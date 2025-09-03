"use client"
import { motion, useScroll, useSpring } from "framer-motion"
import { useState, useEffect } from "react"

const sections = [
  { id: "hero", label: "Home", color: "#0033A0" },
  { id: "solution", label: "Solution", color: "#00A3E0" },
  { id: "features", label: "Features", color: "#00843D" },
  { id: "security", label: "Security", color: "#0033A0" },
]

export function ScrollProgress() {
  const [activeSection, setActiveSection] = useState(0)
  const { scrollYProgress } = useScroll()
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100 // Offset for header
      const windowHeight = window.innerHeight
      
      // Find which section is currently in view
      let currentSection = 0
      
      for (let i = 0; i < sections.length; i++) {
        const element = document.getElementById(sections[i].id)
        if (element) {
          const elementTop = element.offsetTop
          const elementBottom = elementTop + element.offsetHeight
          
          // Check if the section is in view
          if (scrollPosition >= elementTop - windowHeight / 2 && scrollPosition < elementBottom - windowHeight / 2) {
            currentSection = i
            break
          }
        }
      }
      
      // If we're at the bottom, set to last section
      if (scrollPosition + windowHeight >= document.documentElement.scrollHeight - 100) {
        currentSection = sections.length - 1
      }
      
      setActiveSection(currentSection)
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offsetTop = element.offsetTop - 80
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:block">
      <div className="flex flex-col items-center gap-4">
        {/* Progress bar */}
        <div className="relative">
          <div className="w-1 h-48 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="w-full bg-gradient-to-b from-[#0033A0] via-[#00A3E0] to-[#84BD00] origin-top"
              style={{ scaleY }}
            />
          </div>

          {/* Section indicators */}
          <div className="absolute inset-0 flex flex-col justify-between py-1">
            {sections.map((section, index) => (
              <motion.button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="group relative flex items-center"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  className={`w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-300 ${
                    index <= activeSection
                      ? "bg-gradient-to-r from-[#0033A0] to-[#00A3E0] scale-110"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  animate={{
                    scale: index === activeSection ? 1.3 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                />

                {/* Tooltip */}
                <motion.div
                  className="absolute right-6 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  initial={{ x: 10, opacity: 0 }}
                  whileHover={{ x: 0, opacity: 1 }}
                >
                  {section.label}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </motion.div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Section counter */}
        <motion.div
          className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <span className="text-xs font-medium text-gray-600">
            {activeSection + 1} / {sections.length}
          </span>
        </motion.div>
      </div>
    </div>
  )
}
