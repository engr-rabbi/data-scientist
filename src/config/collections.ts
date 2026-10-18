/**
 * Admin definitions of every manageable content type.
 *
 * The admin's "Add → Edit → Preview → Save → Publish" screens are generated
 * from these definitions, so a new content type needs only a definition here —
 * no new screen. The website itself never imports this file.
 */
import { faqCategories, projectCategories, services } from '@/config/profile'
import { ICON_NAMES } from '@/config/icon-names'

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'strings' | 'image' | 'images' | 'json'

export interface FieldDef {
  /** Dot path inside the item, e.g. "detail.problem". */
  key: string
  label: string
  type: FieldType
  help?: string
  placeholder?: string
  rows?: number
  options?: () => string[]
  /** image fields: where alt text / caption are stored */
  altKey?: string
  captionKey?: string
}

export interface CollectionDef {
  key: string
  label: string
  singular: string
  group: 'Services & work' | 'Profile & credentials' | 'Content'
  icon: string
  /** list-row texts / preview */
  titleKey: string
  subtitleKey?: string
  textKey?: string
  chipsKey?: string
  imageKey?: string
  imageAltKey?: string
  /** wording of the on/off switch */
  statusLabels: [string, string]
  featured?: boolean
  sections: { title: string; fields: FieldDef[] }[]
  blank: () => Record<string, unknown>
  /** fields that receive a generated unique id/slug from the title */
  idKeys?: string[]
  /** field that holds "01", "02"… (re-numbered automatically) */
  renumberKey?: string
  liveHref?: (item: Record<string, unknown>) => string
  /** extra label on the preview card, e.g. the CTA text */
  ctaKey?: string
  hint?: string
}

const T = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: 'text', ...extra })
const A = (key: string, label: string, rows = 3, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: 'textarea', rows, ...extra })
const L = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: 'strings', ...extra })
const ON = { published: true }

