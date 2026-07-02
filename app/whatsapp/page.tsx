import { ChatPanel } from "@/components/chat/chat-panel"
import Link from "next/link"
import { ArrowLeft, Plane } from "lucide-react"

export const metadata = { title: "WhatsApp Demo – BlueWings" }

export default function WhatsAppPage() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-3 bg-[#008069] px-4 py-3 text-white">
        <Link href="/" aria-label="Back to home" className="rounded-full p-1 transition-colors hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <Plane className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">BlueWings</p>
          <p className="text-xs leading-tight text-white/70">Business account · Simulated demo</p>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <ChatPanel
          variant="whatsapp"
          suggestions={["Find flights DEL to GOI this weekend", "Show my bookings", "Change my seat"]}
        />
      </div>
    </div>
  )
}
