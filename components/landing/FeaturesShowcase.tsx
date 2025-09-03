"use client"
import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { UserPlus, FileSpreadsheet, CheckSquare, Settings, Download, Zap } from "lucide-react"
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe"

const features = [
  {
    icon: UserPlus,
    title: "Assign Finance Teams",
    description: "Intelligent routing based on request type, amount, and organizational structure",
    color: "from-[#0033A0] to-[#00A3E0]",
    delay: 0.1,
  },
  {
    icon: FileSpreadsheet,
    title: "CAPEX/OPEX Templates",
    description: "Pre-configured templates with automated validation and compliance checks",
    color: "from-[#00A3E0] to-[#00843D]",
    delay: 0.2,
  },
  {
    icon: CheckSquare,
    title: "Committee Checklists",
    description: "Dynamic checklists that adapt based on request parameters and governance rules",
    color: "from-[#00843D] to-[#84BD00]",
    delay: 0.3,
  },
  {
    icon: Settings,
    title: "Smart Workflow Automation",
    description: "Automated document processing, compliance verification, and real-time updates across all stakeholders.",
    color: "from-[#84BD00] to-[#0033A0]",
    delay: 0.4,
  },
  {
    icon: Download,
    title: "Export to PDF/Excel",
    description: "One-click exports with customizable formats for reporting and archival",
    color: "from-[#0033A0] to-[#00A3E0]",
    delay: 0.5,
  },
  {
    icon: Zap,
    title: "Real-time Notifications",
    description: "Instant alerts and updates across all stakeholders and communication channels",
    color: "from-[#00A3E0] to-[#00843D]",
    delay: 0.6,
  },
]

export function FeaturesShowcase() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotionSafe()
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Background elements */}
      <motion.div
        className="absolute inset-0 opacity-20"
        initial={{ y: 100 }}
        animate={isInView ? { y: 0 } : { y: 100 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[#0033A0]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-[#00A3E0]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#84BD00]/3 rounded-full blur-3xl"></div>
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
              className="inline-flex items-center gap-2 bg-[#0033A0]/10 text-[#0033A0] px-4 py-2 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Zap className="h-4 w-4" />
              Powerful Features
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#0033A0] to-[#00A3E0] bg-clip-text text-transparent mb-6">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive tools and features designed to streamline your cash call management process from start to finish.
            </p>
          </motion.div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group relative"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 h-full flex flex-col">
                  <div className={`flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed flex-grow">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
