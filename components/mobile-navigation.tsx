"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  Menu, 
  X, 
  Home, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  User,
  Building,
  BarChart3,
  Shield,
  Zap,
  BookOpen
} from "lucide-react"
import { useAuth } from "@/lib/firebase-auth-context"
import { signOutUser } from "@/lib/firebase-database"

interface MobileNavigationProps {
  className?: string
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, userProfile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOutUser()
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navigationItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      roles: ["admin", "finance", "affiliate"]
    },
    {
      label: "Cash Calls",
      href: "/manage-cash-calls",
      icon: <FileText className="h-5 w-5" />,
      roles: ["admin", "finance"]
    },
    {
      label: "Financial Packages",
      href: "/financial-packages",
      icon: <BookOpen className="h-5 w-5" />,
      roles: ["finance"]
    },
    {
      label: "Affiliates",
      href: "/manage-affiliates",
      icon: <Building className="h-5 w-5" />,
      roles: ["admin"]
    },
    {
      label: "Users",
      href: "/manage-users",
      icon: <Users className="h-5 w-5" />,
      roles: ["admin"]
    },
    {
      label: "Reports",
      href: "/reports",
      icon: <BarChart3 className="h-5 w-5" />,
      roles: ["admin", "finance"]
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      roles: ["admin", "finance", "affiliate"]
    },
    {
      label: "Performance",
      href: "/performance",
      icon: <Zap className="h-5 w-5" />,
      roles: ["admin"]
    }
  ]

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userProfile?.role || "")
  )



  const handleNavigation = (href: string) => {
    router.push(href)
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 bg-white">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#0033A0] rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {userProfile?.full_name || "User"}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {userProfile?.role || "User"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-left"
                onClick={() => handleNavigation(item.href)}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-left text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
