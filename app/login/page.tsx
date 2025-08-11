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
import { signIn } from "@/lib/firebase-database"
import { AlertCircle } from "lucide-react"
import { AnimatedLoading } from "@/components/animated-loading"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password")
      return
    }

    setIsLoading(true)

    try {
      // Use Firebase authentication
      const userCredential = await signIn(email.trim(), password)

      if (userCredential.user) {
        // Show loading for 5 seconds before redirecting
        setTimeout(() => {
          router.push("/dashboard")
        }, 5000)
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <AnimatedLoading message="Signing In..." />
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
            <CardTitle className="text-white text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-white/80">Sign in to your cash call management dashboard</CardDescription>
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-white font-medium mb-2 block">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="enhanced-input"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-white font-medium mb-2 block">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="enhanced-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full aramco-button-primary text-white enhanced-button"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-white/80">
                Don't have an account?{" "}
                <Link href="/signup" className="font-medium text-[#84BD00] hover:text-[#00A3E0] transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
