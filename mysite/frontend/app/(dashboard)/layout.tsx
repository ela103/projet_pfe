"use client"

import type React from "react"
import { useState } from "react"

import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"
import { ChatbotWidget } from "@/components/chatbot-widget"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Arrière-plan global adaptable au thème */}
      <div className="absolute inset-0 bg-[#F5F7FB]" />

      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background:
            "linear-gradient(135deg, #050816 0%, #071126 35%, #081936 70%, #0A2244 100%)",
        }}
      />

      <div
        className="pointer-events-none fixed -left-28 -top-28 h-[380px] w-[380px] rounded-full blur-3xl"
        style={{
          background: "var(--brand-primary)",
          opacity: 0.18,
        }}
      />

      <div
        className="pointer-events-none fixed -right-28 top-10 h-[340px] w-[340px] rounded-full blur-3xl"
        style={{
          background: "var(--brand-secondary)",
          opacity: 0.14,
        }}
      />

      <div
        className="pointer-events-none fixed bottom-[-140px] left-1/3 h-[380px] w-[380px] rounded-full blur-3xl"
        style={{
          background: "var(--brand-accent)",
          opacity: 0.12,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.08), transparent 34%)",
        }}
      />

      {/* Petites bulles décoratives */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute left-[9%] top-[7%] h-3 w-3 rounded-full bg-white/40 dark:bg-white/10" />
        <span className="absolute left-[27%] top-[12%] h-2 w-2 rounded-full bg-white/50 dark:bg-white/10" />
        <span className="absolute right-[18%] top-[10%] h-4 w-4 rounded-full bg-white/40 dark:bg-white/10" />
        <span className="absolute right-[8%] top-[28%] h-2.5 w-2.5 rounded-full bg-white/40 dark:bg-white/10" />
        <span className="absolute left-[14%] bottom-[20%] h-3 w-3 rounded-full bg-white/30 dark:bg-white/10" />
        <span className="absolute right-[22%] bottom-[13%] h-4 w-4 rounded-full bg-white/30 dark:bg-white/10" />
      </div>

      <div className="absolute inset-0 bg-white/20 dark:bg-black/10" />

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="relative z-10 flex min-h-screen w-full">
        {/* Sidebar */}
        <div
          className={`
            fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto
            transform transition-transform duration-300 ease-in-out
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
          `}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <main className="min-h-screen flex-1 overflow-auto p-6 text-slate-900 dark:text-white">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />

          <div className="mt-6">{children}</div>

          <ChatbotWidget />
        </main>
      </div>
    </div>
  )
}