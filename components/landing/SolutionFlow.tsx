"use client"
import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowRight, CheckCircle, FileText, Users, Zap } from "lucide-react"
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe"

const steps = [
  {
    icon: FileText,
    title: "Submit Request",
    description: "Affiliates submit cash call requests with all required documentation through our intuitive interface.",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    icon: Users,
    title: "Finance Review",
    description: "Finance team reviews and validates requests, ensuring compliance and completeness.",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-500",
  },
  {
    icon: CheckCircle,
    title: "CFO Approval",
    description: "CFO reviews and approves high-value requests with full visibility into the approval process.",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    iconColor: "text-green-500",
  },
  {
    icon: Zap,
    title: "Instant Processing",
    description: "Approved requests are processed immediately with automated notifications to all stakeholders.",
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-500",
  },
]

export function SolutionFlow() {
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
        <div className="max-w-6xl w-full mx-auto">
          {/* Section header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Zap className="h-4 w-4" />
              Streamlined Process
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              How It Works
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Our intelligent workflow streamlines cash call management from submission to approval, ensuring
              transparency and efficiency at every step.
            </p>
          </motion.div>

          {/* Process steps */}
          <div className="relative">
            {/* Progress line */}
            <motion.div
              className="absolute top-1/2 left-0 right-0 h-1 bg-white/20 rounded-full hidden lg:block"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 1.5, delay: 0.8 }}
              style={{ transformOrigin: "left" }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  className="relative group"
                  initial={{ opacity: 0, y: 50 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ duration: 0.8, delay: 1 + index * 0.2 }}
                >
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-bold text-[#0033A0] z-10">
                    {index + 1}
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-2">
                    <div className={`flex items-center justify-center w-16 h-16 ${step.bgColor} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className={`h-8 w-8 ${step.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
                    <p className="text-white/80 leading-relaxed">{step.description}</p>
                  </div>

                  {/* Arrow connector */}
                  {index < steps.length - 1 && (
                    <motion.div
                      className="absolute top-1/2 -right-4 hidden lg:block"
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{ duration: 0.6, delay: 1.5 + index * 0.2 }}
                    >
                      <ArrowRight className="h-6 w-6 text-white/60" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
