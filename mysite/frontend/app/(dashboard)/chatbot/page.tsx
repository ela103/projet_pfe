"use client"

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import {
  Bot,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Message = {
  role: "user" | "assistant"
  content: string
}

type ChatHistoryItem = {
  id: number
  question: string
  answer: string
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Bonjour 👋 Je suis votre **assistant SEO IA**.

Je peux vous aider concernant :

- l’analyse du trafic ;
- les performances Google Analytics 4 ;
- les données Search Console ;
- les pages à améliorer ;
- les recommandations SEO ;
- l’interprétation des KPI.

Posez-moi votre question.`,
    },
  ])

  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const websiteId = localStorage.getItem("websiteId")
        const url = websiteId
          ? `http://127.0.0.1:8000/api/ai/chat/history/?website_id=${websiteId}`
          : "http://127.0.0.1:8000/api/ai/chat/history/"

        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        const history: ChatHistoryItem[] = data.messages || []

        if (history.length === 0) {
          return
        }

        const restoredMessages = history
          .slice()
          .reverse()
          .flatMap((item) => [
            {
              role: "user" as const,
              content: item.question,
            },
            {
              role: "assistant" as const,
              content: item.answer,
            },
          ])

        setMessages((previousMessages) => [
          previousMessages[0],
          ...restoredMessages,
        ])
      } catch (error) {
        console.error("Erreur historique chatbot :", error)
      }
    }

    void fetchChatHistory()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    })
  }, [messages, loading])

  async function handleSend() {
    const question = input.trim()

    if (!question || loading) return

    const userMessage: Message = {
      role: "user",
      content: question,
    }

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage,
    ])

    setInput("")
    setLoading(true)

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/ai/chat/",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question,
            website_id: localStorage.getItem("websiteId"),
            channel: "chatbot",
          }),
        },
      )

      if (!response.ok) {
        throw new Error(
          `Erreur HTTP : ${response.status}`,
        )
      }

      const data = await response.json()

      const assistantContent =
        data.response?.text ??
        data.response ??
        data.answer ??
        data.message ??
        "Aucune réponse n’a été générée."

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "assistant",
          content: assistantContent,
        },
      ])
    } catch (error) {
      console.error("Erreur chatbot :", error)

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "assistant",
          content:
            "Une erreur est survenue pendant la génération de la réponse. Veuillez réessayer.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  return (
    <section className="flex h-[calc(100vh-32px)] min-h-[650px] p-4 md:p-6">
      <div
        className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border shadow-[var(--dashboard-shadow)]"
        style={{
          background: "var(--dashboard-card)",
          borderColor: "var(--dashboard-border)",
        }}
      >
        {/* En-tête */}
        <header
          className="flex shrink-0 items-center justify-between border-b px-5 py-4 md:px-7"
          style={{
            borderColor: "var(--dashboard-border)",
          }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg"
                style={{
                  background: "var(--brand-gradient)",
                  boxShadow:
                    "0 12px 26px color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                }}
              >
                <Bot className="h-6 w-6" />
              </div>

              <span
                className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 bg-emerald-500"
                style={{
                  borderColor: "var(--dashboard-card)",
                }}
              />
            </div>

            <div>
              <h1 className="text-base font-black text-[var(--dashboard-text)] md:text-lg">
                Assistant SEO IA
              </h1>

              <p className="mt-0.5 text-xs font-semibold text-[var(--dashboard-muted)]">
                En ligne · Analyse et recommandations SEO
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-[var(--dashboard-card-soft)] px-4 py-2 text-xs font-black text-[var(--dashboard-muted)] sm:flex">
            <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" />
            Propulsé par l’IA
          </div>
        </header>

        {/* Discussion */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            {messages.map((message, index) => {
              const isUser = message.role === "user"

              return (
                <article
                  key={`${message.role}-${index}`}
                  className={`flex items-start gap-3 ${
                    isUser
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-md"
                      style={{
                        background: "var(--brand-gradient)",
                        boxShadow:
                          "0 10px 22px color-mix(in srgb, var(--brand-primary) 20%, transparent)",
                      }}
                    >
                      <Bot className="h-5 w-5" />
                    </div>
                  )}

                  <div
                    className={`min-w-0 break-words px-5 py-4 text-sm leading-7 md:text-base ${
                      isUser
                        ? "w-fit max-w-[75%] rounded-[24px] rounded-br-md bg-[var(--brand-primary)] text-white"
                        : "w-fit max-w-[88%] rounded-[24px] rounded-bl-md border bg-[var(--dashboard-card-soft)] text-[var(--dashboard-text)] md:max-w-[80%]"
                    }`}
                    style={
                      isUser
                        ? undefined
                        : {
                            borderColor:
                              "var(--dashboard-border)",
                          }
                    }
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">
                        {message.content}
                      </p>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="mb-4 mt-5 text-xl font-black first:mt-0">
                              {children}
                            </h1>
                          ),

                          h2: ({ children }) => (
                            <h2 className="mb-3 mt-5 text-lg font-black first:mt-0">
                              {children}
                            </h2>
                          ),

                          h3: ({ children }) => (
                            <h3 className="mb-3 mt-4 text-base font-black first:mt-0">
                              {children}
                            </h3>
                          ),

                          p: ({ children }) => (
                            <p className="mb-4 last:mb-0">
                              {children}
                            </p>
                          ),

                          strong: ({ children }) => (
                            <strong className="font-black text-[var(--brand-primary)]">
                              {children}
                            </strong>
                          ),

                          ul: ({ children }) => (
                            <ul className="mb-4 ml-5 list-disc space-y-1.5">
                              {children}
                            </ul>
                          ),

                          ol: ({ children }) => (
                            <ol className="mb-4 ml-5 list-decimal space-y-1.5">
                              {children}
                            </ol>
                          ),

                          li: ({ children }) => (
                            <li className="pl-1">
                              {children}
                            </li>
                          ),

                          blockquote: ({ children }) => (
                            <blockquote className="my-4 border-l-4 border-[var(--brand-primary)] pl-4 text-[var(--dashboard-muted)]">
                              {children}
                            </blockquote>
                          ),

                          hr: () => (
                            <hr className="my-5 border-[var(--dashboard-border)]" />
                          ),
                        }}
                      >
                        {message.content
                          .replace(/\\n/g, "\n")
                          .trim()}
                      </ReactMarkdown>
                    )}
                  </div>

                  {isUser && (
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--dashboard-card-soft)] text-[var(--dashboard-muted)]">
                      <UserRound className="h-5 w-5" />
                    </div>
                  )}
                </article>
              )
            })}

            {loading && (
              <div className="flex items-start gap-3">
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-md"
                  style={{
                    background: "var(--brand-gradient)",
                    boxShadow:
                      "0 10px 22px color-mix(in srgb, var(--brand-primary) 20%, transparent)",
                  }}
                >
                  <Bot className="h-5 w-5" />
                </div>

                <div
                  className="rounded-[24px] rounded-bl-md border bg-[var(--dashboard-card-soft)] px-5 py-4"
                  style={{
                    borderColor:
                      "var(--dashboard-border)",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--dashboard-muted)]" />

                    <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--dashboard-muted)] [animation-delay:150ms]" />

                    <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--dashboard-muted)] [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Zone de saisie */}
        <footer
          className="shrink-0 border-t px-4 py-4 md:px-8"
          style={{
            borderColor: "var(--dashboard-border)",
            background: "var(--dashboard-card)",
          }}
        >
          <div className="mx-auto flex w-full max-w-5xl items-end gap-3">
            <div
              className="flex min-h-14 flex-1 items-end rounded-[22px] border bg-[var(--dashboard-card-soft)] px-4 py-2 transition focus-within:ring-2 focus-within:ring-[var(--brand-primary)]/25"
              style={{
                borderColor: "var(--dashboard-border)",
              }}
            >
              <textarea
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Posez une question sur le trafic ou le SEO..."
                rows={1}
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm font-semibold text-[var(--dashboard-text)] outline-none placeholder:text-[var(--dashboard-muted)]"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!input.trim() || loading}
              className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] text-white shadow-lg transition duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              style={{
                background: "var(--brand-gradient)",
                boxShadow:
                  "0 12px 26px color-mix(in srgb, var(--brand-primary) 22%, transparent)",
              }}
              aria-label="Envoyer le message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

          <p className="mx-auto mt-2 max-w-5xl text-center text-[10px] font-semibold text-[var(--dashboard-muted)]">
            Entrée pour envoyer · Maj + Entrée pour revenir à la ligne
          </p>
        </footer>
      </div>
    </section>
  )
}
