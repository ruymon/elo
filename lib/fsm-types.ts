export interface FSMState {
  id: string
  name: string
  x: number
  y: number
  isInitial: boolean
  isFinal: boolean
}

export interface FSMTransition {
  id: string
  from: string
  to: string
  label: string
}

export interface FSMData {
  states: FSMState[]
  transitions: FSMTransition[]
}

export type Tool = "select" | "state" | "transition"

export interface CanvasContextMenuState {
  x: number
  y: number
  type: "canvas" | "state" | "transition"
  targetId?: string
}
