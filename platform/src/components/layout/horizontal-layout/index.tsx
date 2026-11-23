import type { DictionaryType } from "@/lib/get-dictionary"
import type { ReactNode } from "react"

import { Footer } from "../footer"
import { Sidebar } from "../sidebar"
import { HorizontalLayoutHeader } from "./horizontal-layout-header"

export function HorizontalLayout({
  children,
  dictionary,
}: {
  children: ReactNode
  dictionary: DictionaryType
}) {
  return (
    <>
      <Sidebar dictionary={dictionary} />
      <div className="w-full flex-1 min-w-0 flex flex-col">
        <HorizontalLayoutHeader dictionary={dictionary} />
        <main className="min-h-[calc(100svh-9.85rem)] bg-muted/40 w-full min-w-0 flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </>
  )
}
