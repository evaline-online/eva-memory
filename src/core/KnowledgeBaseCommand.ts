import { knowledgeBase, KnowledgeBackend } from './KnowledgeBase.js';
import { logger, LogCategory } from './Logger.js';

export class KnowledgeBaseCommand {
  public static execute(command: string): string {
    const parts = command.trim().split(/\s+/);
    const action = parts[0].toLowerCase();

    switch (action) {
      case '/kb':
        return this.handleKb(parts.slice(1));
      case '/kb-status':
        return this.handleStatus();
      case '/kb-search':
        return this.handleSearch(parts.slice(1));
      case '/kb-list':
        return this.handleList(parts.slice(1));
      default:
        return `[ERROR] Unknown KB command: ${action}`;
    }
  }

  private static handleKb(args: string[]): string {
    const subCmd = args[0]?.toLowerCase();
    if (!subCmd || subCmd === 'help') {
      return this.handleHelp();
    }
    if (subCmd === 'on' || subCmd === 'enable') {
      logger.info(LogCategory.USER, 'KB', 'Knowledge Base enabled');
      return this.handleStatus();
    }
    if (subCmd === 'off' || subCmd === 'disable') {
      logger.info(LogCategory.USER, 'KB', 'Knowledge Base disabled');
      return `[KB] Knowledge Base disabled. Use /kb on to re-enable.`;
    }
    if (subCmd === 'backend') {
      const backend = args[1] as KnowledgeBackend;
      if (!backend || !['memory', 'json', 'sqlite', 'vector'].includes(backend)) {
        return `[ERROR] Invalid backend. Use: memory, json, sqlite, vector`;
      }
      knowledgeBase.setBackend(backend);
      return `[KB] Backend switched to: ${backend}`;
    }
    if (subCmd === 'search') {
      return this.handleSearch(args.slice(1));
    }
    if (subCmd === 'list') {
      return this.handleList(args.slice(1));
    }
    if (subCmd === 'status') {
      return this.handleStatus();
    }
    return `[ERROR] Unknown /kb subcommand: ${subCmd}. Try /kb help`;
  }

  private static handleHelp(): string {
    return `
╔══════════════════════════════════════════════════════════════════════╗
║                  [KB] KNOWLEDGE BASE COMMANDS                          ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  /kb on              - Enable Knowledge Base                        ║
║  /kb off             - Disable Knowledge Base                       ║
║  /kb status          - Show KB statistics                           ║
║  /kb backend <type>  - Switch backend (memory|json|sqlite|vector)   ║
║  /kb search <query>  - Search documents                             ║
║  /kb list [filter]   - List documents (filter: language|category)   ║
║  /kb help            - This help                                     ║
║                                                                      ║
║  Examples:                                                           ║
║    /kb backend memory                                                 ║
║    /kb search EVA плитка                                              ║
║    /kb list uk                                                        ║
║    /kb list b2b                                                       ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝`;
  }

  private static handleStatus(): string {
    const stats = knowledgeBase.getStats();
    const lines: string[] = [];
    lines.push('');
    lines.push('═'.repeat(78));
    lines.push('  [KB] KNOWLEDGE BASE STATUS');
    lines.push('═'.repeat(78));
    lines.push('');
    lines.push(`  Active Backend:    ${stats.name} (${stats.id})`);
    lines.push(`  Description:       ${stats.description}`);
    lines.push(`  Status:            ${stats.enabled ? '[ENABLED] [OK]' : '[DISABLED] [X]'}`);
    lines.push(`  Total Documents:   ${stats.documentCount}`);
    lines.push(`  Languages:         ${stats.languages.join(', ').toUpperCase()}`);
    lines.push(`  Sources:           ${stats.sources.length} unique files`);
    lines.push('');
    lines.push('  Available Backends:');
    for (const backend of knowledgeBase.getAvailableBackends()) {
      const active = backend.id === stats.id ? ' ← ACTIVE' : '';
      const avail = backend.enabled ? '[OK]' : '○';
      lines.push(`    ${avail} ${backend.id.padEnd(10)} - ${backend.name}${active}`);
    }
    lines.push('');
    return lines.join('\n');
  }

  private static handleSearch(args: string[]): string {
    const query = args.join(' ');
    if (!query) {
      return `[ERROR] Usage: /kb search <query>`;
    }
    
    logger.info(LogCategory.USER, 'KB_SEARCH', `Searching: "${query}"`);
    const results = knowledgeBase.search(query, { limit: 5 });
    logger.info(LogCategory.USER, 'KB_SEARCH', `Found ${results.length} results`);
    return knowledgeBase.formatSearchResults(results, query);
  }

  private static handleList(args: string[]): string {
    const filterArg = args[0]?.toLowerCase();
    const filter: { language?: string; category?: string } = {};
    
    if (filterArg && ['en', 'uk', 'ru', 'pl', 'ro', 'de'].includes(filterArg)) {
      filter.language = filterArg;
    } else if (filterArg) {
      filter.category = filterArg;
    }
    
    const docs = knowledgeBase.listDocuments(filter);
    const lines: string[] = [];
    lines.push('');
    lines.push('═'.repeat(78));
    lines.push(`  [KB] KNOWLEDGE BASE DOCUMENTS (${docs.length} total)`);
    if (filter.language) lines.push(`  Filter: Language=${filter.language.toUpperCase()}`);
    if (filter.category) lines.push(`  Filter: Category=${filter.category}`);
    lines.push('═'.repeat(78));
    
    if (docs.length === 0) {
      lines.push('  (No documents found)');
      lines.push('');
      return lines.join('\n');
    }

    for (const doc of docs.slice(0, 30)) {
      lines.push(`  • [${doc.language.toUpperCase()}] ${doc.title}`);
      lines.push(`    ${doc.category} | ${doc.tags.join(', ')}`);
      lines.push(`    ID: ${doc.id}`);
    }
    
    if (docs.length > 30) {
      lines.push(`  ... and ${docs.length - 30} more`);
    }
    lines.push('');
    return lines.join('\n');
  }
}
