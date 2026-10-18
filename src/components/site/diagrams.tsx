'use client'

import type { ReactNode } from 'react'

/**
 * Hand-built technical diagram illustrations (SVG) — used as project visuals
 * where a generated raster image would be less precise. Brand-consistent:
 * zinc-950 canvas, teal strokes, English labels rendered as real text so they
 * stay crisp at any size and remain accessible.
 *
 * Both diagrams are decorative (aria-hidden) — the surrounding figure carries
 * the descriptive alt text / caption.
 */

const STROKE = '#2dd4bf'
const STROKE_SOFT = 'rgba(45, 212, 191, 0.35)'
const INK = 'rgba(255, 255, 255, 0.75)'
const INK_FAINT = 'rgba(255, 255, 255, 0.4)'

function Canvas({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg
      viewBox="0 0 672 384"
      role="img"
      aria-label={label}
      className="h-auto w-full"
    >
      <defs>
        <pattern id="diagram-grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
        </pattern>
        <marker id="diagram-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={STROKE} />
        </marker>
        <radialGradient id="diagram-glow" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="rgba(45,212,191,0.14)" />
          <stop offset="100%" stopColor="rgba(45,212,191,0)" />
        </radialGradient>
      </defs>

      <rect width="672" height="384" fill="#09090b" />
      <rect width="672" height="384" fill="url(#diagram-grid)" />
      <rect width="672" height="384" fill="url(#diagram-glow)" />
      {children}
    </svg>
  )
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={STROKE}
      strokeWidth="2"
      strokeOpacity="0.85"
      markerEnd="url(#diagram-arrow)"
    />
  )
}

function NodeLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fill={INK} fontSize="12" fontWeight="500" fontFamily="ui-sans-serif, system-ui, sans-serif">
      {text}
    </text>
  )
}

/* ------------------------------- RAG pipeline ------------------------------ */

