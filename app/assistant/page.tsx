import { SiteHeader } from "@/components/layout/site-header"
import { ChatPanel } from "@/components/chat/chat-panel"

export const metadata = { title: "Sky Assistant – BlueWings" }

export default function AssistantPage() {
  return (
    <div className="flex h-dvh flex-col">
      <SiteHeader />
      <div className="min-h-0 flex-1">
        <ChatPanel
          variant="web"
          suggestions={[
            "Find flights from DEL to BOM tomorrow",
            "Show my bookings",
            "What is the refund policy?",
            "I want to talk to a human",
          ]}
        />
      </div>
    </div>
  )
}
