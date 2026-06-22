'use client'

import { useEffect, useRef, useState } from 'react'
import { useLenis } from 'lenis/react'
import { ScrollTrigger } from '@/lib/gsap'

const WARM_SHADES = [
  '#B5613C', '#C56B3F', '#A85433', '#BD8A3C',
  '#B5705A', '#AE5A45', '#C98A3E', '#A9763C',
]
const COLS = 24
const ROWS = 16

type RGB = [number, number, number]
function toRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function hx(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
}

function toHex(c: RGB): string {
  return '#' + hx(c[0]) + hx(c[1]) + hx(c[2])
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function resetToTop(lenis: ReturnType<typeof useLenis>) {
  ScrollTrigger.clearScrollMemory()
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  ScrollTrigger.refresh()
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  ScrollTrigger.update()
}

export default function PageLoader() {
  const [gone, setGone] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const lenis = useLenis()
  const lenisRef = useRef(lenis)
  useEffect(() => { lenisRef.current = lenis }, [lenis])

  useEffect(() => {
    // Freeze the page at scroll=0 for the entire loader duration.
    // lenis.stop() halts Lenis-driven scrolling; the capture scroll listener
    // resets any stray native scroll (e.g. focus-induced) to 0 immediately.
    lenisRef.current?.stop()
    const holdTop = () => window.scrollTo(0, 0)
    window.addEventListener('scroll', holdTop, { capture: true })

    function finish() {
      window.removeEventListener('scroll', holdTop, { capture: true })
      window.scrollTo(0, 0)
      const l = lenisRef.current
      if (l) {
        l.start()
        l.scrollTo(0, { immediate: true, force: true })
      }
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      setGone(true)
      requestAnimationFrame(() => resetToTop(lenisRef.current))
      return () => {
        window.removeEventListener('scroll', holdTop, { capture: true })
        lenisRef.current?.start()
      }
    }

    const el = overlayRef.current
    if (!el) return

    const shade = WARM_SHADES[Math.floor(Math.random() * WARM_SHADES.length)]
    const pattern = Math.random() < 0.5 ? 'scatter' : 'wave'

    el.style.backgroundColor = shade

    const base = toRgb(shade)
    const top = mix(base, [255, 255, 255], 0.16)
    const bot = mix(base, [0, 0, 0], 0.16)

    const grid = document.createElement('div')
    grid.style.cssText = `position:absolute;inset:0;display:grid;grid-template-columns:repeat(${COLS},1fr);grid-template-rows:repeat(${ROWS},1fr)`

    const tileEls: HTMLDivElement[] = []
    for (let i = 0; i < COLS * ROWS; i++) {
      const row = Math.floor(i / COLS)
      const t_pos = row / (ROWS - 1)
      const c = mix(top, bot, t_pos)
      const f = 1 + (Math.random() - 0.5) * 0.09
      const t = document.createElement('div')
      t.style.background = toHex([c[0] * f, c[1] * f, c[2] * f])
      grid.appendChild(t)
      tileEls.push(t)
    }
    el.appendChild(grid)
    el.style.backgroundColor = 'transparent'

    el.getBoundingClientRect()

    tileEls.forEach((t, i) => {
      const col = i % COLS
      const delay =
        pattern === 'scatter'
          ? Math.random() * 900
          : (col / COLS) * 850 + Math.random() * 220
      t.style.transition = 'opacity .38s ease'
      t.style.transitionDelay = delay + 'ms'
      t.style.opacity = '0'
    })

    const timer = setTimeout(() => {
      finish()
      resetToTop(lenisRef.current)
      setGone(true)
    }, 1400)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', holdTop, { capture: true })
      lenisRef.current?.start()
    }
  }, [])

  if (gone) return null

  return (
    <div
      ref={overlayRef}
      className="page-loader"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#B5613C' }}
    />
  )
}
