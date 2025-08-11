'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from './firebase'
import { getUserProfile, User } from './firebase-database'

interface AuthContextType {
  user: FirebaseUser | null
  userProfile: User | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  retryConnection: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const retryConnection = () => {
    setError(null)
    setLoading(true)
    // Force a re-initialization by reloading the page
    window.location.reload()
  }

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initializeAuth = async () => {
      try {
        setError(null)
        
        // Check network connectivity first
        if (!navigator.onLine) {
          setError('No internet connection. Please check your network and try again.')
          setLoading(false)
          return
        }

        // Test Firebase connectivity
        try {
          // Simple connectivity test
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000)
            
            // Test if Firebase auth is accessible
            const testAuth = () => {
              try {
                unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                  clearTimeout(timeout)
                  resolve(firebaseUser)
                }, (error) => {
                  clearTimeout(timeout)
                  reject(error)
                })
              } catch (err) {
                clearTimeout(timeout)
                reject(err)
              }
            }
            
            testAuth()
          })
        } catch (connectError) {
          console.error('Firebase connection test failed:', connectError)
          setError('Unable to connect to Firebase services. Please check your internet connection and try again.')
          setLoading(false)
          return
        }

        // If we get here, Firebase is accessible
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          setUser(firebaseUser)
          
          if (firebaseUser) {
            try {
              // Fetch user profile from Firestore
              const profile = await getUserProfile(firebaseUser.uid)
              setUserProfile(profile)
            } catch (profileError) {
              console.error('Error fetching user profile:', profileError)
              setUserProfile(null)
              // Don't set this as a critical error since the user is still authenticated
            }
          } else {
            setUserProfile(null)
          }
          
          setLoading(false)
        }, (authError) => {
          console.error('Firebase auth error:', authError)
          setError(`Authentication error: ${authError.message}`)
          setLoading(false)
        })

      } catch (error) {
        console.error('Error initializing Firebase auth:', error)
        setError('Failed to initialize authentication. Please try refreshing the page.')
        setLoading(false)
      }
    }

    initializeAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      setUserProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
      setError('Failed to sign out. Please try again.')
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    error,
    signOut,
    retryConnection
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 