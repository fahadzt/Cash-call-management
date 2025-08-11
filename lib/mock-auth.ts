// Mock authentication service for preview environment
export interface MockUser {
  id: string
  email: string
  full_name: string
  role: "admin" | "manager" | "user"
  company: string
  isAuthenticated: boolean
}

export interface MockSession {
  user: MockUser
  access_token: string
}

// Mock users for demo
const mockUsers: MockUser[] = [
  {
    id: "admin-1",
    email: "admin@aramco.com",
    full_name: "Admin User",
    role: "admin",
    company: "Aramco Digital",
    isAuthenticated: true,
  },
  {
    id: "manager-1",
    email: "manager@aramco.com",
    full_name: "Manager User",
    role: "manager",
    company: "Aramco Digital",
    isAuthenticated: true,
  },
  {
    id: "user-1",
    email: "user@aramco.com",
    full_name: "Regular User",
    role: "user",
    company: "Aramco Digital",
    isAuthenticated: true,
  },
]

class MockAuth {
  private currentUser: MockUser | null = null

  async getSession(): Promise<{ data: { session: MockSession | null }; error: null }> {
    // For demo, always return admin user
    const user = mockUsers[0] // Admin user
    this.currentUser = user

    return {
      data: {
        session: user
          ? {
              user,
              access_token: "mock-token",
            }
          : null,
      },
      error: null,
    }
  }

  async signInWithPassword(credentials: { email: string; password: string }) {
    // Mock sign in - find user by email
    const user = mockUsers.find((u) => u.email === credentials.email)

    if (!user) {
      return {
        data: { user: null, session: null },
        error: { message: "Invalid email or password" },
      }
    }

    this.currentUser = user
    return {
      data: {
        user,
        session: { user, access_token: "mock-token" },
      },
      error: null,
    }
  }

  async signUp(userData: {
    email: string
    password: string
    options?: {
      data?: {
        full_name: string
        company: string
        role: string
      }
    }
  }) {
    // Mock sign up
    const newUser: MockUser = {
      id: `user-${Date.now()}`,
      email: userData.email,
      full_name: userData.options?.data?.full_name || "New User",
      role: (userData.options?.data?.role as any) || "user",
      company: userData.options?.data?.company || "",
      isAuthenticated: true,
    }

    mockUsers.push(newUser)
    this.currentUser = newUser

    return {
      data: {
        user: newUser,
        session: { user: newUser, access_token: "mock-token" },
      },
      error: null,
    }
  }

  async signOut() {
    this.currentUser = null
    return { error: null }
  }

  async getUser() {
    return {
      data: { user: this.currentUser },
      error: null,
    }
  }
}

export const mockAuth = new MockAuth()
