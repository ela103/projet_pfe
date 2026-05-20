"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Bell, CalendarDays, Search } from "lucide-react"

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
    engagement_rate?: number
    bounce_rate?: number
  }[]
  gsc_chart: {
    date: string
    clicks: number
    impressions: number
    ctr?: number
    position?: number
  }[]
}

type LessonItem = {
  title: string
  subtitle: string
  progress: number
  badge: string
}
type TopPage = {
  page: string
  total_clicks: number
  total_impressions: number
}

type TaskItem = {
  tag: string
  title: string
  subtitle: string
}
type TopKeyword = {
  query: string
  total_clicks: number
  total_impressions: number
  avg_ctr?: number
  avg_position: number
}
function TopKeywordsCard({
  keywords,
  loading,
  error,
}: {
  keywords: TopKeyword[]
  loading: boolean
  error: string
}) {
  return (
    <Card className="p-4">
      <SectionTitle title="Mots-clés performants" rightText="Top 5" />

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : keywords.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aucun mot-clé disponible pour ce site.
        </p>
      ) : (
        <div className="space-y-3">
          {keywords.slice(0, 5).map((item, index) => {
            const ctr =
              item.total_impressions > 0
                ? ((item.total_clicks / item.total_impressions) * 100).toFixed(1)
                : "0.0"

            return (
              <div
                key={`${item.query}-${index}`}
                className="grid grid-cols-[32px_minmax(0,1fr)_70px_80px_60px] items-center gap-3 border-b border-white/5 pb-2 last:border-b-0"
              >
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#ff4fb8]/15 text-[11px] font-black text-[#ff4fb8]">
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold text-white">
                    {item.query}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Position moy. : {Number(item.avg_position || 0).toFixed(1)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-black text-white">
                    {item.total_clicks}
                  </p>
                  <p className="text-[9px] text-slate-500">clics</p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-black text-white">
                    {item.total_impressions}
                  </p>
                  <p className="text-[9px] text-slate-500">impr.</p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-black text-[#a78bfa]">
                    {ctr}%
                  </p>
                  <p className="text-[9px] text-slate-500">CTR</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}


function formatCompact(value: number) {
  if (!value) return "0"
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}

function formatDateShort(date: string) {
  if (!date) return ""
  const parts = date.split("-")
  if (parts.length !== 3) return date
  return `${parts[2]}/${parts[1]}`
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[18px] border border-white/5 bg-[#17182d] shadow-[0_18px_40px_rgba(0,0,0,0.20)] ${className}`}
    >
      {children}
    </div>
  )
}

function SectionTitle({
  title,
  rightText,
}: {
  title: string
  rightText?: string
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-[13px] font-extrabold text-white">{title}</h3>
      {rightText ? (
        <span className="text-[10px] font-semibold text-slate-500">
          {rightText}
        </span>
      ) : null}
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  data,
  color,
  gradientId,
}: {
  title: string
  value: string
  subtitle: string
  data: { x: string; y: number }[]
  color: string
  gradientId: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-400">{title}</p>
          <h2 className="mt-1 text-[30px] font-black leading-none text-white">
            {value}
          </h2>
          <p className="mt-2 text-[10px] font-semibold text-slate-500">
            {subtitle}
          </p>
        </div>

        <span className="text-[10px] font-semibold text-slate-500">
          last month +
        </span>
      </div>

      <div className="mt-1 h-[55px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>

            <Area
              type="monotone"
              dataKey="y"
              stroke={color}
              strokeWidth={2.2}
              fill={`url(#${gradientId})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function GaugeCard({
  title,
  subtitle,
  value,
  progress,
  target,
}: {
  title: string
  subtitle: string
  value: number
  progress: number
  target: number
}) {
  const rotation = Math.max(12, Math.min(170, progress * 1.7))

  return (
    <Card className="h-[232px] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-bold text-slate-400">{title}</p>

          <p className="mt-3 text-[12px] font-semibold text-slate-500">
            {subtitle}
          </p>

          <p className="text-[12px] font-semibold text-slate-500">
            Search Console
          </p>
        </div>

        <span className="text-[11px] font-bold text-slate-500">
          current
        </span>
      </div>

      <div className="relative mx-auto mt-5 h-[92px] w-[190px] overflow-hidden">
        <div className="absolute left-0 top-0 h-[190px] w-[190px] rounded-full border-[18px] border-[#2a2d4b]" />

        <div
          className="absolute left-0 top-0 h-[190px] w-[190px] rounded-full border-[18px] border-transparent border-r-[#7c5cff] border-t-[#7c5cff]"
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
        />

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[34px] font-black text-white">
          {value}%
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] font-semibold text-slate-500">
        Objectif : {target}% CTR
      </p>
    </Card>
  )
}
function ScoreCard({
  score,
}: {
  score: number
}) {
  const donutData = [
    { name: "done", value: score },
    { name: "rest", value: 100 - score },
  ]

  return (
    <Card className="p-4">
      <SectionTitle title="Achievements" rightText="View all →" />

      <div className="relative mx-auto h-[120px] w-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={donutData}
              dataKey="value"
              innerRadius={44}
              outerRadius={58}
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
            >
              <Cell fill="#ff4fb8" />
              <Cell fill="#2a2d4b" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-[#1b1c34] px-4 py-3 text-center">
            <div className="text-[18px] font-black text-white">{score}</div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-slate-500">
        <span>SEO score</span>
        <span className="rounded-full bg-[#111222] px-2 py-1 text-white">
          Good level
        </span>
      </div>
    </Card>
  )
}

function ProgressCard({
  data,
}: {
  data: { name: string; speaking: number; listening: number }[]
}) {
  return (
    <Card className="p-4">
      <SectionTitle title="Progress" rightText="last year +" />

      <div className="mb-2 flex items-center gap-4 text-[10px] font-semibold">
        <span className="flex items-center gap-1 text-slate-400">
          <span className="h-2 w-2 rounded-full bg-[#7c5cff]" />
          Sessions
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <span className="h-2 w-2 rounded-full bg-[#ff4fb8]" />
          Clicks
        </span>
      </div>

      <div className="h-[145px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4fb8" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#ff4fb8" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                background: "#17182d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                color: "white",
              }}
            />

            <Area
              type="monotone"
              dataKey="speaking"
              stroke="#7c5cff"
              strokeWidth={2.2}
              fill="url(#sessionsFill)"
              dot={false}
            />

            <Area
              type="monotone"
              dataKey="listening"
              stroke="#ff4fb8"
              strokeWidth={2.2}
              fill="url(#clicksFill)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function LessonsCard({
  rows,
}: {
  rows: LessonItem[]
}) {
  return (
    <Card className="p-4">
      <SectionTitle title="My lessons" rightText="This week +" />

      <div className="space-y-3">
        {rows.map((lesson, index) => (
          <div
            key={index}
            className="grid grid-cols-[34px_1fr_90px_84px] items-center gap-3"
          >
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#ff4fb8] text-[10px] font-bold text-white">
              Start
            </div>

            <div>
              <p className="text-[11px] font-bold text-white">{lesson.title}</p>
              <p className="mt-1 text-[9px] font-semibold text-slate-500">
                {lesson.subtitle}
              </p>
            </div>

            <div>
              <p className="mb-1 text-[9px] font-bold text-white">
                {lesson.progress}% complete
              </p>
              <div className="h-1.5 rounded-full bg-[#2a2d4b]">
                <div
                  className="h-1.5 rounded-full bg-[#7c5cff]"
                  style={{ width: `${lesson.progress}%` }}
                />
              </div>
            </div>

            <button className="rounded-full bg-[#ff4fb8]/15 px-3 py-1.5 text-[9px] font-black text-[#ff4fb8]">
              {lesson.badge}
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}

function LevelBar({
  label,
  value,
  width,
  color,
}: {
  label: string
  value: string
  width: string
  color: string
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400">
          {label}
        </span>
        <span className="text-[11px] font-black text-white">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#2a2d4b]">
        <div
          className="h-1.5 rounded-full"
          style={{ width, background: color }}
        />
      </div>
    </div>
  )
}

function LevelCard({
  ctr,
  bounceRate,
  engagementRate,
  visibilityRate,
}: {
  ctr: number
  bounceRate: number
  engagementRate: number
  visibilityRate: number
}) {
  return (
    <Card className="h-[250px] p-4">
      <SectionTitle title="Indicateurs SEO" rightText="Données réelles" />

      <div className="space-y-4">
        <LevelBar
          label="CTR moyen"
          value={`${ctr}%`}
          width={`${Math.min(100, ctr * 10)}%`}
          color="#7c5cff"
        />

        <LevelBar
          label="Taux de rebond"
          value={`${bounceRate}%`}
          width={`${Math.min(100, bounceRate)}%`}
          color="#ff4fb8"
        />

        <LevelBar
          label="Taux d’engagement"
          value={`${engagementRate}%`}
          width={`${Math.min(100, engagementRate)}%`}
          color="#a78bfa"
        />

        <LevelBar
          label="Visibilité organique"
          value={`${visibilityRate}%`}
          width={`${Math.min(100, visibilityRate)}%`}
          color="#8b5cf6"
        />
      </div>
    </Card>
  )
}

function WeeklyBarsCard({
  data,
}: {
  data: { day: string; value: number }[]
}) {
  return (
    <Card className="p-4">
      <SectionTitle title="Learning hours" rightText="Weekly +" />

      <div className="h-[148px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="day"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              contentStyle={{
                background: "#17182d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                color: "white",
              }}
            />
            <Bar dataKey="value" fill="#ff4fb8" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function CalendarCard() {
  const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

  return (
    <Card className="p-4">
      <SectionTitle title="November 2023" rightText="" />

      <div className="mb-2 flex items-center justify-between">
        <button className="text-slate-500">‹</button>
        <CalendarDays className="h-4 w-4 text-[#7c5cff]" />
        <button className="text-slate-500">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
        {days.map((d) => (
          <span key={d} className="font-bold text-slate-500">
            {d}
          </span>
        ))}

        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className={`rounded-lg py-1.5 font-bold ${
              i === 9
                ? "bg-[#7567ff] text-white"
                : "text-slate-400 hover:bg-white/5"
            }`}
          >
            {i + 7}
          </span>
        ))}
      </div>
    </Card>
  )
}

function TasksCard({
  rows,
}: {
  rows: TaskItem[]
}) {
  return (
    <Card className="p-4">
      <SectionTitle title="Tasks" rightText="Today, 27 Nov +" />

      <div className="space-y-3">
        {rows.map((task, index) => (
          <div
            key={index}
            className="border-b border-white/5 pb-3 last:border-b-0"
          >
            <div className="mb-1">
              <span className="rounded-full bg-[#ff4fb8]/15 px-2 py-0.5 text-[9px] font-black text-[#ff4fb8]">
                {task.tag}
              </span>
            </div>

            <p className="text-[11px] font-bold text-white">{task.title}</p>
            <p className="mt-1 text-[10px] font-semibold text-slate-500">
              {task.subtitle}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function BounceRateRadialCard({
  value,
}: {
  value: number
}) {
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, value))
  const offset = circumference - (progress / 100) * circumference

  return (
    <Card className="h-[232px] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-bold text-slate-400">
            Taux de rebond
          </p>

          <p className="mt-2 text-[12px] font-semibold text-slate-500">
            Sessions non engagées
          </p>
        </div>

        <span className="text-[11px] font-bold text-slate-500">
          last month +
        </span>
      </div>

      <div className="mt-5 flex items-center justify-center">
        <div className="relative h-[120px] w-[120px]">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#2a2d4b"
              strokeWidth="12"
              fill="none"
            />

            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#ff4fb8"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[30px] font-black leading-none text-white">
              {value}%
            </span>
            <span className="mt-1 text-[10px] font-bold text-slate-500">
              bounce
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function TopPagesCard({
  pages,
  loading,
  error,
}: {
  pages: TopPage[]
  loading: boolean
  error: string
}) {
  const maxClicks = Math.max(
    ...pages.map((item) => Number(item.total_clicks || 0)),
    1
  )

  return (
    <Card className="h-[250px] p-4">
      <SectionTitle title="Pages performantes" rightText="Top 5" />

      {loading ? (
        <div className="flex h-[180px] items-center justify-center">
          <p className="text-[12px] font-semibold text-slate-500">
            Chargement...
          </p>
        </div>
      ) : error ? (
        <div className="flex h-[180px] items-center justify-center">
          <p className="text-[12px] font-semibold text-red-400">{error}</p>
        </div>
      ) : pages.length === 0 ? (
        <div className="flex h-[180px] items-center justify-center">
          <p className="text-[12px] font-semibold text-slate-500">
            Aucune page disponible.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pages.slice(0, 5).map((item, index) => {
            const clicks = Number(item.total_clicks || 0)
            const impressions = Number(item.total_impressions || 0)
            const width = Math.max(8, Math.round((clicks / maxClicks) * 100))

            return (
              <div key={`${item.page}-${index}`}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-white">
                      {item.page || "Page inconnue"}
                    </p>
                    <p className="text-[9px] font-semibold text-slate-500">
                      {impressions} impressions
                    </p>
                  </div>

                  <span className="shrink-0 text-[11px] font-black text-white">
                    {clicks} clics
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-[#2a2d4b]">
                  <div
                    className="h-1.5 rounded-full bg-[#7c5cff]"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export function MainDashboard() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>("")

  const [loadingSites, setLoadingSites] = useState(true)
  const [sitesError, setSitesError] = useState("")

  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [statsError, setStatsError] = useState("")

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [appliedStartDate, setAppliedStartDate] = useState("")
  const [appliedEndDate, setAppliedEndDate] = useState("")
  const [topKeywords, setTopKeywords] = useState<TopKeyword[]>([])
  const [keywordsLoading, setKeywordsLoading] = useState(false)
  const [keywordsError, setKeywordsError] = useState("")
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [pagesLoading, setPagesLoading] = useState(false)
  const [pagesError, setPagesError] = useState("")

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        setLoadingSites(true)
        setSitesError("")

        const response = await fetch("http://127.0.0.1:8000/data/websites/", {
          method: "GET",
          credentials: "include",
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Impossible de charger les sites.")
        }

        const list: Website[] = data.websites || []
        setWebsites(list)

        if (list.length > 0) {
          const storedId = localStorage.getItem("websiteId")
          if (storedId && list.some((site) => String(site.id) === storedId)) {
            setSelectedWebsiteId(storedId)
          } else {
            const firstId = String(list[0].id)
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

        const params = new URLSearchParams()
        params.append("website_id", selectedWebsiteId)

        if (appliedStartDate) params.append("start_date", appliedStartDate)
        if (appliedEndDate) params.append("end_date", appliedEndDate)

        const response = await fetch(
          `http://127.0.0.1:8000/data/dashboard/stats/?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
          }
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
  }, [selectedWebsiteId, appliedStartDate, appliedEndDate])

  useEffect(() => {
  if (!selectedWebsiteId) return

  const fetchTopPages = async () => {
    try {
      setPagesLoading(true)
      setPagesError("")

      const response = await fetch(
        `http://127.0.0.1:8000/data/top-pages/?website_id=${selectedWebsiteId}`,
        {
          method: "GET",
          credentials: "include",
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Impossible de charger les pages.")
      }

      setTopPages(data.pages || [])
    } catch (err: any) {
      setPagesError(err.message || "Erreur lors du chargement des pages.")
      setTopPages([])
    } finally {
      setPagesLoading(false)
    }
  }

  fetchTopPages()
}, [selectedWebsiteId])

  useEffect(() => {
  if (!selectedWebsiteId) return

  const fetchTopKeywords = async () => {
    try {
      setKeywordsLoading(true)
      setKeywordsError("")

      const response = await fetch(
        `http://127.0.0.1:8000/data/top-keywords/?website_id=${selectedWebsiteId}`,
        {
          method: "GET",
          credentials: "include",
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Impossible de charger les mots-clés.")
      }

      setTopKeywords(data.keywords || [])
    } catch (err: any) {
      setKeywordsError(err.message || "Erreur lors du chargement des mots-clés.")
      setTopKeywords([])
    } finally {
      setKeywordsLoading(false)
    }
  }

  fetchTopKeywords()
}, [selectedWebsiteId])

  const totalUsers =
    statsData?.ga_chart?.reduce((acc, item) => acc + Number(item.users || 0), 0) || 0

  const totalSessions =
    statsData?.ga_chart?.reduce((acc, item) => acc + Number(item.sessions || 0), 0) || 0

  const totalPageViews =
    statsData?.ga_chart?.reduce((acc, item) => acc + Number(item.page_views || 0), 0) || 0

  const totalClicks =
    statsData?.gsc_chart?.reduce((acc, item) => acc + Number(item.clicks || 0), 0) || 0

  const totalImpressions =
    statsData?.gsc_chart?.reduce((acc, item) => acc + Number(item.impressions || 0), 0) || 0

  const ctr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(1)) : 0
  const averageBounceRate =
  statsData?.ga_chart?.length
    ? Number(
        (
          statsData.ga_chart.reduce(
            (acc, item) => acc + Number(item.bounce_rate || 0),
            0
          ) / statsData.ga_chart.length
        ).toFixed(1)
      )
    : 0

const ctrTarget = 10

const ctrGaugeProgress =
  ctrTarget > 0
    ? Math.min(100, Math.round((ctr / ctrTarget) * 100))
    : 0
const averageEngagementRate =
  statsData?.ga_chart?.length
    ? Number(
        (
          statsData.ga_chart.reduce(
            (acc, item) => acc + Number(item.engagement_rate || 0),
            0
          ) / statsData.ga_chart.length
        ).toFixed(1)
      )
    : 0

    const organicVisibilityRate =
  totalImpressions > 0
    ? Math.min(100, Math.round((totalClicks / totalImpressions) * 1000))
    : 0
const miniSessionsChart = useMemo(() => {
  const ga = statsData?.ga_chart || []

  return ga.slice(-7).map((item, index) => ({
    x: String(index + 1),
    y: Number(item.sessions || 0),
  }))
}, [statsData])

const miniClicksChart = useMemo(() => {
  const gsc = statsData?.gsc_chart || []

  return gsc.slice(-7).map((item, index) => ({
    x: String(index + 1),
    y: Number(item.clicks || 0),
  }))
}, [statsData])

const miniPageViewsChart = useMemo(() => {
  const ga = statsData?.ga_chart || []

  return ga.slice(-7).map((item, index) => ({
    x: String(index + 1),
    y: Number(item.page_views || 0),
  }))
}, [statsData])

  const miniChartOne = useMemo(() => {
    const ga = statsData?.ga_chart || []
    return ga.slice(-7).map((item, index) => ({
      x: String(index + 1),
      y: Number(item.users || 0),
    }))
  }, [statsData])

  const miniChartTwo = useMemo(() => {
    const ga = statsData?.ga_chart || []
    return ga.slice(-7).map((item, index) => ({
      x: String(index + 1),
      y: Number(item.sessions || 0),
    }))
  }, [statsData])

  const miniBounceRateChart = useMemo(() => {
  const ga = statsData?.ga_chart || []

  return ga.slice(-7).map((item, index) => ({
    x: String(index + 1),
    y: Number(item.bounce_rate || 0),
  }))
}, [statsData])

  const miniCtrChart = useMemo(() => {
  const gsc = statsData?.gsc_chart || []

  return gsc.slice(-7).map((item, index) => {
    const clicks = Number(item.clicks || 0)
    const impressions = Number(item.impressions || 0)

    return {
      x: String(index + 1),
      y:
        impressions > 0
          ? Number(((clicks / impressions) * 100).toFixed(1))
          : 0,
    }
  })
}, [statsData])
  const progressData = useMemo(() => {
    const ga = statsData?.ga_chart || []
    const gsc = statsData?.gsc_chart || []

    return ga.slice(-6).map((gaItem) => {
      const gscItem = gsc.find((item) => item.date === gaItem.date)
      return {
        name: formatDateShort(gaItem.date),
        speaking: Number(gaItem.sessions || 0),
        listening: Number(gscItem?.clicks || 0),
      }
    })
  }, [statsData])

  const weeklyBarData = useMemo(() => {
    const ga = statsData?.ga_chart || []
    const last7 = ga.slice(-6)
    return last7.map((item) => ({
      day: formatDateShort(item.date),
      value: Number(item.page_views || 0),
    }))
  }, [statsData])

 
  const scoreValue = Math.max(40, Math.min(98, Math.round((ctr * 8) + 40)))
  const usersRate = Math.max(10, Math.min(100, totalUsers > 0 ? 65 : 0))
  const pagesRate = Math.max(10, Math.min(100, totalPageViews > 0 ? 72 : 0))
  const clicksRate = Math.max(10, Math.min(100, totalClicks > 0 ? 88 : 0))

  const lessonRows: LessonItem[] = [
    {
      title: "Analyse des sessions organiques",
      subtitle: "Overview • Google Analytics",
      progress: 80,
      badge: "Reminder",
    },
    {
      title: "Audit des clics Search Console",
      subtitle: "Search performance • GSC",
      progress: 20,
      badge: "Reminder",
    },
    {
      title: "Suivi des pages les plus vues",
      subtitle: "Pages report • SEO metrics",
      progress: 50,
      badge: "Reminder",
    },
  ]

  const taskRows: TaskItem[] = [
    {
      tag: "Priority",
      title: "Vérifier les pages faibles",
      subtitle: "Today • 10:00 AM",
    },
    {
      tag: "Task",
      title: "Contrôler les clics organiques",
      subtitle: "Today • 1:45 PM",
    },
    {
      tag: "Study",
      title: "Analyser la courbe de trafic",
      subtitle: "Today • 5:00 PM",
    },
    {
      tag: "Other",
      title: "Revoir les KPIs du site",
      subtitle: "Today • 6:30 PM",
    },
  ]

  const handleApplyDateFilter = () => {
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
  }

  return (
    <div className="min-h-screen bg-[#0e1022] p-5 text-white">
      <div className="mx-auto max-w-[1120px]">
        {/* TOP HEADER */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-white">
              Hello, Ahmed!
            </h1>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              Good luck improving your website performance
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                placeholder="search"
                className="h-9 w-[220px] rounded-xl border border-white/5 bg-[#17182d] pl-9 pr-3 text-[12px] font-semibold text-white outline-none placeholder:text-slate-600"
              />
            </div>

            <button className="relative grid h-9 w-9 place-items-center rounded-xl bg-[#17182d] text-slate-300">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ff4fb8]" />
            </button>

            <select
              value={selectedWebsiteId}
              onChange={(e) => {
                const value = e.target.value
                setSelectedWebsiteId(value)
                localStorage.setItem("websiteId", value)
              }}
              className="h-9 rounded-xl border border-white/5 bg-[#17182d] px-3 text-[12px] font-semibold text-white outline-none"
            >
              {loadingSites ? (
                <option>Loading...</option>
              ) : websites.length === 0 ? (
                <option>No website</option>
              ) : (
                websites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="mb-4 grid grid-cols-1 gap-3 rounded-[18px] border border-white/5 bg-[#17182d] p-4 lg:grid-cols-[1fr_160px_160px_120px] lg:items-end">
          <div>
            <p className="text-[13px] font-extrabold text-white">
              Dashboard filters
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Select a period to update your dashboard statistics.
            </p>
            {sitesError ? (
              <p className="mt-1 text-[11px] text-red-400">{sitesError}</p>
            ) : null}
            {statsError ? (
              <p className="mt-1 text-[11px] text-red-400">{statsError}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 rounded-xl border border-white/5 bg-[#111222] px-3 text-[12px] font-semibold text-white outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 rounded-xl border border-white/5 bg-[#111222] px-3 text-[12px] font-semibold text-white outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleApplyDateFilter}
            className="h-10 rounded-xl bg-[#7c5cff] px-4 text-[12px] font-bold text-white transition hover:opacity-90"
          >
            Apply
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_240px]">
          {/* LEFT MAIN AREA */}
          <section className="space-y-4">
            {/* TOP ROW */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard
  title="Trafic organique"
  value={loadingStats ? "..." : formatCompact(totalClicks)}
  subtitle="Clics depuis Google Search Console"
  data={
    miniClicksChart.length > 0
      ? miniClicksChart
      : [
          { x: "1", y: 10 },
          { x: "2", y: 18 },
          { x: "3", y: 15 },
          { x: "4", y: 24 },
          { x: "5", y: 19 },
          { x: "6", y: 30 },
          { x: "7", y: 37 },
        ]
  }
  color="#7c5cff"
  gradientId="organicTrafficChart"
/>
<StatCard
    title="Pages consultées"
    value={loadingStats ? "..." : formatCompact(totalPageViews)}
    subtitle="Pages vues Google Analytics"
    data={
      miniPageViewsChart.length > 0
        ? miniPageViewsChart
        : [
            { x: "1", y: 12 },
            { x: "2", y: 22 },
            { x: "3", y: 18 },
            { x: "4", y: 30 },
            { x: "5", y: 26 },
            { x: "6", y: 36 },
            { x: "7", y: 40 },
          ]
    }
    color="#a78bfa"
    gradientId="pageViewsChart"
  />
<StatCard
  title="Sessions"
  value={loadingStats ? "..." : formatCompact(totalSessions)}
  subtitle="Sessions totales du site"
  data={
  miniChartTwo.length > 0
    ? miniChartTwo
    : [
          { x: "1", y: 30 },
          { x: "2", y: 19 },
          { x: "3", y: 33 },
          { x: "4", y: 26 },
          { x: "5", y: 42 },
          { x: "6", y: 36 },
          { x: "7", y: 49 },
        ]
  }
  color="#ff4fb8"
  gradientId="sessionsChart"
/>


            </div>
         
            {/* MIDDLE ROW */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
              <ScoreCard score={loadingStats ? 0 : scoreValue} />
              <ProgressCard
                data={
                  progressData.length > 0
                    ? progressData
                    : [
                        { name: "May", speaking: 28, listening: 32 },
                        { name: "June", speaking: 38, listening: 22 },
                        { name: "July", speaking: 26, listening: 36 },
                        { name: "August", speaking: 45, listening: 28 },
                        { name: "September", speaking: 34, listening: 44 },
                        { name: "October", speaking: 52, listening: 50 },
                      ]
                }
              />
            </div>
            {/* CTR + TAUX DE REBOND */}
<div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
 <GaugeCard
  title="CTR moyen"
  subtitle="Clics / impressions"
  value={loadingStats ? 0 : ctr}
  progress={loadingStats ? 0 : ctrGaugeProgress}
  target={ctrTarget}
/>

  <StatCard
    title="Taux de rebond"
    value={loadingStats ? "..." : `${averageBounceRate}%`}
    subtitle="Sessions non engagées"
    data={
      miniBounceRateChart.length > 0
        ? miniBounceRateChart
        : [
            { x: "1", y: 45 },
            { x: "2", y: 39 },
            { x: "3", y: 42 },
            { x: "4", y: 35 },
            { x: "5", y: 38 },
            { x: "6", y: 33 },
            { x: "7", y: 30 },
          ]
    }
    color="#a78bfa"
    gradientId="bounceRateChart"
  />
</div>

            {/* BOTTOM ROW */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
              <TopKeywordsCard
                 keywords={topKeywords}
                 loading={keywordsLoading}
                 error={keywordsError}
              />
              <TopPagesCard
                   pages={topPages}
                   loading={pagesLoading}
                   error={pagesError}
               />
            </div>
          </section>

          {/* RIGHT COLUMN */}
          <aside className="space-y-4">
            <WeeklyBarsCard
              data={
                weeklyBarData.length > 0
                  ? weeklyBarData
                  : [
                      { day: "Mon", value: 2 },
                      { day: "Tue", value: 5 },
                      { day: "Wed", value: 3 },
                      { day: "Thu", value: 7 },
                      { day: "Fri", value: 4 },
                      { day: "Sat", value: 6 },
                    ]
              }
            />
            <CalendarCard />
            <TasksCard rows={taskRows} />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default MainDashboard