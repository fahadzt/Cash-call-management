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
import { AlertCircle, CheckCircle } from "lucide-react"
import { AnimatedLoading } from "@/components/animated-loading"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    company: "",
    role: "viewer" as "viewer" | "affiliate" | "approver" | "admin",
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

    setIsLoading(true)

    try {
      // Use Firebase authentication
      const userCredential = await signUp(
        formData.email.trim(),
        formData.password,
        {
          full_name: formData.fullName.trim(),
          department: formData.company.trim(),
          role: formData.role,
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

  if (isLoading) {
    return <AnimatedLoading message="Creating Account..." />
  }

  return (
    <div className="min-h-screen aramco-gradient-bg flex items-center justify-center py-12 px-4 relative">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="w-full max-w-md relative z-10">
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
            <CardDescription className="text-white/80">Get started with cash call management today</CardDescription>
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
                <Label htmlFor="company" className="text-white font-medium mb-2 block">
                  Company
                </Label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Enter your company name (optional)"
                  className="enhanced-input"
                />
              </div>

              <div>
                <Label htmlFor="role" className="text-white font-medium mb-2 block">
                  Role
                </Label>
                <Select value={formData.role} onValueChange={(value: "viewer" | "affiliate" | "approver" | "admin") => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="enhanced-select">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="viewer" className="text-gray-700 hover:bg-[#0033A0]/10">
                      Viewer
                    </SelectItem>
                    <SelectItem value="affiliate" className="text-gray-700 hover:bg-[#0033A0]/10">
                      Affiliate
                    </SelectItem>
                    <SelectItem value="approver" className="text-gray-700 hover:bg-[#0033A0]/10">
                      Approver
                    </SelectItem>
                    <SelectItem value="admin" className="text-gray-700 hover:bg-[#0033A0]/10">
                      Admin
                    </SelectItem>
                  </SelectContent>
                </Select>
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
