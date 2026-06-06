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
 type EventStats = {
  total_events: number
  total_users: number
  top_event: string
}

type UserProfile = {
  authenticated: boolean
  email: string
  first_name?: string
  last_name?: string
  username?: string
}

function KeywordsTable({
  keywords,
  loading,
  error,
}: {
  keywords: TopKeyword[]
  loading: boolean
  error: string
}) {


  return (
    <Card className="p-5 xl:col-span-2">
      <SectionTitle title="Tableau des requêtes GSC" rightText="Trié par clics" />

      {loading ? (
        <div className="flex h-[220px] items-center justify-center text-sm font-semibold text-slate-500">
          Chargement des requêtes...
        </div>
      ) : error ? (
        <div className="flex h-[220px] items-center justify-center text-sm font-semibold text-red-400">
          {error}
        </div>
      ) : keywords.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-sm font-semibold text-slate-500">
          Aucune requête GSC disponible.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--dashboard-border)] text-[11px] uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                <th className="py-3 pr-4 font-black">Mot-clé</th>
                <th className="py-3 px-4 text-right font-black">Clics</th>
                <th className="py-3 px-4 text-right font-black">Impressions</th>
                <th className="py-3 px-4 text-right font-black">CTR</th>
                <th className="py-3 pl-4 text-right font-black">Position</th>
              </tr>
            </thead>

            <tbody>
              {keywords.map((keyword) => {
                const ctr =
                  keyword.total_impressions > 0
                    ? (keyword.total_clicks / keyword.total_impressions) * 100
                    : 0

                return (
                  <tr
                    key={keyword.query}
                    className="border-b border-[var(--dashboard-border)]/70 text-[var(--dashboard-text)] last:border-0"
                  >
                    <td className="py-3 pr-4 font-bold">
                      {keyword.query || "Non défini"}
                    </td>

                    <td className="py-3 px-4 text-right font-semibold">
                      {keyword.total_clicks}
                    </td>

                    <td className="py-3 px-4 text-right font-semibold">
                      {keyword.total_impressions}
                    </td>

                    <td className="py-3 px-4 text-right font-semibold">
                      {ctr.toFixed(2)}%
                    </td>

                    <td className="py-3 pl-4 text-right font-semibold">
                      {Number(keyword.avg_position || 0).toFixed(1)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
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
    <Card className="h-full p-4">
      <SectionTitle title="Requêtes Search Console" rightText="Triées par clics" />

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
                className="grid grid-cols-[32px_minmax(0,1fr)_60px_70px_60px_55px] items-center gap-3 border-b pb-2 last:border-b-0"
style={{ borderColor: "var(--dashboard-border)" }}
              >
                <div className="grid h-8 w-8 place-items-center rounded-xl text-[11px] font-black"
style={{
  backgroundColor: "color-mix(in srgb, var(--brand-secondary) 18%, transparent)",
  color: "var(--brand-secondary)",
}}>
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold text-[var(--dashboard-text)]">
  {item.query}
</p>
                  <p className="text-[10px] text-slate-500">
  Depuis Google Search Console
</p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-black text-[var(--dashboard-text)]">
  {item.total_clicks}
</p>
                  <p className="text-[9px] text-slate-500">clics</p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-black text-[var(--dashboard-text)]">
  {item.total_impressions}
</p>
                  <p className="text-[9px] text-slate-500">impr.</p>
                </div>

                <div className="text-right">
                  <p
  className="text-[11px] font-black"
  style={{ color: "var(--brand-tertiary)" }}
>
  {ctr}%
</p>

                  <p className="text-[9px] text-slate-500">CTR</p>
                </div>
                <div className="text-right">
  <p className="text-[11px] font-black text-[var(--dashboard-text)]">
    {formatPosition(item.avg_position)}
  </p>
  <p className="text-[9px] text-slate-500">pos.</p>
</div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

function EngagementCircleCard({
  value,
  loading,
}: {
  value: number
  loading: boolean
}) {
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(value, 0), 100)
  const offset = circumference - (progress / 100) * circumference

  return (
    <Card className="h-[232px] p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-bold text-slate-400">
            Taux d’engagement
          </p>

          <p className="mt-2 text-[12px] font-semibold text-slate-500">
            Sessions engagées
          </p>
        </div>

        <span className="rounded-full bg-[var(--brand-primary)]/10 px-2 py-1 text-[10px] font-bold text-[var(--brand-primary)]">
          GA4
        </span>
      </div>

      <div className="mt-5 flex items-center justify-center">
        <div className="relative h-[118px] w-[118px]">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#2a2d4b"
              strokeWidth="14"
            />

            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="var(--brand-primary)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>

          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-[28px] font-black leading-none text-[var(--dashboard-text)]">
                {loading ? "..." : `${progress}%`}
              </p>

              <p className="mt-1 text-[10px] font-bold text-slate-500">
                engagé
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function buildMiniTrendFromValue(value: number, points = 7) {
  if (!value || value <= 0) return []

  return Array.from({ length: points }, (_, index) => {
    const variation = Math.sin(index + 1) * 0.12
    const y = Math.max(0, Math.round(value + value * variation))

    return {
      x: String(index + 1),
      y,
    }
  })
}

function formatCompact(value: number) {
  if (!value) return "0"
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}
function formatPosition(value: number) {
  const position = Number(value || 0)

  return position % 1 === 0 ? position.toFixed(0) : position.toFixed(1)
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
      className={`min-w-0 overflow-hidden rounded-[18px] border bg-[var(--dashboard-card)] shadow-[var(--dashboard-shadow)] ${className}`}
      style={{ borderColor: "var(--dashboard-border)" }}
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
      <h3 className="text-[13px] font-extrabold text-[var(--dashboard-text)]">
        {title}
      </h3>
      {rightText ? (
        <span className="text-[10px] font-semibold text-[var(--dashboard-muted)]">
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
  hideChart = false,
  badge = "Période",
}: {
  title: string
  value: string
  subtitle: string
  data: { x: string; y: number }[]
  color: string
  gradientId: string
  hideChart?: boolean
  badge?: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-[var(--dashboard-muted)]">
              {title}
          </p>
         <h2 className="mt-1 text-[30px] font-black leading-none text-[var(--dashboard-text)]">
             {value}
         </h2>
<p className="mt-2 text-[10px] font-semibold text-[var(--dashboard-muted)]">
  {subtitle}
</p>
        </div>

        <span
  className="rounded-full px-2 py-1 text-[10px] font-bold"
  style={{
    backgroundColor: `${color}22`,
    color: color,
  }}
>
  {badge}
</span>
      </div>

      <div className="mt-1 h-[55px]">
  {data.length === 0 ? (
  <div className="flex h-full flex-col justify-center px-2">
    <div
  className="h-[2px] w-full rounded-full"
  style={{ backgroundColor: color }}
/>

    <div className="mt-2 text-right">
      <span className="text-[10px] font-semibold text-slate-600">
        Aucun trafic
      </span>
    </div>
  </div>
) : data.every((item) => Number(item.y || 0) === 0) ? (
  <div className="flex h-full flex-col justify-center px-2">
    <div className="h-[2px] w-full rounded-full bg-slate-700/70" />

    <div className="mt-2 text-right">
      <span className="text-[10px] font-semibold text-slate-600">
        Aucun trafic
      </span>
    </div>
  </div>
) : (
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

  )}
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
          className="absolute left-0 top-0 h-[190px] w-[190px] rounded-full border-[18px] border-transparent border-r-[var(--brand-primary)] border-t-[var(--brand-primary)]"
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
        />

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[34px] font-black text-[var(--dashboard-text)]">
  {value}%
</div>
      </div>

      <p className="mt-3 text-center text-[11px] font-semibold text-slate-500">
        Objectif : {target}% CTR
      </p>
    </Card>
  )
}
function EventsCard({
  totalEvents,
  totalUsers,
  topEvent,
  loading,
  error,
}: {
  totalEvents: number
  totalUsers: number
  topEvent: string
  loading: boolean
  error: string
}) {
  const progress = Math.min(100, totalEvents)

  const donutData = [
    { name: "events", value: progress },
    { name: "rest", value: 100 - progress },
  ]

  return (
    <Card className="p-4">
      <SectionTitle title="Événements GA4" rightText="Données réelles" />

      {loading ? (
        <div className="flex h-[170px] items-center justify-center">
          <p className="text-[12px] font-semibold text-slate-500">
            Chargement...
          </p>
        </div>
      ) : error ? (
        <div className="flex h-[170px] items-center justify-center">
          <p className="text-[12px] font-semibold text-red-400">
            {error}
          </p>
        </div>
      ) : (
        <>
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
                  <Cell fill="var(--brand-primary)" />
                  <Cell fill="#2a2d4b" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-[#1b1c34] px-4 py-3 text-center">
                <div className="text-[18px] font-black text-white">
                  {formatCompact(totalEvents)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 space-y-2 text-[10px] font-semibold text-slate-500">
            <div className="flex items-center justify-between">
              <span>Total événements</span>
              <span className="rounded-full bg-[var(--dashboard-card-soft)] px-2 py-1 text-[var(--dashboard-text)]">
                {formatCompact(totalEvents)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Utilisateurs engagés</span>
              <span className="rounded-full bg-[var(--dashboard-card-soft)] px-2 py-1 text-[var(--dashboard-text)]">
                {formatCompact(totalUsers)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Top événement</span>
              <span className="max-w-[95px] truncate rounded-full bg-[var(--dashboard-card-soft)] px-2 py-1 text-[var(--dashboard-text)]">
                {topEvent || "Aucun"}
              </span>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

function ProgressCard({
  data,
}: {
  data: { name: string; speaking: number; listening: number }[]
}) {
  const hasData = data.length > 0

  return (
    <Card className="p-4">
      <SectionTitle title="Évolution du trafic" rightText="GA4 / GSC" />

      <div className="mb-2 flex items-center gap-4 text-[10px] font-semibold">
        <span className="flex items-center gap-1 text-slate-400">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--brand-primary)" }} />
          Sessions
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--brand-secondary)" }} />
          Clics
        </span>
      </div>

      {!hasData ? (
        <div className="flex h-[145px] items-center justify-center">
          <p className="text-[12px] font-semibold text-slate-500">
            Aucune donnée réelle disponible pour cette période.
          </p>
        </div>
      ) : (
        <div className="h-[145px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-primary)"  stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity={0} />
                </linearGradient>

                <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-secondary)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--brand-secondary)" stopOpacity={0} />
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
                name="Sessions"
                stroke="var(--brand-primary)"
                strokeWidth={2.2}
                fill="url(#sessionsFill)"
                dot={false}
              />

              <Area
                type="monotone"
                dataKey="listening"
                name="Clics"
                stroke="var(--brand-secondary)"
                strokeWidth={2.2}
                fill="url(#clicksFill)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
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
                  className="h-1.5 rounded-full"
                  style={{ width: `${lesson.progress}%`, backgroundColor: "var(--brand-primary)" }}
                />
              </div>
            </div>

            <button className="rounded-full bg-[var(--brand-secondary)]/15 px-3 py-1.5 text-[9px] font-black text-[var(--brand-secondary)]">
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
          color="var(--brand-primary)"
        />

        <LevelBar
          label="Taux de rebond"
          value={`${bounceRate}%`}
          width={`${Math.min(100, bounceRate)}%`}
          color="var(--brand-tertiary)"
        />

        <LevelBar
          label="Taux d’engagement"
          value={`${engagementRate}%`}
          width={`${Math.min(100, engagementRate)}%`}
          color="var(--brand-tertiary)"
        />

        <LevelBar
          label="Visibilité organique"
          value={`${visibilityRate}%`}
          width={`${Math.min(100, visibilityRate)}%`}
          color="var(--brand-tertiary)"
        />
      </div>
    </Card>
  )
}

function WeeklyBarsCard({
  data,
  loading,
  error,
}: {
  data: { page: string; page_views: number }[]
  loading: boolean
  error: string
}) {
  const formatPageLabel = (page: string) => {
  if (!page) return "Page"

  const cleanPage = page.replace("/travel_agency", "") || "/"

  if (cleanPage.length > 12) {
    return `${cleanPage.slice(0, 12)}...`
  }

  return cleanPage
}
  return (
    <Card className="p-4">
      <SectionTitle title="Top 10 pages visitées" rightText="Google Analytics" />

      <div className="h-[190px]">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[12px] font-semibold text-slate-500">
              Chargement...
            </p>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[12px] font-semibold text-red-400">
              {error}
            </p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[12px] font-semibold text-slate-500">
              Aucune page visitée disponible.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slice(0, 10)}>
              <XAxis
  dataKey="page"
  tickFormatter={formatPageLabel}
  tick={{ fill: "#64748b", fontSize: 10 }}
  axisLine={false}
  tickLine={false}
/>

              <YAxis hide />

              <Tooltip
  cursor={{ fill: "rgba(255,255,255,0.03)" }}
  formatter={(value: number) => [`${value} vues`, "Pages vues"]}
  labelFormatter={(label) => `Page : ${label}`}
  contentStyle={{
    background: "#17182d",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    color: "white",
  }}
/>

              <Bar
                dataKey="page_views"
                fill="var(--brand-primary)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

function CalendarCard({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()

  const monthLabel = visibleMonth.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  })

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const firstWeekDay = (firstDay.getDay() + 6) % 7
  const totalDays = lastDay.getDate()

  const calendarCells: ({ day: number; date: string } | null)[] = []

  for (let i = 0; i < firstWeekDay; i++) {
    calendarCells.push(null)
  }

  for (let day = 1; day <= totalDays; day++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`

    calendarCells.push({
      day,
      date,
    })
  }

  const goPreviousMonth = () => {
    setVisibleMonth(new Date(year, month - 1, 1))
  }

  const goNextMonth = () => {
    setVisibleMonth(new Date(year, month + 1, 1))
  }

  return (
    <Card className="p-4">
      <SectionTitle title="Calendrier" rightText="Sélection date" />

      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goPreviousMonth}
          className="text-[18px] font-bold text-[var(--dashboard-muted)] transition hover:text-[var(--dashboard-text)]"
        >
          ‹
        </button>

        <div className="flex items-center gap-2">
          <CalendarDays
            className="h-4 w-4"
            style={{ color: "var(--brand-primary)" }}
          />
          <span className="text-[12px] font-black capitalize text-[var(--dashboard-text)]">
            {monthLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={goNextMonth}
          className="text-[18px] font-bold text-[var(--dashboard-muted)] transition hover:text-[var(--dashboard-text)]"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
        {days.map((d) => (
          <span
            key={d}
            className="font-bold text-[var(--dashboard-muted)]"
          >
            {d}
          </span>
        ))}

        {calendarCells.map((item, index) => {
          if (!item) {
            return <span key={`empty-${index}`} />
          }

          const active = selectedDate === item.date

          return (
            <button
              key={item.date}
              type="button"
              onClick={() => onSelectDate(item.date)}
              className="rounded-lg py-1.5 text-[11px] font-bold transition"
              style={{
                background: active ? "var(--brand-gradient)" : "transparent",
                color: active ? "white" : "var(--dashboard-muted)",
              }}
            >
              {item.day}
            </button>
          )
        })}
      </div>

      {selectedDate ? (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-[var(--dashboard-card-soft)] px-3 py-2">
          <p className="text-[10px] font-semibold text-[var(--dashboard-muted)]">
            Date sélectionnée
          </p>

          <button
            type="button"
            onClick={() => onSelectDate("")}
            className="text-[10px] font-black"
            style={{ color: "var(--brand-primary)" }}
          >
            Réinitialiser
          </button>
        </div>
      ) : null}

      {selectedDate ? (
        <p className="mt-2 text-[10px] font-semibold text-[var(--dashboard-text)]">
          {selectedDate}
        </p>
      ) : null}
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
            className="border-b pb-3 last:border-b-0"
style={{ borderColor: "var(--dashboard-border)" }}
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
          GA4
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
  return (
    <Card className="h-full p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-black text-[var(--dashboard-text)]">
            Top pages SEO
          </h3>
          <p className="mt-1 text-[11px] font-semibold text-[var(--dashboard-muted)]">
            Pages les plus performantes
          </p>
        </div>

        <span className="text-[11px] font-bold text-[var(--brand-primary)]">
          Top 5
        </span>
      </div>

      {loading ? (
        <div className="flex h-[185px] items-center justify-center">
          <p className="text-[12px] font-semibold text-slate-500">
            Chargement...
          </p>
        </div>
      ) : error ? (
        <div className="flex h-[185px] items-center justify-center">
          <p className="text-[12px] font-semibold text-red-400">{error}</p>
        </div>
      ) : pages.length === 0 ? (
        <div className="flex h-[185px] items-center justify-center">
          <p className="text-[12px] font-semibold text-slate-500">
            Aucune page disponible.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
  {pages.slice(0, 5).map((item, index) => {
    const clicks = Number(item.total_clicks || 0)
    const impressions = Number(item.total_impressions || 0)

    return (
      <div
        key={`${item.page}-${index}`}
        className="group flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-2.5 py-2 transition hover:border-white/10 hover:bg-white/[0.06]"
      >
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-black text-white shadow-md"
            style={{
              background:
                index % 3 === 0
                  ? "var(--brand-gradient)"
                  : index % 3 === 1
                  ? "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))"
                  : "linear-gradient(135deg, var(--brand-secondary), var(--brand-tertiary))",
            }}
          >
            {index + 1}
          </div>

          <div className="min-w-0">
            <p className="truncate text-[11px] font-black leading-tight text-[var(--dashboard-text)]">
              {item.page || "Page inconnue"}
            </p>

            <p className="mt-0.5 text-[9px] font-semibold leading-tight text-[var(--dashboard-muted)]">
              {formatCompact(impressions)} impressions
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[12px] font-black text-[var(--brand-primary)]">
            {formatCompact(clicks)}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-wide text-[var(--dashboard-muted)]">
            clics
          </p>
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
  const [user, setUser] = useState<UserProfile | null>(null)
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
  const [eventStats, setEventStats] = useState<EventStats | null>(null)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState("")
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
  
  const [topVisitedPages, setTopVisitedPages] = useState<
  { page: string; page_views: number }[]
>([])

const [topVisitedPagesLoading, setTopVisitedPagesLoading] = useState(false)
const [topVisitedPagesError, setTopVisitedPagesError] = useState("")

  


  const themes = [
  {
    id: "violetRose",
    primary: "#7c5cff",
    secondary: "#ff4fb8",
  },
  {
    id: "bluePurple",
    primary: "#315cff",
    secondary: "#a855f7",
  },
  {
    id: "purplePink",
    primary: "#8b5cf6",
    secondary: "#ec4899",
  },
  {
    id: "mintPurple",
    primary: "#2dd4bf",
    secondary: "#a855f7",
  },
  {
    id: "cyanBlue",
    primary: "#06b6d4",
    secondary: "#3b82f6",
  },
]

const [selectedTheme, setSelectedTheme] = useState(themes[0])


const currentTheme = selectedTheme

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

  const fetchTopVisitedPages = async () => {
    try {
      setTopVisitedPagesLoading(true)
      setTopVisitedPagesError("")

      const params = new URLSearchParams()
      params.append("website_id", selectedWebsiteId)

      if (selectedCalendarDate) {
  params.append("start_date", selectedCalendarDate)
  params.append("end_date", selectedCalendarDate)
} else {
  if (appliedStartDate) {
    params.append("start_date", appliedStartDate)
  }

  if (appliedEndDate) {
    params.append("end_date", appliedEndDate)
  }
}

      const response = await fetch(
        `http://127.0.0.1:8000/data/top-visited-pages/?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || "Impossible de charger les pages les plus visitées."
        )
      }

      setTopVisitedPages(data.pages || [])
    } catch (err: any) {
      setTopVisitedPagesError(
        err.message || "Erreur lors du chargement des pages visitées."
      )
      setTopVisitedPages([])
    } finally {
      setTopVisitedPagesLoading(false)
    }
  }

  fetchTopVisitedPages()
}, [
  selectedWebsiteId,
  appliedStartDate,
  appliedEndDate,
  selectedCalendarDate,
  
])

  useEffect(() => {
  const fetchUser = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/me/", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok && data.authenticated) {
        setUser(data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'utilisateur :", error)
    }
  }

  fetchUser()
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

  if (selectedCalendarDate) {
  params.append("start_date", selectedCalendarDate)
  params.append("end_date", selectedCalendarDate)
} else {
  if (appliedStartDate) {
    params.append("start_date", appliedStartDate)
  }

  if (appliedEndDate) {
    params.append("end_date", appliedEndDate)
  }
}

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
}, [selectedWebsiteId, appliedStartDate, appliedEndDate, selectedCalendarDate])

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

useEffect(() => {
  if (!selectedWebsiteId) return

  const fetchEventStats = async () => {
    try {
      setEventsLoading(true)
      setEventsError("")

      const params = new URLSearchParams()
      params.append("website_id", selectedWebsiteId)

     if (selectedCalendarDate) {
  params.append("start_date", selectedCalendarDate)
  params.append("end_date", selectedCalendarDate)
} else {
  if (appliedStartDate) {
    params.append("start_date", appliedStartDate)
  }

  if (appliedEndDate) {
    params.append("end_date", appliedEndDate)
  }
}

      const response = await fetch(
        `http://127.0.0.1:8000/data/dashboard/events/?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Impossible de charger les événements GA4.")
      }

      setEventStats({
        total_events: Number(data.total_events || 0),
        total_users: Number(data.total_users || 0),
        top_event: data.top_event || "",
      })
    } catch (err: any) {
      setEventsError(err.message || "Erreur lors du chargement des événements GA4.")
      setEventStats(null)
    } finally {
      setEventsLoading(false)
    }
  }

  fetchEventStats()
}, [
  selectedWebsiteId,
  appliedStartDate,
  appliedEndDate,
  selectedCalendarDate,
  
])
  const totalUsers =
    statsData?.ga_chart?.reduce((acc, item) => acc + Number(item.users || 0), 0) || 0

  const totalSessions =
    statsData?.ga_chart?.reduce((acc, item) => acc + Number(item.sessions || 0), 0) || 0

  const totalPageViews =
    statsData?.ga_chart?.reduce((acc, item) => acc + Number(item.page_views || 0), 0) || 0

  const totalClicks =
    statsData?.gsc_chart?.reduce((acc, item) => acc + Number(item.clicks || 0), 0) || 0

  const fallbackPageViewsChart = buildMiniTrendFromValue(totalPageViews, 7)

  const positionedKeywords = topKeywords.length

  const miniKeywordsChart =
  positionedKeywords > 0
    ? Array.from({ length: positionedKeywords }, (_, index) => ({
        x: String(index + 1),
        y: index % 2 === 0 ? positionedKeywords : Math.max(1, positionedKeywords / 2),
      }))
    : []

  const totalImpressions =
    statsData?.gsc_chart?.reduce((acc, item) => acc + Number(item.impressions || 0), 0) || 0
  
  const gaChart = statsData?.ga_chart ?? []

const averageEngagementRate =
  gaChart.length > 0
    ? gaChart.reduce(
        (acc: number, item: any) =>
          acc + Number(item.engagement_rate || 0),
        0
      ) / gaChart.length
    : 0

const engagementRate =
  averageEngagementRate <= 1
    ? Math.round(averageEngagementRate * 100)
    : Math.round(averageEngagementRate)

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
    setSelectedCalendarDate(null)
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
  }

 
const userDisplayName =
  user?.first_name || user?.username || user?.email || "Utilisateur"

  return (
    <div className="w-full overflow-x-hidden bg-transparent p-5 text-[var(--dashboard-text)]">
      <div className="mx-auto max-w-[1120px]">
        {/* TOP HEADER */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-[var(--dashboard-text)]">
  Hello, {userDisplayName}
</h1>

<p className="mt-1 text-[11px] font-semibold text-slate-500">
  Suivi des performances SEO, du trafic et des mots-clés
</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedWebsiteId}
              onChange={(e) => {
                const value = e.target.value
                setSelectedWebsiteId(value)
                localStorage.setItem("websiteId", value)
              }}
              className="h-9 rounded-xl border bg-[var(--dashboard-card)] px-3 text-[12px] font-semibold text-[var(--dashboard-text)] outline-none"
style={{ borderColor: "var(--dashboard-border)" }}
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

{/* ── FILTER BAR ── */}
<div
  style={{
    marginBottom: "20px",
    background: "var(--dashboard-card)",
    border: "1px solid var(--dashboard-border)",
    borderRadius: "20px",
    padding: "20px 24px",
    backdropFilter: "blur(12px)",
    boxShadow: "var(--dashboard-shadow)",
  }}
>
  {/* Header row */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "18px",
      paddingBottom: "14px",
      borderBottom: "1px solid var(--dashboard-line)",
    }}
  >
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: "10px",
        background: "var(--brand-gradient)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
          "0 4px 12px color-mix(in srgb, var(--brand-primary) 35%, transparent)",
        flexShrink: 0,
      }}
    >
      <span style={{ color: "white", fontSize: "14px", fontWeight: 900 }}>
        F
      </span>
    </div>

    <div>
      <p
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--dashboard-text)",
          margin: 0,
        }}
      >
        Filtres du tableau de bord
      </p>

      <p
        style={{
          fontSize: "11px",
          color: "var(--dashboard-muted)",
          margin: 0,
        }}
      >
        Sélectionnez une période 
      </p>
    </div>

    {/* Errors */}
    {sitesError && (
      <p style={{ fontSize: "11px", color: "#f87171", marginLeft: "12px" }}>
        {sitesError}
      </p>
    )}

    {statsError && (
      <p style={{ fontSize: "11px", color: "#f87171", marginLeft: "12px" }}>
        {statsError}
      </p>
    )}
  </div>

  {/* Inputs row */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr  auto auto",
      gap: "12px",
      alignItems: "flex-end",
    }}
  >
    

    {/* Date début */}
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "6px",
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--dashboard-muted)",
        }}
      >
        Date début
      </label>

      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        style={{
          width: "100%",
          height: "42px",
          background: "var(--dashboard-card-soft)",
          border: startDate
            ? "1px solid var(--brand-secondary)"
            : "1px solid var(--dashboard-border)",
          borderRadius: "13px",
          padding: "0 14px",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--dashboard-text)",
          outline: "none",
          colorScheme: "dark",
          transition: "border-color 0.2s",
          boxShadow: startDate
            ? "0 0 0 3px color-mix(in srgb, var(--brand-secondary) 14%, transparent)"
            : "none",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--brand-secondary)"
        }}
        onBlur={(e) => {
          e.target.style.borderColor = startDate
            ? "var(--brand-secondary)"
            : "var(--dashboard-border)"
        }}
      />
    </div>

    {/* Date fin */}
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "6px",
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--dashboard-muted)",
        }}
      >
        Date fin
      </label>

      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        style={{
          width: "100%",
          height: "42px",
          background: "var(--dashboard-card-soft)",
          border: endDate
            ? "1px solid var(--brand-tertiary)"
            : "1px solid var(--dashboard-border)",
          borderRadius: "13px",
          padding: "0 14px",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--dashboard-text)",
          outline: "none",
          colorScheme: "dark",
          transition: "border-color 0.2s",
          boxShadow: endDate
            ? "0 0 0 3px color-mix(in srgb, var(--brand-tertiary) 14%, transparent)"
            : "none",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--brand-tertiary)"
        }}
        onBlur={(e) => {
          e.target.style.borderColor = endDate
            ? "var(--brand-tertiary)"
            : "var(--dashboard-border)"
        }}
      />
    </div>

    {/* Bouton Appliquer */}
    <button
      type="button"
      onClick={handleApplyDateFilter}
      style={{
        height: "42px",
        padding: "0 20px",
        borderRadius: "13px",
        border: "none",
        background: "var(--brand-gradient)",
        color: "white",
        fontSize: "13px",
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow:
          "0 4px 16px color-mix(in srgb, var(--brand-primary) 35%, transparent)",
        transition: "opacity 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.opacity = "0.88"
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.opacity = "1"
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
      }}
    >
      Appliquer
    </button>

    {/* Bouton Réinitialiser */}
    <button
      type="button"
      onClick={() => {
        
        setStartDate("")
        setEndDate("")
        setAppliedStartDate("")
        setAppliedEndDate("")
        setSelectedCalendarDate(null)
      }}
      style={{
        height: "42px",
        padding: "0 16px",
        borderRadius: "13px",
        background: "var(--dashboard-card-soft)",
        border: "1px solid var(--dashboard-border)",
        color: "var(--dashboard-muted)",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.color =
          "var(--dashboard-text)"
        ;(e.currentTarget as HTMLElement).style.borderColor =
          "var(--brand-primary)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.color =
          "var(--dashboard-muted)"
        ;(e.currentTarget as HTMLElement).style.borderColor =
          "var(--dashboard-border)"
      }}
    >
      Reset
    </button>
  </div>

  {/* Active filters badges */}
  {(startDate || endDate) && (
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginTop: "14px",
        paddingTop: "12px",
        borderTop: "1px solid var(--dashboard-line)",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          color: "var(--dashboard-muted)",
          alignSelf: "center",
        }}
      >
        Filtres actifs :
      </span>

      

      {startDate && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: "99px",
            background:
              "color-mix(in srgb, var(--brand-secondary) 14%, transparent)",
            color: "var(--brand-secondary)",
            border:
              "1px solid color-mix(in srgb, var(--brand-secondary) 28%, transparent)",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          Du : {startDate}
          <span
            style={{ cursor: "pointer", opacity: 0.65 }}
            onClick={() => setStartDate("")}
          >
            ×
          </span>
        </span>
      )}

      {endDate && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: "99px",
            background:
              "color-mix(in srgb, var(--brand-tertiary) 14%, transparent)",
            color: "var(--brand-tertiary)",
            border:
              "1px solid color-mix(in srgb, var(--brand-tertiary) 28%, transparent)",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          Au : {endDate}
          <span
            style={{ cursor: "pointer", opacity: 0.65 }}
            onClick={() => setEndDate("")}
          >
            ×
          </span>
        </span>
      )}
    </div>
  )}
</div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_240px]">
          {/* LEFT MAIN AREA */}
          <section className="space-y-4">
            {/* TOP ROW */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard
  title="Trafic organique"
  value={loadingStats ? "..." : formatCompact(totalClicks)}
  subtitle="Clics depuis Google Search Console"
  data={miniClicksChart}
  color="var(--brand-secondary)"
  gradientId="organicTrafficChart"
  badge="GSC"
/>
<StatCard
  title="Pages consultées"
  value={loadingStats ? "..." : formatCompact(totalPageViews)}
  subtitle="Pages vues Google Analytics"
  data={
    miniPageViewsChart.length > 0
      ? miniPageViewsChart
      : fallbackPageViewsChart
  }
  color="var(--brand-primary)"
  gradientId="pageViewsChart"
  badge="GA4"
/>
<StatCard
  title="Trafic total"
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
  color="var(--brand-secondary)"
  gradientId="sessionsChart"
  badge="GA4"
/>
<StatCard
  title="Mots-clés positionnés"
  value={loadingStats ? "..." : formatCompact(positionedKeywords)}
  subtitle="Requêtes visibles dans Google"
  data={miniKeywordsChart}
  color="var(--brand-primary)"
  gradientId="keywordsChart"
  badge="GSC"
/>


            </div>
         
            {/* MIDDLE ROW */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
              <EventsCard
  totalEvents={eventStats?.total_events || 0}
  totalUsers={eventStats?.total_users || 0}
  topEvent={eventStats?.top_event || ""}
  loading={eventsLoading}
  error={eventsError}
/>
              <ProgressCard data={progressData} />
            </div>
           
{/* CTR + TAUX DE REBOND + ENGAGEMENT */}
<div className="grid grid-cols-1 gap-3 lg:grid-cols-[250px_minmax(0,1fr)_210px]">
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
    color="var(--brand-tertiary)"
    gradientId="bounceRateChart"
  />
  <EngagementCircleCard
    value={engagementRate}
    loading={loadingStats}
  />
</div>
      <WeeklyBarsCard
  data={topVisitedPages}
  loading={topVisitedPagesLoading}
  error={topVisitedPagesError}
/>
            {/* BOTTOM ROW */}
            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1fr_360px]">
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
      
           <CalendarCard
           selectedDate={selectedCalendarDate}
           onSelectDate={setSelectedCalendarDate}
           />
            <TasksCard rows={taskRows} />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default MainDashboard