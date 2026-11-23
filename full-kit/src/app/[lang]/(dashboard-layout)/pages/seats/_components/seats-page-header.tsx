"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Armchair,
  Building2,
  ChevronDown,
  GitPullRequest,
  KeyRound,
  LayoutGrid,
  Plus,
  SlidersHorizontal,
} from "lucide-react"

import { initialSeatChangeRequests } from "@/data/seats-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SeatsPageHeaderProps {
  lang: LocaleType
}

export function SeatsPageHeader({ lang }: SeatsPageHeaderProps) {
  const [selectedBranch, setSelectedBranch] = useState("Main Branch - Central Library")

  const pendingRequestsCount = initialSeatChangeRequests.filter(
    (r) => r.status === "Pending"
  ).length

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
      <div>
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Armchair className="size-4.5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Seat & Floor Management
            </h1>
            <p className="text-xs text-muted-foreground">
              Interactive shift-based floor grid, category restrictions & allocation timeline
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls: Branch Switcher & Quick Navigation */}
      <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
        {/* Branch Switcher (PRD §19 & §40) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs border-border bg-card hover:bg-muted/50 rounded-md"
            >
              <Building2 className="size-3.5 text-muted-foreground" />
              <span className="font-medium max-w-[150px] truncate">{selectedBranch}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 text-xs rounded-md">
            <DropdownMenuLabel>Select Branch</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setSelectedBranch("Main Branch - Central Library")}
              className="justify-between"
            >
              <span>Main Branch - Central</span>
              <Badge variant="outline" className="text-[10px] ml-2 rounded-md">
                Main
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSelectedBranch("Branch 2 - West Campus")}
              className="justify-between"
            >
              <span>Branch 2 - West Campus</span>
              <Badge variant="secondary" className="text-[10px] ml-2 rounded-md">
                Branch
              </Badge>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Lockers Button */}
        <Link
          href={ensureLocalizedPathname("/pages/seats/lockers", lang)}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "h-8 text-xs gap-1.5 border-border rounded-md",
          })}
        >
          <KeyRound className="size-3.5 text-muted-foreground" />
          <span>Lockers</span>
        </Link>

        {/* Layout Builder Button */}
        <Link
          href={ensureLocalizedPathname("/pages/seats/builder", lang)}
          className={buttonVariants({
            variant: "default",
            size: "sm",
            className: "h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs rounded-md",
          })}
        >
          <LayoutGrid className="size-3.5" />
          <span>Floor Builder</span>
        </Link>
      </div>
    </div>
  )
}
