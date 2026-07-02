"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

const COLS = ["A", "B", "C", "D", "E", "F"] as const
const ROWS = 30

export type SeatStatus = "available" | "occupied" | "selected"

function cabinForRow(row: number): "business" | "premium" | "economy" {
  if (row <= 2) return "business"
  if (row <= 5) return "premium"
  return "economy"
}

export function SeatMap({
  occupied,
  selected,
  cabin,
  maxSelectable,
  onToggle,
}: {
  occupied: string[]
  selected: string[]
  cabin: "economy" | "premium" | "business"
  maxSelectable: number
  onToggle: (seat: string) => void
}) {
  const occupiedSet = useMemo(() => new Set(occupied), [occupied])
  const selectedSet = useMemo(() => new Set(selected), [selected])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-5 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-[4px] border border-border bg-card" aria-hidden="true" />
          Available
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-[4px] bg-muted" aria-hidden="true" />
          Occupied
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-[4px] bg-primary" aria-hidden="true" />
          Selected
        </span>
      </div>

      <div className="w-full max-w-xs rounded-t-full border border-b-0 border-border pt-10" aria-hidden="true" />

      <div
        className="flex max-h-[420px] w-full max-w-xs flex-col gap-1.5 overflow-y-auto rounded-b-2xl border border-t-0 border-border p-4"
        role="group"
        aria-label="Seat selection map"
      >
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          {COLS.slice(0, 3).map((c) => (
            <span key={c} className="flex h-8 w-8 items-center justify-center">
              {c}
            </span>
          ))}
          <span className="w-6" />
          {COLS.slice(3).map((c) => (
            <span key={c} className="flex h-8 w-8 items-center justify-center">
              {c}
            </span>
          ))}
        </div>

        {Array.from({ length: ROWS }, (_, i) => i + 1).map((row) => {
          const rowCabin = cabinForRow(row)
          const disabledRow = rowCabin !== cabin
          return (
            <div key={row} className="flex items-center justify-center gap-1.5">
              {COLS.map((col, idx) => {
                const seat = `${row}${col}`
                const isOccupied = occupiedSet.has(seat)
                const isSelected = selectedSet.has(seat)
                const atLimit = selected.length >= maxSelectable && !isSelected
                const disabled = isOccupied || disabledRow || atLimit
                return (
                  <div key={seat} className="flex items-center gap-1.5">
                    {idx === 3 && (
                      <span className="flex w-6 items-center justify-center text-[10px] text-muted-foreground">
                        {row}
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onToggle(seat)}
                      aria-label={`Seat ${seat}${isOccupied ? ", occupied" : isSelected ? ", selected" : disabledRow ? `, ${rowCabin} cabin` : ", available"}`}
                      aria-pressed={isSelected}
                      className={cn(
                        "h-8 w-8 rounded-[6px] border text-[10px] font-medium transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : isOccupied
                            ? "cursor-not-allowed border-transparent bg-muted text-transparent"
                            : disabledRow || atLimit
                              ? "cursor-not-allowed border-border bg-card opacity-30"
                              : "border-border bg-card text-muted-foreground hover:border-foreground",
                      )}
                    >
                      {seat}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
