"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import type { FSMState, FSMTransition, Tool, CanvasContextMenuState } from "@/lib/fsm-types"
import { FSMStateNode } from "./fsm-state"
import { FSMTransitionLine } from "./fsm-transition"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Circle, ArrowRight, Trash2, Edit3, Flag, Target } from "lucide-react"

interface FSMCanvasProps {
  states: FSMState[]
  transitions: FSMTransition[]
  selectedTool: Tool
  selectedStateId: string | null
  selectedTransitionId: string | null
  transitionStart: string | null
  onAddState: (x: number, y: number) => void
  onUpdateState: (id: string, updates: Partial<FSMState>) => void
  onDeleteState: (id: string) => void
  onSelectState: (id: string | null) => void
  onStartTransition: (stateId: string) => void
  onCompleteTransition: (toStateId: string) => void
  onDeleteTransition: (id: string) => void
  onSelectTransition: (id: string | null) => void
  onEditState: (id: string) => void
  onEditTransition: (id: string) => void
}

export function FSMCanvas({
  states,
  transitions,
  selectedTool,
  selectedStateId,
  selectedTransitionId,
  transitionStart,
  onAddState,
  onUpdateState,
  onDeleteState,
  onSelectState,
  onStartTransition,
  onCompleteTransition,
  onDeleteTransition,
  onSelectTransition,
  onEditState,
  onEditTransition,
}: FSMCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const getCanvasCoords = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== canvasRef.current) return
      const coords = getCanvasCoords(e)

      if (selectedTool === "state") {
        onAddState(coords.x, coords.y)
      } else if (selectedTool === "select") {
        onSelectState(null)
        onSelectTransition(null)
      }

      if (transitionStart) {
        onCompleteTransition("")
      }
    },
    [selectedTool, transitionStart, getCanvasCoords, onAddState, onSelectState, onSelectTransition, onCompleteTransition]
  )

  const handleStateClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      
      if (selectedTool === "transition") {
        if (transitionStart) {
          onCompleteTransition(id)
        } else {
          onStartTransition(id)
        }
      } else if (selectedTool === "select") {
        onSelectState(id)
        onSelectTransition(null)
      }
    },
    [selectedTool, transitionStart, onStartTransition, onCompleteTransition, onSelectState, onSelectTransition]
  )

  const handleStateDoubleClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      onEditState(id)
    },
    [onEditState]
  )

  const handleStateDragStart = useCallback(
    (id: string, e: React.MouseEvent) => {
      if (selectedTool !== "select") return
      e.stopPropagation()
      
      const state = states.find((s) => s.id === id)
      if (!state) return

      const coords = getCanvasCoords(e)
      setDragOffset({
        x: coords.x - state.x,
        y: coords.y - state.y,
      })
      setIsDragging(true)
      onSelectState(id)
    },
    [selectedTool, states, getCanvasCoords, onSelectState]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const coords = getCanvasCoords(e)
      setMousePos(coords)

      if (isDragging && selectedStateId) {
        onUpdateState(selectedStateId, {
          x: Math.max(40, Math.min(coords.x - dragOffset.x, (canvasRef.current?.clientWidth || 800) - 40)),
          y: Math.max(40, Math.min(coords.y - dragOffset.y, (canvasRef.current?.clientHeight || 600) - 40)),
        })
      }
    },
    [isDragging, selectedStateId, dragOffset, getCanvasCoords, onUpdateState]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTransitionClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      if (selectedTool === "select") {
        onSelectTransition(id)
        onSelectState(null)
      }
    },
    [selectedTool, onSelectTransition, onSelectState]
  )

  const handleTransitionDoubleClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      onEditTransition(id)
    },
    [onEditTransition]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, type: "canvas" | "state" | "transition", targetId?: string) => {
      e.preventDefault()
      const coords = getCanvasCoords(e)
      setContextMenu({ x: coords.x, y: coords.y, type, targetId })
    },
    [getCanvasCoords]
  )

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    window.addEventListener("mouseup", handleGlobalMouseUp)
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp)
  }, [])

  const selectedState = selectedStateId ? states.find((s) => s.id === selectedStateId) : null

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={canvasRef}
          className="relative w-full h-full bg-canvas overflow-hidden select-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--canvas-grid) 1px, transparent 1px),
              linear-gradient(to bottom, var(--canvas-grid) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
            cursor: selectedTool === "state" ? "crosshair" : selectedTool === "transition" ? "pointer" : "default",
          }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={(e) => {
            if (e.target === canvasRef.current) {
              handleContextMenu(e, "canvas")
            }
          }}
        >
          {/* SVG layer for transitions */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  className="fill-transition"
                />
              </marker>
              <marker
                id="arrowhead-selected"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  className="fill-transition-selected"
                />
              </marker>
            </defs>

            {transitions.map((t) => {
              const from = states.find((s) => s.id === t.from)
              const to = states.find((s) => s.id === t.to)
              if (!from || !to) return null

              return (
                <FSMTransitionLine
                  key={t.id}
                  transition={t}
                  from={from}
                  to={to}
                  isSelected={selectedTransitionId === t.id}
                  onClick={(e) => handleTransitionClick(t.id, e)}
                  onDoubleClick={(e) => handleTransitionDoubleClick(t.id, e)}
                  onContextMenu={(e) => handleContextMenu(e, "transition", t.id)}
                />
              )
            })}

            {/* Drawing transition line */}
            {transitionStart && selectedState && (
              <line
                x1={selectedState.x}
                y1={selectedState.y}
                x2={mousePos.x}
                y2={mousePos.y}
                className="stroke-transition"
                strokeWidth="1.5"
                strokeDasharray="5,5"
              />
            )}
          </svg>

          {/* State nodes */}
          {states.map((state) => (
            <FSMStateNode
              key={state.id}
              state={state}
              isSelected={selectedStateId === state.id}
              isTransitionStart={transitionStart === state.id}
              onClick={(e) => handleStateClick(state.id, e)}
              onDoubleClick={(e) => handleStateDoubleClick(state.id, e)}
              onMouseDown={(e) => handleStateDragStart(state.id, e)}
              onContextMenu={(e) => handleContextMenu(e, "state", state.id)}
            />
          ))}

          {/* Empty state hint */}
          {states.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground text-xs">
                <Circle className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p>Click on canvas to add states</p>
                <p className="mt-1 opacity-60">or use the toolbar</p>
              </div>
            </div>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-44">
        {contextMenu?.type === "canvas" && (
          <>
            <ContextMenuItem onClick={() => onAddState(contextMenu.x, contextMenu.y)}>
              <Circle className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs">Add State</span>
            </ContextMenuItem>
          </>
        )}

        {contextMenu?.type === "state" && contextMenu.targetId && (
          <>
            <ContextMenuItem onClick={() => onEditState(contextMenu.targetId!)}>
              <Edit3 className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs">Edit State</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => {
                const state = states.find((s) => s.id === contextMenu.targetId)
                if (state) onUpdateState(contextMenu.targetId!, { isInitial: !state.isInitial })
              }}
            >
              <Flag className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs">Toggle Initial</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                const state = states.find((s) => s.id === contextMenu.targetId)
                if (state) onUpdateState(contextMenu.targetId!, { isFinal: !state.isFinal })
              }}
            >
              <Target className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs">Toggle Final</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onStartTransition(contextMenu.targetId!)}>
              <ArrowRight className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs">Add Transition</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onClick={() => onDeleteState(contextMenu.targetId!)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs">Delete State</span>
            </ContextMenuItem>
          </>
        )}

        {contextMenu?.type === "transition" && contextMenu.targetId && (
          <>
            <ContextMenuItem onClick={() => onEditTransition(contextMenu.targetId!)}>
              <Edit3 className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs">Edit Transition</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onClick={() => onDeleteTransition(contextMenu.targetId!)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs">Delete Transition</span>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
