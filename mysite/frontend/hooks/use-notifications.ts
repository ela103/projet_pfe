"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { useToast } from "@/hooks/use-toast"

export type NotificationItem = {
  id: number
  title: string
  message: string
  level: "info" | "warning" | "error"
  source: string
  is_read: boolean
  created_at: string
}

export function useNotifications() {
  const { toast } = useToast()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const knownIds = useRef<Set<number>>(new Set())
  const firstLoad = useRef(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/data/notifications/",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.error(
          data.message || "Impossible de charger les notifications."
        )
        return
      }

      const incoming: NotificationItem[] =
        data.notifications || []

      setNotifications(incoming)
      setUnreadCount(data.unread_count || 0)

      // Premier chargement :
      // mémoriser les anciennes notifications sans popup.
      if (firstLoad.current) {
        incoming.forEach((notification) => {
          knownIds.current.add(notification.id)
        })

        firstLoad.current = false
        return
      }

      const newNotifications = incoming.filter(
        (notification) =>
          !knownIds.current.has(notification.id)
      )

      newNotifications.forEach((notification) => {
        toast({
          variant:
            notification.level === "error"
              ? "destructive"
              : "default",
          title: notification.title,
          description: notification.message,
        })

        knownIds.current.add(notification.id)
      })
    } catch (error) {
      console.error(
        "Erreur de chargement des notifications :",
        error
      )
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchNotifications()

    // Vérification toutes les 10 secondes
    const intervalId = window.setInterval(
      fetchNotifications,
      10000
    )

    return () => {
      window.clearInterval(intervalId)
    }
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    refreshNotifications: fetchNotifications,
  }
}