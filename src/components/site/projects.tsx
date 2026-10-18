'use client'

import { withBase } from '@/lib/base-path'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, ExternalLink, Github, Info } from 'lucide-react'

import { caseStudies, projects, projectCategories, type Project } from '@/config/profile'
import { dispatchPrefill, platformLinks, scrollToId } from '@/lib/links'
import { track } from '@/lib/analytics'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SectionHeading } from '@/components/site/section-heading'
import { RagDiagram, WorkflowDiagram } from '@/components/site/diagrams'
import { cn } from '@/lib/utils'

/* ------------------------------ service mapping ---------------------------- */
/** Maps a project category to the matching service id used by #start-project prefill. */
export const CATEGORY_SERVICE_HINT: Record<Project['category'], string> = {
  Analytics: 'data-analytics-bi',
  'Machine Learning': 'ml-predictive',
  'Deep Learning': 'deep-learning-cv',
  AI: 'ai-llm-rag',
  Automation: 'ai-automation',
  Research: 'web-research',
}

/* ------------------------- project ↔ case study map ------------------------ */
/** Explicit pairing between flagship projects and their deep-dive case studies. */
const PROJECT_TO_CASE: Record<string, string> = {
  'churn-prediction': 'cs-churn',
  'sales-forecasting': 'cs-forecasting',
}

/** Resolve the case study (with its dedicated-page slug) for a project, if any. */
function caseStudyFor(projectId: string) {
  const csId = PROJECT_TO_CASE[projectId]
  return caseStudies.find((c) => c.id === csId) ?? null
}

