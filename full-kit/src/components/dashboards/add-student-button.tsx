"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { UserPlus } from "lucide-react"

import type { ComponentProps } from "react"
import type { LocaleType } from "@/types"

import { ensureLocalizedPathname } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function AddStudentButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  const params = useParams()
  const locale = (params?.lang as LocaleType) || "en"

  return (
    <Button
      asChild
      variant="default"
      size="sm"
      className={cn(
        "h-9 gap-x-2 px-3.5 text-xs font-semibold shadow-sm transition-all hover:shadow-md cursor-pointer",
        className
      )}
      {...props}
    >
      <Link href={ensureLocalizedPathname("/pages/students/add", locale)}>
        <UserPlus className="size-4 shrink-0" aria-hidden />
        <span className="text-xs font-semibold">Add Student</span>
      </Link>
    </Button>
  )
}
