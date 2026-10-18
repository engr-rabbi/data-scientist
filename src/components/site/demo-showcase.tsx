'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion, useSpring, useTransform } from 'framer-motion'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Info, RotateCcw, Sparkles, TrendingUp, Users } from 'lucide-react'

import { track } from '@/lib/analytics'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SectionHeading } from '@/components/site/section-heading'
import { cn } from '@/lib/utils'

/* ------------------------------ shared styling ----------------------------- */

const SLIDER_DARK =
  'w-full [&_[data-slot=slider-track]]:bg-white/10 [&_[data-slot=slider-range]]:bg-teal-400'

const SELECT_ITEM_DARK = 'focus:bg-white/10 focus:text-teal-300 dark:focus:bg-white/10 dark:focus:text-teal-300'

function DemoCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">{children}</div>
}

/* ------------------------------ forecasting demo --------------------------- */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface ForecastPoint {
  label: string
  actual: number | null
  forecast: number | null
  bandBase: number | null
  bandSpan: number | null
  lower: number | null
  upper: number | null
}

/** Deterministic pseudo-noise in [0, 1) — fixed formula, identical on SSR and client. */
function fractNoise(i: number, salt = 0): number {
  const v = Math.sin((i + salt * 57) * 12.9898) * 43758.5453
  return v - Math.floor(v)
}

function monthLabel(i: number): string {
  return `${MONTH_NAMES[i % 12]} '${22 + Math.floor(i / 12)}`
}

/** 36 months of history + 12 months of forecast, built from fixed formulas only. */
function buildForecastSeries(trend: 'up' | 'flat', seasonality: number): ForecastPoint[] {
  const amp = seasonality * 0.35
  const step = trend === 'up' ? 1.35 : 0.05
  const points: ForecastPoint[] = []

  for (let i = 0; i < 36; i++) {
    const v = 118 + i * step + amp * Math.sin((i * 2 * Math.PI) / 12) + (fractNoise(i) - 0.5) * 9
    points.push({
      label: monthLabel(i),
      actual: Math.round(v * 10) / 10,
      forecast: null,
      bandBase: null,
      bandSpan: null,
      lower: null,
      upper: null,
    })
  }
  for (let j = 36; j < 48; j++) {
    const v = 118 + j * step + amp * Math.sin((j * 2 * Math.PI) / 12) + (fractNoise(j, 3) - 0.5) * 6
    const spread = 5 + (j - 36) * 1.15
    const lower = Math.round((v - spread) * 10) / 10
    const upper = Math.round((v + spread) * 10) / 10
    points.push({
      label: monthLabel(j),
      actual: null,
      forecast: Math.round(v * 10) / 10,
      bandBase: lower,
      bandSpan: Math.round((upper - lower) * 10) / 10,
      lower,
      upper,
    })
  }
  return points
}

function ForecastTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: ForecastPoint }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900/95 px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-medium text-white/70">{d.label}</p>
      {d.actual != null && (
        <p className="mt-1 flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-teal-400" aria-hidden="true" />
          Sales: <span className="font-semibold">{d.actual}</span>
        </p>
      )}
      {d.forecast != null && (
        <>
          <p className="mt-1 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-400" aria-hidden="true" />
            Forecast: <span className="font-semibold">{d.forecast}</span>
          </p>
          <p className="mt-0.5 text-white/60">
            Range: {d.lower} – {d.upper}
          </p>
        </>
      )}
    </div>
  )
}

