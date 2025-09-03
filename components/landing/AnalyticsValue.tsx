"use client"
import { useRef, useEffect, useState } from "react"
import { motion, useInView, useMotionValue, useSpring } from "framer-motion"
import { TrendingUp, Clock, AlertCircle, DollarSign } from "lucide-react"
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe"

const metrics = [
  {
    icon: DollarSign,
    label: "Total SAR Requested",
    value: 2847000000,
    suffix: " SAR",
    description: "Month-to-date funding requests",
    color: "from-[#0033A0] to-[#00A3E0]",
  },
  {
    icon: Clock,
    label: "Average Approval Time",
    value: 3.2,
    suffix: " days",
    description: "Down 65% from previous quarter",
    color: "from-[#00A3E0] to-[#00843D]",
  },
  {
    icon: AlertCircle,
    label: "Overdue Requests",
    value: 7,
    suffix: "",
    description: "Requiring immediate attention",
    color: "from-[#00843D] to-[#84BD00]",
  },
  {
    icon: TrendingUp,
    label: "Process Efficiency",
    value: 94,
    suffix: "%",
    description: "Automated workflow completion rate",
    color: "from-[#84BD00] to-[#0033A0]",
  },
]

function AnimatedCounter({
  value,
  suffix,
  isInView,
  delay = 0,
}: {
  value: number
  suffix: string
  isInView: boolean
  delay?: number
}) {
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration: 2000 })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        motionValue.set(value)
      }, delay)
      return () => clearTimeout(timeout)
    }
  }, [isInView, value, delay, motionValue])

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(latest)
    })
    return unsubscribe
  }, [springValue])

  const formatValue = (val: number) => {
    if (value >= 1000000000) {
      return (val / 1000000000).toFixed(1) + "B"
    } else if (value >= 1000000) {
      return (val / 1000000).toFixed(1) + "M"
    } else if (value >= 1000) {
      return (val / 1000).toFixed(1) + "K"
    }
    return val.toFixed(value % 1 === 0 ? 0 : 1)
  }

  return (
    <span className="font-bold">
      {formatValue(displayValue)}
      {suffix}
    </span>
  )
}

function DonutChart({ percentage, isInView, delay = 0 }: { percentage: number; isInView: boolean; delay?: number }) {
  const circumference = 2 * Math.PI * 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative w-32 h-32 mx-auto mb-4">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={isInView ? { strokeDashoffset } : { strokeDashoffset: circumference }}
          transition={{ duration: 2, delay: delay + 0.5, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0033A0" />
            <stop offset="100%" stopColor="#00A3E0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
      </div>
    </div>
  )
}

export function AnalyticsValue() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotionSafe()
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-to-br from-[#0033A0] via-[#00A3E0] to-[#00843D] relative overflow-hidden">
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
              <TrendingUp className="h-4 w-4" />
              Real-time Analytics
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Data-Driven Insights
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Monitor your cash call performance with real-time analytics and actionable insights that drive better decisions.
            </p>
          </motion.div>

          {/* Metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                className="text-center group"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className={`flex items-center justify-center w-16 h-16 bg-gradient-to-br ${metric.color} rounded-xl mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                    <metric.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl text-white mb-2">
                    <AnimatedCounter
                      value={metric.value}
                      suffix={metric.suffix}
                      isInView={isInView}
                      delay={0.8 + index * 0.1}
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{metric.label}</h3>
                  <p className="text-white/80 text-sm">{metric.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Efficiency chart */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">Process Efficiency</h3>
              <DonutChart percentage={94} isInView={isInView} delay={1.4} />
              <p className="text-white/80">Automated workflow completion rate</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
