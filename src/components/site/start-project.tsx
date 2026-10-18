'use client'


import { apiFetch } from '@/lib/api-client'
/**
 * ============================================================================
 * StartProject — the conversion centerpiece (#start-project)
 * ----------------------------------------------------------------------------
 * Multi-step project inquiry form (client-side steps, single final submit):
 *   1. Client Information   2. Project Information
 *   3. Files & Contact      4. Review & Submit
 *
 * POSTs multipart FormData to /api/inquiries (relative URL).
 *
 * `prefill-service` listener (for other agents/sections):
 *   Dispatch `window.dispatchEvent(new CustomEvent('prefill-service', { detail: serviceId }))`
 *   and this section scrolls into view, resets any submitted state, and
 *   pre-selects the matching service category via SERVICE_CATEGORY_MAP below
 *   (jumping to step 2 where the select lives, so the value is visible).
 *
 * Service id mapping (services defined in src/config/profile.ts):
 *   data-analytics-bi → Data Analysis
 *   ml-predictive     → Machine Learning
 *   forecasting       → Forecasting
 *   ai-llm-rag        → AI / LLM
 *   ai-automation     → AI Automation
 *   deep-learning-cv  → Deep Learning
 *   web-research      → Web Research
 * ============================================================================
 */

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  FileUp,
  Loader2,
  MessageCircle,
  Save,
  MessageSquare,
  Phone,
  Rocket,
  Sparkles,
  ThumbsUp,
  UploadCloud,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import SectionHeading from './section-heading'
import { useToast } from '@/hooks/use-toast'
import {
  budgetRanges,
  contactMethods,
  profile,
  processFlow,
  projectCategoriesForm,
} from '@/config/profile'
import { drainPrefills, onStartProjectPage, platformLinks, scrollToId, telLink, waLink } from '@/lib/links'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

/* --------------------- service id → form category map --------------------- */

const SERVICE_CATEGORY_MAP: Record<string, string> = {
  'data-analytics-bi': 'Data Analysis',
  'ml-predictive': 'Machine Learning',
  'forecasting': 'Forecasting',
  'ai-llm-rag': 'AI / LLM',
  'ai-automation': 'AI Automation',
  'deep-learning-cv': 'Deep Learning',
  'web-research': 'Web Research',
}

/* -------------------------------- constants ------------------------------- */

const STEPS = [
  { n: 1, label: 'Client Info' },
  { n: 2, label: 'Project' },
  { n: 3, label: 'Files & Contact' },
  { n: 4, label: 'Review' },
] as const

/** Icons for the `processFlow` steps (config order). */
const FLOW_ICONS = [ClipboardList, MessageSquare, FileCheck2, CircleDollarSign, ThumbsUp, Rocket]

