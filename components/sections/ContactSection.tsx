'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Container from '@/components/layout/Container'
import SectionHeading from '@/components/ui/SectionHeading'
import type { SiteSettingsEntry } from '@/lib/keystatic'

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const STEPS = [
  {
    id: '01',
    eyebrow: 'About you',
    question: 'First, what should I call you?',
    type: 'text' as const,
    placeholder: 'type your name',
    required: true,
    field: 'name' as const,
  },
  {
    id: '02',
    eyebrow: 'Reaching you',
    question: 'And where can I reach you?',
    type: 'email' as const,
    placeholder: 'your email',
    required: true,
    field: 'email' as const,
  },
  {
    id: '03',
    eyebrow: 'The reason',
    question: 'What would you like to talk about?',
    type: 'textarea' as const,
    placeholder: 'a project, a role, or just hello',
    required: false,
    field: 'message' as const,
  },
] as const

type Step = (typeof STEPS)[number]
type Answers = { name: string; email: string; message: string }
type Status = 'idle' | 'sending' | 'done' | 'error'

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

// Shared input class — no border classes here, border applied via inline style (1.5px)
const INPUT_BASE =
  'w-full bg-transparent text-[20px] font-body text-[--color-text-primary] placeholder:text-[#c2b4a2] px-0 py-2 outline-none'

// ---------------------------------------------------------------------------
// StepContent — separate component so its useEffect fires on mount only,
// after AnimatePresence mode="wait" allows it to enter (~300ms after exit).
// ---------------------------------------------------------------------------

