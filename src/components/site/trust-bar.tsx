'use client'

import {
  BarChart3,
  Bot,
  BrainCircuit,
  ClipboardCheck,
  Code2,
  Database,
  Layers,
  PieChart,
  type LucideIcon,
} from 'lucide-react'
import { trustBar } from '@/config/profile'

const ICONS: Record<string, LucideIcon> = {
  'Data Science': Database,
  'Machine Learning': BrainCircuit,
  'Deep Learning': Layers,
  'Data Analytics': PieChart,
  'AI Automation': Bot,
  'Python & SQL': Code2,
  'Power BI': BarChart3,
  'Engineering & Project Management': ClipboardCheck,
}

/**
 * Slim dark capability strip directly below the hero — visually continues the
 * hero background. Horizontally scrollable on mobile, centered wrap on sm+.
 */
export default function TrustBar() {
  return (
    <section aria-label="Core capabilities" className="border-y border-white/10 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="custom-scrollbar flex snap-x gap-x-6 gap-y-2 overflow-x-auto py-3 sm:flex-wrap sm:justify-center sm:overflow-x-visible">
          {trustBar.map((label, i) => {
            const Icon = ICONS[label] ?? BarChart3
            return (
              <div key={label} className="flex items-center gap-3">
                {i > 0 ? (
                  <span aria-hidden="true" className="hidden h-3.5 w-px shrink-0 bg-white/10 sm:block" />
                ) : null}
                <div className="flex snap-start items-center gap-2.5 whitespace-nowrap">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-teal-400">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="text-[13px] text-white/60">{label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
