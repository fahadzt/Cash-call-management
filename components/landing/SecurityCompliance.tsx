"use client"
import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Shield, Lock, FileCheck, Users, Database, Eye, CheckCircle } from "lucide-react"
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe"

const securityFeatures = [
  {
    icon: Users,
    title: "Role-Based Access Control",
    description: "Granular permissions and multi-level approval workflows for secure access management",
    badge: "RBAC",
  },
  {
    icon: FileCheck,
    title: "Complete Audit Trail",
    description: "Comprehensive logging with timestamp verification and user activity tracking",
    badge: "Audit Trail",
  },
  {
    icon: Database,
    title: "Enterprise Data Export",
    description: "Flexible data export formats compatible with enterprise systems and reporting tools",
    badge: "Data Export",
  },
  {
    icon: Lock,
    title: "Secure Data Storage",
    description: "Encrypted data storage with secure authentication and authorization protocols",
    badge: "Security",
  },
]

export function SecurityCompliance() {
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
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-[#00843D]/5 rounded-full blur-3xl"></div>
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
              className="inline-flex items-center gap-2 bg-[#00843D]/10 text-[#00843D] px-4 py-2 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Shield className="h-4 w-4" />
              Security & Reliability
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#0033A0] to-[#00843D] bg-clip-text text-transparent mb-6">
              Built for Trust
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Enterprise-grade security features designed to protect your data and ensure reliable operations.
            </p>
          </motion.div>

          {/* Security features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group relative"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 h-full flex flex-col">
                  <div className="flex items-start gap-4 flex-grow">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#0033A0] to-[#00843D] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                        <span className="px-2 py-1 bg-[#00843D]/10 text-[#00843D] text-xs font-medium rounded-full">
                          {feature.badge}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
