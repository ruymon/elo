"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { FSMDesigner } from "@/components/fsm/fsm-designer"

export default function Home() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <FSMDesigner />
    </ThemeProvider>
  )
}