function ForecastDemo() {
  const [trend, setTrend] = useState<'up' | 'flat'>('up')
  const [seasonality, setSeasonality] = useState(45)

  const data = useMemo(() => buildForecastSeries(trend, seasonality), [trend, seasonality])

  const handleTrend = (value: string) => {
    const next = value === 'flat' ? 'flat' : 'up'
    setTrend(next)
    track('demo_interaction', `forecast:trend:${next}`)
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-white/50">36 mo history + 12 mo forecast</p>
        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
          Synthetic data
        </span>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-end gap-6">
        <div className="space-y-1.5">
          <label htmlFor="demo-forecast-trend" className="text-sm text-white/70">
            Trend
          </label>
          <Select value={trend} onValueChange={handleTrend}>
            <SelectTrigger
              id="demo-forecast-trend"
              aria-label="Trend direction"
              className="w-36 border-white/10 bg-white/5 text-white hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <SelectValue placeholder="Trend" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-900 text-white">
              <SelectItem value="up" className={SELECT_ITEM_DARK}>
                Upward
              </SelectItem>
              <SelectItem value="flat" className={SELECT_ITEM_DARK}>
                Flat
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-48 flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="demo-forecast-seasonality" className="text-sm text-white/70">
              Seasonality
            </label>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-teal-300">{seasonality}%</span>
          </div>
          <Slider
            aria-label="Seasonality strength"
            min={0}
            max={100}
            step={1}
            value={[seasonality]}
            onValueChange={(v) => setSeasonality(v[0] ?? 0)}
            onValueCommit={(v) => track('demo_interaction', `forecast:seasonality:${v[0]}`)}
            className={SLIDER_DARK}
          />
        </div>
      </div>

      {/* Manual legend */}
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-teal-400" aria-hidden="true" /> History
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed border-amber-400" aria-hidden="true" /> Forecast
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-teal-500/25" aria-hidden="true" /> Confidence band
        </span>
      </div>

      {/* Chart */}
      <div className="mt-2 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 6, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="demoHistoryFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
            <XAxis
              dataKey="label"
              interval={11}
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              minTickGap={8}
            />
            <YAxis
              width={40}
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<ForecastTooltip />}
              cursor={{ stroke: 'rgba(255,255,255,0.18)', strokeDasharray: '4 4' }}
            />
            <Area dataKey="actual" type="monotone" stroke="#2dd4bf" strokeWidth={2} fill="url(#demoHistoryFill)" />
            <Area dataKey="bandBase" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
            <Area
              dataKey="bandSpan"
              stackId="band"
              stroke="none"
              fill="rgba(45,212,191,0.15)"
              isAnimationActive={false}
            />
            <Line dataKey="forecast" type="monotone" stroke="#fbbf24" strokeWidth={2} strokeDasharray="6 4" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* --------------------------------- churn demo ------------------------------ */

type Contract = 'month-to-month' | 'one-year' | 'two-year'

const CONTRACT_OPTIONS: Array<{ value: Contract; label: string; adjust: number }> = [
  { value: 'month-to-month', label: 'Month-to-month', adjust: 0.8 },
  { value: 'one-year', label: 'One-year', adjust: 0 },
  { value: 'two-year', label: 'Two-year', adjust: -0.9 },
]

function ChurnDemo() {
  const [tenure, setTenure] = useState(24)
  const [charges, setCharges] = useState(70)
  const [contract, setContract] = useState<Contract>('month-to-month')

  const { risk, level, drivers } = useMemo(() => {
    const adjust = CONTRACT_OPTIONS.find((c) => c.value === contract)?.adjust ?? 0
    // Illustrative hand-tuned logistic model on synthetic logic.
    const z = -1.2 + 0.03 * charges - 0.04 * tenure + adjust
    const p = 1 / (1 + Math.exp(-z))
    const riskPct = Math.round(p * 1000) / 10

    const candidates = [
      {
        key: 'charges',
        delta: 0.03 * (charges - 70),
        text:
          charges >= 95
            ? 'High monthly charges are pushing risk up'
            : charges >= 60
              ? 'Mid-range charges contribute mildly to risk'
              : 'Low charges keep the risk contribution down',
      },
      {
        key: 'tenure',
        delta: -0.04 * (tenure - 36),
        text:
          tenure < 12
            ? 'Very short tenure — the highest-risk window'
            : tenure < 36
              ? 'Moderate tenure — risk declines with time'
              : 'Long tenure strongly reduces churn risk',
      },
      {
        key: 'contract',
        delta: adjust,
        text:
          contract === 'month-to-month'
            ? 'Month-to-month contract — no commitment lock-in'
            : contract === 'one-year'
              ? 'One-year contract — moderate commitment'
              : 'Two-year contract — strong commitment lowers risk',
      },
    ]

    return {
      risk: riskPct,
      level: riskPct < 40 ? 'Low' : riskPct < 70 ? 'Moderate' : 'High',
      drivers: [...candidates].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3),
    }
  }, [charges, tenure, contract])

  const ringColor = risk < 40 ? '#2dd4bf' : risk < 70 ? '#fbbf24' : '#f97316'
  const RADIUS = 62
  const CIRC = 2 * Math.PI * RADIUS

  const riskSpring = useSpring(risk, { stiffness: 80, damping: 18 })
  const riskText = useTransform(riskSpring, (v) => `${v.toFixed(1)}%`)
  useEffect(() => {
    riskSpring.set(risk)
  }, [risk, riskSpring])

  const handleContract = (value: string) => {
    const next = (CONTRACT_OPTIONS.find((c) => c.value === value)?.value ?? 'month-to-month') as Contract
    setContract(next)
    track('demo_interaction', `churn:contract:${next}`)
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Controls */}
      <div className="space-y-6">
        <p className="text-xs font-semibold tracking-wider text-white/40 uppercase">Customer profile</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="demo-churn-tenure" className="text-sm text-white/70">
              Tenure
            </label>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-teal-300">{tenure} mo</span>
          </div>
          <Slider
            aria-label="Tenure in months"
            min={1}
            max={72}
            step={1}
            value={[tenure]}
            onValueChange={(v) => setTenure(v[0] ?? 24)}
            onValueCommit={(v) => track('demo_interaction', `churn:tenure:${v[0]}`)}
            className={SLIDER_DARK}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="demo-churn-charges" className="text-sm text-white/70">
              Monthly charges
            </label>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-teal-300">${charges}</span>
          </div>
          <Slider
            aria-label="Monthly charges in dollars"
            min={20}
            max={120}
            step={1}
            value={[charges]}
            onValueChange={(v) => setCharges(v[0] ?? 70)}
            onValueCommit={(v) => track('demo_interaction', `churn:charges:${v[0]}`)}
            className={SLIDER_DARK}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="demo-churn-contract" className="text-sm text-white/70">
            Contract
          </label>
          <Select value={contract} onValueChange={handleContract}>
            <SelectTrigger
              id="demo-churn-contract"
              aria-label="Contract type"
              className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <SelectValue placeholder="Contract" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-900 text-white">
              {CONTRACT_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value} className={SELECT_ITEM_DARK}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="flex items-start gap-1.5 text-[11px] text-white/40 italic">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Illustrative logistic model on synthetic logic — not a production model.
        </p>
      </div>

      {/* Risk visual */}
      <div className="flex flex-col items-center">
        <div className="relative flex size-44 items-center justify-center">
          <svg viewBox="0 0 160 160" className="size-44 -rotate-90" aria-hidden="true">
            <circle cx={80} cy={80} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={12} />
            <circle
              cx={80}
              cy={80}
              r={RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - risk / 100)}
              className="transition-[stroke-dashoffset,stroke] duration-700 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center" aria-live="polite">
            <motion.span className="text-3xl font-bold text-white">{riskText}</motion.span>
            <span className="mt-1 text-xs" style={{ color: ringColor }}>
              {level} churn risk
            </span>
          </div>
        </div>

        <p className="mt-6 self-start text-xs font-semibold tracking-wider text-white/40 uppercase">
          Top risk drivers
        </p>
        <ul className="mt-2 w-full space-y-2">
          {drivers.map((d) => (
            <li
              key={d.key}
              className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            >
              {d.delta >= 0 ? (
                <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-amber-400" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="mt-0.5 size-3.5 shrink-0 text-teal-400" aria-hidden="true" />
              )}
              <span className="text-xs leading-relaxed text-white/70">{d.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ------------------------------- cleaning demo ----------------------------- */

const MISSING = '—'
const RAW_DUPLICATE_IDS = new Set([2, 4])

interface CleanRow {
  id: number
  name: string
  age: number | '—'
  city: string
  email: string
}

const RAW_ROWS: CleanRow[] = [
  { id: 1, name: '  alice johnson ', age: 34, city: 'Dhaka', email: 'ALICE@MAIL.COM' },
  { id: 2, name: 'Bob Smith', age: -29, city: 'Chittagong', email: 'bob@mail.com' },
  { id: 3, name: 'carol white', age: 41, city: '  Sylhet ', email: MISSING },
  { id: 4, name: 'Bob Smith', age: -29, city: 'Chittagong', email: 'bob@mail.com' },
  { id: 5, name: 'DAVID LEE', age: MISSING, city: 'Khulna', email: 'david@mail.com' },
  { id: 6, name: '  eve davis', age: 27, city: MISSING, email: 'eve@mail.com' },
]

const CLEAN_ROWS: CleanRow[] = [
  { id: 1, name: 'Alice Johnson', age: 34, city: 'Dhaka', email: 'alice@mail.com' },
  { id: 2, name: 'Bob Smith', age: 29, city: 'Chittagong', email: 'bob@mail.com' },
  { id: 3, name: 'Carol White', age: 41, city: 'Sylhet', email: 'not provided' },
  { id: 5, name: 'David Lee', age: 31, city: 'Khulna', email: 'david@mail.com' },
  { id: 6, name: 'Eve Davis', age: 27, city: 'Unknown', email: 'eve@mail.com' },
]

const CLEANING_FIXES = [
  'Trimmed & normalized casing',
  'Invalid age corrected',
  'Missing values imputed',
  'Duplicate row removed',
]

function CleaningDemo() {
  const [cleaned, setCleaned] = useState(false)

  const toggle = () => {
    track('demo_interaction', cleaned ? 'cleaning:show-raw' : 'cleaning:clean')
    setCleaned(!cleaned)
  }

  const rows = cleaned ? CLEAN_ROWS : RAW_ROWS

  const ageClass = (row: CleanRow) => {
    if (cleaned) return row.id === 5 ? 'text-teal-300' : 'text-white/80'
    if (typeof row.age === 'number' && row.age < 0) return 'font-medium text-rose-300'
    if (row.age === MISSING) return 'text-white/30 italic'
    return 'text-white/80'
  }

  const cityClass = (row: CleanRow) => {
    if (cleaned) return row.id === 6 ? 'text-teal-300' : 'text-white/80'
    return row.city === MISSING ? 'text-white/30 italic' : 'text-white/80'
  }

  const emailClass = (row: CleanRow) => {
    if (cleaned) return row.id === 3 ? 'text-teal-300' : 'text-white/80'
    return row.email === MISSING ? 'text-white/30 italic' : 'text-white/80'
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/70" aria-live="polite">
          <span className="font-semibold text-white">6 rows → 5 rows</span>
          <span className="text-white/40"> · </span>
          <span className="font-medium text-teal-300">4 issues fixed</span>
        </p>
        <Button
          size="sm"
          onClick={toggle}
          variant={cleaned ? 'outline' : 'default'}
          className={cn(
            cleaned
              ? 'border-white/20 bg-transparent text-white/80 hover:bg-white/10'
              : 'bg-teal-600 text-white hover:bg-teal-700'
          )}
        >
          {cleaned ? (
            <>
              <RotateCcw className="size-4" aria-hidden="true" /> Show raw
            </>
          ) : (
            <>
              <Sparkles className="size-4" aria-hidden="true" /> Clean Data
            </>
          )}
        </Button>
      </div>

      {/* Fix legend */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {CLEANING_FIXES.map((f) => (
          <span
            key={f}
            className={cn(
              'rounded-full border px-2 py-0.5 text-[11px] transition-colors',
              cleaned ? 'border-teal-400/20 bg-teal-400/10 text-teal-300' : 'border-white/10 bg-white/5 text-white/50'
            )}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Table */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={cleaned ? 'clean' : 'raw'}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="mt-4 overflow-hidden rounded-xl border border-white/10"
        >
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 text-[11px] tracking-wider text-white/50 uppercase">
                <th scope="col" className="px-3 py-2 font-medium">
                  Name
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Age
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  City
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Email
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isDuplicate = !cleaned && RAW_DUPLICATE_IDS.has(row.id)
                return (
                  <tr
                    key={`${cleaned ? 'c' : 'r'}-${row.id}`}
                    className={cn('border-t border-white/5', isDuplicate && 'bg-rose-500/10')}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-white/80">{row.name}</td>
                    <td className={cn('px-3 py-2', ageClass(row))}>{row.age}</td>
                    <td className={cn('px-3 py-2 whitespace-nowrap', cityClass(row))}>{row.city}</td>
                    <td className={cn('px-3 py-2 whitespace-nowrap', emailClass(row))}>{row.email}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </motion.div>
      </AnimatePresence>

      <p className="mt-3 flex items-start gap-1.5 text-[11px] text-white/40 italic">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Example pipeline output: trimmed values, median-imputed age (31), defaults for missing fields, duplicates
        dropped. Synthetic data.
      </p>
    </div>
  )
}

/* --------------------------------- skeleton -------------------------------- */

function DemoSkeleton() {
  return (
    <div className="mx-auto mt-8 max-w-4xl" aria-hidden="true">
      <div className="mx-auto h-10 w-72 animate-pulse rounded-lg bg-white/5" />
      <div className="mt-6 h-80 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
    </div>
  )
}

/* --------------------------------- section --------------------------------- */

/** Hydration-safe "mounted" flag: false during SSR/hydration, true afterwards. */
const subscribeNoop = () => () => {}
const getMountedSnapshot = () => true
const getServerSnapshot = () => false

export default function DemoShowcase() {
  // Render interactive/dynamic content only after mount — keeps SSR/CSR output
  // identical and lets recharts measure its container on the client.
  const mounted = useSyncExternalStore(subscribeNoop, getMountedSnapshot, getServerSnapshot)

  return (
    <section id="demos" className="bg-zinc-950 py-14 text-white md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Interactive"
          title="Try a Live Mini-Demo"
          description="Lightweight demonstrations of the kind of analysis I deliver. Synthetic data — clearly labeled."
          dark
          align="center"
        />

        {!mounted ? (
          <DemoSkeleton />
        ) : (
          <Tabs defaultValue="forecasting" className="mt-8">
            <TabsList className="mx-auto flex h-auto max-w-full flex-wrap items-center justify-center border border-white/10 bg-white/5 p-1">
              <TabsTrigger
                value="forecasting"
                className="gap-1.5 text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-teal-300 dark:data-[state=active]:border-white/10 dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-teal-300"
              >
                <TrendingUp className="size-4" aria-hidden="true" />
                Forecasting Demo
              </TabsTrigger>
              <TabsTrigger
                value="churn"
                className="gap-1.5 text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-teal-300 dark:data-[state=active]:border-white/10 dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-teal-300"
              >
                <Users className="size-4" aria-hidden="true" />
                Churn Risk Demo
              </TabsTrigger>
              <TabsTrigger
                value="cleaning"
                className="gap-1.5 text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-teal-300 dark:data-[state=active]:border-white/10 dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-teal-300"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                Data Cleaning Demo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="forecasting" className="mt-6">
              <div className="mx-auto max-w-4xl">
                <DemoCard>
                  <ForecastDemo />
                </DemoCard>
              </div>
            </TabsContent>

            <TabsContent value="churn" className="mt-6">
              <div className="mx-auto max-w-4xl">
                <DemoCard>
                  <ChurnDemo />
                </DemoCard>
              </div>
            </TabsContent>

            <TabsContent value="cleaning" className="mt-6">
              <div className="mx-auto max-w-4xl">
                <DemoCard>
                  <CleaningDemo />
                </DemoCard>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </section>
  )
}
