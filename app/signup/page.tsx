"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { signUp } from "@/lib/firebase-database"
import { AlertCircle, CheckCircle, Building2, Users } from "lucide-react"
import { AnimatedLoading } from "@/components/animated-loading"

// Define the 4 affiliate companies
const AFFILIATE_COMPANIES = [
  {
    id: "cyberani-001",
    name: "Cyberani",
    code: "CYBERANI-001",
    description: "Cybersecurity and Digital Innovation",
    country: "Saudi Arabia"
  },
  {
    id: "nextera-002", 
    name: "NextEra",
    code: "NEXTERA-002",
    description: "Next Generation Energy Solutions",
    country: "Saudi Arabia"
  },
  {
    id: "cntxt-003",
    name: "CNTXT",
    code: "CNTXT-003", 
    description: "Digital Transformation Consulting",
    country: "Saudi Arabia"
  },
  {
    id: "plantdigital-004",
    name: "Plant Digital",
    code: "PLANTDIGITAL-004",
    description: "Plant Operations and Digital Solutions",
    country: "Saudi Arabia"
  }
]

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    role: "admin" as "finance" | "affiliate" | "cfo" | "admin",
    affiliateCompanyId: "",
    position: "",
    phone: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (!formData.fullName.trim()) {
      setError("Full name is required")
      return
    }

    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }

    // Validate affiliate company selection for affiliate users
    if (formData.role === "affiliate" && !formData.affiliateCompanyId) {
      setError("Please select your affiliate company")
      return
    }

    setIsLoading(true)

    try {
      // Use Firebase authentication
      const userCredential = await signUp(
        formData.email.trim(),
        formData.password,
        {
          full_name: formData.fullName.trim(),
          role: formData.role,
          affiliate_company_id: formData.affiliateCompanyId || undefined,
          position: formData.position.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        }
      )

      if (userCredential.user) {
        setSuccess("Account created successfully! Redirecting to dashboard...")
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }
    } catch (err: any) {
      console.error("Signup error:", err)
      setError(err.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = (role: "finance" | "affiliate" | "cfo" | "admin") => {
    setFormData({ ...formData, role })
    // Reset affiliate company if role is not affiliate
    if (role !== "affiliate") {
      setFormData(prev => ({ ...prev, role, affiliateCompanyId: "" }))
    }
  }

  if (isLoading) {
    return <AnimatedLoading message="Creating Account..." />
  }

  return (
    <div className="min-h-screen aramco-gradient-bg flex items-center justify-center py-12 px-4 relative">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/images/aramco-digital-new.png"
              alt="Aramco Digital"
              width={200}
              height={60}
              className="h-12 w-auto drop-shadow-lg"
            />
          </Link>
        </div>

        <Card className="enhanced-card">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl font-bold">Create your account</CardTitle>
            <CardDescription className="text-white/80">
              Get started with cash call management today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="fullName" className="text-white font-medium mb-2 block">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  placeholder="Enter your full name"
                  className="enhanced-input"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-white font-medium mb-2 block">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="Enter your email"
                  className="enhanced-input"
                />
              </div>

              <div>
                <Label htmlFor="role" className="text-white font-medium mb-2 block">
                  Account Type *
                </Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="enhanced-select">
                    <SelectValue placeholder="Select your account type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="finance" className="text-gray-700 hover:bg-[#0033A0]/10">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Finance User (Review & Assignment)
                      </div>
                    </SelectItem>
                    <SelectItem value="affiliate" className="text-gray-700 hover:bg-[#0033A0]/10">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Affiliate Company User
                      </div>
                    </SelectItem>
                    <SelectItem value="cfo" className="text-gray-700 hover:bg-[#0033A0]/10">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        CFO (Approval Authority)
                      </div>
                    </SelectItem>
                    <SelectItem value="admin" className="text-gray-700 hover:bg-[#0033A0]/10">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Administrator (Full Access)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Affiliate Company Selection - Only show for affiliate users */}
              {formData.role === "affiliate" && (
                <div>
                  <Label htmlFor="affiliateCompany" className="text-white font-medium mb-2 block">
                    Select Your Affiliate Company *
                  </Label>
                  <Select 
                    value={formData.affiliateCompanyId} 
                    onValueChange={(value) => setFormData({ ...formData, affiliateCompanyId: value })}
                  >
                    <SelectTrigger className="enhanced-select">
                      <SelectValue placeholder="Choose your affiliate company" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300 max-h-60">
                      {AFFILIATE_COMPANIES.map((company) => (
                        <SelectItem key={company.id} value={company.id} className="text-gray-700 hover:bg-[#0033A0]/10">
                          <div className="flex flex-col items-start">
                            <div className="font-medium">{company.name}</div>
                            <div className="text-xs text-gray-500">
                              {company.description} • {company.country}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-white/60 mt-1">
                    This will limit your access to only your company's cash calls and checklists
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="position" className="text-white font-medium mb-2 block">
                  Position (Optional)
                </Label>
                <Input
                  id="position"
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Project Manager, Finance Director"
                  className="enhanced-input"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-white font-medium mb-2 block">
                  Phone Number (Optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="enhanced-input"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-white font-medium mb-2 block">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Create a password (min. 6 characters)"
                  className="enhanced-input"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-white font-medium mb-2 block">
                  Confirm Password *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  placeholder="Confirm your password"
                  className="enhanced-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full aramco-button-primary text-white enhanced-button"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-white/80">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-[#84BD00] hover:text-[#00A3E0] transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
