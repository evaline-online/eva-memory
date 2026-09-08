/**
 * CompanyKnowledge — EvaLine corporate knowledge matrix (who knows what).
 *
 * Maps every corporate role (src/core/CorporateRoles.ts, real roleIds) to the
 * knowledge domains it must master, the on-disk data sources backing those
 * domains, and an info-exchange map (who exchanges what with whom).
 */
import { CORPORATE_ROLES } from './CorporateRoles.js';
import { ProductCatalog, CatalogLang } from './ProductCatalog.js';

export interface RoleKnowledge {
  domains: string[];
  sources: string[];
  exchangesWith: string[];
}

export interface InfoExchange {
  from: string;
  to: string;
  what: string;
}

export const KNOWLEDGE_MATRIX: Record<string, RoleKnowledge> = {
  god: {
    domains: ['corporate axioms', 'governance & arbitration', 'full product & tech overview', 'consilium deadlock resolution'],
    sources: ['knowledge-base/evaline-company-dossier.md', 'docs/reports/'],
    exchangesWith: ['ceo', 'cto', 'adam', 'eva'],
  },
  adam: {
    domains: ['EVA polymer manufacturing specs', 'backend architecture', 'infrastructure security', 'product catalog (B2B)'],
    sources: ['data/products.json', 'knowledge-base/evaline-com-ua/', 'knowledge-base/evaline-company-dossier.md'],
    exchangesWith: ['eva', 'architect', 'security_auditor', 'qa_automation'],
  },
  eva: {
    domains: ['sales & client diplomacy (6 languages)', 'product catalog (B2C/B2B)', 'frontend & UX', 'market & news'],
    sources: ['data/products.json', 'knowledge-base/evaline-com-ua/site/', 'knowledge-base/evaline-company-dossier.md', 'docs/reports/'],
    exchangesWith: ['adam', 'ceo', 'legal_compliance', 'general_assistant'],
  },
  eva_frontend: {
    domains: ['reactive UI / cyber-terminal ergonomics', 'Web Speech & accessibility', 'zero-CDN performance'],
    sources: ['public/', 'docs/reports/'],
    exchangesWith: ['eva', 'architect', 'qa_automation'],
  },
  adam_backend: {
    domains: ['Node.js microservices', 'PostgreSQL schemas', 'OmniRoute daemons', 'zero-trust perimeter'],
    sources: ['docs/reports/', 'knowledge-base/evaline-company-dossier.md'],
    exchangesWith: ['adam', 'architect', 'devops', 'security_auditor'],
  },
  architect: {
    domains: ['distributed systems design', 'API contracts', 'scalability & fault tolerance', 'cost optimization'],
    sources: ['docs/reports/'],
    exchangesWith: ['adam', 'adam_backend', 'devops_sre', 'cto'],
  },
  devops: {
    domains: ['Kubernetes & CI/CD', 'IaC (Terraform)', 'observability', 'zero-downtime deployments'],
    sources: ['docs/reports/'],
    exchangesWith: ['devops_sre', 'architect', 'security_auditor'],
  },
  security_auditor: {
    domains: ['Zero-Trust security', 'OWASP & threat modeling', 'IAM/RBAC', 'cryptography & secret isolation'],
    sources: ['docs/reports/'],
    exchangesWith: ['ciso', 'adam', 'adam_backend', 'devops'],
  },
  general_assistant: {
    domains: ['cross-functional coordination', 'meeting synthesis', 'structured documentation', 'market/news digest'],
    sources: ['knowledge-base/evaline-com-ua/site/uk/novini/', 'docs/reports/'],
    exchangesWith: ['eva', 'ceo', 'god'],
  },
  data_engineer: {
    domains: ['hybrid PostgreSQL topologies', 'Qdrant vector retrieval', 'streaming pipelines'],
    sources: ['docs/reports/'],
    exchangesWith: ['data_ai_lead', 'adam_backend', 'architect'],
  },
  ceo: {
    domains: ['business & strategy', 'sales & partner negotiations', 'finance (USD/EUR)', 'product roadmap'],
    sources: ['data/products.json', 'knowledge-base/evaline-company-dossier.md', 'docs/reports/'],
    exchangesWith: ['cfo', 'cto', 'eva', 'legal_compliance', 'god'],
  },
  cto: {
    domains: ['technology strategy', 'system architecture', 'AI model garden', 'engineering excellence'],
    sources: ['docs/reports/', 'MODELS.2026.md'],
    exchangesWith: ['architect', 'data_ai_lead', 'ceo', 'qa_automation'],
  },
  ciso: {
    domains: ['Zero-Trust architecture', 'cryptographic key isolation', 'threat defense', 'mTLS'],
    sources: ['docs/reports/'],
    exchangesWith: ['security_auditor', 'legal_compliance', 'adam'],
  },
  cfo: {
    domains: ['unit economics', 'cloud OpEx & token economics', 'budget planning (USD/EUR)', 'financial compliance'],
    sources: ['docs/reports/'],
    exchangesWith: ['ceo', 'cto', 'legal_compliance'],
  },
  devops_sre: {
    domains: ['multi-cloud Kubernetes', 'GitOps CI/CD', 'Prometheus/Grafana observability', 'SLA 99.99%'],
    sources: ['docs/reports/'],
    exchangesWith: ['devops', 'architect', 'security_auditor'],
  },
  data_ai_lead: {
    domains: ['relational + vector data architecture', 'RAG pipelines & embeddings', 'semantic retrieval'],
    sources: ['knowledge-base/evaline-knowledge-base/', 'docs/reports/'],
    exchangesWith: ['data_engineer', 'cto', 'architect'],
  },
  qa_automation: {
    domains: ['test automation', 'regression & integration suites', 'release verification'],
    sources: ['tests/', 'docs/reports/'],
    exchangesWith: ['cto', 'architect', 'adam_backend'],
  },
  legal_compliance: {
    domains: ['EU AI Act & GDPR', 'sanctions & anti-aggressor policy', 'company dossier & certificates'],
    sources: ['knowledge-base/evaline-company-dossier.md', 'data/products.json (certifications)'],
    exchangesWith: ['ceo', 'ciso', 'eva'],
  },
};

