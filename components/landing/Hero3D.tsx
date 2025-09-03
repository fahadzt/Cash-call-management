"use client"
import { useEffect, useRef, useState } from "react"
import type React from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react"
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe"

export function Hero3D() {
  const heroRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotionSafe()
  const [mounted, setMounted] = useState(false)

  // Mouse parallax effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 })

  const backgroundX = useTransform(springX, [-1, 1], [-20, 20])
  const backgroundY = useTransform(springY, [-1, 1], [-20, 20])
  const floatingX = useTransform(springX, [-1, 1], [-10, 10])
  const floatingY = useTransform(springY, [-1, 1], [-10, 10])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion) return

    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    mouseX.set((e.clientX - centerX) / (rect.width / 2))
    mouseY.set((e.clientY - centerY) / (rect.height / 2))
  }

  if (!mounted) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-[#0033A0] via-[#00A3E0] to-[#00843D] relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
      </section>
    )
  }

  return (
    <section
      ref={heroRef}
      className="min-h-screen bg-gradient-to-br from-[#0033A0] via-[#00A3E0] to-[#00843D] relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated background elements */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          x: backgroundX,
          y: backgroundY,
        }}
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#84BD00]/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00843D]/15 rounded-full blur-2xl"></div>
      </motion.div>

      <div className="absolute inset-0 bg-black/20"></div>

      <div className="container mx-auto px-4 h-full flex items-center justify-center relative z-10">
        <div className="text-center max-w-5xl">
          {/* Floating icon */}
          <motion.div
            className="flex justify-center mb-8"
            style={{
              x: floatingX,
              y: floatingY,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="relative">
              <Sparkles className="h-16 w-16 text-white/90" />
              <motion.div
                className="absolute inset-0 h-16 w-16"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <div className="w-full h-full border-2 border-white/20 rounded-full border-dashed"></div>
              </motion.div>
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            className="text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-8 drop-shadow-2xl leading-tight"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            Cash Call Management,{" "}
            <motion.span
              className="bg-gradient-to-r from-[#84BD00] to-[#00A3E0] bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              Reimagined
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto drop-shadow-lg leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            Transform your affiliate funding workflow with intelligent automation, real-time visibility, and seamless
            stakeholder collaboration.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <Link href="/account-request">
              <Button
                size="lg"
                className="text-xl px-12 py-6 bg-white text-[#0033A0] hover:bg-white/90 enhanced-button shadow-2xl font-semibold"
              >
                Request Access
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.4 }}
      >
        <motion.div
          className="flex flex-col items-center text-white/80 cursor-pointer group"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          onClick={() => {
            window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
          }}
        >
          <span className="text-sm mb-2 group-hover:text-white transition-colors">Discover More</span>
          <ChevronDown className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </motion.div>
      </motion.div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  )
}
