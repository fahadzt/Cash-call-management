"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, Building2, Users, FileText } from "lucide-react"
import { AnimatedLoading } from "@/components/animated-loading"

// Define the 4 affiliate companies
const AFFILIATE_COMPANIES = [
  {
    id: "cyberani-001",
    name: "Cyberani"
  },
  {
    id: "nextera-002", 
    name: "NextEra"
  },
  {
    id: "cntxt-003",
    name: "CNTXT"
  },
  {
    id: "plantdigital-004",
    name: "Plant Digital"
  }
]

export default function AccountRequestPage() {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    position: "",
    department: "",
    phone: "",
    affiliateCompanyId: "none",
    reasonForAccess: "",
    managerName: "",
    managerEmail: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validation
    if (!formData.fullName.trim()) {
      setError("Full name is required")
      return
    }

    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }

    if (!formData.position.trim()) {
      setError("Position is required")
      return
    }

    if (!formData.department.trim()) {
      setError("Department is required")
      return
    }

    if (!formData.reasonForAccess.trim()) {
      setError("Reason for access is required")
      return
    }

    if (!formData.managerName.trim()) {
      setError("Manager name is required")
      return
    }

    if (!formData.managerEmail.trim()) {
      setError("Manager email is required")
      return
    }

    setIsLoading(true)

    try {
      // Submit account request to database
      const response = await fetch('/api/account-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit request')
      }

      setSuccess("✅ Account request submitted successfully! IT will review your request and contact you once approved.")
      
      // Reset form
      setFormData({
        email: "",
        fullName: "",
        position: "",
        department: "",
        phone: "",
        affiliateCompanyId: "none",
        reasonForAccess: "",
        managerName: "",
        managerEmail: ""
      })

    } catch (err) {
      console.error('Error submitting request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/aramco-digital-new.png"
              alt="Aramco Digital"
              width={200}
              height={60}
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Request Account Access
          </h1>
          <p className="text-gray-600">
            Submit your request for access to the Cash Call Management System
          </p>
        </div>

        {/* Account Request Form */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Account Request Form
            </CardTitle>
            <CardDescription>
              Fill out the form below to request access. IT will review your request and contact you once approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="block mb-2">Full Name *</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="block mb-2">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="position" className="block mb-2">Position/Job Title *</Label>
                    <Input
                      id="position"
                      type="text"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="e.g., Financial Analyst, Manager"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="department" className="block mb-2">Department *</Label>
                    <Input
                      id="department"
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="e.g., Finance, Operations"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="block mb-2">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Company Information
                </h3>
                
                <div>
                  <Label htmlFor="affiliateCompany" className="block mb-2">Affiliate Company (if applicable)</Label>
                  <Select
                    value={formData.affiliateCompanyId}
                    onValueChange={(value) => handleInputChange('affiliateCompanyId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your affiliate company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Affiliate Company</SelectItem>
                      {AFFILIATE_COMPANIES.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Access Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Access Information
                </h3>
                
                <div>
                  <Label htmlFor="reasonForAccess" className="block mb-2">Reason for Access *</Label>
                  <Textarea
                    id="reasonForAccess"
                    value={formData.reasonForAccess}
                    onChange={(e) => handleInputChange('reasonForAccess', e.target.value)}
                    placeholder="Please explain why you need access to the Cash Call Management System..."
                    rows={4}
                    required
                  />
                </div>
              </div>

              {/* Manager Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Manager Approval
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="managerName" className="block mb-2">Manager Name *</Label>
                    <Input
                      id="managerName"
                      type="text"
                      value={formData.managerName}
                      onChange={(e) => handleInputChange('managerName', e.target.value)}
                      placeholder="Enter your manager's name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="managerEmail" className="block mb-2">Manager Email *</Label>
                    <Input
                      id="managerEmail"
                      type="email"
                      value={formData.managerEmail}
                      onChange={(e) => handleInputChange('managerEmail', e.target.value)}
                      placeholder="Enter your manager's email"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <AnimatedLoading />
                      Submitting Request...
                    </div>
                  ) : (
                    "Submit Account Request"
                  )}
                </Button>
              </div>
            </form>

            {/* Success Message */}
            {success && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">{success}</span>
                </div>
                <p className="text-green-700 text-sm mt-2">
                  You will receive an email confirmation shortly. IT will review your request and contact you once approved.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 font-medium">Error</span>
                </div>
                <p className="text-red-700 text-sm mt-2">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
