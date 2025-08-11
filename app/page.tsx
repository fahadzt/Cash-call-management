import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, TrendingUp, Shield, Sparkles } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image
              src="/images/aramco-digital-new.png"
              alt="Aramco Digital"
              width={220}
              height={70}
              className="h-14 w-auto"
            />
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-[#0033A0] hover:bg-[#0033A0]/10 enhanced-button">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="aramco-button-primary text-white enhanced-button">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 aramco-gradient-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <div className="flex justify-center mb-6">
            <Sparkles className="h-12 w-12 text-white/80 animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            Cash Call Management,{" "}
            <span className="bg-gradient-to-r from-[#84BD00] to-[#00A3E0] bg-clip-text text-transparent">
              Simplified
            </span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
            A centralized workflow tool to track, manage, and automate affiliate funding requests with style and
            efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="text-lg px-10 py-5 bg-white text-[#0033A0] hover:bg-white/90 enhanced-button shadow-2xl"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                className="text-lg px-10 py-5 aramco-button-secondary text-white enhanced-button shadow-2xl"
              >
                Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-white/70 text-sm mt-4">Create your account to get started • Full features available</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-[#0033A0] to-[#00A3E0] bg-clip-text text-transparent mb-4">
              Streamline Your Cash Call Process
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Manage affiliate funding requests with transparency, efficiency, and complete audit trails.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 aramco-card-bg rounded-2xl group hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full aramco-button-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-[#0033A0]">Centralized Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Track all cash calls across affiliates in one unified, intelligent dashboard.
              </p>
            </div>

            <div className="text-center p-8 aramco-card-bg rounded-2xl group hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full aramco-button-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-[#0033A0]">Smart Workflows</h3>
              <p className="text-gray-600 leading-relaxed">
                Automated approval processes with customizable stakeholder assignments and notifications.
              </p>
            </div>

            <div className="text-center p-8 aramco-card-bg rounded-2xl group hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#84BD00] to-[#00843D] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-[#0033A0]">Complete Audit Trail</h3>
              <p className="text-gray-600 leading-relaxed">
                Full history and documentation for compliance, transparency, and regulatory requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#0033A0] via-[#00A3E0] to-[#00843D] relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6 drop-shadow-lg">
            Ready to Transform Your Cash Call Process?
          </h2>
          <p className="text-white/90 mb-10 max-w-xl mx-auto text-lg drop-shadow">
            Join organizations already using our platform to streamline their affiliate funding operations with
            cutting-edge technology.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="text-lg px-10 py-5 bg-white text-[#0033A0] hover:bg-white/90 enhanced-button shadow-2xl"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-gradient-to-r from-gray-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <Image
            src="/images/aramco-digital-new.png"
            alt="Aramco Digital"
            width={180}
            height={60}
            className="h-10 w-auto mx-auto mb-4 opacity-70"
          />
          <p className="text-gray-500">&copy; 2024 Aramco Digital. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
