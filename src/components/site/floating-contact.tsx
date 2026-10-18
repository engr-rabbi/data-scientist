'use client'

import { tx } from '@/lib/ui-text'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, MessageCircle, Phone, Rocket, Send } from 'lucide-react'
import { scrollToId, telLink, telegramLink, waLink } from '@/lib/links'
import { track } from '@/lib/analytics'

/**
 * Floating conversion stack (bottom-right): "Start a Project" shortcut, back-to-top,
 * Telegram, phone and WhatsApp. Appears after the visitor scrolls 400px.
 *
 * Refinement: the "Start a Project" pill hides while the inquiry form itself is
 * on screen (it would be redundant there) — back-to-top / Telegram / phone /
 * WhatsApp stay.
 */
export default function FloatingContact() {
  const [visible, setVisible] = useState(false)
  const [formInView, setFormInView] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const form = document.getElementById('start-project')
    if (!form || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => setFormInView(entry.isIntersecting),
      { rootMargin: '-10% 0px -10% 0px' }
    )
    io.observe(form)
    return () => io.disconnect()
  }, [])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="floating-contact"
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2 sm:right-5 sm:bottom-5 sm:gap-3"
        >
          <AnimatePresence initial={false}>
            {visible && !formInView ? (
              <motion.button
                key="start-project-pill"
                type="button"
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.9 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={() => {
                  track('start_project', 'floating')
                  scrollToId('start-project')
                }}
                aria-label="Start a project"
                title="Start a Project"
                className="flex h-11 items-center gap-2 rounded-full bg-teal-600 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-600/30 transition-transform hover:scale-105 hover:bg-teal-500 sm:h-12 sm:px-5"
              >
                <Rocket className="h-4 w-4" aria-hidden="true" />
                {tx('Start a Project')}
              </motion.button>
            ) : null}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => {
              track('back_to_top', 'floating')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            aria-label="Back to top"
            title="Back to top"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-white/80 shadow-lg backdrop-blur transition-all hover:scale-105 hover:border-teal-400/50 hover:text-teal-300 sm:h-12 sm:w-12"
          >
            <ArrowUp className="size-4 sm:size-5" aria-hidden="true" />
          </button>

          <a
            href={telegramLink()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('click_telegram', 'floating')}
            aria-label="Message me on Telegram"
            title="Telegram"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg transition-transform hover:scale-105 sm:h-12 sm:w-12"
          >
            <Send className="size-4 sm:size-5" aria-hidden="true" />
          </a>

          <a
            href={telLink()}
            onClick={() => track('click_phone', 'floating')}
            aria-label="Call me"
            title="Call me"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-transform hover:scale-105 sm:h-12 sm:w-12"
          >
            <Phone className="size-4 sm:size-5" aria-hidden="true" />
          </a>

          <a
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('click_whatsapp', 'floating')}
            aria-label="Chat on WhatsApp"
            title="Chat on WhatsApp"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 sm:h-12 sm:w-12"
          >
            <MessageCircle className="size-4 sm:size-5" aria-hidden="true" />
          </a>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
