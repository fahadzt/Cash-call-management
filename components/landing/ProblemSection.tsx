"use client"
import { useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { AlertTriangle, Clock, FileX, Users2 } from "lucide-react"
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe"

const problems = [
  {
    icon: AlertTriangle,
    title: "Limited Visibility",
    description:
      "Cash call requests disappear into email chains and spreadsheets, creating blind spots for stakeholders.",
  },
  {
    icon: Clock,
    title: "Approval Delays",
    description: "Manual routing and unclear ownership lead to bottlenecks that delay critical funding decisions.",
  },
  {
    icon: FileX,
    title: "Fragmented Checklists",
    description: "Compliance requirements scattered across different systems make it difficult to ensure completeness.",
  },
  {
    icon: Users2,
    title: "Stakeholder Confusion",
    description: "Unclear roles and responsibilities result in missed reviews and duplicated efforts.",
  },
]

export function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotionSafe()
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden"
    >
      {/* Background parallax shapes */}
      <motion.div
        className="absolute inset-0 opacity-20"
        initial={{ y: 100 }}
        animate={isInView ? { y: 0 } : { y: 100 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[#0033A0]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-[#00A3E0]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#84BD00]/5 rounded-full blur-3xl"></div>
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl w-full mx-auto">
          {/* Section header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <AlertTriangle className="h-4 w-4" />
              Current Challenges
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#0033A0] to-[#00A3E0] bg-clip-text text-transparent mb-6">
              The Cash Call Challenge
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Traditional cash call management creates friction, delays, and compliance risks that impact your
              organization's financial agility.
            </p>
          </motion.div>

          {/* Problem cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {problems.map((problem, index) => (
              <motion.div
                key={problem.title}
                className="group relative"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                  <div className="flex items-center justify-center w-16 h-16 bg-red-50 rounded-xl mb-6 group-hover:bg-red-100 transition-colors">
                    <problem.icon className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{problem.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{problem.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
