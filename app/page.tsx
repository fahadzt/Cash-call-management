import { Hero3D } from "@/components/landing/Hero3D"
import { SolutionFlow } from "@/components/landing/SolutionFlow"
import { FeaturesShowcase } from "@/components/landing/FeaturesShowcase"
import { SecurityCompliance } from "@/components/landing/SecurityCompliance"
import { ScrollNavigation } from "@/components/common/ScrollNavigation"
import { ScrollProgress } from "@/components/common/ScrollProgress"
import { ScrollController } from "@/components/common/ScrollController"

export default function LandingPage() {
  return (
    <div className="relative">
      {/* Scroll Controller */}
      <ScrollController />
      
      {/* Navigation */}
      <ScrollNavigation />
      
      {/* Scroll Progress Indicator */}
      <ScrollProgress />

      {/* Hero Section */}
      <section id="hero" className="relative">
        <Hero3D />
      </section>

      {/* Solution Flow */}
      <section id="solution" className="relative">
        <SolutionFlow />
      </section>

      {/* Features Showcase */}
      <section id="features" className="relative">
        <FeaturesShowcase />
      </section>

      {/* Security & Compliance */}
      <section id="security" className="relative">
        <SecurityCompliance />
      </section>
    </div>
  )
}
