"use client"

import { useEffect, useState } from "react"
import { libraryService } from "@/services/library-service"
import { invoicesData } from "../_data/invoices"
import type { InvoiceType } from "../types"
import { InvoicesTable } from "./invoices-table"

export function Invoices() {
  const [data, setData] = useState<InvoiceType[]>(invoicesData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true)
        const res = await libraryService.getStudents({ page_size: 50 })
        const list = res.results || (Array.isArray(res) ? (res as any) : [])
        if (list && list.length > 0) {
          setData(
            list.map((s: any) => ({
              id: String(s.id),
              studentId: s.student_id || `STU-${String(s.id).slice(0, 4)}`,
              name: s.full_name || s.name || "Student",
              email: s.email || "student@example.com",
              phone: s.phone || "+91 98765 00000",
              avatar: s.photo_url || "/images/avatar/placeholder.png",
              gender: (s.gender === "FEMALE" ? "Female" : "Male") as any,
              seatNo: s.seat_number || "Unassigned",
              shift: s.shift || "Morning",
              plan: s.plan_name || "Monthly Flexi",
              joinDate: s.joined_date || s.created_at?.slice(0, 10) || "2026-01-01",
              dueDate: s.end_date || "2026-12-31",
              feeStatus: (s.fee_status === "OVERDUE" ? "Overdue" : s.fee_status === "PENDING" ? "Pending" : "Paid") as any,
              status: (s.status === "ACTIVE" ? "Live" : s.status === "EXPIRED" ? "Expired" : s.status === "SUSPENDED" ? "Suspended" : "Pending") as any,
              totalFee: s.total_fee || 1200,
            }))
          )
        }
      } catch {
        // Fallback to initial invoices on network offline
      } finally {
        setLoading(false)
      }
    }
    loadStudents()
  }, [])

  return (
    <article className="col-span-full">
      <InvoicesTable data={data} />
    </article>
  )
}
