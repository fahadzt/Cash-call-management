"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Menu, X } from "lucide-react"
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe"

const sections = [
  { id: "hero", label: "Home" },
  { id: "solution", label: "Solution" },
  { id: "features", label: "Features" },
]

export function ScrollNavigation() {
  const [activeSection, setActiveSection] = useState("hero")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const prefersReducedMotion = useReducedMotionSafe()

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100
      setScrolled(window.scrollY > 50)

      // Find the active section based on scroll position
      const sectionElements = sections.map((section) => ({
        id: section.id,
        element: document.getElementById(section.id),
      }))

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i]
        if (section.element) {
          const rect = section.element.getBoundingClientRect()
          const elementTop = rect.top + window.scrollY

          if (scrollPosition >= elementTop - 200) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Initial check

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
    setIsMenuOpen(false)
  }

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg"
          : "bg-white/80 backdrop-blur-md border-b border-gray-100"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <motion.div
            className="flex items-center cursor-pointer"
            onClick={() => scrollToSection("hero")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Image
              src="/images/aramco-digital-new.png"
              alt="Aramco Digital"
              width={220}
              height={70}
              className="h-14 w-auto"
            />
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {sections.map((section) => (
              <motion.button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  activeSection === section.id ? "text-[#0033A0]" : "text-gray-600 hover:text-[#0033A0]"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {section.label}
                {activeSection === section.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0033A0] to-[#00A3E0]"
                    layoutId="activeSection"
                    initial={false}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  />
                )}
              </motion.button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-[#0033A0] hover:bg-[#0033A0]/10 enhanced-button">
                Login
              </Button>
            </Link>
            <Link href="/account-request">
              <Button className="aramco-button-primary text-white enhanced-button">
                Request Access
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="lg:hidden p-2 text-gray-600 hover:text-[#0033A0] transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileTap={{ scale: 0.95 }}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="lg:hidden mt-4 pb-4 border-t border-gray-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <nav className="flex flex-col gap-2 mt-4">
                {sections.map((section, index) => (
                  <motion.button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                      activeSection === section.id
                        ? "bg-[#0033A0]/10 text-[#0033A0] font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-[#0033A0]"
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    {section.label}
                  </motion.button>
                ))}
                <div className="flex gap-2 px-4 mt-4 pt-4 border-t border-gray-200">
                  <Link href="/login" className="flex-1">
                    <Button variant="ghost" className="w-full text-[#0033A0] hover:bg-[#0033A0]/10">
                      Login
                    </Button>
                  </Link>
                  <Link href="/account-request" className="flex-1">
                    <Button className="w-full aramco-button-primary text-white">Request Access</Button>
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
