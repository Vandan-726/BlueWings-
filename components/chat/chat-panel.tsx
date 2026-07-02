"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Send, Loader2, Sparkles, Wrench } from "lucide-react"

const TOOL_LABELS: Record<string, string> = {
  searchFlights: "Searching flights",
  listMyBookings: "Fetching your bookings",
  getBookingDetails: "Looking up booking",
  cancelBooking: "Cancelling booking",
  changeSeat: "Changing seat",
  updateMealOrBaggage: "Updating preferences",
  getFlightStatus: "Checking flight status",
  escalateToHuman: "Escalating to a human agent",
}

function getFollowUpsForText(text: string): string[] {
  const lowercase = text.toLowerCase()
  if (lowercase.includes("pnr") || lowercase.includes("booking id") || lowercase.includes("confirmed booking") || lowercase.includes("current bookings") || lowercase.includes("booking details") || lowercase.includes("booking information")) {
    return [
      "How do I change my seat?",
      "Cancel this booking",
      "What is the refund policy?"
    ]
  }
  if (lowercase.includes("flight") || lowercase.includes("pricing") || lowercase.includes("class") || lowercase.includes("economy")) {
    return [
      "Show flight status",
      "Check details for this flight",
      "Search new flights"
    ]
  }
  if (lowercase.includes("refund") || lowercase.includes("cancel") || lowercase.includes("policy")) {
    return [
      "Talk to a human",
      "Refund details",
      "Show my bookings"
    ]
  }
  if (lowercase.includes("seat") || lowercase.includes("baggage") || lowercase.includes("meal") || lowercase.includes("preferences")) {
    return [
      "Change seat selection",
      "View meal options",
      "Baggage allowance details"
    ]
  }
  return [
    "Show my bookings",
    "Find flights from DEL to BOM tomorrow",
    "What is the refund policy?"
  ]
}

interface MessagePart {
  type: string
  text?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  parts: MessagePart[]
}

/** Renders assistant text, converting /paths into links */
function LinkifiedText({ text, linkClass }: { text: string; linkClass: string }) {
  const parts = text.split(/(\/(?:book|trips|login|flights)[^\s).,]*)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("/") && part.length > 1 ? (
          <Link key={i} href={part} className={cn("underline underline-offset-2", linkClass)}>
            {part}
          </Link>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function renderLinks(text: string, isUser: boolean, isWA: boolean = false) {
  const parts = text.split(/(\/(?:book|trips|login|flights)[^\s).,]*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("/") && part.length > 1) {
      return (
        <Link
          key={i}
          href={part}
          className={cn(
            "underline underline-offset-2 transition-colors font-medium",
            (isUser && !isWA)
              ? "text-white hover:text-white/80 font-bold"
              : "text-primary hover:text-primary-active font-semibold",
          )}
        >
          {part}
        </Link>
      )
    }
    return part
  })
}

function renderInline(text: string, isUser: boolean = false, isWA: boolean = false) {
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g)
  return boldParts.map((boldPart, idx) => {
    if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
      const innerText = boldPart.slice(2, -2)
      return (
        <strong key={idx} className={cn("font-bold", (isUser && !isWA) ? "text-white" : "text-ink")}>
          {renderLinks(innerText, isUser, isWA)}
        </strong>
      )
    }
    return <span key={idx}>{renderLinks(boldPart, isUser, isWA)}</span>
  })
}