type StepContentProps = {
  step: Step
  answers: Answers
  onChangeAnswer: (field: keyof Answers, value: string) => void
  fieldError: string
  isLast: boolean
  status: Status
  onAdvance: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

function StepContent({
  step,
  answers,
  onChangeAnswer,
  fieldError,
  isLast,
  status,
  onAdvance,
  inputRef,
  textareaRef,
}: StepContentProps) {
  useEffect(() => {
    const t = setTimeout(() => {
      if (step.type === 'textarea') textareaRef.current?.focus()
      else inputRef.current?.focus()
    }, 50)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = answers[step.field]
  const sending = status === 'sending'

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && step.type !== 'textarea') {
      e.preventDefault()
      if (status === 'idle') onAdvance()
    }
  }

  return (
    <div className="w-full">
      {/* Eyebrow — DM Sans 12px 500 uppercase .22em tracking, terracotta */}
      <span
        className="block mb-[14px] font-body text-[12px] font-medium tracking-[0.22em] uppercase"
        style={{ color: 'var(--color-accent-500)' }}
      >
        {step.eyebrow}
      </span>

      {/* Question — Fraunces italic 30px lh 1.2 ink */}
      <label
        htmlFor="contact-input"
        className="block font-display italic text-[30px] leading-[1.2] text-[--color-text-primary] mb-6 cursor-text"
        style={{ fontWeight: 400 }}
      >
        {step.question}
      </label>

      {/* Input / textarea — 1.5px warm bottom border, 20px DM Sans */}
      {step.type === 'textarea' ? (
        <textarea
          id="contact-input"
          ref={textareaRef}
          rows={2}
          placeholder={step.placeholder}
          value={value}
          onChange={e => onChangeAnswer(step.field, e.target.value)}
          className={`${INPUT_BASE} resize-none min-h-[46px]`}
          style={{ borderBottom: '1.5px solid rgba(120,90,60,0.26)' }}
        />
      ) : (
        <input
          id="contact-input"
          ref={inputRef}
          type={step.type}
          placeholder={step.placeholder}
          value={value}
          onChange={e => onChangeAnswer(step.field, e.target.value)}
          onKeyDown={handleKeyDown}
          className={INPUT_BASE}
          style={{ borderBottom: '1.5px solid rgba(120,90,60,0.26)' }}
        />
      )}

      {/* Validation hint — 12px terracotta, min-height 14px */}
      <p
        className="text-[12px] mt-2 min-h-[14px]"
        style={{ color: 'var(--color-accent-500)' }}
        aria-live="assertive"
        aria-atomic="true"
      >
        {fieldError}
      </p>

      {/* Filled terracotta pill button — 14px DM Sans 500, 1.5px border, 13px 24px padding */}
      <button
        type="button"
        onClick={() => { if (status === 'idle') onAdvance() }}
        disabled={sending}
        className="group mt-[18px] inline-flex items-center gap-[9px] font-body text-[14px] font-medium text-white rounded-full cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(181,97,60,0.25)] transition-[transform,box-shadow] duration-300 disabled:opacity-70 disabled:pointer-events-none"
        style={{
          background: 'var(--color-accent-500)',
          border: '1.5px solid var(--color-accent-500)',
          padding: '13px 24px',
        }}
      >
        {sending ? (
          <>
            <span aria-hidden="true" className="w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white animate-spin" />
            Sending
          </>
        ) : (
          <>
            {isLast ? 'Send message' : 'Continue'}
            <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </>
        )}
      </button>

      {/* "press Enter" hint — 11px #c2b4a2 */}
      {step.type !== 'textarea' && (
        <p className="text-[11px] mt-3" style={{ color: '#c2b4a2' }}>
          press Enter
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SuccessScreen
// ---------------------------------------------------------------------------

function SuccessScreen() {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => { ref.current?.focus() }, [])

  return (
    <div className="w-full">
      {/* 46px terracotta circle, white checkmark, 18px margin */}
      <div
        aria-hidden="true"
        className="flex items-center justify-center rounded-full mb-[18px]"
        style={{
          width: 46,
          height: 46,
          background: 'var(--color-accent-500)',
          color: '#fff',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3
        ref={ref}
        tabIndex={-1}
        className="font-display italic text-[30px] leading-[1.2] text-[--color-text-primary] mb-3 outline-none"
        style={{ fontWeight: 400 }}
      >
        Thanks, talk soon.
      </h3>
      <p className="font-body text-[14px] leading-[1.6] max-w-[34ch]" style={{ color: '#4a4239' }}>
        I will get back to you within a day. Meanwhile, my work is just above.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ErrorScreen
// ---------------------------------------------------------------------------

function ErrorScreen({ email, onRetry }: { email: string; onRetry: () => void }) {
  const ref = useRef<HTMLParagraphElement>(null)
  useEffect(() => { ref.current?.focus() }, [])

  return (
    <div className="w-full">
      <p
        ref={ref}
        tabIndex={-1}
        className="font-display italic text-[30px] leading-[1.2] text-[--color-text-primary] mb-3 outline-none"
        style={{ fontWeight: 400 }}
      >
        That did not send.
      </p>
      <p className="font-body text-[14px] text-[--color-text-secondary]">
        Try emailing me directly at{' '}
        <a href={`mailto:${email}`} style={{ color: 'var(--color-accent-500)' }} className="underline">
          {email}
        </a>
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 font-body text-[13px] text-[--color-text-muted] underline hover:text-[--color-text-secondary] transition-colors duration-[--duration-base]"
      >
        try again
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ContactSection
// ---------------------------------------------------------------------------

type Props = { settings: SiteSettingsEntry | null }

export default function ContactSection({ settings }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [fieldError, setFieldError] = useState('')

  const reduceMotion = useReducedMotion()
  const glowRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const TOTAL = STEPS.length
  const step = STEPS[stepIndex]
  const isLast = stepIndex === TOTAL - 1
  const showBack = stepIndex > 0 && status === 'idle'

  const glowOpacity = status === 'done' ? 1 : 0.5 + stepIndex * 0.2

  useEffect(() => {
    if (status !== 'done' || reduceMotion || !glowRef.current) return
    glowRef.current.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)' },
        { transform: 'translate(-50%, -50%) scale(1.18)' },
        { transform: 'translate(-50%, -50%) scale(1)' },
      ],
      { duration: 1100, easing: 'cubic-bezier(.22,1,.36,1)' }
    )
  }, [status, reduceMotion])

  const validate = useCallback(() => {
    if (step.required) {
      const val = answers[step.field].trim()
      if (!val) {
        setFieldError('please add this so I can reply')
        return false
      }
    }
    if (step.type === 'email' && answers.email && !isValidEmail(answers.email.trim())) {
      setFieldError('that email looks a little off')
      return false
    }
    setFieldError('')
    return true
  }, [step, answers])

  const advance = useCallback(async () => {
    if (status !== 'idle') return
    if (!validate()) return

    if (isLast) {
      setStatus('sending')
      try {
        const endpoint = process.env.NEXT_PUBLIC_CONTACT_FORM_ENDPOINT
        if (!endpoint) throw new Error('no endpoint configured')
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(answers),
        })
        if (!res.ok) throw new Error('send failed')
        setStatus('done')
      } catch {
        setStatus('error')
      }
      return
    }

    setStepIndex(i => i + 1)
    setFieldError('')
  }, [status, validate, isLast, answers])

  const goBack = useCallback(() => {
    if (stepIndex > 0 && status === 'idle') {
      setStepIndex(i => i - 1)
      setFieldError('')
    }
  }, [stepIndex, status])

  const handleChangeAnswer = useCallback((field: keyof Answers, value: string) => {
    setAnswers(a => ({ ...a, [field]: value }))
  }, [])

  const slideVariants = {
    enter:  { opacity: 0, y: reduceMotion ? 0 : 22 },
    center: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
    exit: {
      opacity: 0,
      y: reduceMotion ? 0 : -22,
      transition: { duration: 0.3, ease: 'easeIn' as const },
    },
  }

  const liveStatus =
    status === 'sending' ? 'Sending your message' :
    status === 'done'    ? 'Message sent' :
    status === 'error'   ? 'Message failed to send' :
    ''

  const progressWidth = status === 'done' ? '100%' : `${((stepIndex + 1) / TOTAL) * 100}%`
  const countLabel    = status === 'done' ? 'sent'  : `0${stepIndex + 1} / 0${TOTAL}`

  if (!settings) return null

  return (
    <section id="contact" className="scroll-mt-20 py-24 md:py-32">
      <Container>

        <SectionHeading
          index="06"
          title="Get in touch"
          subtext="Have a project, a role, or just a hello. I would love to hear it."
          variant="centered"
          tone="warm"
        />

        {/* Form area — centered, max 680px */}
        <div className="mt-8 sm:mt-[52px]">
        <div className="max-w-[680px] mx-auto">

          {/* Screen-reader status announcer */}
          <p className="sr-only" aria-live="polite" aria-atomic="true">{liveStatus}</p>

          {/* Panel — cream bg, 16px radius, overflow hidden to clip glow */}
          <div
            className="relative overflow-hidden"
            style={{
              background: 'var(--color-cream-50)',
              borderRadius: 16,
              minHeight: 330,
              padding: '42px 42px 26px',
            }}
          >
            {/* Ambient glow — z-0, inside panel so it clips */}
            <div
              ref={glowRef}
              aria-hidden="true"
              className="pointer-events-none absolute transition-opacity duration-[600ms] ease-linear"
              style={{
                left: '50%',
                top: '52%',
                width: '62%',
                height: '74%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(closest-side, rgba(181,97,60,0.24), rgba(224,156,96,0.10) 52%, transparent 75%)',
                filter: 'blur(46px)',
                zIndex: 0,
                opacity: glowOpacity,
              }}
            />

            {/* Progress bar — absolute top-0, 3px, z-2 */}
            <div
              role="progressbar"
              aria-valuenow={status === 'done' ? TOTAL : stepIndex + 1}
              aria-valuemin={1}
              aria-valuemax={TOTAL}
              aria-label="Form progress"
              className="absolute left-0 top-0 w-full"
              style={{ height: 3, background: 'rgba(120,90,60,0.10)', zIndex: 2 }}
            >
              <div
                className="h-full transition-[width] duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
                style={{ width: progressWidth, background: 'var(--color-accent-500)' }}
              />
            </div>

            {/* Stage — z-1, min-height 212px, flex center */}
            <div className="relative flex items-center min-h-[212px]" style={{ zIndex: 1 }}>
              <AnimatePresence mode="wait" initial={false}>
                {status === 'done' ? (
                  <motion.div key="done" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full">
                    <SuccessScreen />
                  </motion.div>
                ) : status === 'error' ? (
                  <motion.div key="error" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full">
                    <ErrorScreen email={settings.email ?? ''} onRetry={() => setStatus('idle')} />
                  </motion.div>
                ) : (
                  <motion.div key={stepIndex} variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full">
                    <StepContent
                      step={step}
                      answers={answers}
                      onChangeAnswer={handleChangeAnswer}
                      fieldError={fieldError}
                      isLast={isLast}
                      status={status}
                      onAdvance={advance}
                      inputRef={inputRef}
                      textareaRef={textareaRef}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Nav row — back link (hidden on step 1) + step count */}
            <div className="relative flex items-center justify-between mt-[10px]" style={{ zIndex: 1 }}>
              <button
                type="button"
                onClick={goBack}
                tabIndex={showBack ? 0 : -1}
                aria-hidden={showBack ? undefined : true}
                className="font-body text-[13px] transition-opacity duration-300"
                style={{
                  color: '#94806f',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: showBack ? 1 : 0,
                  pointerEvents: showBack ? 'auto' : 'none',
                }}
              >
                ← back
              </button>
              <span
                className="font-body text-[12px] tracking-[0.12em]"
                style={{ color: '#94806f' }}
              >
                {countLabel}
              </span>
            </div>

            {/* Escape email link — inside panel, centered, z-1 */}
            <p
              className="relative text-center font-body text-[12px] mt-[14px]"
              style={{ zIndex: 1, color: '#9C9182' }}
            >
              or just email{' '}
              <a
                href={`mailto:${settings.email ?? ''}`}
                style={{ color: 'var(--color-accent-500)', textDecoration: 'none' }}
                className="hover:underline"
              >
                {settings.email}
              </a>
            </p>
          </div>
        </div>
        </div>
      </Container>
    </section>
  )
}
