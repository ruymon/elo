"use client"

import { useState, useCallback, useEffect } from "react"
import { nanoid } from "nanoid"
import type { FSMState, FSMTransition, FSMData, Tool } from "@/lib/fsm-types"
import { exportToJSON, exportToSVG, exportToLaTeX, downloadFile } from "@/lib/fsm-export"
import { FSMCanvas } from "./fsm-canvas"
import { FSMToolbar } from "./fsm-toolbar"
import { EditStateDialog, EditTransitionDialog } from "./fsm-dialogs"

interface HistoryEntry {
  states: FSMState[]
  transitions: FSMTransition[]
}

export function FSMDesigner() {
  const [states, setStates] = useState<FSMState[]>([])
  const [transitions, setTransitions] = useState<FSMTransition[]>([])
  const [selectedTool, setSelectedTool] = useState<Tool>("select")
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null)
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null)
  const [transitionStart, setTransitionStart] = useState<string | null>(null)
  
  // Edit dialogs
  const [editStateId, setEditStateId] = useState<string | null>(null)
  const [editTransitionId, setEditTransitionId] = useState<string | null>(null)

  // Undo/Redo
  const [history, setHistory] = useState<HistoryEntry[]>([{ states: [], transitions: [] }])
  const [historyIndex, setHistoryIndex] = useState(0)

  const pushHistory = useCallback((newStates: FSMState[], newTransitions: FSMTransition[]) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push({ states: newStates, transitions: newTransitions })
      return newHistory.slice(-50) // Keep last 50 entries
    })
    setHistoryIndex((prev) => Math.min(prev + 1, 49))
  }, [historyIndex])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const entry = history[newIndex]
      setStates(entry.states)
      setTransitions(entry.transitions)
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      const entry = history[newIndex]
      setStates(entry.states)
      setTransitions(entry.transitions)
    }
  }, [history, historyIndex])

  // State counter for naming
  const [stateCounter, setStateCounter] = useState(0)

  const addState = useCallback((x: number, y: number) => {
    const newState: FSMState = {
      id: nanoid(8),
      name: `q${stateCounter}`,
      x,
      y,
      isInitial: states.length === 0,
      isFinal: false,
    }
    const newStates = [...states, newState]
    setStates(newStates)
    setStateCounter((c) => c + 1)
    pushHistory(newStates, transitions)
  }, [states, transitions, stateCounter, pushHistory])

  const updateState = useCallback((id: string, updates: Partial<FSMState>) => {
    const newStates = states.map((s) => (s.id === id ? { ...s, ...updates } : s))
    
    // If setting as initial, unset other initial states
    if (updates.isInitial) {
      newStates.forEach((s) => {
        if (s.id !== id) s.isInitial = false
      })
    }
    
    setStates(newStates)
    pushHistory(newStates, transitions)
  }, [states, transitions, pushHistory])

  const deleteState = useCallback((id: string) => {
    const newStates = states.filter((s) => s.id !== id)
    const newTransitions = transitions.filter((t) => t.from !== id && t.to !== id)
    setStates(newStates)
    setTransitions(newTransitions)
    setSelectedStateId(null)
    pushHistory(newStates, newTransitions)
  }, [states, transitions, pushHistory])

  const startTransition = useCallback((stateId: string) => {
    setTransitionStart(stateId)
    setSelectedStateId(stateId)
    setSelectedTool("transition")
  }, [])

  const completeTransition = useCallback((toStateId: string) => {
    if (transitionStart && toStateId) {
      // Check if transition already exists
      const exists = transitions.some(
        (t) => t.from === transitionStart && t.to === toStateId
      )
      
      if (!exists) {
        const newTransition: FSMTransition = {
          id: nanoid(8),
          from: transitionStart,
          to: toStateId,
          label: "",
        }
        const newTransitions = [...transitions, newTransition]
        setTransitions(newTransitions)
        pushHistory(states, newTransitions)
        
        // Open edit dialog for the new transition
        setEditTransitionId(newTransition.id)
      }
    }
    setTransitionStart(null)
  }, [transitionStart, transitions, states, pushHistory])

  const updateTransition = useCallback((id: string, updates: Partial<FSMTransition>) => {
    const newTransitions = transitions.map((t) => (t.id === id ? { ...t, ...updates } : t))
    setTransitions(newTransitions)
    pushHistory(states, newTransitions)
  }, [states, transitions, pushHistory])

  const deleteTransition = useCallback((id: string) => {
    const newTransitions = transitions.filter((t) => t.id !== id)
    setTransitions(newTransitions)
    setSelectedTransitionId(null)
    pushHistory(states, newTransitions)
  }, [states, transitions, pushHistory])

  const clearAll = useCallback(() => {
    setStates([])
    setTransitions([])
    setStateCounter(0)
    setSelectedStateId(null)
    setSelectedTransitionId(null)
    setTransitionStart(null)
    pushHistory([], [])
  }, [pushHistory])

  // Export functions
  const handleExportJSON = useCallback(() => {
    const data: FSMData = { states, transitions }
    const json = exportToJSON(data)
    downloadFile(json, "fsm.json", "application/json")
  }, [states, transitions])

  const handleExportSVG = useCallback(() => {
    const data: FSMData = { states, transitions }
    const svg = exportToSVG(data)
    downloadFile(svg, "fsm.svg", "image/svg+xml")
  }, [states, transitions])

  const handleExportLaTeX = useCallback(() => {
    const data: FSMData = { states, transitions }
    const latex = exportToLaTeX(data)
    downloadFile(latex, "fsm.tex", "text/plain")
  }, [states, transitions])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === "v" || e.key === "V") {
        setSelectedTool("select")
      } else if (e.key === "s" || e.key === "S") {
        setSelectedTool("state")
      } else if (e.key === "t" || e.key === "T") {
        setSelectedTool("transition")
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedStateId) {
          deleteState(selectedStateId)
        } else if (selectedTransitionId) {
          deleteTransition(selectedTransitionId)
        }
      } else if (e.key === "Escape") {
        setTransitionStart(null)
        setSelectedStateId(null)
        setSelectedTransitionId(null)
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault()
        undo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedStateId, selectedTransitionId, deleteState, deleteTransition, undo, redo])

  const editingState = editStateId ? states.find((s) => s.id === editStateId) : null
  const editingTransition = editTransitionId ? transitions.find((t) => t.id === editTransitionId) : null

  return (
    <div className="flex flex-col h-screen bg-background">
      <FSMToolbar
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        onExportJSON={handleExportJSON}
        onExportSVG={handleExportSVG}
        onExportLaTeX={handleExportLaTeX}
        onClear={clearAll}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={undo}
        onRedo={redo}
      />
      
      <div className="flex-1 relative overflow-hidden">
        <FSMCanvas
          states={states}
          transitions={transitions}
          selectedTool={selectedTool}
          selectedStateId={selectedStateId}
          selectedTransitionId={selectedTransitionId}
          transitionStart={transitionStart}
          onAddState={addState}
          onUpdateState={updateState}
          onDeleteState={deleteState}
          onSelectState={setSelectedStateId}
          onStartTransition={startTransition}
          onCompleteTransition={completeTransition}
          onDeleteTransition={deleteTransition}
          onSelectTransition={setSelectedTransitionId}
          onEditState={setEditStateId}
          onEditTransition={setEditTransitionId}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-3 py-1.5 bg-card border-t text-[10px] text-muted-foreground">
        <span>{states.length} states</span>
        <span>{transitions.length} transitions</span>
        <span className="flex-1" />
        <span>
          {selectedTool === "select" && "Select mode"}
          {selectedTool === "state" && "Click to add state"}
          {selectedTool === "transition" && (transitionStart ? "Click target state" : "Click source state")}
        </span>
      </div>

      <EditStateDialog
        state={editingState ?? null}
        open={!!editStateId}
        onOpenChange={(open) => !open && setEditStateId(null)}
        onSave={updateState}
      />

      <EditTransitionDialog
        transition={editingTransition ?? null}
        open={!!editTransitionId}
        onOpenChange={(open) => !open && setEditTransitionId(null)}
        onSave={updateTransition}
      />
    </div>
  )
}
