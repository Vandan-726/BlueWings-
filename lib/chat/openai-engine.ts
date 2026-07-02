import { db } from "@/lib/db"
import { conversations, messages, flights, bookings, passengers, escalations } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { searchFlights } from "@/lib/flights"
import { getBookingWithDetails } from "@/lib/bookings"
import { cancelBooking, changeSeat } from "@/lib/servicing"

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_flights",
      description: "Search available flights between an origin and destination for a given date. ALWAYS use this tool to find flight options when the user wants to search, book, or check flight availability.",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string", description: "3-letter airport code of origin, e.g. BOM, DEL, BLR" },
          destination: { type: "string", description: "3-letter airport code of destination, e.g. BOM, DEL, BLR" },
          date: { type: "string", description: "Departure date in YYYY-MM-DD format" }
        },
        required: ["origin", "destination", "date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_my_bookings",
      description: "List the current user's bookings. Only works if the user is logged in.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_booking_details",
      description: "Retrieve booking details for a specific 6-character PNR code. Returns flight schedule, status, passenger details, and passenger IDs.",
      parameters: {
        type: "object",
        properties: {
          pnr: { type: "string", description: "6-character alphanumeric booking PNR code" }
        },
        required: ["pnr"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "change_seat",
      description: "Assign or change a seat for a specific passenger in a booking. Requires the booking ID, passenger ID, and the new seat number (e.g. 12A). Get these IDs by calling get_booking_details first.",
      parameters: {
        type: "object",
        properties: {
          bookingId: { type: "string", description: "The unique booking UUID" },
          passengerId: { type: "integer", description: "The numeric passenger ID" },
          seatNumber: { type: "string", description: "The new seat number, e.g., 14F, 12A" }
        },
        required: ["bookingId", "passengerId", "seatNumber"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancel_booking",
      description: "Cancel a booking using its unique booking ID. Note: You should check booking details first, calculate and display the refund to the user, and ask for their confirmation before calling this tool.",
      parameters: {
        type: "object",
        properties: {
          bookingId: { type: "string", description: "The unique booking UUID to cancel" }
        },
        required: ["bookingId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description: "Escalate the conversation to a human support agent. Use this when the user explicitly requests a human, or if the user has an issue that the AI cannot resolve. You MUST provide a detailed summary of the conversation history for the human agent handoff.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "A concise, detailed summary of the conversation context, the user's issue, and what needs resolution." }
        },
        required: ["reason"]
      }
    }
  }
]

export async function handleOpenAIChatMessage(
  userId: string | null,
  conversationId: string,
  messageText: string
): Promise<string> {
  // 1. Check if OpenAI API Key is present
  if (!process.env.OPENAI_API_KEY) {
    return "⚠️ OpenAI API key is not configured. Please add the OPENAI_API_KEY to your .env.local file to activate the AI travel assistant."
  }

  // 2. Fetch conversation channel & past messages context
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1)
  if (!conv) {
    throw new Error("Conversation not found")
  }

  const pastMsgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(10)

  const history = [...pastMsgs].reverse().map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }))

  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const isoDate = `${year}-${month}-${day}`
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const systemPrompt = `You are Sky, the virtual travel assistant for BlueWings Airlines. You are friendly, professional, and helpful.

Today's current date is ${dateString} (YYYY-MM-DD: ${isoDate}). Always use this date as the reference point to resolve relative date expressions like "today", "tomorrow", "day after tomorrow", "next Monday", etc., to exact YYYY-MM-DD date strings before calling any tools.

Your capabilities:
1. Search flight schedules and prices (always use the search_flights tool).
2. List user's bookings (always use the list_my_bookings tool).
3. Retrieve detailed information for a specific booking using its PNR code (use get_booking_details tool).
4. Assign or change seats for a passenger (use get_booking_details first to locate passenger IDs and booking ID, then call change_seat).
5. Cancel a booking. You must first fetch booking details using get_booking_details to find the departure time and price.
   - Calculate refund: calculate refund percentage based on departure time:
     - > 24 hours: 100% refund
     - 12-24 hours: 50% refund
     - < 12 hours: 0% refund
   - Explain the refund details clearly to the user first, and ask for explicit confirmation (e.g. YES or NO).
   - If they confirm YES, call the cancel_booking tool.
6. Support: answer questions regarding meals (vegetarian, Jain, gluten-free, etc.), baggage policies (7kg cabin, 15kg checked), and web check-in (opens 48h prior, closes 60m prior).
7. Escalation: if the user explicitly asks for a human/agent, or if you encounter an issue you cannot resolve, summarize the conversation context and call the escalate_to_human tool.

Guidelines:
- ALWAYS format flight results in a clear list, showing pricing for all three cabin classes: Economy, Premium, and Business.
- When displaying flight search results, ALWAYS provide direct links to the checkout page in the following format:
  - Economy: /book/{flightId}?cabin=economy&pax=1
  - Premium: /book/{flightId}?cabin=premium&pax=1
  - Business: /book/{flightId}?cabin=business&pax=1
- You must also provide the link to the interactive search page:
  /flights?origin={origin}&destination={destination}&date={date}&travelers=1
- Keep answers concise, clear, and professional.
`

  let apiMessages: any[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: messageText },
  ]

  let loopCount = 0
  const maxLoops = 5

  const isOR = (process.env.OPENAI_API_KEY || "").startsWith("sk-or-")
  const apiUrl = isOR ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions"
  const apiModel = isOR ? "openai/gpt-4o-mini" : "gpt-4o-mini"

  while (loopCount < maxLoops) {
    loopCount++
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...(isOR ? {
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "BlueWings"
        } : {})
      },
      body: JSON.stringify({
        model: apiModel,
        messages: apiMessages,
        tools: TOOLS,
        tool_choice: "auto",
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      throw new Error(`OpenAI API error ${response.status}: ${errBody}`)
    }

    const data = await response.json()
    const choice = data.choices[0]
    const message = choice.message

    // Append response to history for loop continuation
    apiMessages.push(message)

    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        const name = toolCall.function.name
        const args = JSON.parse(toolCall.function.arguments || "{}")
        let output = ""

        try {
          if (name === "search_flights") {
            const results = await searchFlights({
              origin: (args.origin || "").toUpperCase(),
              destination: (args.destination || "").toUpperCase(),
              date: args.date,
            })
            output = JSON.stringify(results)
          } else if (name === "list_my_bookings") {
            if (!userId || userId === "anonymous") {
              output = JSON.stringify({ error: "User is not logged in. Tell the user to log in at /login." })
            } else {
              const rows = await db
                .select({ booking: bookings, flight: flights })
                .from(bookings)
                .leftJoin(flights, eq(bookings.flightId, flights.id))
                .where(eq(bookings.userId, userId))
                .orderBy(desc(bookings.createdAt))
                .limit(10)
              output = JSON.stringify(rows)
            }
          } else if (name === "get_booking_details") {
            const details = await getBookingWithDetails(userId || "anonymous", args.pnr)
            output = JSON.stringify(details || { error: `No booking found for PNR ${args.pnr}` })
          } else if (name === "change_seat") {
            await changeSeat(userId || "anonymous", args.bookingId, args.passengerId, args.seatNumber.toUpperCase())
            output = JSON.stringify({ success: true, message: `Seat successfully changed to ${args.seatNumber.toUpperCase()}` })
          } else if (name === "cancel_booking") {
            await cancelBooking(userId || "anonymous", args.bookingId)
            output = JSON.stringify({ success: true, message: "Booking cancelled successfully." })
          } else if (name === "escalate_to_human") {
            await db.insert(escalations).values({
              userId: userId || "anonymous",
              reason: args.reason || "User requested agent handoff",
              status: "open",
              channel: conv.channel || "web",
            })
            output = JSON.stringify({ success: true, message: "Handoff summary successfully logged. human operations supervisor notified." })
          }
        } catch (err: any) {
          output = JSON.stringify({ error: err.message })
        }

        apiMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: output,
        })
      }
    } else {
      return message.content || ""
    }
  }

  return "I encountered a processing timeout while resolving your request. Please try again."
}

// Unified dispatcher that automatically checks OpenAI API Key availability
export async function handleChat(
  userId: string | null,
  conversationId: string,
  messageText: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return "⚠️ OpenAI API key is not configured. Please add the `OPENAI_API_KEY` to your `.env.local` file to activate the AI travel assistant."
  }
  try {
    return await handleOpenAIChatMessage(userId, conversationId, messageText)
  } catch (err: any) {
    console.error("OpenAI Chat Engine Error:", err.message)
    if (err.message.includes("429")) {
      return "⚠️ OpenAI API Error (429): You have exceeded your current quota or rate limit. Please check your billing and plan details on the OpenAI developer portal."
    }
    return `⚠️ Sorry, I encountered an error while processing your request: ${err.message}`
  }
}