export function RagDiagram() {
  return (
    <Canvas label="Diagram of a RAG pipeline: documents, chunking, embeddings, vector database, LLM and cited answers">
      {/* 1 — documents */}
      <g>
        <rect x="46" y="128" width="52" height="66" rx="5" fill="none" stroke={STROKE_SOFT} strokeWidth="2" transform="translate(8 -6)" />
        <rect x="52" y="134" width="52" height="66" rx="5" fill="#0e7490" fillOpacity="0.18" stroke={STROKE} strokeWidth="2" />
        {[148, 160, 172, 184].map((y) => (
          <line key={y} x1="62" y1={y} x2="94" y2={y} stroke={INK_FAINT} strokeWidth="2.5" strokeLinecap="round" />
        ))}
        <NodeLabel x={80} y={230} text="Documents" />
      </g>
      <Arrow x1={116} y1={168} x2={148} y2={168} />

      {/* 2 — chunking grid */}
      <g>
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <rect
              key={`${r}-${c}`}
              x={156 + c * 20}
              y={138 + r * 20}
              width="15"
              height="15"
              rx="2.5"
              fill="none"
              stroke={STROKE}
              strokeWidth="1.6"
              strokeOpacity={0.55 + ((r + c) % 3) * 0.18}
            />
          ))
        )}
        <NodeLabel x={206} y={230} text="Chunking" />
      </g>
      <Arrow x1={252} y1={168} x2={284} y2={168} />

      {/* 3 — embeddings cloud */}
      <g>
        {[
          [318, 146], [336, 138], [352, 150], [326, 162], [344, 168], [360, 160],
          [312, 176], [334, 186], [352, 182], [340, 198], [362, 192], [320, 204],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 4 === 0 ? 4.5 : 3} fill={STROKE} fillOpacity={0.45 + (i % 3) * 0.2} />
        ))}
        <NodeLabel x={338} y={230} text="Embeddings" />
      </g>
      <Arrow x1={384} y1={168} x2={416} y2={168} />

      {/* 4 — vector database */}
      <g>
        <ellipse cx="452" cy="140" rx="30" ry="9" fill="none" stroke={STROKE} strokeWidth="2" />
        <path d="M 422 140 L 422 194 A 30 9 0 0 0 482 194 L 482 140" fill="#0e7490" fillOpacity="0.14" stroke={STROKE} strokeWidth="2" />
        <path d="M 422 158 A 30 9 0 0 0 482 158" fill="none" stroke={STROKE_SOFT} strokeWidth="2" />
        <path d="M 422 176 A 30 9 0 0 0 482 176" fill="none" stroke={STROKE_SOFT} strokeWidth="2" />
        <NodeLabel x={452} y={230} text="Vector DB" />
      </g>
      <Arrow x1={488} y1={168} x2={520} y2={168} />

      {/* 5 — LLM chip */}
      <g>
        <rect x="526" y="138" width="60" height="60" rx="9" fill="none" stroke={STROKE} strokeWidth="2" />
        <rect x="541" y="153" width="30" height="30" rx="4" fill={STROKE} fillOpacity="0.25" stroke={STROKE} strokeWidth="1.5" />
        {[536, 556, 576].map((x) => (
          <g key={x}>
            <line x1={x} y1="138" x2={x} y2="126" stroke={STROKE} strokeWidth="1.6" strokeOpacity="0.6" />
            <line x1={x} y1="198" x2={x} y2="210" stroke={STROKE} strokeWidth="1.6" strokeOpacity="0.6" />
          </g>
        ))}
        <NodeLabel x={556} y={230} text="LLM" />
      </g>
      <Arrow x1={590} y1={168} x2={614} y2={168} />

      {/* 6 — cited answer */}
      <g>
        <rect x="620" y="140" width="36" height="46" rx="4" fill="#0e7490" fillOpacity="0.18" stroke={STROKE} strokeWidth="2" transform="rotate(6 638 163)" />
        {[152, 160, 168].map((y) => (
          <line key={y} x1="628" y1={y} x2="648" y2={y} stroke={INK_FAINT} strokeWidth="2" strokeLinecap="round" transform="rotate(6 638 163)" />
        ))}
        <circle cx="630" cy="192" r="10" fill="#09090b" stroke={STROKE} strokeWidth="2" />
        <path d="M 625.5 192 L 629 195.5 L 635 188.5" stroke={STROKE} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <NodeLabel x={640} y={230} text="Cited answer" />
      </g>

      {/* retrieval loop (dashed) */}
      <path
        d="M 526 110 L 556 110 L 556 92 L 452 92 L 452 128"
        fill="none"
        stroke={INK_FAINT}
        strokeWidth="1.6"
        strokeDasharray="4 5"
        markerEnd="url(#diagram-arrow)"
      />
      <text x={508} y={84} textAnchor="middle" fill={INK_FAINT} fontSize="11" fontFamily="ui-sans-serif, system-ui, sans-serif">
        semantic search
      </text>
    </Canvas>
  )
}

/* --------------------------- AI workflow automation ------------------------ */

