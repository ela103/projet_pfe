"use client"

import { useEffect, useState } from "react"
import { WelcomeCard } from "@/components/dashboard/welcome-card"
import { RoomCard } from "@/components/dashboard/room-card"
import { DeviceCard } from "@/components/dashboard/device-card"
import { AirConditioning } from "@/components/dashboard/air-conditioning"
import { UsersWidget } from "@/components/dashboard/users"
import { ConsumptionChart } from "@/components/dashboard/consumption-chart"
import { Shortcuts } from "@/components/dashboard/shortcuts"
import { LightPanels } from "@/components/dashboard/light-panels"
import { Scenes } from "@/components/dashboard/scenes"
import EnergyWidget from "@/components/dashboard/energy-widget"

type Website = {
  id: number
  name: string
}
type StatsData = {
  ga_chart: {
    date: string
    users: number
    sessions: number
    page_views: number
  }[]
  gsc_chart: {
    date: string
    clicks: number
    impressions: number
  }[]
}
export function MainDashboard() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>("")
  const [loadingSites, setLoadingSites] = useState(true)
  const [sitesError, setSitesError] = useState("")
  const [statsData, setStatsData] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [statsError, setStatsError] = useState("")

  useEffect(() => {
  const fetchWebsites = async () => {
    try {
      setLoadingSites(true)
      setSitesError("")

      const response = await fetch("http://127.0.0.1:8000/data/websites/")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Impossible de charger les sites.")
      }

      setWebsites(data.websites || [])

      if (data.websites && data.websites.length > 0) {
        const storedId = localStorage.getItem("websiteId")

        if (
          storedId &&
          data.websites.some((site: Website) => String(site.id) === storedId)
        ) {
          setSelectedWebsiteId(storedId)
        } else {
          const firstId = String(data.websites[0].id)
          setSelectedWebsiteId(firstId)
          localStorage.setItem("websiteId", firstId)
        }
      }
    } catch (err: any) {
      setSitesError(err.message || "Une erreur est survenue.")
    } finally {
      setLoadingSites(false)
    }
  }

  fetchWebsites()
}, [])
  useEffect(() => {
  if (!selectedWebsiteId) return

  const fetchStats = async () => {
  try {
    setLoadingStats(true)
    setStatsError("")
    setStatsData(null)

    const response = await fetch(
      `http://127.0.0.1:8000/data/dashboard/stats/?website_id=${selectedWebsiteId}`
    )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Impossible de charger les statistiques.")
      }

      setStatsData(data)
    } catch (err: any) {
      setStatsError(err.message || "Une erreur est survenue.")
    } finally {
      setLoadingStats(false)
    }
  }

  fetchStats()
}, [selectedWebsiteId])

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Sélectionnez un site pour charger ses statistiques et analyses.
            </p>
          </div>

          <div className="w-full md:w-72">
            {loadingSites ? (
              <p className="text-sm text-muted-foreground">Chargement des sites...</p>
            ) : sitesError ? (
              <p className="text-sm text-red-500">{sitesError}</p>
            ) : (
              <select                value={selectedWebsiteId}
                 onChange={(e) => {
    const value = e.target.value
    setSelectedWebsiteId(value)
    localStorage.setItem("websiteId", value)
  }}
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground outline-none"
              >
                {websites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} 
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {selectedWebsiteId && (
          <p className="mt-3 text-xs text-muted-foreground">
            Site sélectionné : ID {selectedWebsiteId}
          </p>
          
        )}
        {loadingStats && (
  <p className="mt-2 text-sm text-muted-foreground">
    Chargement des statistiques...
  </p>
)}

{statsError && (
  <p className="mt-2 text-sm text-red-500">{statsError}</p>
)}

{statsData && (
  <div className="mt-4 grid gap-3 md:grid-cols-2">
    <div className="rounded-xl bg-background p-4 ring-1 ring-border">
      <h3 className="text-sm font-semibold text-foreground">GA Chart</h3>
      <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
        {JSON.stringify(statsData.ga_chart, null, 2)}
      </pre>
    </div>

    <div className="rounded-xl bg-background p-4 ring-1 ring-border">
      <h3 className="text-sm font-semibold text-foreground">GSC Chart</h3>
      <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
        {JSON.stringify(statsData.gsc_chart, null, 2)}
      </pre>
    </div>
  </div>
)}
      </section>

      <WelcomeCard />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Rooms</h2>
              <span className="text-[10px] text-muted-foreground">Master bed room ▾</span>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {["Living Room", "Kitchen", "Bed Room", "Bathroom", "Bed Room", "Bathroom"].map((r, i) => (
                <RoomCard key={i} title={r} />
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Popular Devices</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DeviceCard title="Refrigerator" icon="fridge" />
                <DeviceCard title="Washer" icon="washer" />
                <DeviceCard title="Desktop PC" icon="pc" />
                <DeviceCard title="Air Conditioning" icon="ac" />
              </div>
            </div>

            <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Scene</h2>
              </div>
              <Scenes />
            </div>
          </section>

          <EnergyWidget />
        </div>

        <div className="space-y-5">
          <AirConditioning />
          <UsersWidget />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ConsumptionChart />
        </div>
        <Shortcuts />
      </div>

      <LightPanels />
    </div>
  )
}