export const INFO_EXCHANGE: InfoExchange[] = [
  { from: 'adam', to: 'eva', what: 'EVA product specs (sheets, mats, hardness, embossing) for client answers' },
  { from: 'eva', to: 'ceo', what: 'sales leads, market intel & B2B/B2C demand signals' },
  { from: 'cfo', to: 'ceo', what: 'budgets, unit economics & OpEx forecasts (USD/EUR)' },
  { from: 'cto', to: 'ceo', what: 'technology roadmap & model-garden cost/perf trade-offs' },
  { from: 'legal_compliance', to: 'ceo', what: 'compliance rulings (EU AI Act, GDPR, sanctions)' },
  { from: 'eva', to: 'adam', what: 'client product requirements (custom sizes/colors) to production' },
  { from: 'security_auditor', to: 'ciso', what: 'vulnerability findings & IAM audit results' },
  { from: 'architect', to: 'devops_sre', what: 'deployment topology & API contracts' },
  { from: 'data_ai_lead', to: 'cto', what: 'RAG pipeline quality & retrieval metrics' },
  { from: 'qa_automation', to: 'cto', what: 'test coverage & regression reports' },
  { from: 'general_assistant', to: 'god', what: 'consolidated corporate summaries & decisions log' },
];

const LABELS: Record<CatalogLang, Record<string, string>> = {
  en: {
    title: 'EVALINE COMPANY KNOWLEDGE MATRIX',
    role: 'Role',
    domains: 'Knows',
    sources: 'Sources',
    exchanges: 'Exchanges with',
    unknown: 'Unknown role.',
    usageList: 'Usage: /who [roleId] — role knowledge domains & info exchange partners.',
    productStats: 'Product DB stats',
  },
  uk: {
    title: 'МАТРИЦЯ ЗНАНЬ КОМПАНІЇ EVALINE',
    role: 'Роль',
    domains: 'Знає',
    sources: 'Джерела',
    exchanges: 'Обмін інформацією з',
    unknown: 'Невідома роль.',
    usageList: 'Використання: /who [roleId] — домени знань ролі та партнери обміну.',
    productStats: 'Статистика БД продуктів',
  },
  ru: {
    title: 'МАТРИЦА ЗНАНИЙ КОМПАНИИ EVALINE',
    role: 'Роль',
    domains: 'Знает',
    sources: 'Источники',
    exchanges: 'Обмен информацией с',
    unknown: 'Неизвестная роль.',
    usageList: 'Использование: /who [roleId] — домены знаний роли и партнёры обмена.',
    productStats: 'Статистика БД продуктов',
  },
};