function parseMarkdown(text: string, isUser: boolean = false, isWA: boolean = false) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []

  let inList = false
  let listItems: React.ReactNode[] = []
  let listKey = 0

  function flushList() {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul
          key={`ul-${listKey++}`}
          className={cn("list-disc pl-5 my-2 space-y-1.5", (isUser && !isWA) ? "text-white" : "text-body")}
        >
          {listItems}
        </ul>
      )
      listItems = []
      inList = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith("### ")) {
      flushList()
      const headerText = line.slice(4)
      elements.push(
        <h3
          key={`h3-${i}`}
          className={cn("text-[13px] font-semibold tracking-wider uppercase mt-4 mb-2 first:mt-0", (isUser && !isWA) ? "text-white" : "text-muted-foreground")}
        >
          {renderInline(headerText, isUser, isWA)}
        </h3>
      )
    } else if (line.startsWith("## ")) {
      flushList()
      const headerText = line.slice(3)
      elements.push(
        <h2
          key={`h2-${i}`}
          className={cn("text-base font-semibold mt-5 mb-2 first:mt-0", (isUser && !isWA) ? "text-white" : "text-ink")}
        >
          {renderInline(headerText, isUser, isWA)}
        </h2>
      )
    } else if (line.startsWith("# ")) {
      flushList()
      const headerText = line.slice(2)
      elements.push(
        <h1
          key={`h1-${i}`}
          className={cn("text-lg font-medium mt-6 mb-3 first:mt-0", (isUser && !isWA) ? "text-white" : "text-ink")}
        >
          {renderInline(headerText, isUser, isWA)}
        </h1>
      )
    } else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      inList = true
      const cleanLine = line.trim().slice(2)
      listItems.push(
        <li key={`li-${i}`} className={cn("text-sm leading-relaxed", (isUser && !isWA) ? "text-white" : "text-body")}>
          {renderInline(cleanLine, isUser, isWA)}
        </li>
      )
    } else if (line.trim() === "") {
      flushList()
    } else {
      flushList()
      elements.push(
        <p
          key={`p-${i}`}
          className={cn("text-sm leading-relaxed my-1.5 first:mt-0 last:mb-0", (isUser && !isWA) ? "text-white" : "text-body")}
        >
          {renderInline(line, isUser, isWA)}
        </p>
      )
    }
  }

  flushList()
  return elements
}


