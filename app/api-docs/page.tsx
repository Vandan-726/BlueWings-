"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BlueWingsLogo } from "@/components/brand/logo"

export default function ApiDocsPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Dynamically load Redoc script from CDN
    const script = document.createElement("script")
    script.src = "https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [mounted])

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-hairline bg-white px-6 shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/">
            <BlueWingsLogo />
          </Link>
          <span className="h-6 w-px bg-hairline" />
          <span className="text-sm font-semibold tracking-tight text-ink uppercase">Developer API Documentation</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/openapi.json"
            target="_blank"
            className="rounded-full border border-hairline px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-soft hover:border-ink transition-all duration-200"
          >
            Raw OpenAPI JSON
          </Link>
          <Link
            href="/"
            className="rounded-full bg-primary hover:bg-primary-active px-4 py-2 text-xs font-semibold text-white transition-colors duration-200"
          >
            Back to App
          </Link>
        </div>
      </header>

      {/* Redoc Integration */}
      <main className="w-full">
        {mounted ? (
          <div
            dangerouslySetInnerHTML={{
              __html: `
                <redoc 
                  spec-url="/openapi.json" 
                  theme='{
                    "colors": {
                      "primary": {
                        "main": "#FF385C"
                      },
                      "success": {
                        "main": "#00a884"
                      }
                    },
                    "typography": {
                      "fontFamily": "var(--font-cereal), sans-serif",
                      "headings": {
                        "fontFamily": "var(--font-cereal), sans-serif",
                        "fontWeight": "600"
                      }
                    }
                  }'
                ></redoc>
              `
            }}
          />
        ) : (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
      </main>
    </div>
  )
}
