"use client"
import { useEffect } from "react"
import { initScrollTrigger, cleanup } from "@/utils/scroll"
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe"

export function ScrollController() {
  const prefersReducedMotion = useReducedMotionSafe()

  useEffect(() => {
    if (prefersReducedMotion) return

    const cleanupResize = initScrollTrigger()

    // Cleanup on unmount
    return () => {
      cleanup()
      cleanupResize?.()
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    // Smooth scroll behavior for the entire page
    if (typeof window !== "undefined") {
      document.documentElement.style.scrollBehavior = "smooth"
    }

    return () => {
      if (typeof window !== "undefined") {
        document.documentElement.style.scrollBehavior = "auto"
      }
    }
  }, [])

  return null
}