export const collections: CollectionDef[] = [
  {
    key: 'services', label: 'Services', singular: 'service', group: 'Services & work', icon: '🛠',
    titleKey: 'title', subtitleKey: 'tagline', imageKey: 'image', imageAltKey: 'imageAlt', ctaKey: 'ctaLabel',
    statusLabels: ['Active', 'Inactive'], featured: true, idKeys: ['id'], renumberKey: 'number',
    hint: 'The cards under “What I Can Do For You” and the /services page.',
    liveHref: () => '/services',
    sections: [
      { title: 'Basics', fields: [
        T('title', 'Service name'),
        T('shortTitle', 'Short name', { help: 'Used in menus, the footer and the inquiry form.' }),
        A('tagline', 'Short description', 2),
        { key: 'icon', label: 'Icon', type: 'select', options: () => [...ICON_NAMES] },
        { key: 'priceFrom', label: 'Starting price (USD)', type: 'number', help: 'Leave empty to show “Request a Quote”.' },
      ] },
      { title: 'Picture', fields: [{ key: 'image', label: 'Service image', type: 'image', altKey: 'imageAlt', captionKey: 'imageCaption' }] },
      { title: 'Full description', fields: [A('detail.problem', 'The problem it solves', 4), A('detail.solution', 'How I solve it', 4)] },
      { title: 'Features & skills', fields: [
        L('items', 'Key features', { help: 'The first five appear as tags on the card.' }),
        L('detail.technologies', 'Technologies / skills'),
        L('detail.process', 'Process steps'),
        L('detail.deliverables', 'Deliverables'),
      ] },
      { title: 'Call to action', fields: [
        T('ctaLabel', 'CTA text', { placeholder: 'Start This Project' }),
        T('ctaLink', 'CTA link (optional)', { placeholder: '/start-a-project or https://…', help: 'Empty = opens the inquiry form pre-filled with this service.' }),
      ] },
    ],
    blank: () => ({
      id: '', number: '', icon: 'bar-chart', image: '', imageAlt: '', imageCaption: '', title: '', shortTitle: '', tagline: '',
      items: [], ctaLabel: 'Start This Project', ctaLink: '', priceFrom: null,
      detail: { problem: '', solution: '', process: [], deliverables: [], technologies: [] }, ...ON, featured: false,
    }),
  },
  {
    key: 'projects', label: 'Portfolio projects', singular: 'project', group: 'Services & work', icon: '📁',
    titleKey: 'title', subtitleKey: 'category', textKey: 'summary', chipsKey: 'tech', imageKey: 'visual', imageAltKey: 'visualAlt',
    statusLabels: ['Published', 'Unpublished'], featured: true, idKeys: ['id'],
    hint: '“Projects & Case Work” on the homepage and the /projects page.',
    liveHref: (i) => `/projects#${i.id}`,
    sections: [
      { title: 'Basics', fields: [
        T('title', 'Project title'),
        A('summary', 'Short description', 2, { help: 'Shown on the card. Empty = the problem text is used.' }),
        { key: 'category', label: 'Project category', type: 'select', options: () => projectCategories.filter((c) => c !== 'All') },
        T('role', 'My role'),
        { key: 'isDemo', label: 'Demonstration project (shows the “Demo dataset” labels)', type: 'checkbox', help: 'Untick for real client work.' },
      ] },
      { title: 'Pictures', fields: [
        { key: 'visual', label: 'Project image (card cover)', type: 'image', altKey: 'visualAlt', captionKey: 'visualCaption', help: 'Special values “diagram:rag” and “diagram:workflow” show the built-in illustrations.' },
        { key: 'images', label: 'Additional images', type: 'images', help: 'Shown as a gallery in the project dialog.' },
      ] },
      { title: 'Story', fields: [A('description', 'Detailed description', 5), A('problem', 'Problem', 3), A('solution', 'Solution', 3)] },
      { title: 'Details', fields: [L('tech', 'Technologies'), L('highlights', 'Key features'), L('results', 'Results / metrics'), T('dataset', 'Data note')] },
      { title: 'Links', fields: [T('github', 'GitHub link'), T('demo', 'Live demo link'), T('caseStudyUrl', 'Case study link', { placeholder: '/case-studies/my-case' })] },
    ],
    blank: () => ({ id: '', title: '', category: 'Analytics', summary: '', description: '', problem: '', solution: '', role: '', visual: '', visualAlt: '', visualCaption: '', images: [], tech: [], highlights: [], results: [], dataset: '', github: '', demo: '', caseStudyUrl: '', isDemo: false, ...ON, featured: false }),
  },
  {
    key: 'caseStudies', label: 'Case studies', singular: 'case study', group: 'Services & work', icon: '🔍',
    titleKey: 'title', subtitleKey: 'category', textKey: 'summary', chipsKey: 'technology', imageKey: 'visual',
    statusLabels: ['Published', 'Unpublished'], featured: true, idKeys: ['id', 'slug'],
    hint: '“Deep Dives” on the homepage; each one also gets its own page.',
    liveHref: (i) => `/case-studies/${i.slug}`,
    sections: [
      { title: 'Basics', fields: [T('title', 'Title'), T('slug', 'Page address (slug)', { help: 'Part of the URL. Change it only before the first publish.' }), T('category', 'Category'), A('summary', 'Summary', 3), { key: 'visual', label: 'Cover image', type: 'image' }] },
      { title: 'The case', fields: [A('challenge', 'Challenge', 4), A('data', 'Data', 3), L('dataQuality', 'Data quality notes'), L('approach', 'Approach'), L('technology', 'Technology')] },
      { title: 'Outcome', fields: [{ key: 'results', label: 'Results', type: 'json', help: 'Each result: value, label, note.' }, A('businessMeaning', 'What it means for the business', 3), A('limitations', 'Limitations', 3), A('nextStep', 'Next step', 3)] },
    ],
    blank: () => ({ id: '', slug: '', title: '', category: '', visual: '', summary: '', challenge: '', data: '', dataQuality: [], approach: [], technology: [], results: [], businessMeaning: '', limitations: '', nextStep: '', ...ON, featured: false }),
  },
  {
    key: 'skillGroups', label: 'Skills', singular: 'skill group', group: 'Profile & credentials', icon: '🧰',
    titleKey: 'title', chipsKey: 'skills', statusLabels: ['Published', 'Unpublished'],
    sections: [{ title: 'Skill group', fields: [T('title', 'Group name'), L('skills', 'Skills')] }],
    blank: () => ({ title: '', skills: [], ...ON }),
  },
  {
    key: 'credentials', label: 'Certifications & training', singular: 'certification', group: 'Profile & credentials', icon: '🎓',
    titleKey: 'name', subtitleKey: 'provider', textKey: 'description', chipsKey: 'skills', statusLabels: ['Published', 'Unpublished'], idKeys: ['id'],
    sections: [{ title: 'Credential', fields: [T('name', 'Name'), T('provider', 'Provider / issuer'), T('kind', 'Kind', { help: 'e.g. Certification, Training' }), T('category', 'Category'), A('description', 'Description', 3), L('skills', 'Skills covered')] }],
    blank: () => ({ id: '', name: '', provider: '', kind: 'Certification', category: '', description: '', skills: [], ...ON }),
  },
  {
    key: 'kaggleActivities', label: 'Kaggle activities', singular: 'Kaggle item', group: 'Profile & credentials', icon: '🏆',
    titleKey: 'title', subtitleKey: 'kind', textKey: 'description', chipsKey: 'tech', imageKey: 'image', imageAltKey: 'imageAlt',
    statusLabels: ['Published', 'Unpublished'], featured: true,
    hint: '“Kaggle Competitions, Notebooks & Dataset Work” on the homepage (right after Projects & Case Work) and the /kaggle page.',
    liveHref: () => '/kaggle',
    sections: [
      { title: 'Basics', fields: [
        T('title', 'Title'),
        { key: 'kind', label: 'Category', type: 'select', options: () => ['Competition', 'Notebook', 'Dataset'] },
        { key: 'year', label: 'Year', type: 'number' },
        A('description', 'Short description', 2, { help: 'Shown on the card.' }),
        A('detail', 'Detailed description', 6, { help: 'Shown in “View Details”. Leave a blank line between paragraphs.' }),
      ] },
      { title: 'Picture', fields: [
        { key: 'image', label: 'Project image / thumbnail', type: 'image', altKey: 'imageAlt', help: 'Wide pictures (16:9) look best. Without a picture — or if the file cannot load — a neat placeholder is shown.' },
      ] },
      { title: 'Skills & technologies', fields: [
        L('skills', 'Related skills'),
        L('tech', 'Technologies used', { help: 'The card tags show these; if empty, the related skills are shown instead.' }),
      ] },
      { title: 'Links & result', fields: [
        T('kaggleUrl', 'Kaggle URL', { placeholder: 'https://www.kaggle.com/…', help: 'Adds the “View on Kaggle” button. Empty = the GitHub link below is offered instead.' }),
        T('repoUrl', 'GitHub repository link', { placeholder: 'https://github.com/…' }),
        T('repoName', 'GitHub repository name'),
        T('result', 'Competition result / ranking', { help: 'Only enter a rank, medal or score you can verify on Kaggle. Empty = nothing is shown.' }),
      ] },
    ],
    blank: () => ({ kind: 'Competition', title: '', year: new Date().getFullYear(), description: '', detail: '', skills: [], tech: [], image: '', imageAlt: '', kaggleUrl: '', result: '', repoUrl: '', repoName: '', ...ON, featured: false }),
  },
  {
    key: 'experience', label: 'Professional experience', singular: 'position', group: 'Profile & credentials', icon: '💼',
    titleKey: 'role', subtitleKey: 'org', statusLabels: ['Published', 'Unpublished'],
    sections: [{ title: 'Position', fields: [T('role', 'Role'), T('org', 'Organisation'), T('period', 'Period', { placeholder: '2021 – 2024' }), L('points', 'Highlights')] }],
    blank: () => ({ role: '', org: '', period: '', points: [], ...ON }),
  },
  {
    key: 'careerJourney', label: 'Career journey', singular: 'stage', group: 'Profile & credentials', icon: '🧭',
    titleKey: 'title', subtitleKey: 'stage', textKey: 'body', chipsKey: 'tags', statusLabels: ['Published', 'Unpublished'],
    sections: [{ title: 'Stage', fields: [T('stage', 'Stage label'), T('title', 'Title'), A('body', 'Text', 4), L('tags', 'Tags')] }],
    blank: () => ({ stage: '', title: '', body: '', tags: [], ...ON }),
  },
  {
    key: 'memberships', label: 'Memberships', singular: 'membership', group: 'Profile & credentials', icon: '🤝',
    titleKey: 'name', subtitleKey: 'level', statusLabels: ['Published', 'Unpublished'],
    sections: [{ title: 'Membership', fields: [T('name', 'Name'), T('level', 'Level')] }],
    blank: () => ({ name: '', level: '', ...ON }),
  },
  {
    key: 'platforms', label: 'Professional profiles', singular: 'profile', group: 'Profile & credentials', icon: '🌐',
    titleKey: 'name', textKey: 'description', statusLabels: ['Published', 'Unpublished'],
    sections: [{ title: 'Profile', fields: [T('name', 'Platform'), A('description', 'Description', 2), T('url', 'Link'), T('cta', 'Button text')] }],
    blank: () => ({ name: '', description: '', url: '', cta: 'Visit profile', ...ON }),
  },
  {
    key: 'notableRepos', label: 'GitHub repositories', singular: 'repository', group: 'Profile & credentials', icon: '💻',
    titleKey: 'name', subtitleKey: 'language', textKey: 'description', statusLabels: ['Published', 'Unpublished'],
    sections: [{ title: 'Repository', fields: [T('name', 'Name'), T('url', 'Link'), A('description', 'Description', 2), T('language', 'Language'), T('tag', 'Tag')] }],
    blank: () => ({ name: '', url: '', description: '', language: '', tag: '', ...ON }),
  },
  {
    key: 'testimonials', label: 'Testimonials', singular: 'testimonial', group: 'Content', icon: '💬',
    titleKey: 'name', subtitleKey: 'company', textKey: 'quote', imageKey: 'photo', imageAltKey: 'photoAlt', statusLabels: ['Published', 'Unpublished'],
    hint: 'While there are no published testimonials, the homepage shows the placeholder text.',
    liveHref: () => '/testimonials',
    sections: [
      { title: 'Client', fields: [T('name', 'Client name'), T('role', 'Role'), T('company', 'Company'), { key: 'photo', label: 'Photo (optional)', type: 'image', altKey: 'photoAlt' }] },
      { title: 'Testimonial', fields: [A('quote', 'Quote', 5), T('sourceUrl', 'Link to the original review', { placeholder: 'https://www.upwork.com/…' })] },
    ],
    blank: () => ({ name: '', role: '', company: '', quote: '', photo: '', photoAlt: '', sourceUrl: '', ...ON }),
  },
  {
    key: 'faqs', label: 'FAQ', singular: 'question', group: 'Content', icon: '❓',
    titleKey: 'q', subtitleKey: 'category', textKey: 'a', statusLabels: ['Published', 'Unpublished'],
    sections: [{ title: 'Question', fields: [T('q', 'Question'), { key: 'category', label: 'Category', type: 'select', options: () => [...faqCategories] }, A('a', 'Answer', 5)] }],
    blank: () => ({ q: '', category: faqCategories[0] ?? '', a: '', ...ON }),
  },
  {
    key: 'insights', label: 'Blog / insights', singular: 'article', group: 'Content', icon: '📝',
    titleKey: 'title', subtitleKey: 'category', textKey: 'excerpt', chipsKey: 'tags', statusLabels: ['Published', 'Unpublished'], idKeys: ['slug'], featured: true,
    hint: '“Notes From the Field”.',
    sections: [
      { title: 'Article', fields: [T('title', 'Title'), T('slug', 'Page address (slug)'), T('category', 'Category'), T('date', 'Date', { placeholder: '2026-01-31' }), T('readTime', 'Read time', { placeholder: '5 min read' }), A('excerpt', 'Excerpt', 3), L('tags', 'Tags')] },
      { title: 'Body', fields: [{ key: 'sections', label: 'Sections', type: 'json', help: 'Each section: a heading and paragraphs (body).' }] },
    ],
    blank: () => ({ slug: '', title: '', category: '', excerpt: '', date: new Date().toISOString().slice(0, 10), readTime: '', tags: [], sections: [{ heading: '', body: [''] }], ...ON, featured: false }),
  },
  {
    key: 'solutions', label: 'What I can solve', singular: 'problem', group: 'Content', icon: '🧩',
    titleKey: 'problem', textKey: 'solution', statusLabels: ['Published', 'Unpublished'],
    sections: [{ title: 'Problem → solution', fields: [T('problem', 'Problem'), A('solution', 'Solution', 3), { key: 'serviceRef', label: 'Linked service', type: 'select', options: () => services.map((s) => s.id) }] }],
    blank: () => ({ problem: '', solution: '', serviceRef: services[0]?.id ?? '', ...ON }),
  },
]

