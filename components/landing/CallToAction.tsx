"use client"
import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, Eye, Sparkles } from "lucide-react"
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe"

export function CallToAction() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotionSafe()
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-gradient-to-br from-[#0033A0] via-[#00A3E0] to-[#00843D] relative overflow-hidden"
    >
      {/* Background elements */}
      <motion.div
        className="absolute inset-0 opacity-20"
        initial={{ y: 100 }}
        animate={isInView ? { y: 0 } : { y: 100 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Floating icon */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.8 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative">
              <motion.div
                className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                animate={isInView ? { rotate: [0, 5, -5, 0] } : {}}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="h-10 w-10 text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.h2
            className="text-5xl md:text-7xl font-bold text-white mb-8 drop-shadow-2xl leading-tight"
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Ready to Transform Your{" "}
            <motion.span
              className="bg-gradient-to-r from-[#84BD00] to-white bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              Cash Call Process?
            </motion.span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Join leading organizations that have already streamlined their affiliate funding workflows with
            our secure, IT-managed platform. Request access today to get started.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 1 }}
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
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="text-xl px-12 py-6 border-2 border-white text-white hover:bg-white hover:text-[#0033A0] enhanced-button shadow-2xl font-semibold bg-transparent"
              >
                Schedule Demo
                <Calendar className="ml-3 h-6 w-6" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white/80"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <span className="text-sm">Enterprise-grade security</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm">IT-managed access</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm">Quick approval process</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
