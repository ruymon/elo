"use client"

import type { FSMState } from "@/lib/fsm-types"
import { cn } from "@/lib/utils"

interface FSMStateNodeProps {
  state: FSMState
  isSelected: boolean
  isTransitionStart: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
}

export function FSMStateNode({
  state,
  isSelected,
  isTransitionStart,
  onClick,
  onDoubleClick,
  onMouseDown,
  onContextMenu,
}: FSMStateNodeProps) {
  const radius = 32

  return (
    <div
      className={cn(
        "absolute flex items-center justify-center cursor-pointer transition-shadow duration-100",
        "rounded-full border-[1.5px]",
        isSelected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        isTransitionStart && "ring-2 ring-transition-selected ring-offset-2 ring-offset-background"
      )}
      style={{
        width: radius * 2,
        height: radius * 2,
        left: state.x - radius,
        top: state.y - radius,
        backgroundColor: isSelected
          ? "var(--state-selected)"
          : state.isInitial
          ? "var(--state-initial)"
          : state.isFinal
          ? "var(--state-final)"
          : "var(--state-default)",
        borderColor: "var(--border)",
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
    >
      {/* Initial state indicator */}
      {state.isInitial && (
        <svg
          className="absolute pointer-events-none"
          style={{
            left: -28,
            top: "50%",
            transform: "translateY(-50%)",
            width: 24,
            height: 12,
          }}
        >
          <line
            x1="0"
            y1="6"
            x2="16"
            y2="6"
            className="stroke-foreground"
            strokeWidth="1.5"
          />
          <polygon
            points="14,2 22,6 14,10"
            className="fill-foreground"
          />
        </svg>
      )}

      {/* Final state inner circle */}
      {state.isFinal && (
        <div
          className="absolute rounded-full border-[1.5px] pointer-events-none"
          style={{
            width: (radius - 5) * 2,
            height: (radius - 5) * 2,
            borderColor: "var(--border)",
          }}
        />
      )}

      {/* State name */}
      <span className="text-xs font-medium text-foreground select-none truncate px-1 max-w-[56px]">
        {state.name}
      </span>
    </div>
  )
}
