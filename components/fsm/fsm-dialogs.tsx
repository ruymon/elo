"use client"

import { useState, useEffect } from "react"
import type { FSMState, FSMTransition } from "@/lib/fsm-types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface EditStateDialogProps {
  state: FSMState | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, updates: Partial<FSMState>) => void
}

export function EditStateDialog({
  state,
  open,
  onOpenChange,
  onSave,
}: EditStateDialogProps) {
  const [name, setName] = useState("")
  const [isInitial, setIsInitial] = useState(false)
  const [isFinal, setIsFinal] = useState(false)

  useEffect(() => {
    if (state) {
      setName(state.name)
      setIsInitial(state.isInitial)
      setIsFinal(state.isFinal)
    }
  }, [state])

  const handleSave = () => {
    if (state) {
      onSave(state.id, { name, isInitial, isFinal })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle className="text-sm">Edit State</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="state-name" className="text-xs">
              Name
            </Label>
            <Input
              id="state-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs"
              placeholder="State name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is-initial" className="text-xs">
              Initial State
            </Label>
            <Switch
              id="is-initial"
              checked={isInitial}
              onCheckedChange={setIsInitial}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is-final" className="text-xs">
              Final State
            </Label>
            <Switch
              id="is-final"
              checked={isFinal}
              onCheckedChange={setIsFinal}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface EditTransitionDialogProps {
  transition: FSMTransition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, updates: Partial<FSMTransition>) => void
}

export function EditTransitionDialog({
  transition,
  open,
  onOpenChange,
  onSave,
}: EditTransitionDialogProps) {
  const [label, setLabel] = useState("")

  useEffect(() => {
    if (transition) {
      setLabel(transition.label)
    }
  }, [transition])

  const handleSave = () => {
    if (transition) {
      onSave(transition.id, { label })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle className="text-sm">Edit Transition</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="transition-label" className="text-xs">
              Label
            </Label>
            <Input
              id="transition-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-8 text-xs"
              placeholder="Transition label (e.g., a, b, ε)"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Use symbols like a, b, 0, 1, or ε for epsilon transitions
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