export function ChatPanel({
  variant,
  suggestions,
}: {
  variant: "web" | "whatsapp"
  suggestions?: string[]
}) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "submitted">("idle")
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, error])

  const busy = status === "submitted"
  const isWA = variant === "whatsapp"

  async function handleSend(textToSend: string) {
    if (!textToSend.trim() || busy) return

    // 1. Optimistically append user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      parts: [{ type: "text", text: textToSend }],
    }
    setMessages((prev) => [...prev, userMsg])
    setStatus("submitted")
    setError(null)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend, conversationId }),
      })

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`)
      }

      const data = await res.json()
      if (data.error) {
        throw new Error(data.error)
      }

      if (data.conversationId) {
        setConversationId(data.conversationId)
      }

      if (data.messages) {
        setMessages(data.messages)
      }

      // Check for reschedule redirect URL in the reply
      if (data.reply) {
        const match = data.reply.match(/\/trips\/([A-Za-z0-9]{6})\?reschedule=true/)
        if (match) {
          setTimeout(() => {
            router.push(match[0])
          }, 1500)
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err)
      setError(err.message || "Failed to connect to the chat assistant.")
    } finally {
      setStatus("idle")
    }
  }

  function submit() {
    if (!input.trim() || busy) return
    handleSend(input)
    setInput("")
  }

  return (
    <div className={cn("flex h-full flex-col", isWA ? "bg-[#efe7dd]" : "bg-white")}>
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {messages.length === 0 && (
            <div
              className={cn(
                "flex flex-col items-center text-center gap-6 rounded-lg p-8",
                isWA
                  ? "bg-white/80"
                  : "border border-hairline bg-card shadow-tier",
              )}
            >
              <Sparkles className="h-10 w-10 text-primary animate-pulse" aria-hidden="true" />
              <div>
                <h2 className="text-[22px] font-medium tracking-tight text-ink">
                  {isWA ? "BlueWings on WhatsApp" : "Hi, I'm Sky"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-body max-w-md">
                  Ask me to find flights, manage a booking, change seats or meals, or answer travel questions.
                </p>
              </div>
              {suggestions && (
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSend(s)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 shadow-sm",
                        isWA
                          ? "border-[#c9beb2] bg-white text-foreground hover:bg-secondary"
                          : "border-hairline bg-white text-ink hover:bg-surface-soft hover:border-ink",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((message, index) => {
            const isLastAssistant = message.role === "assistant" && index === messages.length - 1
            return (
              <div key={message.id} className="flex flex-col gap-2">
                <div className={cn("flex animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out", message.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] px-5 py-3 text-sm leading-relaxed",
                      message.role === "user"
                        ? isWA
                          ? "rounded-2xl rounded-br-md bg-[#d9fdd3] text-foreground"
                          : "rounded-lg rounded-br-xs bg-primary text-white font-medium shadow-[0_2px_8px_rgba(255,56,92,0.12)]"
                        : isWA
                          ? "rounded-2xl rounded-bl-md bg-white text-foreground shadow-sm"
                          : "rounded-lg rounded-bl-xs border border-hairline bg-white text-ink shadow-tier",
                    )}
                  >
                    {message.parts?.map((part, i) => {
                      if (part.type === "text") {
                        return (
                          <div key={i} className="space-y-1">
                            {parseMarkdown(part.text || "", message.role === "user", isWA)}
                          </div>
                        )
                      }
                      if (part.type.startsWith("tool-")) {
                        const toolName = part.type.slice(5)
                        return (
                          <div key={i} className="flex items-center gap-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <Wrench className="h-3.5 w-3.5 animate-pulse text-primary" aria-hidden="true" />
                            {TOOL_LABELS[toolName] ?? toolName}…
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>

                {isLastAssistant && !busy && (
                  <div className="flex flex-wrap gap-2 mt-1.5 justify-start animate-in fade-in slide-in-from-bottom-1 duration-200">
                    {getFollowUpsForText(message.content).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSend(s)}
                        className={cn(
                          "rounded-full border text-xs font-semibold transition-all duration-200 shadow-sm px-3.5 py-1.5",
                          isWA
                            ? "border-[#c9beb2] bg-white text-foreground hover:bg-[#f0f2f5]"
                            : "border-hairline bg-white text-ink hover:bg-surface-soft hover:border-ink"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {busy && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm animate-in fade-in duration-200",
                  isWA
                    ? "rounded-2xl rounded-bl-md bg-white text-muted-foreground shadow-sm"
                    : "rounded-lg rounded-bl-xs border border-hairline bg-white text-muted-foreground shadow-tier",
                )}
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
                <span>Sky is typing…</span>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg rounded-bl-xs border border-destructive/30 bg-destructive/5 px-5 py-3 text-sm leading-relaxed text-destructive animate-in fade-in duration-200">
                {error}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Bottom general suggestions (always visible when there are messages) */}
      {messages.length > 0 && suggestions && !busy && (
        <div className={cn(
          "border-t py-3 px-4 flex flex-wrap gap-2 justify-center animate-in fade-in duration-200",
          isWA
            ? "border-[#d5cabd] bg-[#f0f0f0]"
            : "border-hairline-soft/30 bg-white"
        )}>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSend(s)}
              className={cn(
                "rounded-full border text-xs font-semibold transition-all duration-200 shadow-sm px-3.5 py-1.5",
                isWA
                  ? "border-[#c9beb2] bg-white text-foreground hover:bg-[#e4e4e4]"
                  : "border-hairline bg-white text-ink hover:bg-surface-soft hover:border-ink"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className={cn(isWA ? "border-t border-[#d5cabd] bg-[#f0f0f0] px-4 py-3" : "bg-white py-6 px-4 border-t border-hairline-soft")}>
        <form
          className="mx-auto flex w-full max-w-2xl items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          {isWA ? (
            <>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return
                    e.preventDefault()
                    submit()
                  }
                }}
                placeholder="Message"
                aria-label="Chat message"
                className="flex-1 rounded-full border border-transparent bg-white px-4 py-2.5 text-sm text-foreground outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white bg-[#00a884] hover:bg-[#008f72] transition-colors disabled:opacity-40"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center bg-white border border-hairline rounded-full shadow-tier focus-within:border-ink transition-all p-1.5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return
                    e.preventDefault()
                    submit()
                  }
                }}
                placeholder="Ask Sky anything about your trip…"
                aria-label="Chat message"
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-muted-soft outline-none border-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary hover:bg-primary-active disabled:bg-primary-disabled text-white transition-colors"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

