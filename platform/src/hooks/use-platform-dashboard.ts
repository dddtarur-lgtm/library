"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  platformService,
  type ExpiryForecastPoint,
  type LibraryGrowthPoint,
  type PlanDistributionPoint,
  type PlatformRevenuePoint,
  type StudentStatusPoint,
} from "@/services/platform-service"
import type {
  EmailConnectionHealth,
  ExpiringLibraryPlan,
  GraceAndLockedLibrary,
  LibraryRequest,
  PlatformKPIs,
  PlatformPayment,
} from "@/data/platform-admin-data"

import {
  initialEmailConnections,
  initialExpiringPlans,
  initialExpiryForecastData,
  initialGraceAndLocked,
  initialLibraryGrowthData,
  initialPendingRequests,
  initialPlanDistributionData,
  initialPlatformKPIs,
  initialPlatformPayments,
  initialPlatformRevenueData,
  initialStudentStatusData,
} from "@/data/platform-admin-data"

export interface UsePlatformDashboardParams {
  range?: string
  dateFrom?: string
  dateTo?: string
}

export function usePlatformDashboard(params?: UsePlatformDashboardParams) {
  const rangeParam = params?.range || "this-month"
  const dateFrom = params?.dateFrom
  const dateTo = params?.dateTo

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [kpis, setKpis] = useState<PlatformKPIs>(initialPlatformKPIs)
  const [pendingRequests, setPendingRequests] = useState<LibraryRequest[]>(initialPendingRequests)
  const [graceAndLocked, setGraceAndLocked] = useState<GraceAndLockedLibrary[]>(initialGraceAndLocked)
  const [expiringPlans, setExpiringPlans] = useState<ExpiringLibraryPlan[]>(initialExpiringPlans)
  const [recentPayments, setRecentPayments] = useState<PlatformPayment[]>(initialPlatformPayments)
  const [emailHealth, setEmailHealth] = useState<EmailConnectionHealth[]>(initialEmailConnections)

  const [revenueData, setRevenueData] = useState<PlatformRevenuePoint[]>(initialPlatformRevenueData)
  const [growthData, setGrowthData] = useState<LibraryGrowthPoint[]>(initialLibraryGrowthData)
  const [planDistribution, setPlanDistribution] = useState<PlanDistributionPoint[]>(initialPlanDistributionData)
  const [studentStatus, setStudentStatus] = useState<StudentStatusPoint[]>(initialStudentStatusData)
  const [expiryForecast, setExpiryForecast] = useState<ExpiryForecastPoint[]>(initialExpiryForecastData)

  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true)
    setError(null)

    const filterParams = {
      range: rangeParam,
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
    }

    try {
      const [
        kpisRes,
        requestsRes,
        graceRes,
        expiringRes,
        paymentsRes,
        emailRes,
        revenueRes,
        growthRes,
        planDistRes,
        studentRes,
        forecastRes,
      ] = await Promise.allSettled([
        platformService.getDashboardKPIs(filterParams),
        platformService.getPendingRequests(),
        platformService.getGraceAndLocked(),
        platformService.getExpiringPlans(),
        platformService.getRecentPayments(),
        platformService.getEmailHealth(),
        platformService.getRevenueReport(filterParams),
        platformService.getGrowthReport(filterParams),
        platformService.getPlanDistribution(),
        platformService.getStudentStatus(),
        platformService.getExpiryForecast(),
      ])

      const extractList = (res: PromiseSettledResult<any>): any[] | null => {
        if (res.status !== "fulfilled" || !res.value) return null
        const val = res.value
        if (Array.isArray(val)) return val
        if (Array.isArray(val?.data)) return val.data
        if (Array.isArray(val?.results)) return val.results
        return null
      }

      if (kpisRes.status === "fulfilled" && kpisRes.value) {
        const rawKpis: any = kpisRes.value
        const unwrapped = rawKpis?.kpis || rawKpis?.data || rawKpis
        setKpis((prev) => ({ ...prev, ...unwrapped }))
      }

      const reqList = extractList(requestsRes)
      if (reqList) setPendingRequests(reqList)

      const graceList = extractList(graceRes)
      if (graceList) setGraceAndLocked(graceList)

      const expList = extractList(expiringRes)
      if (expList) setExpiringPlans(expList)

      const payList = extractList(paymentsRes)
      if (payList) setRecentPayments(payList)

      const emailList = extractList(emailRes)
      if (emailList) setEmailHealth(emailList)

      const revList = extractList(revenueRes)
      if (revList && revList.length > 0) setRevenueData(revList)

      const growthList = extractList(growthRes)
      if (growthList && growthList.length > 0) setGrowthData(growthList)

      const planList = extractList(planDistRes)
      if (planList && planList.length > 0) setPlanDistribution(planList)

      const stuList = extractList(studentRes)
      if (stuList && stuList.length > 0) setStudentStatus(stuList)

      const forecastList = extractList(forecastRes)
      if (forecastList && forecastList.length > 0) setExpiryForecast(forecastList)
    } catch (err: any) {
      const msg = err?.message || "Failed to fetch live platform dashboard data"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [rangeParam, dateFrom, dateTo])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  return {
    isLoading,
    error,
    refetch: (isSilent = false) => loadDashboardData(isSilent),
    kpis,
    pendingRequests,
    graceAndLocked,
    expiringPlans,
    recentPayments,
    emailHealth,
    revenueData,
    growthData,
    planDistribution,
    studentStatus,
    expiryForecast,
    setPendingRequests,
    setGraceAndLocked,
    setExpiringPlans,
    setRecentPayments,
  }
}