/* ----------------------------- pure item helpers ---------------------------- */

type Obj = Record<string, unknown>

export function getPath(o: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Obj)[k] : undefined), o)
}

export function setPath<T extends Obj>(o: T, path: string, value: unknown): T {
  const keys = path.split('.')
  const root: Obj = { ...o }
  let cur = root
  for (const k of keys.slice(0, -1)) {
    cur[k] = { ...((cur[k] as Obj) ?? {}) }
    cur = cur[k] as Obj
  }
  cur[keys[keys.length - 1]] = value
  return root as T
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

export const isOn = (item: Obj) => item.published !== false

/** Gives new items a unique id/slug (from the title) and renumbers “01, 02 …”. */
export function finalizeItems(def: CollectionDef, items: Obj[]): Obj[] {
  const used = new Set<string>()
  const out = items.map((it) => ({ ...it }))
  for (const key of def.idKeys ?? []) {
    out.forEach((it) => { const v = it[key]; if (typeof v === 'string' && v && !v.startsWith('new-')) used.add(v) })
    for (const it of out) {
      const v = it[key]
      if (typeof v === 'string' && v && !v.startsWith('new-')) continue
      const base = slugify(String(it[def.titleKey] ?? '')) || 'item'
      let id = base, n = 2
      while (used.has(id)) id = `${base}-${n++}`
      used.add(id); it[key] = id
    }
  }
  if (def.renumberKey) out.forEach((it, i) => { it[def.renumberKey!] = String(i + 1).padStart(2, '0') })
  return out
}

export function validateItems(def: CollectionDef, items: Obj[]): string[] {
  const problems: string[] = []
  items.forEach((it, i) => { if (!String(it[def.titleKey] ?? '').trim()) problems.push(`#${i + 1}: “${def.sections[0].fields.find((f) => f.key === def.titleKey)?.label ?? def.titleKey}” is required.`) })
  return problems
}