const ALLOWED_EXTENSIONS = ['csv', 'xlsx', 'xls', 'pdf', 'zip', 'docx', 'png', 'jpg', 'jpeg', 'webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB — keep in sync with src/lib/upload.ts and Code.gs
const MAX_FILES = 5
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* ------------------------- draft autosave (localStorage) ------------------ */

const DRAFT_KEY = 'smfr-inquiry-draft-v1'

interface DraftPayload {
  form: Partial<FormState>
  step: number
  savedAt: string
}

function draftHasContent(f: FormState): boolean {
  return (Object.keys(f) as (keyof FormState)[]).some((k) => k !== 'website' && f[k] !== '')
}

/* --------------------------------- types ---------------------------------- */

interface FormState {
  name: string
  company: string
  email: string
  whatsapp: string
  country: string
  serviceCategory: string
  projectTitle: string
  description: string
  businessGoal: string
  deliverable: string
  budgetRange: string
  deadline: string
  contactMethod: string
  website: string // honeypot — must stay empty
}

type FieldErrors = Partial<Record<keyof FormState, string>>

const INITIAL_FORM: FormState = {
  name: '',
  company: '',
  email: '',
  whatsapp: '',
  country: '',
  serviceCategory: '',
  projectTitle: '',
  description: '',
  businessGoal: '',
  deliverable: '',
  budgetRange: '',
  deadline: '',
  contactMethod: '',
  website: '',
}

/* -------------------------------- helpers --------------------------------- */

function validateStep(step: number, form: FormState): FieldErrors {
  const errors: FieldErrors = {}
  if (step === 1) {
    if (form.name.trim().length < 2) errors.name = 'Please enter your name.'
    if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Please enter a valid email address.'
  }
  if (step === 2) {
    if (!form.serviceCategory) errors.serviceCategory = 'Please choose a service category.'
    if (form.projectTitle.trim().length < 3) errors.projectTitle = 'Please add a short project title.'
    if (form.description.trim().length < 30)
      errors.description = 'Please describe the project in at least 30 characters.'
  }
  if (step === 3) {
    if (!form.contactMethod) errors.contactMethod = 'Please select your preferred contact method.'
  }
  return errors
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ------------------------------- component -------------------------------- */

export default function StartProject({ showHeading = true }: { showHeading?: boolean } = {}) {
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [inquiryId, setInquiryId] = useState('')
  const [draftRestored, setDraftRestored] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const startedRef = useRef(false) // ensures 'form-start' fires only once

  /* -------------------- prefill-service event listener -------------------- */
  useEffect(() => {
    function onPrefillService(event: Event) {
      const serviceId = (event as CustomEvent<string>).detail
      const category = SERVICE_CATEGORY_MAP[serviceId]

      // Open/prepare the form: clear any submitted state, pre-select the
      // service and jump to step 2 so the selection is visible.
      setSubmitted(false)
      if (category) {
        setForm((prev) => ({ ...prev, serviceCategory: category }))
        setErrors((prev) => ({ ...prev, serviceCategory: undefined }))
      }
      setStep((prev) => (prev === 1 ? 2 : prev))

      if (!startedRef.current) {
        startedRef.current = true
        track('start_project', 'form-start')
      }
      // Only bring the form into view on its own page. On the homepage the CTA that
      // fired this event opens the dedicated page itself — never scroll the homepage
      // down to the embedded copy of the form.
      if (onStartProjectPage()) requestAnimationFrame(() => scrollToId('start-project'))
    }

    function onPrefillBudget(event: Event) {
      // Sets only the budget range; scrolling/form-opening is left to the
      // accompanying prefill-service dispatch (used together by pricing CTAs).
      const budget = (event as CustomEvent<string>).detail
      if (budgetRanges.includes(budget)) {
        setForm((prev) => ({ ...prev, budgetRange: budget }))
      }
    }

    function onPrefillNote(event: Event) {
      // Seeds the project description with an optional note (e.g. the instant
      // estimate path: "Ballpark: Analysis / Dashboard, $100 – $300, 3–7 days").
      // NEVER overwrites typed text — only fills an empty description.
      const note = (event as CustomEvent<string>).detail
      if (!note) return
      setForm((prev) => (prev.description.trim() ? prev : { ...prev, description: note }))
    }

    window.addEventListener('prefill-service', onPrefillService)
    window.addEventListener('prefill-budget', onPrefillBudget)
    window.addEventListener('prefill-note', onPrefillNote)
    return () => {
      window.removeEventListener('prefill-service', onPrefillService)
      window.removeEventListener('prefill-budget', onPrefillBudget)
      window.removeEventListener('prefill-note', onPrefillNote)
    }
  }, [])

  /* ------------------------- draft restore (on mount) ---------------------- */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as DraftPayload
      if (!draft || typeof draft !== 'object' || !draft.form) return
      const restored: FormState = { ...INITIAL_FORM }
      ;(Object.keys(restored) as (keyof FormState)[]).forEach((k) => {
        const v = draft.form[k]
        if (typeof v === 'string' && v.length > 0) restored[k] = v
      })
      restored.website = '' // honeypot must never persist
      if (!draftHasContent(restored)) return
      setForm(restored)
      if (typeof draft.step === 'number' && draft.step >= 1 && draft.step <= 4) {
        setStep(draft.step)
      }
      setDraftRestored(true)
    } catch {
      /* corrupted or unavailable draft — start clean */
    }
  }, [])

  /* -------- cross-page prefill drain (sessionStorage bridge, on mount) ------ */
  /*
   * Prefills dispatched from a DIFFERENT page (e.g. /services or /pricing
   * dedicated pages) are stashed in sessionStorage and applied here AFTER the
   * draft restore — same rules as the event listeners: budget only if valid,
   * note only into an empty description, service selection wins over the
   * draft because it is an explicit user action on the referring page.
   */
  useEffect(() => {
    const stash = drainPrefills()
    if (Object.keys(stash).length === 0) return

    if (stash.service) {
      const category = SERVICE_CATEGORY_MAP[stash.service]
      setSubmitted(false)
      if (category) {
        setForm((prev) => ({ ...prev, serviceCategory: category }))
        setErrors((prev) => ({ ...prev, serviceCategory: undefined }))
      }
      setStep((prev) => (prev === 1 ? 2 : prev))
      if (!startedRef.current) {
        startedRef.current = true
        track('start_project', 'form-start')
      }
    }
    if (stash.budget && budgetRanges.includes(stash.budget)) {
      setForm((prev) => ({ ...prev, budgetRange: stash.budget }))
    }
    if (stash.note) {
      setForm((prev) => (prev.description.trim() ? prev : { ...prev, description: stash.note }))
    }
  }, [])

  /* --------------------- draft autosave (debounced 500ms) ------------------- */
  useEffect(() => {
    if (submitted) return
    const hasContent = draftHasContent(form)
    const t = setTimeout(() => {
      try {
        if (!hasContent) {
          window.localStorage.removeItem(DRAFT_KEY)
          setDraftSaved(false)
        } else {
          const payload: DraftPayload = { form, step, savedAt: new Date().toISOString() }
          window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
          setDraftSaved(true)
        }
      } catch {
        /* storage unavailable (private mode) — non-critical */
      }
    }, 500)
    return () => clearTimeout(t)
  }, [form, step, submitted])

  /** Wipe the persisted draft and reset the form to a clean state. */
  function clearDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* ignore */
    }
    setForm(INITIAL_FORM)
    setStep(1)
    setErrors({})
    setDraftRestored(false)
    setDraftSaved(false)
  }

  /* ------------------------------ field helpers ---------------------------- */

  /** Enter inside a text input advances to the next step (textareas excluded). */
  function handleStepKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Enter') return
    const target = e.target as HTMLElement
    if (target.tagName !== 'INPUT') return
    e.preventDefault()
    handleNext()
  }

  const set = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const goToStep = (target: number) => {
    setErrors({})
    setStep(target)
  }

  function handleNext() {
    const stepErrors = validateStep(step, form)
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length > 0) return
    if (step === 1 && !startedRef.current) {
      startedRef.current = true
      track('start_project', 'form-start')
    }
    setStep((s) => Math.min(4, s + 1))
  }

  function handleBack() {
    setErrors({})
    setStep((s) => Math.max(1, s - 1))
  }

  /* ------------------------------ file handling ---------------------------- */

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list)
    const accepted: File[] = []
    const problems: string[] = []

    for (const f of incoming) {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        problems.push(`"${f.name}" is not an accepted file type (allowed: CSV, XLSX, XLS, PDF, ZIP, DOCX, PNG, JPG, JPEG, WEBP).`)
        continue
      }
      if (f.size === 0) {
        problems.push(`"${f.name}" is empty.`)
        continue
      }
      if (f.size > MAX_FILE_SIZE) {
        problems.push(`"${f.name}" exceeds the 5 MB size limit.`)
        continue
      }
      accepted.push(f)
    }

    const room = Math.max(0, MAX_FILES - files.length)
    if (incoming.length > 0 && room === 0) {
      problems.push(`Maximum ${MAX_FILES} files allowed — remove one to add another.`)
    } else if (accepted.length > room) {
      problems.push(`Only ${room} more file${room === 1 ? '' : 's'} can be added (max ${MAX_FILES}).`)
    }

    setFiles((prev) => [...prev, ...accepted.slice(0, room)])
    setFileError(problems.length > 0 ? problems.join(' ') : null)
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setFileError(null)
  }

  /* -------------------------------- submit --------------------------------- */

  async function handleSubmit() {
    // Final pass: re-validate every step before sending.
    for (const s of [1, 2, 3]) {
      const stepErrors = validateStep(s, form)
      if (Object.keys(stepErrors).length > 0) {
        setStep(s)
        setErrors(stepErrors)
        return
      }
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('company', form.company)
      fd.append('email', form.email)
      fd.append('whatsapp', form.whatsapp)
      fd.append('country', form.country)
      fd.append('serviceCategory', form.serviceCategory)
      fd.append('projectTitle', form.projectTitle)
      fd.append('description', form.description)
      fd.append('businessGoal', form.businessGoal)
      fd.append('deliverable', form.deliverable)
      fd.append('budgetRange', form.budgetRange)
      fd.append('deadline', form.deadline)
      fd.append('contactMethod', form.contactMethod)
      fd.append('website', form.website) // honeypot
      files.forEach((f) => fd.append('files', f))

      const res = await apiFetch('/api/inquiries', { method: 'POST', body: fd })
      const data: { ok?: boolean; id?: string; error?: string } = await res
        .json()
        .catch(() => ({}))

      if (res.ok && data.ok) {
        track('submit_project', form.serviceCategory)
        try {
          window.localStorage.removeItem(DRAFT_KEY)
        } catch {
          /* ignore */
        }
        setDraftSaved(false)
        setDraftRestored(false)
        setInquiryId(data.id ?? '')
        setSubmitted(true)
      } else {
        toast({
          title: 'Submission failed',
          description: data.error ?? 'Something went wrong. Please try again.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Could not reach the server. Please check your connection and try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  /* ------------------------------ review data ------------------------------ */

  const clientRows: [string, string][] = [
    ['Name', form.name],
    ['Company', form.company],
    ['Email', form.email],
    ['WhatsApp', form.whatsapp],
    ['Country', form.country],
  ]
  const projectRows: [string, string][] = [
    ['Service category', form.serviceCategory],
    ['Project title', form.projectTitle],
    ['Description', form.description],
    ['Business goal', form.businessGoal],
    ['Expected deliverable', form.deliverable],
    ['Budget range', form.budgetRange],
    ['Deadline', form.deadline],
  ]

  /* --------------------------------- render -------------------------------- */

  return (
    <section id="start-project" className={showHeading ? 'bg-zinc-50 py-14 md:py-20' : 'bg-zinc-50 py-8 md:py-12'}>
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        {/* On the dedicated page the page header already carries this title. */}
        {showHeading ? (
          <SectionHeading
            eyebrow="Start a Project"
            title="Tell Me About Your Project"
            description="Describe what you are trying to achieve — I will review it and respond with the most practical approach, then a clear quotation. No obligations."
          />
        ) : null}

        {/* Cross-link: prefer to talk first? → booking section */}
        <div className={showHeading ? 'mt-6 flex justify-center' : 'flex justify-center'}>
          <button
            type="button"
            onClick={() => scrollToId('book-a-call')}
            className="group inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-xs font-medium text-teal-700 shadow-sm transition-all hover:-translate-y-px hover:border-teal-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
          >
            <CalendarClock className="h-4 w-4 text-teal-600" aria-hidden="true" />
            Prefer to talk it through first? Propose a time for a free 30-min intro call
            <ArrowRight
              className="h-3.5 w-3.5 text-teal-600 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="mt-8 md:mt-10 grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* ------------------------------ form ------------------------------ */}
          <div className="lg:col-span-3">
            {submitted ? (
              /* ------------------------- success panel ------------------------- */
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
                  <CheckCircle2 className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900">
                  Thank you — your project inquiry has been received.
                </h3>
                {inquiryId ? (
                  <p className="mt-2 text-sm text-zinc-600">
                    Reference ID:{' '}
                    <span className="font-mono font-semibold text-teal-700">{inquiryId}</span>
                  </p>
                ) : null}

                <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-sm font-semibold text-zinc-900">What happens next</p>
                  <ol className="mt-3 space-y-2.5">
                    {processFlow.map((s, i) => (
                      <li key={s} className="flex items-center gap-3 text-sm text-zinc-700">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600/10 text-xs font-bold text-teal-700">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>

                {form.contactMethod === 'Upwork' || form.contactMethod === 'Freelancer' ? (
                  <Button asChild className="mt-6 h-11 bg-teal-600 px-5 text-white hover:bg-teal-500">
                    <a
                      href={form.contactMethod === 'Upwork' ? platformLinks.upwork : platformLinks.freelancer}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        track(form.contactMethod === 'Upwork' ? 'click_upwork' : 'click_freelancer', 'start-project-success')
                      }
                    >
                      {form.contactMethod === 'Upwork' ? 'Hire Me on Upwork' : 'Hire Me on Freelancer'}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : null}

                {/* Continue the conversation on WhatsApp (prefilled with the reference) */}
                <Button
                  asChild
                  variant="outline"
                  className="mt-6 h-11 border-teal-200 bg-white px-5 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                >
                  <a
                    href={`https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(
                      `Hello ${profile.name}, I just submitted a project inquiry${
                        inquiryId ? ` (Ref: ${inquiryId})` : ''
                      }${form.projectTitle ? ` — "${form.projectTitle}"` : ''}. Let's continue the conversation.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('click_whatsapp', 'inquiry-success')}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Continue on WhatsApp
                  </a>
                </Button>
              </motion.div>
            ) : (
              /* --------------------------- form card --------------------------- */
              <div className="relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
                {/* Autosave chip (top-right, invisible until first save) */}
                <div
                  aria-live="polite"
                  className={cn(
                    'pointer-events-none absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-zinc-100 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500 transition-opacity duration-500 md:right-6 md:top-6',
                    draftSaved ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <Save className="h-3 w-3 text-teal-600" aria-hidden="true" />
                  Draft saved
                </div>

                {/* Restored-draft notice */}
                {draftRestored ? (
                  <div className="mb-5 flex flex-col gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      <span className="font-semibold">Draft restored.</span> We recovered your saved
                      answers from your last visit.
                    </p>
                    <button
                      type="button"
                      onClick={clearDraft}
                      className="shrink-0 self-start rounded-full border border-teal-300 bg-white px-3 py-1 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 sm:self-auto"
                    >
                      Start fresh
                    </button>
                  </div>
                ) : null}

                {/* Steps indicator */}
                <div className="mb-10 flex items-start" aria-label={`Step ${step} of 4`}>
                  {STEPS.map((s, i) => {
                    const done = step > s.n
                    const current = step === s.n
                    return (
                      <Fragment key={s.n}>
                        <div className="flex shrink-0 flex-col items-center gap-1.5">
                          <div
                            aria-current={current ? 'step' : undefined}
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                              done && 'border-teal-600 bg-teal-600 text-white',
                              current && !done && 'border-teal-600 bg-white text-teal-700',
                              !done && !current && 'border-zinc-300 bg-white text-zinc-400'
                            )}
                          >
                            {done ? <Check className="h-4 w-4" /> : s.n}
                          </div>
                          <span
                            className={cn(
                              'text-[11px] font-medium sm:text-xs',
                              current ? 'text-teal-700' : done ? 'text-zinc-700' : 'text-zinc-400'
                            )}
                          >
                            {s.label}
                          </span>
                        </div>
                        {i < STEPS.length - 1 ? (
                          <div
                            aria-hidden="true"
                            className={cn(
                              'mx-2 mt-[17px] h-0.5 flex-1 rounded-full transition-colors sm:mx-3',
                              step > s.n ? 'bg-teal-600' : 'bg-zinc-200'
                            )}
                          />
                        ) : null}
                      </Fragment>
                    )
                  })}
                </div>

                {/* ------------------------- STEP 1 ------------------------- */}
                {step === 1 ? (
                  <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                    onKeyDown={handleStepKeyDown}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="sp-name">Your Name *</Label>
                      <Input
                        id="sp-name"
                        value={form.name}
                        onChange={(e) => set('name')(e.target.value)}
                        placeholder="John Smith"
                        autoComplete="name"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'sp-name-error' : undefined}
                      />
                      {errors.name ? (
                        <p id="sp-name-error" className="text-destructive text-xs">
                          {errors.name}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sp-company">Company</Label>
                      <Input
                        id="sp-company"
                        value={form.company}
                        onChange={(e) => set('company')(e.target.value)}
                        placeholder="Company / organization (optional)"
                        autoComplete="organization"
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="sp-email">Email *</Label>
                        <Input
                          id="sp-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => set('email')(e.target.value)}
                          placeholder="you@company.com"
                          autoComplete="email"
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? 'sp-email-error' : undefined}
                        />
                        {errors.email ? (
                          <p id="sp-email-error" className="text-destructive text-xs">
                            {errors.email}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sp-whatsapp">WhatsApp Number</Label>
                        <Input
                          id="sp-whatsapp"
                          type="tel"
                          value={form.whatsapp}
                          onChange={(e) => set('whatsapp')(e.target.value)}
                          placeholder="+1 555 000 0000 (optional)"
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sp-country">Country</Label>
                      <Input
                        id="sp-country"
                        value={form.country}
                        onChange={(e) => set('country')(e.target.value)}
                        placeholder="Where are you based? (optional)"
                        autoComplete="country-name"
                      />
                    </div>
                  </motion.div>
                ) : null}

                {/* ------------------------- STEP 2 ------------------------- */}
                {step === 2 ? (
                  <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                    onKeyDown={handleStepKeyDown}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="sp-service">Service Category *</Label>
                      <Select
                        value={form.serviceCategory}
                        onValueChange={(v) => set('serviceCategory')(v)}
                      >
                        <SelectTrigger
                          id="sp-service"
                          className="w-full"
                          aria-invalid={!!errors.serviceCategory}
                          aria-describedby={errors.serviceCategory ? 'sp-service-error' : undefined}
                        >
                          <SelectValue placeholder="Select the service you need" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectCategoriesForm.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.serviceCategory ? (
                        <p id="sp-service-error" className="text-destructive text-xs">
                          {errors.serviceCategory}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sp-title">Project Title *</Label>
                      <Input
                        id="sp-title"
                        value={form.projectTitle}
                        onChange={(e) => set('projectTitle')(e.target.value)}
                        placeholder="e.g. Sales dashboard from monthly CSV exports"
                        aria-invalid={!!errors.projectTitle}
                        aria-describedby={errors.projectTitle ? 'sp-title-error' : undefined}
                      />
                      {errors.projectTitle ? (
                        <p id="sp-title-error" className="text-destructive text-xs">
                          {errors.projectTitle}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="sp-description">Project Description *</Label>
                        <span
                          className={cn(
                            'text-xs',
                            form.description.trim().length >= 30 ? 'text-teal-600' : 'text-zinc-400'
                          )}
                        >
                          {form.description.length} characters (min 30)
                        </span>
                      </div>
                      <Textarea
                        id="sp-description"
                        rows={5}
                        value={form.description}
                        onChange={(e) => set('description')(e.target.value)}
                        placeholder="What data do you have? What problem are you trying to solve? What does success look like?"
                        aria-invalid={!!errors.description}
                        aria-describedby={errors.description ? 'sp-description-error' : undefined}
                      />
                      {/* Minimum-length progress indicator */}
                      <div
                        aria-hidden="true"
                        className="h-1 w-full overflow-hidden rounded-full bg-zinc-100"
                      >
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            form.description.trim().length >= 30
                              ? 'bg-teal-500'
                              : 'bg-teal-600/40'
                          )}
                          style={{
                            width: `${Math.min((form.description.trim().length / 30) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      {errors.description ? (
                        <p id="sp-description-error" className="text-destructive text-xs">
                          {errors.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="sp-goal">Business Goal</Label>
                        <Input
                          id="sp-goal"
                          value={form.businessGoal}
                          onChange={(e) => set('businessGoal')(e.target.value)}
                          placeholder="e.g. reduce churn, better forecasts (optional)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sp-deliverable">Expected Deliverable</Label>
                        <Input
                          id="sp-deliverable"
                          value={form.deliverable}
                          onChange={(e) => set('deliverable')(e.target.value)}
                          placeholder="e.g. dashboard, model, report (optional)"
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="sp-budget">Budget Range</Label>
                        <Select value={form.budgetRange} onValueChange={(v) => set('budgetRange')(v)}>
                          <SelectTrigger id="sp-budget" className="w-full">
                            <SelectValue placeholder="Select a range (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {budgetRanges.map((b) => (
                              <SelectItem key={b} value={b}>
                                {b}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sp-deadline">Deadline</Label>
                        <Input
                          id="sp-deadline"
                          type="date"
                          value={form.deadline}
                          onChange={(e) => set('deadline')(e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : null}

                {/* ------------------------- STEP 3 ------------------------- */}
                {step === 3 ? (
                  <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    {/* File upload zone */}
                    <div className="space-y-2">
                      <Label>Project Files (optional)</Label>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label="Upload project files — click or drag and drop"
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            fileInputRef.current?.click()
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setDragActive(true)
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => {
                          e.preventDefault()
                          setDragActive(false)
                          addFiles(e.dataTransfer.files)
                        }}
                        className={cn(
                          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-8 text-center transition-colors',
                          'hover:border-teal-500 hover:bg-teal-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2',
                          dragActive && 'border-teal-500 bg-teal-50'
                        )}
                      >
                        <UploadCloud className="h-8 w-8 text-teal-600" />
                        <p className="text-sm text-zinc-700">
                          Drag &amp; drop files here, or{' '}
                          <span className="font-medium text-teal-700 underline underline-offset-2">
                            browse
                          </span>
                        </p>
                        <p className="text-xs text-zinc-500">
                          CSV, XLSX, XLS, PDF, ZIP, DOCX, PNG, JPG, JPEG, WEBP — up to {MAX_FILES}{' '}
                          files, 5 MB each
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".csv,.xlsx,.xls,.pdf,.zip,.docx,.png,.jpg,.jpeg,.webp"
                        aria-label="Upload project files"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) addFiles(e.target.files)
                          e.target.value = ''
                        }}
                      />
                      {fileError ? (
                        <p className="text-destructive text-xs">{fileError}</p>
                      ) : null}

                      {files.length > 0 ? (
                        <ul className="mt-2 space-y-2">
                          {files.map((f, i) => (
                            <li
                              key={`${f.name}-${i}`}
                              className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2"
                            >
                              <FileUp className="h-4 w-4 shrink-0 text-teal-600" />
                              <span className="min-w-0 flex-1 truncate text-sm text-zinc-800">
                                {f.name}
                              </span>
                              <span className="shrink-0 text-xs text-zinc-500">
                                {formatBytes(f.size)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFile(i)}
                                aria-label={`Remove file ${f.name}`}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    {/* Preferred contact method */}
                    <div className="space-y-2">
                      <Label>Preferred Contact Method *</Label>
                      <RadioGroup
                        value={form.contactMethod}
                        onValueChange={(v) => set('contactMethod')(v)}
                        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
                      >
                        {contactMethods.map((m) => {
                          const id = `sp-contact-${m.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                          return (
                            <div
                              key={m}
                              className={cn(
                                'flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors',
                                form.contactMethod === m
                                  ? 'border-teal-600 bg-teal-50'
                                  : 'border-zinc-200'
                              )}
                            >
                              <RadioGroupItem value={m} id={id} />
                              <Label
                                htmlFor={id}
                                className="cursor-pointer text-sm font-normal text-zinc-800"
                              >
                                {m}
                              </Label>
                            </div>
                          )
                        })}
                      </RadioGroup>
                      {errors.contactMethod ? (
                        <p className="text-destructive text-xs">{errors.contactMethod}</p>
                      ) : null}
                    </div>

                    {/* Honeypot — hidden from humans, catches bots */}
                    <Input
                      name="website"
                      value={form.website}
                      onChange={(e) => set('website')(e.target.value)}
                      className="hidden"
                      tabIndex={-1}
                      aria-hidden="true"
                      autoComplete="off"
                    />
                  </motion.div>
                ) : null}

                {/* ------------------------- STEP 4 ------------------------- */}
                {step === 4 ? (
                  <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="space-y-4">
                      {/* Client info */}
                      <div className="rounded-xl border border-zinc-200">
                        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                          <h4 className="text-sm font-semibold text-zinc-900">Client Information</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 text-teal-700 hover:text-teal-800"
                            onClick={() => goToStep(1)}
                          >
                            Edit
                          </Button>
                        </div>
                        <dl className="grid gap-x-6 gap-y-2 px-4 py-3 sm:grid-cols-2">
                          {clientRows.map(([label, value]) => (
                            <div key={label} className="text-sm">
                              <dt className="text-xs text-zinc-500">{label}</dt>
                              <dd className="truncate font-medium text-zinc-900">
                                {value || '—'}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>

                      {/* Project info */}
                      <div className="rounded-xl border border-zinc-200">
                        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                          <h4 className="text-sm font-semibold text-zinc-900">Project Information</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 text-teal-700 hover:text-teal-800"
                            onClick={() => goToStep(2)}
                          >
                            Edit
                          </Button>
                        </div>
                        <dl className="grid gap-x-6 gap-y-2 px-4 py-3 sm:grid-cols-2">
                          {projectRows.map(([label, value]) => (
                            <div key={label} className="text-sm sm:col-span-2">
                              <dt className="text-xs text-zinc-500">{label}</dt>
                              <dd className="whitespace-pre-line font-medium text-zinc-900">
                                {value || '—'}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>

                      {/* Files & contact */}
                      <div className="rounded-xl border border-zinc-200">
                        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                          <h4 className="text-sm font-semibold text-zinc-900">Files &amp; Contact</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 text-teal-700 hover:text-teal-800"
                            onClick={() => goToStep(3)}
                          >
                            Edit
                          </Button>
                        </div>
                        <div className="space-y-2 px-4 py-3 text-sm">
                          <div>
                            <p className="text-xs text-zinc-500">Preferred contact method</p>
                            <p className="font-medium text-zinc-900">{form.contactMethod || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">
                              Files ({files.length}/{MAX_FILES})
                            </p>
                            {files.length > 0 ? (
                              <ul className="mt-1 space-y-1">
                                {files.map((f, i) => (
                                  <li
                                    key={`${f.name}-${i}`}
                                    className="flex items-center gap-2 text-zinc-800"
                                  >
                                    <FileUp className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                                    <span className="truncate">{f.name}</span>
                                    <span className="shrink-0 text-xs text-zinc-500">
                                      {formatBytes(f.size)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="font-medium text-zinc-900">No files attached</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500">
                      By submitting you agree to the privacy terms — files are used only to evaluate
                      your project.
                    </p>
                  </motion.div>
                ) : null}

                {/* ------------------------- nav buttons ------------------------- */}
                <div className="mt-8 flex items-center justify-between gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1 || submitting}
                    className="h-11 border-zinc-300 px-5 text-zinc-700 hover:border-teal-600 hover:text-teal-700"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>

                  {step < 4 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="h-11 bg-teal-600 px-6 text-white hover:bg-teal-500"
                    >
                      {step === 3 ? 'Review' : 'Continue'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="h-11 min-w-[220px] bg-teal-600 px-6 text-white hover:bg-teal-500"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        'Submit Project Inquiry'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ---------------------------- side panel ---------------------------- */}
          <aside className="space-y-5 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <h3 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
                <Sparkles className="h-4 w-4 text-teal-600" />
                What happens next
              </h3>
              <ol className="mt-4 space-y-3.5">
                {processFlow.map((s, i) => {
                  const Icon = FLOW_ICONS[i] ?? ClipboardList
                  return (
                    <li key={s} className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600/10 text-teal-700">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="pt-1.5 text-sm text-zinc-600">
                        <span className="font-medium text-zinc-900">{i + 1}. </span>
                        {s}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-zinc-900">Direct hire</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Prefer hiring through a platform? Find me there.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="h-11 justify-between border-zinc-300 px-4 text-zinc-900 hover:border-teal-600 hover:text-teal-700"
                >
                  <a
                    href={platformLinks.upwork}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('click_upwork', 'start-project-side')}
                  >
                    Hire Me on Upwork
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 justify-between border-zinc-300 px-4 text-zinc-900 hover:border-teal-600 hover:text-teal-700"
                >
                  <a
                    href={platformLinks.freelancer}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('click_freelancer', 'start-project-side')}
                  >
                    Hire Me on Freelancer
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border border-teal-200 bg-teal-50/60 p-6"
            >
              <h3 className="text-base font-semibold text-zinc-900">Prefer to talk first?</h3>
              <p className="mt-1 text-sm text-zinc-600">No forms, no friction — just say hello.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button asChild className="h-11 bg-[#25D366] text-white hover:bg-[#1fb857]">
                  <a
                    href={waLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('click_whatsapp', 'start-project-side')}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 border-zinc-300 px-4 text-zinc-900 hover:border-teal-600 hover:text-teal-700"
                >
                  <a href={telLink()} onClick={() => track('click_phone', 'start-project-side')}>
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                </Button>
              </div>
            </motion.div>
          </aside>
        </div>
      </div>
    </section>
  )
}
