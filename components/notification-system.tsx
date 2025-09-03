"use client"

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, X, CheckCircle, AlertCircle, Info, Clock } from 'lucide-react'
import { useAuth } from '@/lib/firebase-auth-context'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'assignment' | 'unassignment' | 'approval' | 'rejection'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'system' | 'cash_call' | 'assignment' | 'approval' | 'document' | 'user'
  action?: {
    label: string
    onClick: (notificationId?: string) => void
  }
  metadata?: {
    cashCallId?: string
    affiliateId?: string
    userId?: string
    documentId?: string
  }
  expiresAt?: Date
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  unreadCount: number
  loadNotifications: (userId: string) => Promise<void>
  isLoading: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const removeNotification = useCallback(async (id: string) => {
    try {
      // Delete from Firebase first
      const { deleteNotification } = await import('@/lib/firebase-database')
      await deleteNotification(id)
      
      // Then update local state
      setNotifications(prev => prev.filter(notif => notif.id !== id))
    } catch (error) {
      console.error('Error deleting notification:', error)
      // Still remove from local state even if Firebase fails
      setNotifications(prev => prev.filter(notif => notif.id !== id))
    }
  }, [])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    }
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]) // Keep max 50 notifications
    
    // Auto-remove success notifications after 5 seconds
    if (notification.type === 'success') {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 5000)
    }
  }, [removeNotification])

  // Function to load notifications from Firebase
  const loadNotifications = useCallback(async (userId: string) => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      const { getUserNotifications } = await import('@/lib/firebase-database')
      const firebaseNotifications = await getUserNotifications(userId)
      
      // Convert Firebase notifications to local format
      const convertedNotifications: Notification[] = firebaseNotifications.map((notif: any) => ({
        id: notif.id,
        type: notif.type === 'assignment' ? 'info' : 
              notif.type === 'unassignment' ? 'warning' : 
              notif.type === 'success' ? 'success' : 'info',
        title: notif.title,
        message: notif.message,
        timestamp: notif.created_at || new Date(),
        read: notif.read || false,
        priority: notif.priority || 'medium',
        category: notif.category || 'system',
        metadata: notif.metadata || {},
        expiresAt: notif.expiresAt ? new Date(notif.expiresAt) : undefined,
        action: notif.cash_call_id ? {
          label: 'View Details',
          onClick: async () => {
            // Mark notification as read and remove it
            if (notif.id) {
              await markAsRead(notif.id)
            }
            // Navigate to cash call details
            window.location.href = `/cash-call/${notif.cash_call_id}`
          }
        } : undefined
      }))
      
      setNotifications(convertedNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
    
    // Mark as read in Firebase
    try {
      const { markNotificationAsRead } = await import('@/lib/firebase-database')
      await markNotificationAsRead(id)
    } catch (error) {
      console.error('Error marking notification as read in Firebase:', error)
    }
  }, [])

  // Set up real-time notification listener
  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    
    const setupRealtimeNotifications = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, orderBy, onSnapshot } = await import('firebase/firestore')
        
        // Use user from the top level of the component
        if (!user?.uid) return
        
        const notificationsRef = collection(db, 'notifications')
        const q = query(
          notificationsRef,
          where('user_id', '==', user.uid)
        )
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const firebaseNotifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          
          // Convert Firebase notifications to local format and sort by created_at desc
          const convertedNotifications: Notification[] = firebaseNotifications
            .map((notif: any) => ({
              id: notif.id,
              type: (notif.type === 'assignment' ? 'info' : 
                    notif.type === 'unassignment' ? 'warning' : 
                    notif.type === 'success' ? 'success' : 'info') as 'success' | 'error' | 'warning' | 'info',
              title: notif.title,
              message: notif.message,
              timestamp: notif.created_at?.toDate() || new Date(),
              read: notif.read || false,
              action: notif.cash_call_id ? {
                label: 'View Details',
                onClick: async () => {
                  if (notif.id) {
                    await markAsRead(notif.id)
                  }
                  window.location.href = `/cash-call/${notif.cash_call_id}`
                }
              } : undefined
            }))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Sort by newest first
          
          setNotifications(convertedNotifications)
        }, (error) => {
          console.error('Error in real-time notifications:', error)
        })
      } catch (error) {
        console.error('Error setting up real-time notifications:', error)
      }
    }
    
    setupRealtimeNotifications()
    
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user?.uid, markAsRead])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
  }, [])

  const clearAll = useCallback(async () => {
    try {
      // Delete all notifications from Firebase
      const { deleteNotification } = await import('@/lib/firebase-database')
      const deletePromises = notifications.map(notif => deleteNotification(notif.id))
      await Promise.all(deletePromises)
      
      // Clear local state
      setNotifications([])
    } catch (error) {
      console.error('Error clearing all notifications:', error)
      // Still clear local state even if Firebase fails
      setNotifications([])
    }
  }, [notifications])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
      unreadCount,
      loadNotifications,
      isLoading
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function NotificationBell() {
  const { unreadCount, notifications, markAllAsRead, clearAll, loadNotifications, isLoading, markAsRead, removeNotification } = useNotifications()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // Load notifications when bell is opened
  useEffect(() => {
    if (isOpen && user?.uid) {
      loadNotifications(user.uid)
    }
  }, [isOpen, user?.uid, loadNotifications])

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'info': return <Info className="h-4 w-4 text-blue-500" />
      default: return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50'
      case 'error': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'info': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
      >
        <Bell className="h-4 w-4 mr-2" />
        Notifications
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => await clearAll()}
                  className="text-xs"
                >
                  Clear all
                </Button>
              </div>
            </div>
          </div>

          <div className="p-2">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border rounded-lg mb-2 cursor-pointer transition-colors ${
                    notification.read ? 'opacity-60' : ''
                  } ${getTypeColor(notification.type)}`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id)
                    }
                    if (notification.action) {
                      notification.action.onClick(notification.id)
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async (e) => {
                            e.stopPropagation()
                            await removeNotification(notification.id)
                          }}
                          className="h-4 w-4 p-0 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {notification.timestamp.toLocaleTimeString()}
                        </span>
                        {notification.action && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              notification.action!.onClick(notification.id)
                            }}
                            className="text-xs"
                          >
                            {notification.action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for status change notifications
export function useStatusChangeNotifications() {
  const { addNotification } = useNotifications()

  const notifyStatusChange = (cashCallId: string, oldStatus: string, newStatus: string, affiliateName: string) => {
    const statusDisplayNames = {
      draft: 'Draft',
      under_review: 'Under Review',
      approved: 'Approved',
      paid: 'Paid',
      rejected: 'Rejected'
    }

    const getNotificationType = (status: string): Notification['type'] => {
      switch (status) {
        case 'approved': return 'success'
        case 'paid': return 'success'
        case 'rejected': return 'error'
        case 'under_review': return 'info'
        default: return 'info'
      }
    }

    addNotification({
      type: getNotificationType(newStatus),
      title: `Cash Call Status Updated`,
      message: `Cash call ${cashCallId} for ${affiliateName} changed from ${statusDisplayNames[oldStatus as keyof typeof statusDisplayNames]} to ${statusDisplayNames[newStatus as keyof typeof statusDisplayNames]}`,
      priority: 'medium',
      category: 'cash_call',
      action: {
        label: 'View Details',
        onClick: () => {
          // Navigate to cash call details
          window.open(`/cash-call/${cashCallId}`, '_blank')
        }
      }
    })
  }

  return { notifyStatusChange }
}

// Hook for assignment notifications
export function useAssignmentNotifications() {
  const { addNotification, markAsRead } = useNotifications()

  const notifyAssignment = (cashCallId: string, cashCallTitle: string, affiliateName: string, assignedBy: string) => {
    addNotification({
      type: 'info',
      title: `Cash Call Assigned`,
      message: `You have been assigned cash call "${cashCallTitle}" for ${affiliateName} by ${assignedBy}`,
      priority: 'high',
      category: 'assignment',
      action: {
        label: 'View Details',
        onClick: async (notificationId?: string) => {
          // Mark notification as read and remove it
          if (notificationId) {
            await markAsRead(notificationId)
          }
          // Navigate to cash call details
          window.location.href = `/cash-call/${cashCallId}`
        }
      }
    })
  }

  const notifyUnassignment = (cashCallId: string, cashCallTitle: string, affiliateName: string) => {
    addNotification({
      type: 'warning',
      title: `Cash Call Unassigned`,
      message: `Cash call "${cashCallTitle}" for ${affiliateName} has been unassigned from you`,
      priority: 'medium',
      category: 'assignment',
      action: {
        label: 'View Details',
        onClick: async (notificationId?: string) => {
          // Mark notification as read and remove it
          if (notificationId) {
            await markAsRead(notificationId)
          }
          // Navigate to cash call details
          window.location.href = `/cash-call/${cashCallId}`
        }
      }
    })
  }

  return { notifyAssignment, notifyUnassignment }
}
