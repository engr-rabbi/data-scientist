'use client'

import { motion, type Variants } from 'framer-motion'
import { ArrowRight, BarChart3, Brain, ChevronRight, Database, LineChart, Rocket, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { dispatchPrefill, scrollToId } from '@/lib/links'
import { track } from '@/lib/analytics'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* ------------------------------- story steps ------------------------------- */

interface StoryStep {
  id: string
  label: string
  sublabel: string
  icon: LucideIcon
}

const STORY_STEPS: StoryStep[] = [
  { id: 'problem', label: 'Business Problem', sublabel: 'The decision that is blocked', icon: Target },
  { id: 'data', label: 'Data', sublabel: 'Collect, clean, quality-check', icon: Database },
  { id: 'analysis', label: 'Analysis', sublabel: 'EDA, patterns, hypotheses', icon: BarChart3 },
  { id: 'ml', label: 'Machine Learning / AI', sublabel: 'Model, predict or automate', icon: Brain },
  { id: 'viz', label: 'Visualization', sublabel: 'Charts that explain themselves', icon: LineChart },
  { id: 'solution', label: 'Business Solution', sublabel: 'Decision-ready deliverable', icon: Rocket },
]

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const stepVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

/* -------------------------------- component -------------------------------- */

interface StoryFlowProps {
  /** Teal-on-dark variant (for zinc-950 sections). Defaults to teal-on-light. */
  dark?: boolean
  /** Tighter paddings; sublabels hidden below lg. */
  compact?: boolean
  className?: string
}

/**
 * Visual storytelling flow: Business Problem → Data → Analysis →
 * Machine Learning / AI → Visualization → Business Solution.
 * Horizontal arrow chain on md+, vertical stack with rotated arrows below.
 * Single whileInView stagger (runs once).
 */
function StoryFlow({ dark = false, compact = false, className }: StoryFlowProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <motion.ol
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        aria-label="How every engagement runs: from business problem to business solution"
        className="flex list-none flex-col p-0 md:flex-row md:items-stretch"
      >
        {STORY_STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <li
              key={step.id}
              className="flex min-w-0 flex-col md:flex-1 md:flex-row md:items-stretch"
            >
              <motion.div
                variants={stepVariants}
                className={cn(
                  'flex min-w-0 flex-1 items-start gap-2.5 rounded-xl border',
                  compact ? 'p-2.5' : 'p-3',
                  dark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-lg',
                    compact ? 'size-8' : 'size-9',
                    dark ? 'bg-teal-400/10 text-teal-300' : 'bg-teal-50 text-teal-700'
                  )}
                >
                  <Icon className={compact ? 'size-4' : 'size-4.5'} />
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'flex items-baseline gap-1.5 text-[13px] leading-snug font-semibold',
                      dark ? 'text-white' : 'text-zinc-900'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[10px] font-bold tabular-nums',
                        dark ? 'text-teal-300' : 'text-teal-600'
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 block text-xs leading-snug',
                      compact && 'hidden lg:block',
                      dark ? 'text-white/60' : 'text-muted-foreground'
                    )}
                  >
                    {step.sublabel}
                  </span>
                </span>
              </motion.div>

              {i < STORY_STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className="flex items-center justify-center py-0.5 md:px-0.5 md:py-0"
                >
                  <ChevronRight
                    className={cn(
                      'size-4 shrink-0 rotate-90 md:rotate-0',
                      dark ? 'text-teal-400/60' : 'text-teal-600/50'
                    )}
                  />
                </div>
              )}
            </li>
          )
        })}
      </motion.ol>

      <p
        className={cn(
          'mt-4 text-center text-xs',
          dark ? 'text-white/50' : 'text-muted-foreground'
        )}
      >
        The same problem → solution path I apply to every engagement.
      </p>
    </div>
  )
}

/* ------------------------ case study CTA (client isle) ---------------------- */

interface CaseStudyCtaProps {
  /** Service id used by the #start-project prefill bridge (e.g. 'ml-predictive'). */
  serviceHint: string
  /** Analytics label source, e.g. the case-study id. */
  source: string
  className?: string
}

/**
 * Conversion CTA for dedicated case-study pages: dispatches the service
 * prefill (same-page event + sessionStorage stash) and routes to the project
 * brief — scrollToId falls back to /start-a-project when the homepage
 * section is not present on the current route.
 */
function CaseStudyCta({ serviceHint, source, className }: CaseStudyCtaProps) {
  return (
    <Button
      onClick={() => {
        dispatchPrefill('service', serviceHint)
        track('start_project', source)
        scrollToId('start-project')
      }}
      className={cn('bg-teal-600 text-white hover:bg-teal-700', className)}
    >
      Discuss a Similar Project
      <ArrowRight className="size-4" aria-hidden="true" />
    </Button>
  )
}

export default StoryFlow
// Named alias kept in sync so either import style works.
export { StoryFlow, CaseStudyCta }