/* --------------------------- category SVG artwork -------------------------- */
/** Deterministic, decorative per-category line art. Light strokes on gradient. */
function CategoryArt({ category }: { category: Project['category'] }) {
  const stroke = {
    stroke: 'currentColor',
    fill: 'none',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const

  let body: ReactNode = null

  if (category === 'Analytics') {
    const heights = [46, 78, 34, 90, 62, 102, 72]
    const tops = heights.map((h, i) => `${50 + i * 46},${126 - h}`)
    body = (
      <g>
        <line x1={30} y1={126} x2={372} y2={126} strokeOpacity={0.5} {...stroke} />
        {heights.map((h, i) => (
          <rect key={i} x={40 + i * 46} y={126 - h} width={20} height={h} rx={3} {...stroke} />
        ))}
        <polyline points={tops.join(' ')} strokeOpacity={0.9} strokeDasharray="1 0" {...stroke} />
        {tops.map((p, i) => {
          const [x, y] = p.split(',').map(Number)
          return <circle key={i} cx={x} cy={y} r={3.5} strokeOpacity={0.9} {...stroke} />
        })}
      </g>
    )
  } else if (category === 'Machine Learning') {
    const left: Array<[number, number]> = [
      [72, 46],
      [98, 70],
      [122, 40],
      [88, 98],
      [132, 76],
      [64, 84],
    ]
    const right: Array<[number, number]> = [
      [248, 38],
      [282, 62],
      [312, 30],
      [262, 88],
      [330, 68],
      [298, 104],
    ]
    body = (
      <g>
        <path d="M46 136 C 130 100, 236 96, 352 22" strokeDasharray="7 5" strokeOpacity={0.7} {...stroke} />
        {left.map(([x, y], i) => (
          <circle key={`l${i}`} cx={x} cy={y} r={5} strokeOpacity={0.85} {...stroke} />
        ))}
        {right.map(([x, y], i) => (
          <circle key={`r${i}`} cx={x} cy={y} r={5} strokeOpacity={0.85} {...stroke} />
        ))}
      </g>
    )
  } else if (category === 'Deep Learning') {
    const layers = [
      { x: 56, ys: [26, 54, 82, 110] },
      { x: 156, ys: [18, 46, 74, 102, 130] },
      { x: 256, ys: [18, 46, 74, 102, 130] },
      { x: 344, ys: [42, 74, 106] },
    ]
    body = (
      <g>
        {layers.slice(0, -1).map((layer, li) => {
          const next = layers[li + 1]
          return layer.ys.map((y1) =>
            next.ys.map((y2) => (
              <line key={`${li}-${y1}-${y2}`} x1={layer.x} y1={y1} x2={next.x} y2={y2} {...stroke} strokeOpacity={0.14} strokeWidth={1.4} />
            ))
          )
        })}
        {layers.flatMap((layer, li) =>
          layer.ys.map((y, ni) => (
            <circle key={`n${li}-${ni}`} cx={layer.x} cy={y} r={5.5} strokeOpacity={0.9} {...stroke} />
          ))
        )}
      </g>
    )
  } else if (category === 'AI') {
    body = (
      <g>
        <rect x={62} y={24} width={112} height={96} rx={6} strokeOpacity={0.85} {...stroke} />
        <line x1={80} y1={50} x2={152} y2={50} strokeOpacity={0.55} {...stroke} />
        <line x1={80} y1={68} x2={138} y2={68} strokeOpacity={0.55} {...stroke} />
        <line x1={80} y1={86} x2={146} y2={86} strokeOpacity={0.55} {...stroke} />
        <rect x={252} y={46} width={62} height={62} rx={9} strokeOpacity={0.9} {...stroke} />
        <rect x={269} y={63} width={28} height={28} rx={4} strokeOpacity={0.9} {...stroke} />
        {[262, 283, 304].map((x) => (
          <g key={x}>
            <line x1={x} y1={46} x2={x} y2={30} strokeOpacity={0.6} {...stroke} />
            <line x1={x} y1={108} x2={x} y2={124} strokeOpacity={0.6} {...stroke} />
          </g>
        ))}
        {[60, 77, 94].map((y) => (
          <g key={y}>
            <line x1={252} y1={y} x2={236} y2={y} strokeOpacity={0.6} {...stroke} />
            <line x1={314} y1={y} x2={330} y2={y} strokeOpacity={0.6} {...stroke} />
          </g>
        ))}
      </g>
    )
  } else if (category === 'Automation') {
    body = (
      <g>
        <rect x={28} y={50} width={82} height={46} rx={8} strokeOpacity={0.85} {...stroke} />
        <rect x={160} y={50} width={82} height={46} rx={8} strokeOpacity={0.85} {...stroke} />
        <rect x={292} y={50} width={82} height={46} rx={8} strokeOpacity={0.85} {...stroke} />
        <line x1={110} y1={73} x2={150} y2={73} strokeOpacity={0.8} {...stroke} />
        <polyline points="142,65 152,73 142,81" strokeOpacity={0.8} {...stroke} />
        <line x1={242} y1={73} x2={282} y2={73} strokeOpacity={0.8} {...stroke} />
        <polyline points="274,65 284,73 274,81" strokeOpacity={0.8} {...stroke} />
        <circle cx={69} cy={66} r={5} strokeOpacity={0.6} {...stroke} />
        <line x1={58} y1={84} x2={82} y2={84} strokeOpacity={0.45} {...stroke} />
        <circle cx={201} cy={66} r={5} strokeOpacity={0.6} {...stroke} />
        <line x1={190} y1={84} x2={214} y2={84} strokeOpacity={0.45} {...stroke} />
        <circle cx={333} cy={66} r={5} strokeOpacity={0.6} {...stroke} />
        <line x1={322} y1={84} x2={346} y2={84} strokeOpacity={0.45} {...stroke} />
      </g>
    )
  } else {
    // Research — grid / table motif
    body = (
      <g>
        <rect x={52} y={22} width={296} height={100} rx={6} strokeOpacity={0.85} {...stroke} />
        <rect x={52} y={22} width={296} height={28} rx={6} fill="currentColor" fillOpacity={0.12} stroke="none" />
        <line x1={52} y1={50} x2={348} y2={50} strokeOpacity={0.7} {...stroke} />
        <line x1={52} y1={76} x2={348} y2={76} strokeOpacity={0.4} {...stroke} />
        <line x1={52} y1={102} x2={348} y2={102} strokeOpacity={0.4} {...stroke} />
        <line x1={150} y1={22} x2={150} y2={122} strokeOpacity={0.4} {...stroke} />
        <line x1={248} y1={22} x2={248} y2={122} strokeOpacity={0.4} {...stroke} />
      </g>
    )
  }

  return (
    <svg
      viewBox="0 0 400 144"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full text-white/40"
    >
      {body}
    </svg>
  )
}

/* ----------------------------- visual header ------------------------------- */
/**
 * Rich media header for the project card: raster illustrations, hand-built
 * SVG diagrams ('diagram:rag' / 'diagram:workflow') or the gradient+CategoryArt
 * fallback for entries without a visual. Badges stay overlaid in all variants.
 */
function ProjectVisualHeader({ project }: { project: Project }) {
  const overlay = (
    <>
      <Badge className="absolute top-3 left-3 z-10 border-transparent bg-white/80 text-teal-700 backdrop-blur">
        {project.category}
      </Badge>
      {project.isDemo !== false ? (
        <span className="absolute top-3 right-3 z-10 rounded-full bg-zinc-900/70 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur">
          Demo dataset
        </span>
      ) : null}
      {project.featured ? (
        <span className="absolute bottom-3 left-3 z-10 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-semibold text-amber-950 shadow">
          ★ Featured
        </span>
      ) : null}
    </>
  )

  if (!project.visual) {
    return (
      <div className="relative h-32 shrink-0 bg-gradient-to-br from-teal-600/80 via-teal-700/60 to-zinc-900">
        <CategoryArt category={project.category} />
        {overlay}
      </div>
    )
  }

  if (project.visual.startsWith('diagram:')) {
    return (
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-zinc-950">
        {project.visual === 'diagram:workflow' ? <WorkflowDiagram /> : <RagDiagram />}
        {overlay}
      </div>
    )
  }

  return (
    <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-zinc-100">
      <Image
        src={withBase(project.visual)}
        alt={project.visualAlt || `${project.title} — illustrative ${project.category} project visual by a data scientist`}
        title={project.visualCaption || undefined}
        fill
        sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      {overlay}
    </div>
  )
}

/* --------------------------------- helpers -------------------------------- */

function GhostLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">{children}</span>
}

