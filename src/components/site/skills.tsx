'use client'

import { motion } from 'framer-motion'
import {
  BarChart3,
  Bot,
  BrainCircuit,
  Code2,
  GitBranch,
  Network,
  type LucideIcon,
} from 'lucide-react'

import { skillGroups } from '@/config/profile'
import { cn } from '@/lib/utils'
import SectionHeading from '@/components/site/section-heading'

const groupIcons: Record<string, LucideIcon> = {
  'Programming & Data': Code2,
  'Visualization & BI': BarChart3,
  'Machine Learning': BrainCircuit,
  'Deep Learning': Network,
  'AI & Automation': Bot,
  'Engineering & Delivery': GitBranch,
}

/* Thin bottom accent tones (teal/cyan/amber/zinc rhythm) */
const accentTones = [
  'bg-teal-500',
  'bg-cyan-500',
  'bg-amber-400',
  'bg-teal-400',
  'bg-zinc-300',
  'bg-teal-600',
]

export default function Skills() {
  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="bg-white py-14 md:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div id="skills-heading">
          <SectionHeading
            eyebrow="Skills"
            title="A Focused, Verified Toolkit"
            description="Only technologies supported by real training and project work — grouped by what they deliver."
            moreHref="/skills"
            moreLabel="Skills page"
          />
        </div>

        <div className="mt-8 md:mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, i) => {
            const Icon = groupIcons[group.title] ?? Code2
            return (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="h-full"
              >
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md">
                  <div className="flex w-fit items-center justify-center rounded-lg bg-teal-50 p-2 text-teal-600">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-semibold text-zinc-900">{group.title}</h3>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {group.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-transparent bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div
                    aria-hidden
                    className={cn(
                      'absolute inset-x-0 bottom-0 h-1',
                      accentTones[i % accentTones.length]
                    )}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