function normalizeRoleId(input: string): string | null {
  const id = (input || '').toLowerCase().trim();
  if (!id) return null;
  if (KNOWLEDGE_MATRIX[id]) return id;
  // resolve by prefix (e.g. "sec" → security_auditor) or by role name substring
  const keys = Object.keys(KNOWLEDGE_MATRIX);
  const byPrefix = keys.find((k) => k.startsWith(id));
  if (byPrefix) return byPrefix;
  const byName = keys.find((k) => (CORPORATE_ROLES[k]?.name || '').toLowerCase().includes(id));
  return byName || null;
}

export class CompanyKnowledge {
  public static getMatrix(): Record<string, RoleKnowledge> {
    return KNOWLEDGE_MATRIX;
  }

  public static getRoleKnowledge(roleId: string): RoleKnowledge | null {
    const id = normalizeRoleId(roleId);
    return id ? KNOWLEDGE_MATRIX[id] : null;
  }

  /** Detail view for one role: title, domains, sources, exchange partners. */
  public static formatRole(roleId: string, lang: CatalogLang = 'en'): string {
    const s = LABELS[lang] || LABELS.en;
    const id = normalizeRoleId(roleId);
    const lines: string[] = [];
    lines.push('');
    lines.push('═'.repeat(78));
    if (!id) {
      lines.push(`  [TEAM] ${s.unknown} "${roleId}"`);
      lines.push('─'.repeat(78));
      lines.push(`  ${s.usageList}`);
      lines.push(`  ${Object.keys(KNOWLEDGE_MATRIX).join(', ')}`);
      lines.push('═'.repeat(78));
      return lines.join('\n');
    }
    const role = CORPORATE_ROLES[id];
    const k = KNOWLEDGE_MATRIX[id];
    lines.push(`  [TEAM] ${s.role.toUpperCase()}: ${role ? role.name : id}`);
    if (role) lines.push(`      ${role.title} | ${role.department} | access: ${role.knowledgeAccessLevel}`);
    lines.push('─'.repeat(78));
    lines.push(`  ${s.domains}:`);
    for (const d of k.domains) lines.push(`    • ${d}`);
    lines.push(`  ${s.sources}:`);
    for (const src of k.sources) lines.push(`    • ${src}`);
    lines.push(`  ${s.exchanges}: ${k.exchangesWith.join(', ')}`);
    lines.push('═'.repeat(78));
    return lines.join('\n');
  }

  /** Compact matrix of all roles + product DB stats (appended to /company, standalone in /who). */
  public static formatMatrix(lang: CatalogLang = 'en'): string {
    const s = LABELS[lang] || LABELS.en;
    const st = ProductCatalog.stats();
    const lines: string[] = [];
    lines.push('');
    lines.push('═'.repeat(78));
    lines.push(`  [NAV] ${s.title}`);
    lines.push('═'.repeat(78));
    for (const id of Object.keys(KNOWLEDGE_MATRIX)) {
      const role = CORPORATE_ROLES[id];
      const k = KNOWLEDGE_MATRIX[id];
      lines.push(`   ${id.padEnd(18)} ${(role ? role.title : id).substring(0, 58)}`);
      lines.push(`      ${s.domains}: ${k.domains.join(', ')}`);
      lines.push(`      ${s.exchanges}: ${k.exchangesWith.join(', ')}`);
    }
    lines.push('─'.repeat(78));
    lines.push(`  [PKG] ${s.productStats}: ${st.total} products / ${Object.keys(st.byCategory).length} categories (data/products.json, updated ${st.updatedAt})`);
    lines.push('─'.repeat(78));
    lines.push(`  i  ${s.usageList}`);
    lines.push('═'.repeat(78));
    return lines.join('\n');
  }

  /** Info-exchange flows list. */
  public static formatExchange(lang: CatalogLang = 'en'): string {
    const lines: string[] = [];
    lines.push('  [FLOW] INFO EXCHANGE FLOWS:');
    for (const e of INFO_EXCHANGE) {
      lines.push(`    • ${e.from} → ${e.to}: ${e.what}`);
    }
    return lines.join('\n');
  }
}
