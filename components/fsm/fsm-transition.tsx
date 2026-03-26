"use client"

import type { FSMState, FSMTransition } from "@/lib/fsm-types"
import { cn } from "@/lib/utils"

interface FSMTransitionLineProps {
  transition: FSMTransition
  from: FSMState
  to: FSMState
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
}

export function FSMTransitionLine({
  transition,
  from,
  to,
  isSelected,
  onClick,
  onDoubleClick,
  onContextMenu,
}: FSMTransitionLineProps) {
  const radius = 32
  const isSelfLoop = from.id === to.id

  if (isSelfLoop) {
    // Self-loop
    const loopRadius = 20
    const startX = from.x
    const startY = from.y - radius
    const controlX1 = from.x - loopRadius * 1.5
    const controlY1 = from.y - radius - loopRadius * 2
    const controlX2 = from.x + loopRadius * 1.5
    const controlY2 = from.y - radius - loopRadius * 2
    
    const pathD = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${startX} ${startY}`
    const labelX = from.x
    const labelY = from.y - radius - loopRadius * 1.8

    return (
      <g className="pointer-events-auto cursor-pointer">
        {/* Invisible wider path for easier clicking */}
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth="16"
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onContextMenu={onContextMenu}
        />
        <path
          d={pathD}
          fill="none"
          className={cn(
            isSelected ? "stroke-transition-selected" : "stroke-transition"
          )}
          strokeWidth={isSelected ? "2" : "1.5"}
          markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
        />
        {transition.label && (
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            className={cn(
              "text-[10px] select-none pointer-events-none",
              isSelected ? "fill-transition-selected font-medium" : "fill-muted-foreground"
            )}
          >
            {transition.label}
          </text>
        )}
      </g>
    )
  }

  // Regular transition
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  
  if (dist === 0) return null
  
  const nx = dx / dist
  const ny = dy / dist

  const startX = from.x + nx * radius
  const startY = from.y + ny * radius
  const endX = to.x - nx * (radius + 8)
  const endY = to.y - ny * (radius + 8)

  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2

  return (
    <g className="pointer-events-auto cursor-pointer">
      {/* Invisible wider line for easier clicking */}
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="transparent"
        strokeWidth="16"
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
      />
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        className={cn(
          isSelected ? "stroke-transition-selected" : "stroke-transition"
        )}
        strokeWidth={isSelected ? "2" : "1.5"}
        markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
      />
      {transition.label && (
        <text
          x={midX}
          y={midY - 6}
          textAnchor="middle"
          className={cn(
            "text-[10px] select-none pointer-events-none",
            isSelected ? "fill-transition-selected font-medium" : "fill-muted-foreground"
          )}
        >
          {transition.label}
        </text>
      )}
    </g>
  )
}
