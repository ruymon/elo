import type { FSMData, FSMState, FSMTransition } from "./fsm-types"

export function exportToJSON(data: FSMData): string {
  return JSON.stringify(data, null, 2)
}

function getTransitionPath(
  from: FSMState,
  to: FSMState,
  isSelfLoop: boolean
): { d: string; labelX: number; labelY: number; angle: number } {
  const radius = 32

  if (isSelfLoop) {
    // Self-loop path
    const loopRadius = 20
    const startX = from.x
    const startY = from.y - radius
    const controlX1 = from.x - loopRadius * 1.5
    const controlY1 = from.y - radius - loopRadius * 2
    const controlX2 = from.x + loopRadius * 1.5
    const controlY2 = from.y - radius - loopRadius * 2
    const endX = from.x
    const endY = from.y - radius

    return {
      d: `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`,
      labelX: from.x,
      labelY: from.y - radius - loopRadius * 1.8,
      angle: 0,
    }
  }

  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const nx = dx / dist
  const ny = dy / dist

  const startX = from.x + nx * radius
  const startY = from.y + ny * radius
  const endX = to.x - nx * (radius + 8)
  const endY = to.y - ny * (radius + 8)

  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2

  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  return {
    d: `M ${startX} ${startY} L ${endX} ${endY}`,
    labelX: midX,
    labelY: midY - 8,
    angle,
  }
}

export function exportToSVG(data: FSMData): string {
  const padding = 60
  const stateRadius = 32
  
  if (data.states.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="100%" height="100%" fill="#fafafa"/>
  <text x="200" y="150" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#666">Empty FSM</text>
</svg>`
  }

  const minX = Math.min(...data.states.map((s) => s.x)) - padding
  const minY = Math.min(...data.states.map((s) => s.y)) - padding
  const maxX = Math.max(...data.states.map((s) => s.x)) + padding
  const maxY = Math.max(...data.states.map((s) => s.y)) + padding

  const width = maxX - minX + stateRadius * 2
  const height = maxY - minY + stateRadius * 2

  const stateMap = new Map(data.states.map((s) => [s.id, s]))

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX - stateRadius} ${minY - stateRadius} ${width} ${height}">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#525252"/>
    </marker>
  </defs>
  <rect width="100%" height="100%" fill="#fafafa"/>
`

  // Draw transitions
  data.transitions.forEach((t) => {
    const from = stateMap.get(t.from)
    const to = stateMap.get(t.to)
    if (!from || !to) return

    const isSelfLoop = t.from === t.to
    const { d, labelX, labelY } = getTransitionPath(from, to, isSelfLoop)

    svg += `  <path d="${d}" stroke="#525252" stroke-width="1.5" fill="none" marker-end="url(#arrowhead)"/>\n`
    if (t.label) {
      svg += `  <text x="${labelX}" y="${labelY}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#525252">${escapeXml(t.label)}</text>\n`
    }
  })

  // Draw states
  data.states.forEach((s) => {
    const fillColor = s.isInitial ? "#e8f5e9" : s.isFinal ? "#e3f2fd" : "#ffffff"
    const strokeColor = "#525252"

    // Initial state indicator
    if (s.isInitial) {
      svg += `  <path d="M ${s.x - stateRadius - 20} ${s.y} L ${s.x - stateRadius - 4} ${s.y}" stroke="${strokeColor}" stroke-width="1.5" marker-end="url(#arrowhead)"/>\n`
    }

    // State circle
    svg += `  <circle cx="${s.x}" cy="${s.y}" r="${stateRadius}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5"/>\n`

    // Final state double circle
    if (s.isFinal) {
      svg += `  <circle cx="${s.x}" cy="${s.y}" r="${stateRadius - 5}" fill="none" stroke="${strokeColor}" stroke-width="1.5"/>\n`
    }

    // State name
    svg += `  <text x="${s.x}" y="${s.y}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#171717">${escapeXml(s.name)}</text>\n`
  })

  svg += `</svg>`
  return svg
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function exportToLaTeX(data: FSMData): string {
  if (data.states.length === 0) {
    return `\\documentclass{standalone}
\\usepackage{tikz}
\\usetikzlibrary{automata, positioning, arrows.meta}

\\begin{document}
\\begin{tikzpicture}[
    >=Stealth,
    node distance=3cm,
    on grid,
    auto,
    every state/.style={
        draw,
        minimum size=1.2cm,
        font=\\small
    }
]
% Empty FSM - add states and transitions
\\end{tikzpicture}
\\end{document}`
  }

  // Normalize coordinates to TikZ scale (divide by ~50 for reasonable spacing)
  const scale = 0.02

  let latex = `\\documentclass{standalone}
\\usepackage{tikz}
\\usetikzlibrary{automata, positioning, arrows.meta}

\\begin{document}
\\begin{tikzpicture}[
    >=Stealth,
    node distance=3cm,
    on grid,
    auto,
    every state/.style={
        draw,
        minimum size=1.2cm,
        font=\\small
    }
]

% States
`

  const stateMap = new Map(data.states.map((s) => [s.id, s]))

  // Generate state nodes
  data.states.forEach((s) => {
    const x = (s.x * scale).toFixed(2)
    const y = (-s.y * scale).toFixed(2) // Flip Y for TikZ coordinate system

    let stateType = "state"
    if (s.isInitial && s.isFinal) {
      stateType = "state, initial, accepting"
    } else if (s.isInitial) {
      stateType = "state, initial"
    } else if (s.isFinal) {
      stateType = "state, accepting"
    }

    const safeName = s.name.replace(/_/g, "\\_")
    const safeId = s.id.replace(/-/g, "")

    latex += `\\node[${stateType}] (${safeId}) at (${x}, ${y}) {${safeName}};\n`
  })

  latex += `
% Transitions
`

  // Generate transitions
  data.transitions.forEach((t) => {
    const from = stateMap.get(t.from)
    const to = stateMap.get(t.to)
    if (!from || !to) return

    const fromId = t.from.replace(/-/g, "")
    const toId = t.to.replace(/-/g, "")
    const safeLabel = t.label.replace(/_/g, "\\_")

    if (t.from === t.to) {
      // Self-loop
      latex += `\\path[->] (${fromId}) edge[loop above] node {${safeLabel}} (${toId});\n`
    } else {
      latex += `\\path[->] (${fromId}) edge node {${safeLabel}} (${toId});\n`
    }
  })

  latex += `
\\end{tikzpicture}
\\end{document}`

  return latex
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
