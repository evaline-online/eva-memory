/**
 * OpLog.ts — unified operation log for the EvaBot brain.
 *
 * Provides:
 *  - In-memory ring buffer (last 1000 entries) for fast /log queries.
 *  - Append-only JSONL persistence at data/operations.jsonl with size-based
 *    rotation (at 5 MB the file is renamed to operations.jsonl.1).
 *  - Entry schema: { ts, level: info|warn|error|debug, kind: command|llm|breaker|system|chat, text, meta? }
 *  - query({limit, level?, kind?, textLike?, since?}) and stats() aggregations.
 *  - DebugContext: a module-level debug flag + latency spans used by the
 *    /debug command and the ChatRouter debug footer.
 *
 * Design guarantees:
 *  - log() NEVER throws — persistence failures are silently swallowed so the
 *    operation log can never take down the chat or LLM path.
 *  - 'debug' level entries are recorded only while the debug flag is ON
 *    (see isDebugOn / setDebugOn); other levels are always recorded.
 */

import fs from 'node:fs';
import path from 'node:path';

export type OpLogLevel = 'info' | 'warn' | 'error' | 'debug';
export type OpLogKind = 'command' | 'llm' | 'breaker' | 'system' | 'chat' | 'auto';

export interface OpLogEntry {
  ts: number;
  level: OpLogLevel;
  kind: OpLogKind;
  text: string;
  meta?: Record<string, unknown>;
}

export interface OpLogQuery {
  limit?: number;
  level?: OpLogLevel;
  kind?: OpLogKind;
  textLike?: string;
  since?: number;
}

export interface OpLogStats {
  bufferSize: number;
  byLevel: Record<OpLogLevel, number>;
  byKind: Record<OpLogKind, number>;
  lastError?: OpLogEntry;
  filePath: string;
  fileBytes?: number;
}

/** Rotation threshold for the JSONL file (5 MB). */
export const OPLOG_ROTATE_BYTES = 5 * 1024 * 1024;

/** Ring buffer capacity (last N entries kept in memory). */
export const OPLOG_RING_CAPACITY = 1000;

/* ────────────────────────────  DebugContext  ──────────────────────────── */

const debugState = { enabled: false };

/** Whether debug mode is currently ON (server-side flag, /debug command). */
export function isDebugOn(): boolean {
  return debugState.enabled;
}

/** Toggles the server-side debug flag. */
export function setDebugOn(value: boolean): void {
  debugState.enabled = value;
}

/** A latency span for one LLM round-trip (used for the * debug footer). */
export interface DebugSpan {
  model: string;
  provider: string;
  startTs: number;
  latencyMs?: number;
  fallback?: string;
  ended: boolean;
  end(fallback?: string): void;
}

/** Starts a debug span for a model/provider call. */
export function startSpan(model: string, provider: string): DebugSpan {
  const span: DebugSpan = {
    model,
    provider,
    startTs: Date.now(),
    latencyMs: undefined,
    fallback: undefined,
    ended: false,
    end(fallback?: string) {
      if (span.ended) return;
      span.ended = true;
      span.latencyMs = Date.now() - span.startTs;
      span.fallback = fallback;
      OpLog.getInstance().log('debug', 'llm', `span model=${model} provider=${provider} latencyMs=${span.latencyMs}`);
    },
  };
  return span;
}

/** Renders the `* debug:` footer line shown in chat replies while debug is ON. */
export function renderDebugFooter(span: DebugSpan): string {
  const latency = span.latencyMs ?? Date.now() - span.startTs;
  return `* debug: model=${span.model} provider=${span.provider} latency=${latency}ms fallback=${span.fallback ?? '—'}`;
}

/* ────────────────────────────────  OpLog  ──────────────────────────────── */

export class OpLog {
  private ring: OpLogEntry[] = [];
  private filePath: string;
  private rotateBytes: number;
  private static instance: OpLog | null = null;

  constructor(options?: { filePath?: string; rotateBytes?: number }) {
    this.filePath = options?.filePath || path.resolve(process.cwd(), 'data', 'operations.jsonl');
    this.rotateBytes = options?.rotateBytes || OPLOG_ROTATE_BYTES;
  }

  /** Process-wide singleton (default data/operations.jsonl path). */
  public static getInstance(): OpLog {
    if (!OpLog.instance) {
      OpLog.instance = new OpLog();
    }
    return OpLog.instance;
  }

  /** Absolute path of the JSONL file (used by /debug full). */
  public getPath(): string {
    return this.filePath;
  }

  /**
   * Records one entry. Never throws: ring-buffer append and JSONL persistence
   * are both wrapped so a logging failure can never break the caller.
   */
  public log(level: OpLogLevel, kind: OpLogKind, text: string, meta?: Record<string, unknown>): void {
    try {
      // Debug gating: skip 'debug' entries unless the /debug flag is ON.
      if (level === 'debug' && !isDebugOn()) return;

      const entry: OpLogEntry = { ts: Date.now(), level, kind, text };
      if (meta !== undefined) entry.meta = meta;

      this.ring.push(entry);
      if (this.ring.length > OPLOG_RING_CAPACITY) this.ring.shift();

      this.appendJsonl(entry);
    } catch {
      /* never throw from log() */
    }
  }

  /** Queries the ring buffer. Returns newest-first entries, limited. */
  public query(q: OpLogQuery = {}): OpLogEntry[] {
    const limit = Math.max(1, Math.min(OPLOG_RING_CAPACITY, q.limit || 20));
    let hits = this.ring.slice();
    if (q.level) hits = hits.filter((e) => e.level === q.level);
    if (q.kind) hits = hits.filter((e) => e.kind === q.kind);
    if (q.textLike) {
      const needle = q.textLike.toLowerCase();
      hits = hits.filter((e) => e.text.toLowerCase().includes(needle));
    }
    if (typeof q.since === 'number') hits = hits.filter((e) => e.ts >= q.since!);
    return hits.slice(-limit).reverse();
  }

  /** Aggregates: counts by kind/level, last error entry, buffer size, file size. */
  public stats(): OpLogStats {
    const byLevel: Record<OpLogLevel, number> = { info: 0, warn: 0, error: 0, debug: 0 };
    const byKind: Record<OpLogKind, number> = { command: 0, llm: 0, breaker: 0, system: 0, chat: 0, auto: 0 };
    let lastError: OpLogEntry | undefined;
    for (const e of this.ring) {
      byLevel[e.level] += 1;
      byKind[e.kind] += 1;
      if (e.level === 'error') lastError = e;
    }
    const stats: OpLogStats = { bufferSize: this.ring.length, byLevel, byKind, filePath: this.filePath };
    if (lastError) stats.lastError = lastError;
    try {
      stats.fileBytes = fs.statSync(this.filePath).size;
    } catch {
      /* file may not exist yet */
    }
    return stats;
  }

  /** Append-only JSONL write with size-based rotation (file → file.1). */
  private appendJsonl(entry: OpLogEntry): void {
    try {
      let size = 0;
      try {
        size = fs.statSync(this.filePath).size;
      } catch {
        size = 0; // file does not exist yet
      }
      if (size >= this.rotateBytes) {
        try {
          fs.renameSync(this.filePath, this.filePath + '.1');
        } catch {
          /* rotation best-effort; keep appending */
        }
      }
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.appendFileSync(this.filePath, JSON.stringify(entry) + '\n', 'utf8');
    } catch {
      /* persistence is best-effort — never throw */
    }
  }
}

/** Shared singleton accessor (short alias for call sites). */
export const opLog = OpLog.getInstance();
