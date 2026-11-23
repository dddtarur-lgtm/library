import type { DictionaryType } from "@/lib/get-dictionary"
import type { ReactNode } from "react"

import { Footer } from "../footer"
import { Sidebar } from "../sidebar"
import { VerticalLayoutHeader } from "./vertical-layout-header"

export function VerticalLayout({
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
        <VerticalLayoutHeader dictionary={dictionary} />
        <main className="min-h-[calc(100svh-6.82rem)] bg-muted/40 w-full min-w-0 flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </>
  )
}
