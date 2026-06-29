"use client"

import { useRouter } from "next/navigation"
import {
  BrainCircuit,
  LineChart,
  Lightbulb,
  Search,
  BarChart3,
  FileWarning,
  Gauge,
} from "lucide-react"

const tools = [
  {
    id: "global-analysis",
    title: "Analyse globale",
    description:
      "Analyse les KPI, le trafic, la visibilité SEO et les performances générales du site sélectionné.",
    icon: Search,
    color: "var(--brand-primary)",
  },
  {
    id: "traffic-diagnosis",
    title: "Diagnostic trafic",
    description:
      "Identifie les causes possibles d’un trafic faible, instable ou en baisse.",
    icon: LineChart,
    color: "var(--brand-secondary)",
  },
  {
    id: "weak-pages",
    title: "Pages à améliorer",
    description:
      "Repère les pages qui nécessitent une optimisation prioritaire.",
    icon: FileWarning,
    color: "var(--brand-tertiary)",
  },
  {
    id: "ga-analysis",
    title: "Analyse Google Analytics",
    description:
      "Analyse les utilisateurs, sessions, pages vues et engagement.",
    icon: BarChart3,
    color: "color-mix(in srgb, var(--brand-primary) 52%, var(--brand-tertiary))",
  },
  {
    id: "gsc-analysis",
    title: "Analyse Search Console",
    description:
      "Explique les clics, impressions, CTR, positions et opportunités SEO.",
    icon: BrainCircuit,
    color: "var(--brand-primary)",
  },
]

export default function AIInsightsPage() {
  const router = useRouter()

  return (
    <section className="relative min-h-screen overflow-hidden p-6 text-[var(--dashboard-text)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute left-[8%] top-[8%] h-56 w-56 rounded-full bg-[var(--brand-primary)]/20 blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute right-[10%] top-[18%] h-64 w-64 rounded-full bg-[var(--brand-secondary)]/20 blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute bottom-[10%] left-[35%] h-72 w-72 rounded-full bg-[var(--brand-tertiary)]/15 blur-3xl" />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--dashboard-muted)]">
              Intelligence artificielle
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              AI Insights
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold text-[var(--dashboard-muted)]">
              Choisissez un outil IA pour analyser les performances SEO, comprendre les faiblesses et prioriser les optimisations.
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {tools.map((tool) => {
            const Icon = tool.icon

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => router.push(`/ai-insights/${tool.id}`)}
                className="group relative min-h-[210px] overflow-hidden rounded-[26px] border bg-[var(--dashboard-card)] p-6 text-left shadow-[var(--dashboard-shadow)] transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ borderColor: "var(--dashboard-border)" }}
              >
                <div
                  className="absolute left-0 top-0 h-full w-1.5 transition-all duration-300 group-hover:w-2"
                  style={{ backgroundColor: tool.color }}
                />

                <div
                  className="mb-8 inline-grid h-14 w-14 place-items-center rounded-2xl"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${tool.color} 16%, var(--dashboard-card))`,
                    color: tool.color,
                  }}
                >
                  <Icon className="h-8 w-8" />
                </div>

                <h2 className="text-xl font-black text-[var(--dashboard-text)]">
                  {tool.title}
                </h2>

                <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-[var(--dashboard-muted)]">
                  {tool.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
