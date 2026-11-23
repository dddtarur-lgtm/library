"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { platformService } from "@/services/platform-service"
import { Building2, ChevronLeft } from "lucide-react"

import type { PlatformLibraryRecord } from "@/data/platform/platform-data"

import { Button } from "@/components/ui/button"
import { LibraryEditForm } from "../../_components/library-edit-form"

export default function LibraryEditPage() {
  const params = useParams()
  const lang = (params.lang as string) || "en"
  const id = (params.id as string) || ""

  const [library, setLibrary] = useState<PlatformLibraryRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        setIsLoading(true)
        const payload = await platformService.getLibraryDetail(id)
        if (isMounted && payload) {
          const rawPlanStatus =
            payload.plan_status ||
            payload.planStatus ||
            payload.subscription?.status ||
            "Active"
          const rawLibStatus =
            payload.library_status || payload.libraryStatus || "Active"
          const planFeeVal = Number(
            payload.plan_fee ??
              payload.planFee ??
              payload.subscription?.fee ??
              payload.subscription?.plan?.price ??
              0
          )
          const planEndDateVal =
            payload.plan_end_date ||
            payload.planEndDate ||
            payload.subscription?.end_date ||
            ""

          const mapped: PlatformLibraryRecord = {
            id: String(payload.id || id),
            name: payload.name || "",
            code: payload.code || "",
            logo: payload.logo || "",
            city: payload.city || "",
            state: payload.state || "",
            planStatus: ([
              "Active",
              "Grace",
              "Locked",
              "Expired",
              "Trial",
            ].includes(rawPlanStatus)
              ? rawPlanStatus
              : "Active") as PlatformLibraryRecord["planStatus"],
            libraryStatus: ([
              "Active",
              "Suspended",
              "Locked",
              "Closed",
            ].includes(rawLibStatus)
              ? rawLibStatus
              : "Active") as PlatformLibraryRecord["libraryStatus"],
            planName:
              payload.plan_name ||
              payload.planName ||
              payload.subscription?.plan_name ||
              "",
            planFee: planFeeVal,
            planEndDate: planEndDateVal,
            joinedDate: payload.joined_date || payload.joinedDate || "",
            branchesCount: Number(
              payload.branches_count ??
                payload.branchesCount ??
                payload.branches?.length ??
                1
            ),
            totalSeats: Number(payload.total_seats ?? payload.totalSeats ?? 0),
            liveStudents: Number(
              payload.students_count ??
                payload.live_students ??
                payload.liveStudents ??
                0
            ),
            ownerName:
              payload.owner_name ||
              payload.ownerName ||
              payload.owner_detail?.name ||
              (payload.owner
                ? `${payload.owner.first_name || ""} ${payload.owner.last_name || ""}`.trim()
                : ""),
            ownerEmail:
              payload.owner_email ||
              payload.ownerEmail ||
              payload.contact_email ||
              payload.owner_detail?.email ||
              payload.owner?.email ||
              "",
            ownerPhone:
              payload.owner_phone ||
              payload.ownerPhone ||
              payload.phone ||
              payload.owner_detail?.phone ||
              payload.owner?.phone ||
              "",
            emailConnection: (payload.email_connection_status === "Connected" ||
            payload.emailConnection === "Connected"
              ? "Connected"
              : "Disconnected") as PlatformLibraryRecord["emailConnection"],
          }
          setLibrary(mapped)
        } else if (isMounted) {
          setNotFound(true)
        }
      } catch (err) {
        console.warn("Failed to load library for edit:", err)
        if (isMounted) setNotFound(true)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    if (id) load()
    return () => {
      isMounted = false
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-12 flex flex-col items-center justify-center min-h-[400px]">
        <Building2 className="size-8 text-primary animate-pulse mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">
          Loading library data...
        </p>
      </div>
    )
  }

  if (notFound || !library) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 sm:p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="size-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
          <Building2 className="size-7" />
        </div>
        <h2 className="text-xl font-black text-foreground">
          Library Not Found
        </h2>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-md">
          Unable to find library &ldquo;{id}&rdquo; to edit. It may not exist.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${lang}/platform/libraries`}>
              <ChevronLeft className="size-4 me-1" /> All Libraries
            </Link>
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground font-bold"
            asChild
          >
            <Link href={`/${lang}/platform/libraries/add`}>
              + Onboard Library
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden p-3 sm:p-4">
      <LibraryEditForm library={library} locale={lang} mode="edit" />
    </div>
  )
}