export function WorkflowDiagram() {
  return (
    <Canvas label="Diagram of an AI workflow automation: email trigger, AI classification, human review branch, spreadsheet logging and completion">
      {/* 1 — trigger envelope */}
      <g>
        <rect x="44" y="140" width="72" height="56" rx="12" fill="#0e7490" fillOpacity="0.14" stroke={STROKE} strokeWidth="2" />
        <rect x="60" y="156" width="40" height="26" rx="4" fill="none" stroke={STROKE} strokeWidth="2" />
        <path d="M 60 158 L 80 172 L 100 158" fill="none" stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <NodeLabel x={80} y={226} text="Trigger" />
      </g>
      <Arrow x1={122} y1={168} x2={152} y2={168} />

      {/* 2 — AI classify (brain sparkle) */}
      <g>
        <circle cx="192" cy="168" r="34" fill="none" stroke={STROKE} strokeWidth="2" />
        <circle cx="192" cy="168" r="34" fill={STROKE} fillOpacity="0.08" />
        {/* simplified brain curve */}
        <path
          d="M 176 178 C 170 168, 174 156, 186 154 C 190 146, 202 146, 206 152 C 216 152, 220 164, 212 172 C 214 182, 202 188, 194 184 C 186 188, 178 186, 176 178 Z"
          fill="none"
          stroke={STROKE}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {[[214, 140], [222, 152], [168, 140]].map(([x, y], i) => (
          <path key={i} d={`M ${x} ${y - 4} L ${x + 1.5} ${y - 1} L ${x + 4.5} ${y} L ${x + 1.5} ${y + 1} L ${x} ${y + 4} L ${x - 1.5} ${y + 1} L ${x - 4.5} ${y} L ${x - 1.5} ${y - 1} Z`} fill={STROKE} fillOpacity="0.8" />
        ))}
        <NodeLabel x={192} y={226} text="AI classify" />
      </g>
      <Arrow x1={232} y1={168} x2={262} y2={168} />

      {/* 3 — review branch */}
      <g>
        <rect x="268" y="144" width="48" height="48" rx="8" transform="rotate(45 292 168)" fill="#09090b" stroke={STROKE} strokeWidth="2" />
        <circle cx="292" cy="168" r="5" fill={STROKE} fillOpacity="0.7" />
        <NodeLabel x={292} y={234} text="Human review" />
        {/* edge case branch */}
        <path d="M 292 226 L 292 296 L 452 296" fill="none" stroke={INK_FAINT} strokeWidth="1.6" strokeDasharray="4 5" markerEnd="url(#diagram-arrow)" />
        <text x={330} y={288} fill={INK_FAINT} fontSize="11" fontFamily="ui-sans-serif, system-ui, sans-serif">
          edge cases
        </text>
      </g>
      <Arrow x1={330} y1={168} x2={360} y2={168} />

      {/* 4 — sheets table */}
      <g>
        <rect x="366" y="132" width="86" height="72" rx="8" fill="#0e7490" fillOpacity="0.12" stroke={STROKE} strokeWidth="2" />
        <line x1="366" y1="152" x2="452" y2="152" stroke={STROKE} strokeWidth="1.8" strokeOpacity="0.7" />
        {[164, 176, 188].map((y) => (
          <g key={y}>
            <line x1="374" y1={y} x2="410" y2={y} stroke={INK_FAINT} strokeWidth="2.4" strokeLinecap="round" />
            <line x1="420" y1={y} x2="444" y2={y} stroke={INK_FAINT} strokeWidth="2.4" strokeLinecap="round" />
          </g>
        ))}
        <NodeLabel x={409} y={226} text="Log to Sheets" />
      </g>
      <Arrow x1={458} y1={168} x2={488} y2={168} />

      {/* 5 — done check */}
      <g>
        <circle cx="524" cy="168" r="26" fill={STROKE} fillOpacity="0.14" stroke={STROKE} strokeWidth="2" />
        <path d="M 512 168 L 520 176 L 536 158" fill="none" stroke={STROKE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <NodeLabel x={524} y={226} text="Done" />
      </g>

      {/* summary strip */}
      <g>
        <rect x="580" y="120" width="56" height="96" rx="8" fill="none" stroke={STROKE_SOFT} strokeWidth="1.6" strokeDasharray="4 4" />
        {[132, 148, 164, 180, 196].map((y, i) => (
          <rect key={y} x="588" y={y} width={40 - i * 4} height="6" rx="3" fill={STROKE} fillOpacity={0.5 - i * 0.08} />
        ))}
        <text x={608} y={238} textAnchor="middle" fill={INK_FAINT} fontSize="11" fontFamily="ui-sans-serif, system-ui, sans-serif">
          summary
        </text>
      </g>
    </Canvas>
  )
}
