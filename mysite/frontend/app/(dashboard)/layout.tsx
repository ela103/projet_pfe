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
    <div className="min-h-screen w-full bg-gradient-to-br from-violet-50 via-pink-50 to-blue-50">
      
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen w-full">

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
        <main className="flex-1 min-h-screen overflow-auto p-6">
          
          {/* Topbar */}
          <Topbar onMenuClick={() => setSidebarOpen(true)} />

          {/* Page content */}
          <div className="mt-6">
            {children}
          </div>

          {/* Chatbot */}
          <ChatbotWidget />

        </main>

      </div>
    </div>
  )
}