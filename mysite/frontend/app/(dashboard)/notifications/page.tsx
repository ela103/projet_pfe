"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react"

type AppNotification = {
  id: number
  title: string
  message: string
  level: "info" | "warning" | "error"
  source: string
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedNotification, setSelectedNotification] =
  useState<AppNotification | null>(null)
  const getIcon = (level: AppNotification["level"]) => {
  if (level === "error") {
    return <AlertTriangle className="h-5 w-5 text-red-500" />
  }

  if (level === "warning") {
    return <AlertTriangle className="h-5 w-5 text-amber-500" />
  }

  return <Info className="h-5 w-5 text-blue-500" />
}

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        setError("")

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
          setError(
            data.message ||
              "Impossible de charger les notifications."
          )
          return
        }

        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      } catch {
        setError("Erreur de connexion au serveur.")
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const getNotificationIcon = (
    level: AppNotification["level"]
  ) => {
    if (level === "error") {
      return (
        <AlertTriangle className="h-5 w-5 text-red-500" />
      )
    }

    if (level === "warning") {
      return (
        <AlertTriangle className="h-5 w-5 text-amber-500" />
      )
    }

    return <Info className="h-5 w-5 text-blue-500" />
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  return (
    <main className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="grid h-12 w-12 place-items-center rounded-2xl"
                style={{
                  background:
                    "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                  color: "var(--brand-primary)",
                }}
              >
                <Bell className="h-6 w-6" />
              </div>

              <div>
                <h1
                  className="text-2xl font-black"
                  style={{ color: "var(--dashboard-text)" }}
                >
                  Notifications
                </h1>

                <p
                  className="mt-1 text-sm font-semibold"
                  style={{ color: "var(--dashboard-muted)" }}
                >
                  Consultez les alertes et les résumés générés
                  automatiquement.
                </p>
              </div>
            </div>
          </div>

          <div
            className="w-fit rounded-full px-4 py-2 text-sm font-black"
            style={{
              background:
                "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
              color: "var(--brand-primary)",
            }}
          >
            {unreadCount} non lue(s)
          </div>
        </header>

        {loading ? (
          <div
            className="flex min-h-[280px] items-center justify-center rounded-[28px] border"
            style={{
              background: "var(--dashboard-card)",
              borderColor: "var(--dashboard-border)",
            }}
          >
            <div className="flex items-center gap-3">
              <Loader2
                className="h-5 w-5 animate-spin"
                style={{ color: "var(--brand-primary)" }}
              />

              <p
                className="text-sm font-bold"
                style={{ color: "var(--dashboard-muted)" }}
              >
                Chargement des notifications...
              </p>
            </div>
          </div>
        ) : error ? (
          <div
            className="rounded-[24px] border p-5"
            style={{
              background:
                "color-mix(in srgb, #ef4444 8%, var(--dashboard-card))",
              borderColor:
                "color-mix(in srgb, #ef4444 28%, var(--dashboard-border))",
            }}
          >
            <p className="font-bold text-red-500">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border p-8 text-center"
            style={{
              background: "var(--dashboard-card)",
              borderColor: "var(--dashboard-border)",
            }}
          >
            <div
              className="grid h-16 w-16 place-items-center rounded-full"
              style={{
                background:
                  "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
                color: "var(--brand-primary)",
              }}
            >
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h2
              className="mt-5 text-lg font-black"
              style={{ color: "var(--dashboard-text)" }}
            >
              Aucune notification
            </h2>

            <p
              className="mt-2 max-w-md text-sm font-semibold"
              style={{ color: "var(--dashboard-muted)" }}
            >
              Les nouveaux résumés SEO et les alertes du pipeline
              apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <button
    key={notification.id}
    type="button"
    onClick={() => setSelectedNotification(notification)}
    className="
      w-full rounded-[24px] border p-5
      text-left transition
      hover:-translate-y-0.5 hover:shadow-lg
    "
    style={{
      background: notification.is_read
        ? "var(--dashboard-card)"
        : "color-mix(in srgb, var(--brand-primary) 6%, var(--dashboard-card))",
      borderColor: notification.is_read
        ? "var(--dashboard-border)"
        : "color-mix(in srgb, var(--brand-primary) 35%, var(--dashboard-border))",
    }}
  >
                <div className="flex items-start gap-4">
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                    style={{
                      background:
                        "var(--dashboard-card-soft)",
                    }}
                  >
                    {getNotificationIcon(notification.level)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2
                          className="text-sm font-black"
                          style={{
                            color: "var(--dashboard-text)",
                          }}
                        >
                          {notification.title}
                        </h2>

                        <p
                          className="mt-2 text-sm leading-6"
                          style={{
                            color: "var(--dashboard-muted)",
                          }}
                        >
                          {notification.message}
                        </p>
                      </div>

                      {!notification.is_read && (
                        <span
                          className="w-fit shrink-0 rounded-full px-3 py-1 text-[10px] font-black"
                          style={{
                            background:
                              "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                            color: "var(--brand-primary)",
                          }}
                        >
                          Nouveau
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span
                        className="text-[11px] font-bold"
                        style={{
                          color: "var(--dashboard-muted)",
                        }}
                      >
                        {formatDate(notification.created_at)}
                      </span>

                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-black"
                        style={{
                          background:
                            "var(--dashboard-card-soft)",
                          color: "var(--dashboard-muted)",
                        }}
                      >
                        {notification.source}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedNotification && (
  <div
    className="
      fixed inset-0 z-[100]
      flex items-center justify-center
      bg-black/50 p-4 backdrop-blur-sm
    "
    onClick={() => setSelectedNotification(null)}
  >
    <div
      className="
        max-h-[85vh] w-full max-w-2xl
        overflow-y-auto rounded-[28px]
        border p-6 shadow-2xl
      "
      style={{
        background: "var(--dashboard-card)",
        borderColor: "var(--dashboard-border)",
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="
              grid h-12 w-12 shrink-0
              place-items-center rounded-2xl
            "
            style={{
              background: "var(--dashboard-card-soft)",
            }}
          >
            {getIcon(selectedNotification.level)}
          </div>

          <div>
            <h2
              className="text-lg font-black"
              style={{
                color: "var(--dashboard-text)",
              }}
            >
              {selectedNotification.title}
            </h2>

            <p
              className="mt-1 text-xs font-semibold"
              style={{
                color: "var(--dashboard-muted)",
              }}
            >
              {new Date(
                selectedNotification.created_at
              ).toLocaleString("fr-FR")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSelectedNotification(null)}
          className="
            grid h-10 w-10 shrink-0
            place-items-center rounded-full
            text-xl font-bold transition
            hover:opacity-70
          "
          style={{
            background: "var(--dashboard-card-soft)",
            color: "var(--dashboard-text)",
          }}
          aria-label="Fermer"
        >
          ×
        </button>
      </div>

      <div
        className="mt-6 rounded-[20px] border p-5"
        style={{
          background: "var(--dashboard-card-soft)",
          borderColor: "var(--dashboard-border)",
        }}
      >
        <p
          className="whitespace-pre-wrap text-sm leading-7"
          style={{
            color: "var(--dashboard-text)",
          }}
        >
          {selectedNotification.message}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{
            background:
              "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
            color: "var(--brand-primary)",
          }}
        >
          {selectedNotification.source}
        </span>

        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{
            background: "var(--dashboard-card-soft)",
            color: "var(--dashboard-muted)",
          }}
        >
          {selectedNotification.level}
        </span>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => setSelectedNotification(null)}
          className="
            rounded-2xl px-5 py-3
            text-sm font-black text-white
          "
          style={{
            background: "var(--brand-primary)",
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  )
}