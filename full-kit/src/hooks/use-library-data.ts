"use client"

import { useCallback, useEffect, useState } from "react"
import { libraryService, LibraryDashboardStats, StudentRecord, SeatRecord, DaybookEntry } from "@/services/library-service"

export function useLibraryDashboard() {
  const [stats, setStats] = useState<LibraryDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await libraryService.getDashboardStats()
      setStats(data)
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard statistics.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}

export function useStudents(initialParams?: { search?: string; status?: string; branch_id?: string; page?: number }) {
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [params, setParams] = useState(initialParams || {})

  const fetchStudents = useCallback(async (customParams?: typeof params) => {
    try {
      setLoading(true)
      setError(null)
      const res = await libraryService.getStudents(customParams || params)
      setStudents(res.results || [])
      setTotal(res.count || 0)
    } catch (err: any) {
      setError(err?.message || "Failed to load students.")
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return { students, total, loading, error, refetch: fetchStudents, setParams }
}

export function useSeats(branchId?: string) {
  const [seats, setSeats] = useState<SeatRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSeats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await libraryService.getSeats({ branch_id: branchId })
      setSeats(res || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load seats.")
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    fetchSeats()
  }, [fetchSeats])

  return { seats, loading, error, refetch: fetchSeats }
}

export function useDaybook(dateFrom?: string, dateTo?: string) {
  const [entries, setEntries] = useState<DaybookEntry[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [listRes, summaryRes] = await Promise.all([
        libraryService.getDaybookEntries({ date_from: dateFrom, date_to: dateTo }),
        libraryService.getDaybookSummary({ date_from: dateFrom, date_to: dateTo }).catch(() => null),
      ])
      setEntries(listRes.results || [])
      setSummary(summaryRes)
    } catch (err: any) {
      setError(err?.message || "Failed to load daybook entries.")
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { entries, summary, loading, error, refetch: fetchData }
}