/* --------------------------------- section -------------------------------- */

export default function Projects() {
  const [category, setCategory] = useState<(typeof projectCategories)[number]>('All')
  const [activeId, setActiveId] = useState<string | null>(null)

  const filtered = useMemo(
    () => (category === 'All' ? projects : projects.filter((p) => p.category === category)),
    [category]
  )
  const active = useMemo(() => projects.find((p) => p.id === activeId) ?? null, [activeId])
  const activeCase = useMemo(() => (active ? caseStudyFor(active.id) : null), [active])

  const openProject = (id: string) => {
    setActiveId(id)
    track('view_project', id)
  }

  const handleFilter = (next: (typeof projectCategories)[number]) => {
    setCategory(next)
    track('view_project', next)
  }

  const handleStartProject = (project: Project) => {
    dispatchPrefill('service', CATEGORY_SERVICE_HINT[project.category])
    track('start_project', project.id)
    setActiveId(null)
    scrollToId('start-project')
  }

  return (
    <section id="projects" className="bg-white py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Portfolio"
          title="Projects & Case Work"
          description="Every project is a mini case study: problem → solution → technology. Entries are demonstrations on public/synthetic datasets — client results are added as verified projects complete."
          moreHref="/projects"
          moreLabel="Projects page"
        />

        {/* Category filter bar */}
        <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filter projects by category">
          {projectCategories.map((cat) => {
            const isActive = cat === category
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleFilter(cat)}
                aria-pressed={isActive}
                className={cn(
                  'relative rounded-full px-4 py-2 text-sm transition-colors',
                  isActive ? 'text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="projects-active-pill"
                    className="absolute inset-0 rounded-full bg-teal-600"
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.55 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            )
          })}
        </div>

        {/* Cards grid */}
        <motion.div layout className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <motion.article
                key={project.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.07, ease: 'easeOut' }}
                id={project.id}
                className="group flex scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-[box-shadow,transform] hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Visual header */}
                <ProjectVisualHeader project={project} />

                {/* Body */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-semibold text-zinc-900">{project.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.summary || project.problem}</p>
                  <p className="mt-2 line-clamp-2 flex items-start gap-1.5 text-sm font-medium text-teal-700">
                    <ArrowRight className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{project.solution}</span>
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.tech.map((t) => (
                      <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openProject(project.id)}
                      className="px-2 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                    >
                      Case details
                    </Button>
                    <div className="flex items-center gap-1">
                      {project.github ? (
                        <Button variant="ghost" size="icon" className="size-8 text-zinc-400 hover:text-zinc-800" asChild>
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${project.title} — GitHub repository`}
                            onClick={() => track('demo_interaction', `${project.id}:github`)}
                          >
                            <Github className="size-4" />
                          </a>
                        </Button>
                      ) : null}
                      {project.demo ? (
                        <Button variant="ghost" size="icon" className="size-8 text-zinc-400 hover:text-zinc-800" asChild>
                          <a
                            href={project.demo}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${project.title} — live demo`}
                            onClick={() => track('demo_interaction', `${project.id}:demo`)}
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Project dialog — mini case study */}
      <Dialog open={!!active} onOpenChange={(open) => !open && setActiveId(null)}>
        <DialogContent className="custom-scrollbar max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {active ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-transparent bg-teal-50 text-teal-700">{active.category}</Badge>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                    Demo dataset
                  </span>
                </div>
                <DialogTitle className="pr-6 text-xl font-semibold text-zinc-900">{active.title}</DialogTitle>
                <DialogDescription className="sr-only">
                  Mini case study for {active.title}: problem, solution, highlights and technologies.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-5">
                {active.visual && !active.visual.startsWith('diagram:') && active.visualCaption ? (
                  <p className="text-xs text-muted-foreground italic">{active.visualCaption}</p>
                ) : null}
                {active.description ? (
                  <p className="text-sm leading-relaxed text-zinc-700">{active.description}</p>
                ) : null}
                <div>
                  <GhostLabel>Problem</GhostLabel>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-700">{active.problem}</p>
                </div>

                <div>
                  <GhostLabel>Solution</GhostLabel>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-700">{active.solution}</p>
                </div>

                <div>
                  <GhostLabel>My role</GhostLabel>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-700">
                    {active.role ?? 'End-to-end solo build — data preparation, modeling, evaluation and handover.'}
                  </p>
                </div>

                <div>
                  <GhostLabel>Key features</GhostLabel>
                  <ul className="mt-1.5 space-y-1.5">
                    {active.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm text-zinc-700">
                        <Check className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden="true" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <GhostLabel>Technologies</GhostLabel>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {active.tech.map((t) => (
                      <span key={t} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {active.results && active.results.length > 0 ? (
                  <div>
                    <GhostLabel>Results / metrics</GhostLabel>
                    <ul className="mt-1.5 space-y-1.5">
                      {active.results.map((r) => (
                        <li key={r} className="flex items-start gap-2 text-sm font-medium text-teal-800">
                          <Check className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden="true" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {active.images && active.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {active.images.map((src) => (
                       
                      <img key={src} src={withBase(src)} alt={`${active.title} — additional image`} loading="lazy" className="aspect-[16/10] w-full rounded-lg border object-cover" />
                    ))}
                  </div>
                ) : null}

                {active.caseStudyUrl ? (
                  <a href={withBase(active.caseStudyUrl)} className="text-sm font-semibold text-teal-700 underline underline-offset-4">
                    Read the full case study →
                  </a>
                ) : null}

                {active.dataset ? (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground italic">
                    <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{active.dataset}</span>
                  </p>
                ) : null}

                {active.isDemo !== false ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                  Demonstration project on public/synthetic data — replace with verified client outcomes as they
                  complete.
                </div>
                ) : null}

                <div className="flex flex-col gap-2 border-t border-zinc-100 pt-4 sm:flex-row sm:flex-wrap">
                  {activeCase ? (
                    <Button asChild className="bg-teal-600 text-white hover:bg-teal-700">
                      <Link
                        href={`/case-studies/${activeCase.slug}`}
                        onClick={() => {
                          track('view_project', `${active.id}:case-study`)
                          setActiveId(null)
                        }}
                      >
                        View Case Study
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : null}
                  <Button
                    onClick={() => handleStartProject(active)}
                    variant={activeCase ? 'outline' : 'default'}
                    className={activeCase ? '' : 'bg-teal-600 text-white hover:bg-teal-700'}
                  >
                    Discuss a Similar Project
                  </Button>
                  {active.github ? (
                    <Button variant="ghost" asChild>
                      <a
                        href={active.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${active.title} — GitHub repository`}
                        onClick={() => track('demo_interaction', `${active.id}:github`)}
                      >
                        <Github className="size-4" aria-hidden="true" />
                        GitHub
                      </a>
                    </Button>
                  ) : null}
                  {active.demo ? (
                    <Button variant="ghost" asChild>
                      <a
                        href={active.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${active.title} — live demo`}
                        onClick={() => track('demo_interaction', `${active.id}:demo`)}
                      >
                        <ExternalLink className="size-4" aria-hidden="true" />
                        Demo
                      </a>
                    </Button>
                  ) : null}
                  <Button variant="outline" asChild>
                    <a
                      href={platformLinks.kaggle}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track('click_kaggle', active.id)}
                    >
                      View Kaggle
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}
