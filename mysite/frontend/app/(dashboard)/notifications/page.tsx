"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"

type AppNotification = {
  id: number
  title: string
  message: string
  level: "info" | "success" | "warning" | "error"
  source?: string | null
  is_read: boolean
  created_at: string
}

type FilterKey = "all" | "unread" | "alerts"

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "unread", label: "Non lues" },
  { key: "alerts", label: "Alertes" },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedNotification, setSelectedNotification] =
    useState<AppNotification | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [query, setQuery] = useState("")

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
          setError(data.message || "Impossible de charger les notifications.")
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

  useEffect(() => {
    const handleNotificationRead = (event: Event) => {
      const customEvent = event as CustomEvent<{
        notificationId: number
        unreadCount: number
      }>

      setNotifications((current) =>
        current.map((item) =>
          item.id === customEvent.detail.notificationId
            ? { ...item, is_read: true }
            : item
        )
      )

      setUnreadCount(customEvent.detail.unreadCount)
    }

    window.addEventListener("notification-read", handleNotificationRead)

    return () => {
      window.removeEventListener("notification-read", handleNotificationRead)
    }
  }, [])

  const filteredNotifications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return notifications.filter((notification) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "unread" && !notification.is_read) ||
        (activeFilter === "alerts" &&
          ["warning", "error"].includes(notification.level))

      const matchesSearch =
        !normalizedQuery ||
        notification.title.toLowerCase().includes(normalizedQuery) ||
        notification.message.toLowerCase().includes(normalizedQuery) ||
        notification.source?.toLowerCase().includes(normalizedQuery)

      return matchesFilter && matchesSearch
    })
  }, [activeFilter, notifications, query])

  const alertCount = notifications.filter((notification) =>
    ["warning", "error"].includes(notification.level)
  ).length

  const openNotification = async (notification: AppNotification) => {
    setSelectedNotification(notification)

    if (notification.is_read) {
      return
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/data/notifications/${notification.id}/read/`,
        {
          method: "POST",
          credentials: "include",
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error(
          data.message || "Impossible de marquer la notification comme lue."
        )
        return
      }

      setNotifications((currentNotifications) =>
        currentNotifications.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        )
      )

      setSelectedNotification((currentNotification) =>
        currentNotification?.id === notification.id
          ? { ...currentNotification, is_read: true }
          : currentNotification
      )

      setUnreadCount(data.unread_count ?? 0)

      window.dispatchEvent(
        new CustomEvent("notification-read", {
          detail: {
            notificationId: notification.id,
            unreadCount: data.unread_count ?? 0,
          },
        })
      )
    } catch (readError) {
      console.error("Erreur pendant la lecture de la notification :", readError)
    }
  }

  const getNotificationIcon = (level: AppNotification["level"]) => {
    if (level === "error") {
      return (
        <AlertTriangle
          className="h-5 w-5"
          style={{ color: "var(--brand-tertiary)" }}
        />
      )
    }

    if (level === "warning") {
      return (
        <AlertTriangle
          className="h-5 w-5"
          style={{
            color:
              "color-mix(in srgb, var(--brand-secondary) 58%, var(--brand-tertiary))",
          }}
        />
      )
    }

    if (level === "success") {
      return (
        <CheckCircle2
          className="h-5 w-5"
          style={{ color: "var(--brand-secondary)" }}
        />
      )
    }

    return (
      <Info className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
    )
  }

  const getLevelLabel = (level: AppNotification["level"]) => {
    if (level === "error") return "Critique"
    if (level === "warning") return "Attention"
    if (level === "success") return "Résolu"
    return "Info"
  }

  const getLevelStyle = (level: AppNotification["level"]) => {
    if (level === "error") {
      return {
        background:
          "color-mix(in srgb, var(--brand-tertiary) 12%, var(--dashboard-card-soft))",
        color: "var(--brand-tertiary)",
      }
    }

    if (level === "warning") {
      return {
        background:
          "color-mix(in srgb, var(--brand-secondary) 12%, var(--dashboard-card-soft))",
        color:
          "color-mix(in srgb, var(--brand-secondary) 58%, var(--brand-tertiary))",
      }
    }

    if (level === "success") {
      return {
        background:
          "color-mix(in srgb, var(--brand-secondary) 14%, var(--dashboard-card-soft))",
        color: "var(--brand-secondary)",
      }
    }

    return {
      background:
        "color-mix(in srgb, var(--brand-primary) 12%, var(--dashboard-card-soft))",
      color: "var(--brand-primary)",
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  return (
    <main className="min-h-screen px-5 py-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
                Centre d'alertes
              </p>
              <h1 className="mt-2 text-2xl font-black text-[var(--dashboard-text)]">
                Notifications
              </h1>
              <p className="mt-2 max-w-xl text-sm font-semibold text-[var(--dashboard-muted)]">
                Alertes SEO, performance et résumés automatiques de vos sites.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SmallStat label="Total" value={notifications.length} />
              <SmallStat label="Non lues" value={unreadCount} active />
              <SmallStat label="Alertes" value={alertCount} />
            </div>
          </div>
        </header>

        <section
          className="mb-5 rounded-[24px] border bg-[var(--dashboard-card)] p-4 shadow-[var(--dashboard-shadow)]"
          style={{ borderColor: "var(--dashboard-border)" }}
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-primary)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher par titre, source ou message"
                className="h-11 w-full rounded-xl border bg-transparent pl-11 pr-4 text-sm font-semibold text-[var(--dashboard-text)] outline-none placeholder:text-[var(--dashboard-muted)] focus:border-[var(--brand-primary)]"
                style={{ borderColor: "var(--dashboard-border)" }}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const active = activeFilter === filter.key

                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className="h-11 rounded-xl border px-4 text-xs font-black transition"
                    style={{
                      background: active
                        ? "var(--brand-gradient)"
                        : "var(--dashboard-card)",
                      borderColor: active
                        ? "transparent"
                        : "var(--dashboard-border)",
                      color: active ? "white" : "var(--dashboard-muted)",
                    }}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>

            <div
              className="flex h-11 items-center gap-2 rounded-xl border px-4 text-xs font-black"
              style={{
                borderColor: "var(--dashboard-border)",
                color: "var(--dashboard-muted)",
              }}
            >
              <SlidersHorizontal className="h-4 w-4 text-[var(--brand-primary)]" />
              {filteredNotifications.length} résultat(s)
            </div>
          </div>
        </section>

        {loading ? (
          <div
            className="flex min-h-[280px] items-center justify-center rounded-[24px] border bg-[var(--dashboard-card)]"
            style={{ borderColor: "var(--dashboard-border)" }}
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-primary)]" />
              <p className="text-sm font-bold text-[var(--dashboard-muted)]">
                Chargement des notifications...
              </p>
            </div>
          </div>
        ) : error ? (
          <div
            className="rounded-[20px] border p-5"
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
          <EmptyState />
        ) : filteredNotifications.length === 0 ? (
          <div
            className="rounded-[24px] border bg-[var(--dashboard-card)] p-8 text-center"
            style={{ borderColor: "var(--dashboard-border)" }}
          >
            <p className="text-sm font-bold text-[var(--dashboard-muted)]">
              Aucune notification ne correspond à votre recherche.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const active = selectedNotification?.id === notification.id

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification)}
                  className="w-full rounded-[22px] border bg-[var(--dashboard-card)] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--dashboard-shadow)]"
                  style={{
                    borderColor: active
                      ? "var(--brand-primary)"
                      : notification.is_read
                      ? "var(--dashboard-border)"
                      : "color-mix(in srgb, var(--brand-primary) 28%, var(--dashboard-border))",
                    boxShadow: active
                      ? "0 12px 28px color-mix(in srgb, var(--brand-primary) 18%, transparent)"
                      : undefined,
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-[54px_1fr_auto] sm:items-center">
                    <div
                      className="grid h-12 w-12 place-items-center rounded-2xl"
                      style={{
                        background:
                          "color-mix(in srgb, var(--brand-primary) 9%, var(--dashboard-card-soft))",
                      }}
                    >
                      {getNotificationIcon(notification.level)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-black text-[var(--dashboard-text)]">
                          {notification.title}
                        </h2>

                        {!notification.is_read && (
                          <span className="rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[10px] font-black text-white">
                            Nouveau
                          </span>
                        )}

                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-black"
                          style={getLevelStyle(notification.level)}
                        >
                          {getLevelLabel(notification.level)}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-[var(--dashboard-muted)]">
                        {notification.message}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-[var(--dashboard-muted)]">
                        <span>{notification.source || "Système"}</span>
                        <span className="h-1 w-1 rounded-full bg-[var(--dashboard-muted)]" />
                        <span>{formatDate(notification.created_at)}</span>
                      </div>
                    </div>

                    <div className="hidden justify-self-end sm:block">
                      <div
                        className="grid h-9 w-9 place-items-center rounded-full border"
                        style={{
                          borderColor: active
                            ? "var(--brand-primary)"
                            : "var(--dashboard-border)",
                          color: active
                            ? "var(--brand-primary)"
                            : "var(--dashboard-muted)",
                        }}
                      >
                        <Bell className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selectedNotification && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-[24px] border bg-[var(--dashboard-card)] p-5 shadow-2xl"
            style={{ borderColor: "var(--dashboard-border)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                  style={{ background: "var(--dashboard-card-soft)" }}
                >
                  {getNotificationIcon(selectedNotification.level)}
                </div>

                <div>
                  <h2 className="text-base font-black text-[var(--dashboard-text)]">
                    {selectedNotification.title}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-[var(--dashboard-muted)]">
                    {formatDate(selectedNotification.created_at)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--dashboard-card-soft)] text-[var(--dashboard-muted)] transition hover:text-[var(--dashboard-text)]"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-[18px] bg-[var(--dashboard-card-soft)] p-4">
              <p className="whitespace-pre-wrap text-sm font-semibold leading-7 text-[var(--dashboard-text)]">
                {selectedNotification.message}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--dashboard-card-soft)] px-3 py-1 text-xs font-bold text-[var(--dashboard-muted)]">
                {selectedNotification.source || "Système"}
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={getLevelStyle(selectedNotification.level)}
              >
                {getLevelLabel(selectedNotification.level)}
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function SmallStat({
  label,
  value,
  active = false,
}: {
  label: string
  value: number
  active?: boolean
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-2"
      style={{
        background: active
          ? "color-mix(in srgb, var(--brand-primary) 10%, var(--dashboard-card))"
          : "var(--dashboard-card)",
        borderColor: active
          ? "color-mix(in srgb, var(--brand-primary) 32%, var(--dashboard-border))"
          : "var(--dashboard-border)",
      }}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
        {label}
      </p>
      <p
        className="mt-0.5 text-sm font-black"
        style={{
          color: active ? "var(--brand-primary)" : "var(--dashboard-text)",
        }}
      >
        {value}
      </p>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border bg-[var(--dashboard-card)] p-8 text-center"
      style={{ borderColor: "var(--dashboard-border)" }}
    >
      <div
        className="grid h-14 w-14 place-items-center rounded-2xl"
        style={{
          background:
            "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
          color: "var(--brand-primary)",
        }}
      >
        <CheckCircle2 className="h-7 w-7" />
      </div>

      <h2 className="mt-4 text-base font-black text-[var(--dashboard-text)]">
        Aucune notification
      </h2>

      <p className="mt-2 max-w-md text-sm font-semibold text-[var(--dashboard-muted)]">
        Les nouveaux résumés SEO et les alertes de performance apparaîtront ici.
      </p>
    </div>
  )
}
