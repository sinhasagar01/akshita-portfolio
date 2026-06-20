'use client'

import { useEffect, useRef, useState } from 'react'

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

export default function PageLoader() {
  const [gone, setGone] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setGone(true)
      return
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
      window.scrollTo(0, 0)
      setGone(true)
    }, 1400)

    return () => clearTimeout(timer)
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
