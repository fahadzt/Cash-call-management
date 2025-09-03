"use client"

export function createPinAnimation(
  element: HTMLElement,
  options: {
    start: string
    end: string
    pinSpacing?: boolean
  }
) {
  // Simple pin animation implementation
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          element.style.position = "fixed"
          element.style.top = "0"
          element.style.left = "0"
          element.style.width = "100%"
          element.style.zIndex = "10"
        } else {
          element.style.position = "relative"
          element.style.top = "auto"
          element.style.left = "auto"
          element.style.width = "auto"
          element.style.zIndex = "auto"
        }
      })
    },
    {
      threshold: 0.1,
      rootMargin: "-50px 0px -50px 0px",
    }
  )

  observer.observe(element)

  return {
    kill: () => {
      observer.disconnect()
      element.style.position = "relative"
      element.style.top = "auto"
      element.style.left = "auto"
      element.style.width = "auto"
      element.style.zIndex = "auto"
    },
  }
}

export function initScrollTrigger() {
  // Initialize scroll-based animations
  const handleScroll = () => {
    const scrolled = window.scrollY
    const parallaxElements = document.querySelectorAll("[data-parallax]")
    
    parallaxElements.forEach((element) => {
      const speed = parseFloat(element.getAttribute("data-parallax") || "0.5")
      const yPos = -(scrolled * speed)
      ;(element as HTMLElement).style.transform = `translateY(${yPos}px)`
    })
  }

  window.addEventListener("scroll", handleScroll)
  
  return () => {
    window.removeEventListener("scroll", handleScroll)
  }
}

export function cleanup() {
  // Cleanup function for scroll animations
  const parallaxElements = document.querySelectorAll("[data-parallax]")
  parallaxElements.forEach((element) => {
    ;(element as HTMLElement).style.transform = ""
  })
}
