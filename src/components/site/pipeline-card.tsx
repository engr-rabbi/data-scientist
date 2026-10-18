'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

/**
 * Decorative "Model Pipeline" demo card — originally the hero's right-column
 * visual, now shared (About page visual). Purely illustrative: sample data,
 * no real predictions.
 */

const ECG_PATH =
  'M0 70 H36 L44 70 L50 46 L56 92 L62 58 L68 70 H112 L120 70 L126 40 L132 96 L138 54 L144 70 H204 L212 70 L218 44 L224 90 L230 60 L236 70 H320'

const CHIPS = ['EDA', 'Forecast', 'RAG']

export default function PipelineCard() {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-teal-500/5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-widest text-white/40 uppercase">
          Model Pipeline
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
          Running
        </span>
      </div>

      {/* Mini animated chart */}
      <div className="relative rounded-xl border border-white/10 bg-zinc-950/50 p-3">
        {CHIPS.map((chip, i) => (
          <span
            key={chip}
            className={`absolute flex items-center gap-1.5 rounded-full border border-white/15 bg-zinc-900/90 px-2.5 py-1 text-[11px] font-medium text-white/70 shadow-lg backdrop-blur ${
              i === 0 ? '-top-2.5 left-4' : i === 1 ? 'top-1/2 -right-2.5 -translate-y-1/2' : '-bottom-2.5 right-6'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" aria-hidden="true" />
            {chip}
          </span>
        ))}

        <svg viewBox="0 0 320 120" className="h-32 w-full" aria-hidden="true">
          <defs>
            <linearGradient id="pipelineEcgGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="60%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#5eead4" />
            </linearGradient>
          </defs>
          {[30, 60, 90].map((y) => (
            <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 5" />
          ))}
          <motion.path
            d={ECG_PATH}
            fill="none"
            stroke="url(#pipelineEcgGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(45,212,191,0.55))' }}
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 2.4,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 1.6,
            }}
          />
          <path
            d="M236 70 H268 L276 70 L284 52 L292 84 L300 64 L308 70 H320"
            fill="none"
            stroke="#2dd4bf"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>
      </div>

      {/* Sample prediction chip */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-teal-400/10 px-2.5 py-1 text-[11px] font-medium text-teal-300">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Sample prediction output
        </span>
        <span className="text-[10px] text-white/30">Demo visualization</span>
      </div>
    </div>
  )
}
