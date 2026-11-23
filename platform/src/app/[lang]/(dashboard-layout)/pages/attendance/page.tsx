"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import React, { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Globe,
  History,
  Lock,
  MapPin,
  Maximize2,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Printer,
  QrCode,
  Radio,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  SlidersHorizontal,
  Smartphone,
  Square,
  Timer,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
  Zap,
} from "lucide-react"

import type { LocaleType } from "@/types"

import { cn } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

export default function AttendancePage() {
  const params = useParams()
  const router = useRouter()
  const lang = (params?.lang as LocaleType) || "en"

  // Active Top-level Navigation Tab (Scans to check integrated inside Live list & QR code tab)
  const [activeTab, setActiveTab] = useState<
    "live" | "matrix" | "qr" | "rules"
  >("live")
  const [liveViewMode, setLiveViewMode] = useState<"inside" | "scans">("inside")

  // Live List State with 24 Students & 2-word doorCheck
  const [liveStudents, setLiveStudents] = useState([
    {
      id: "std-101",
      code: "SHR-0101",
      name: "Rohan Sharma",
      avatar: "/images/avatars/male-02.svg",
      seat: "A-04",
      shift: "Fullday",
      inTime: "07:45 AM",
      timeInside: "3h 25m",
      doorCheck: "Door Scan",
      isLocationOk: true,
      phone: "+91 98221 44012",
      status: "Inside",
    },
    {
      id: "std-104",
      code: "SHR-0104",
      name: "Sneha Deshmukh",
      avatar: "/images/avatars/female-01.svg",
      seat: "A-11",
      shift: "Fullday",
      inTime: "08:30 AM",
      timeInside: "2h 40m",
      doorCheck: "Door Scan",
      isLocationOk: true,
      phone: "+91 97234 11209",
      status: "Inside",
    },
    {
      id: "std-107",
      code: "SHR-0107",
      name: "Kunal Jadhav",
      avatar: "/images/avatars/male-01.svg",
      seat: "D-01",
      shift: "24×7",
      inTime: "09:15 AM",
      timeInside: "1h 55m",
      doorCheck: "Door Scan",
      isLocationOk: true,
      phone: "+91 98980 55678",
      status: "Inside",
    },
    {
      id: "std-103",
      code: "SHR-0103",
      name: "Aditya Kulkarni",
      avatar: "/images/avatars/male-01.svg",
      seat: "C-08",
      shift: "Evening",
      inTime: "02:40 PM",
      timeInside: "4h 10m",
      doorCheck: "Manual Entry",
      isLocationOk: true,
      phone: "+91 99042 11234",
      status: "Inside",
    },
    {
      id: "std-102",
      code: "SHR-0102",
      name: "Priya Patel",
      avatar: "/images/avatars/female-02.svg",
      seat: "B-02",
      shift: "Morning",
      inTime: "06:10 AM",
      timeInside: "5h 20m",
      doorCheck: "Door Scan",
      isLocationOk: true,
      phone: "+91 98224 45670",
      status: "Inside",
    },
    {
      id: "std-106",
      code: "SHR-0106",
      name: "Vikram Rathore",
      avatar: "/images/avatars/female-03.svg",
      seat: "C-02",
      shift: "Fullday",
      inTime: "08:15 AM",
      timeInside: "3h 05m",
      doorCheck: "Staff Override",
      isLocationOk: true,
      phone: "+91 98226 77890",
      status: "Inside",
    },
    {
      id: "std-108",
      code: "SHR-0108",
      name: "Ananya Joshi",
      avatar: "/images/avatars/female-01.svg",
      seat: "B-05",
      shift: "Morning",
      inTime: "06:30 AM",
      timeInside: "4h 50m",
      doorCheck: "Door Scan",
      isLocationOk: true,
      phone: "+91 98227 12345",
      status: "Inside",
    },
    {
      id: "std-109",
      code: "SHR-0109",
      name: "Rahul Verma",
      avatar: "/images/avatars/male-02.svg",
      seat: "C-12",
      shift: "Fullday",
      inTime: "08:45 AM",
      timeInside: "2h 35m",
      doorCheck: "Door Scan",
      isLocationOk: true,
      phone: "+91 98228 23456",
      status: "Inside",
    },
    {
      id: "std-110",
      code: "SHR-0110",
      name: "Meera Nair",
      avatar: "/images/avatars/female-02.svg",
      seat: "D-04",
      shift: "Evening",
      inTime: "03:15 PM",
      timeInside: "3h 30m",
      doorCheck: "Door Scan",
      isLocationOk: true,
      phone: "+91 98229 34567",
      status: "Inside",
    },
    {
      id: "std-111",
      code: "SHR-0111",
      name: "Saurabh Shinde",
      avatar: "/images/avatars/male-01.svg",
      seat: "A-09",
      shift: "24×7",
      inTime: "10:00 AM",
      timeInside: "1h 10m",
      doorCheck: "Manual Entry",
      isLocationOk: true,
      phone: "+91 98230 45678",
      status: "Inside",
    },
    {
      id: "std-112",
      code: "SHR-0112",
      name: "Pooja Hegde",
      avatar: "/images/avatars/female-03.svg",
      seat: "B-08",
      shift: "Morning",
      inTime: "06:45 AM",
      timeInside: "4h 35m",
      doorCheck: "Door Scan",
      isLocationOk: true,
      phone: "+91 98231 56789",
      status: "Inside",
    },
    {
      id: "std-113",
      code: "SHR-0113",
      name: "Nikhil Kulkarni",
      avatar: "/images/avatars/male-02.svg",
      seat: "C-15",
      shift: "Fullday",
      inTime: "09:00 AM",
      timeInside: "2h 20m",
      doorCheck: "Door Scan",
      isLocationOk: true,
      phone: "+91 98232 67890",
      status: "Inside",
    },
    {
      id: "std-114",
      code: "SHR-0114",
      name: "Shruti Rao",
      avatar: "/images/avatars/female-01.svg",
      seat: "D-08",
      shift: "Evening",
      inTime: "03:45 PM",
      timeInside: "3h 00m",
      doorCheck: "Door Scan",
      isLocationOk: true,
      phone: "+91 98233 78901",
      status: "Inside",
    },
    {
      id: "std-115",
      code: "SHR-0115",
      name: "Abhishek Mane",
      avatar: "/images/avatars/male-01.svg",
      seat: "A-14",
      shift: "24×7",
      inTime: "07:30 AM",
      timeInside: "3h 50m",
      doorCheck: "Staff Override",
      isLocationOk: true,
      phone: "+91 98234 89012",
      status: "Inside",
    },
    {
      id: "std-116",
      code: "SHR-0116",
      name: "Divya Bhat",
      avatar: "/images/avatars/female-02.svg",
      seat: "B-11",
      shift: "Fullday",
      inTime: "08:20 AM",
      timeInside: "3h 00m",
      doorCheck: "Door Scan",
      isLocationOk: true,
      phone: "+91 98235 90123",
      status: "Inside",
    },
    {
      id: "std-117",
      code: "SHR-0117",
      name: "Gaurav Patil",
      avatar: "/images/avatars/male-02.svg",
      seat: "C-05",
      shift: "Morning",
      inTime: "06:05 AM",
      timeInside: "5h 15m",
      doorCheck: "Door Scan",
      isLocationOk: true,
      phone: "+91 98236 01234",
      status: "Inside",
    },
    {
      id: "std-118",
      code: "SHR-0118",
      name: "Kavita Rathi",
      avatar: "/images/avatars/female-03.svg",
      seat: "D-12",
      shift: "Evening",
      inTime: "02:15 PM",
      timeInside: "4h 30m",
      doorCheck: "Door Scan",
      isLocationOk: true,
      phone: "+91 98237 12345",
      status: "Inside",
    },
    {
      id: "std-119",
      code: "SHR-0119",
      name: "Amit Deshpande",
      avatar: "/images/avatars/male-01.svg",
      seat: "A-02",
      shift: "Fullday",
      inTime: "08:50 AM",
      timeInside: "2h 30m",
      doorCheck: "Manual Entry",
      isLocationOk: true,
      phone: "+91 98238 23456",
      status: "Inside",
    },
  ])

  // Live List Pagination State (Website Pagination Components)
  const [livePage, setLivePage] = useState(1)
  const livePageSize = 8
  const liveTotalPages = Math.max(1, Math.ceil(liveStudents.length / livePageSize))
  const paginatedLiveStudents = liveStudents.slice(
    (livePage - 1) * livePageSize,
    livePage * livePageSize
  )

  // Flagged Scans Queue (2 items matching Image 1 KPI)
  const [flaggedScans, setFlaggedScans] = useState([
    {
      id: "flag-1",
      studentName: "Tanmay More",
      studentId: "std-105",
      seat: "B-03",
      shift: "Morning",
      scanTime: "07:15 AM",
      distance: "140 meters away",
      reason: "Outside 100m permitted perimeter",
      avatar: "/images/avatars/male-02.svg",
      phone: "+91 98251 77123",
    },
    {
      id: "flag-2",
      studentName: "Vikram Rathore",
      studentId: "std-109",
      seat: "C-02",
      shift: "Fullday",
      scanTime: "08:12 AM",
      distance: "320 meters away",
      reason: "Outside 100m permitted perimeter",
      avatar: "/images/avatars/male-01.svg",
      phone: "+91 94280 66341",
    },
  ])

  // Month & Year Picker Popover State
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedMonth, setSelectedMonth] = useState("Oct")

  // Matrix Filter State
  const [matrixSearch, setMatrixSearch] = useState("")
  const [matrixShiftFilter, setMatrixShiftFilter] = useState("All Shifts")
  const [matrixWeek, setMatrixWeek] = useState("Full Month")
  const [weekDropdownOpen, setWeekDropdownOpen] = useState(false)

  // Dynamic weeks calculated specifically according to the selected month & year (Matches user screenshot)
  const dynamicWeeks = useMemo(() => {
    const mIdx = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    }[selectedMonth] ?? 9
    const daysInMonth = new Date(selectedYear, mIdx + 1, 0).getDate()
    const endStr = String(daysInMonth).padStart(2, "0")

    const list = [
      {
        value: "Week 1-2",
        title: "Week 1-2",
        subtitle: "Days 01–14",
        start: 1,
        end: 14,
      },
      {
        value: "Week 2-3",
        title: "Week 2-3",
        subtitle: "Days 08–21",
        start: 8,
        end: 21,
      },
      {
        value: "Week 3-4",
        title: "Week 3-4",
        subtitle: "Days 15–28",
        start: 15,
        end: 28,
      },
    ]

    if (daysInMonth > 28) {
      list.push({
        value: "Week 4-5",
        title: "Week 4-5",
        subtitle: `Days 22–${endStr}`,
        start: 22,
        end: daysInMonth,
      })
    }

    list.push({
      value: "Full Month",
      title: "Full Month",
      subtitle: `Days 01–${endStr}`,
      start: 1,
      end: daysInMonth,
    })

    return list
  }, [selectedYear, selectedMonth])

  // Matrix Pagination State (Website Pagination Components)
  const [matrixPage, setMatrixPage] = useState(1)
  const matrixPageSize = 8

  // Reset matrix page when filter, search, or date scope change
  useEffect(() => {
    setMatrixPage(1)
  }, [matrixSearch, matrixShiftFilter, selectedYear, selectedMonth, matrixWeek])

  // Quick Override Cell Dialog State
  const [editStatusCell, setEditStatusCell] = useState<{
    studentName: string
    studentCode: string
    studentSeat: string
    dayNum: string
    dayName: string
    dayIndex: number
    currentStatus: string
  } | null>(null)

  // Dynamic Month & Weekday mapping
  const MONTH_INDEX_MAP: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  }
  const WEEKDAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

  // Calculate dynamic matrix days according to selected Month, Year, and Week filter
  const matrixDays = useMemo(() => {
    const mIdx = MONTH_INDEX_MAP[selectedMonth] ?? 9
    const daysInMonth = new Date(selectedYear, mIdx + 1, 0).getDate()

    const matched = dynamicWeeks.find((w) => w.value === matrixWeek) || dynamicWeeks[0]
    const startDay = matched ? matched.start : 1
    const endDay = matched ? Math.min(matched.end, daysInMonth) : Math.min(14, daysInMonth)

    const days: Array<{
      num: string
      day: string
      dayNum: number
      isSunday: boolean
    }> = []

    for (let d = startDay; d <= endDay; d++) {
      const dt = new Date(selectedYear, mIdx, d)
      const dayName = WEEKDAY_NAMES[dt.getDay()]
      days.push({
        num: String(d).padStart(2, "0"),
        day: dayName,
        dayNum: d,
        isSunday: dt.getDay() === 0,
      })
    }

    return days
  }, [selectedYear, selectedMonth, matrixWeek, dynamicWeeks])

  // Year View 12 Months Definition
  const yearMonths = [
    { short: "Jan", full: "January" },
    { short: "Feb", full: "February" },
    { short: "Mar", full: "March" },
    { short: "Apr", full: "April" },
    { short: "May", full: "May" },
    { short: "Jun", full: "June" },
    { short: "Jul", full: "July" },
    { short: "Aug", full: "August" },
    { short: "Sep", full: "September" },
    { short: "Oct", full: "October" },
    { short: "Nov", full: "November" },
    { short: "Dec", full: "December" },
  ]

  // Expanded Matrix Students Dataset (20+ students)
  const [matrixStudents, setMatrixStudents] = useState([
    {
      id: "std-101",
      name: "Rohan Sharma",
      code: "SHR-0101",
      seat: "A-04",
      shift: "Full Day",
      avatar: "/images/avatars/male-02.svg",
      profileRate: 96,
      yearRates: [95, 96, 92, 98, 94, 96, 95, 98, 96, 97, 95, 96],
    },
    {
      id: "std-102",
      name: "Priya Patel",
      code: "SHR-0102",
      seat: "B-02",
      shift: "Morning",
      avatar: "/images/avatars/female-02.svg",
      profileRate: 92,
      yearRates: [90, 92, 88, 94, 90, 92, 95, 90, 92, 94, 91, 93],
    },
    {
      id: "std-103",
      name: "Aditya Kulkarni",
      code: "SHR-0103",
      seat: "C-08",
      shift: "Evening",
      avatar: "/images/avatars/male-01.svg",
      profileRate: 90,
      yearRates: [88, 90, 92, 85, 90, 91, 89, 92, 90, 93, 89, 90],
    },
    {
      id: "std-104",
      name: "Sneha Deshmukh",
      code: "SHR-0104",
      seat: "A-11",
      shift: "Full Day",
      avatar: "/images/avatars/female-01.svg",
      profileRate: 94,
      yearRates: [92, 94, 96, 90, 95, 93, 94, 96, 95, 94, 93, 95],
    },
    {
      id: "std-105",
      name: "Tanmay More",
      code: "SHR-0105",
      seat: "No Seat",
      shift: "Morning",
      avatar: "/images/avatars/male-02.svg",
      profileRate: 85,
      yearRates: [82, 85, 80, 88, 84, 86, 85, 89, 83, 85, 86, 84],
    },
    {
      id: "std-106",
      name: "Vikram Rathore",
      code: "SHR-0106",
      seat: "C-02",
      shift: "Full Day",
      avatar: "/images/avatars/female-03.svg",
      profileRate: 88,
      yearRates: [86, 88, 85, 90, 87, 89, 88, 90, 89, 88, 87, 89],
    },
    {
      id: "std-107",
      name: "Kunal Jadhav",
      code: "SHR-0107",
      seat: "D-01",
      shift: "Full Day",
      avatar: "/images/avatars/male-01.svg",
      profileRate: 98,
      yearRates: [98, 97, 98, 99, 97, 98, 99, 98, 97, 98, 99, 98],
    },
    {
      id: "std-108",
      name: "Ananya Joshi",
      code: "SHR-0108",
      seat: "B-05",
      shift: "Morning",
      avatar: "/images/avatars/female-01.svg",
      profileRate: 93,
      yearRates: [91, 93, 94, 92, 95, 93, 92, 94, 93, 95, 92, 94],
    },
    {
      id: "std-109",
      name: "Rahul Verma",
      code: "SHR-0109",
      seat: "C-12",
      shift: "Full Day",
      avatar: "/images/avatars/male-02.svg",
      profileRate: 91,
      yearRates: [90, 91, 89, 93, 91, 92, 90, 93, 92, 91, 90, 92],
    },
    {
      id: "std-110",
      name: "Meera Nair",
      code: "SHR-0110",
      seat: "D-04",
      shift: "Evening",
      avatar: "/images/avatars/female-02.svg",
      profileRate: 89,
      yearRates: [87, 89, 90, 88, 91, 89, 88, 90, 89, 91, 88, 90],
    },
    {
      id: "std-111",
      name: "Saurabh Shinde",
      code: "SHR-0111",
      seat: "A-09",
      shift: "Full Day",
      avatar: "/images/avatars/male-01.svg",
      profileRate: 95,
      yearRates: [94, 95, 93, 96, 94, 95, 96, 95, 94, 96, 95, 96],
    },
    {
      id: "std-112",
      name: "Pooja Hegde",
      code: "SHR-0112",
      seat: "B-08",
      shift: "Morning",
      avatar: "/images/avatars/female-03.svg",
      profileRate: 92,
      yearRates: [90, 92, 91, 93, 92, 94, 91, 93, 92, 93, 91, 92],
    },
    {
      id: "std-113",
      name: "Nikhil Kulkarni",
      code: "SHR-0113",
      seat: "C-15",
      shift: "Evening",
      avatar: "/images/avatars/male-02.svg",
      profileRate: 87,
      yearRates: [85, 87, 86, 88, 87, 89, 86, 88, 87, 88, 86, 87],
    },
    {
      id: "std-114",
      name: "Shruti Rao",
      code: "SHR-0114",
      seat: "D-08",
      shift: "Evening",
      avatar: "/images/avatars/female-01.svg",
      profileRate: 94,
      yearRates: [93, 94, 95, 93, 96, 94, 93, 95, 94, 96, 93, 95],
    },
    {
      id: "std-115",
      name: "Abhishek Mane",
      code: "SHR-0115",
      seat: "A-14",
      shift: "Full Day",
      avatar: "/images/avatars/male-01.svg",
      profileRate: 96,
      yearRates: [95, 96, 97, 95, 97, 96, 95, 97, 96, 97, 95, 96],
    },
    {
      id: "std-116",
      name: "Divya Bhat",
      code: "SHR-0116",
      seat: "B-11",
      shift: "Full Day",
      avatar: "/images/avatars/female-02.svg",
      profileRate: 90,
      yearRates: [88, 90, 89, 91, 90, 92, 89, 91, 90, 91, 89, 90],
    },
    {
      id: "std-117",
      name: "Gaurav Patil",
      code: "SHR-0117",
      seat: "C-05",
      shift: "Morning",
      avatar: "/images/avatars/male-02.svg",
      profileRate: 93,
      yearRates: [91, 93, 92, 94, 93, 95, 92, 94, 93, 94, 92, 93],
    },
    {
      id: "std-118",
      name: "Kavita Rathi",
      code: "SHR-0118",
      seat: "D-12",
      shift: "Evening",
      avatar: "/images/avatars/female-03.svg",
      profileRate: 86,
      yearRates: [84, 86, 85, 87, 86, 88, 85, 87, 86, 87, 85, 86],
    },
    {
      id: "std-119",
      name: "Amit Deshpande",
      code: "SHR-0119",
      seat: "A-02",
      shift: "Full Day",
      avatar: "/images/avatars/male-01.svg",
      profileRate: 95,
      yearRates: [94, 95, 96, 94, 96, 95, 94, 96, 95, 97, 94, 96],
    },
  ])

  // Custom Day Status Overrides: key [stdId]-[year]-[month]-[dayNum] -> "P" | "L" | "AB" | "HD" | "SUN"
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({})

  // Branch Holiday History & Schedule Modal State
  const [holidayModalOpen, setHolidayModalOpen] = useState(false)
  // Active tab defaults to "declare" (user requested: second tab make first)
  const [holidayTab, setHolidayTab] = useState<"declare" | "history" | "weekly">("declare")
  const [holidayFilter, setHolidayFilter] = useState<"all" | "upcoming" | "past">("all")

  // Interactive Date Picker state for holiday modal
  const [holidayDate, setHolidayDate] = useState<Date | undefined>(new Date(2026, 9, 24)) // 24 Oct 2026
  const [holidayDatePickerOpen, setHolidayDatePickerOpen] = useState(false)

  const [holidays, setHolidays] = useState([
    {
      id: "h-1",
      month: "JAN",
      day: "26",
      title: "Republic Day",
      category: "NATIONAL",
      status: "Passed",
      dateStr: "Mon, 2026-01-26 • All Campuses (HQ & FC Road)",
    },
    {
      id: "h-2",
      month: "AUG",
      day: "15",
      title: "Independence Day",
      category: "NATIONAL",
      status: "Passed",
      dateStr: "Sat, 2026-08-15 • All Campuses",
    },
    {
      id: "h-3",
      month: "OCT",
      day: "02",
      title: "Gandhi Jayanti",
      category: "NATIONAL",
      status: "Passed",
      dateStr: "Fri, 2026-10-02 • All Campuses",
    },
    {
      id: "h-4",
      month: "OCT",
      day: "20",
      title: "Diwali Laxmi Pujan",
      category: "FESTIVAL",
      status: "Passed",
      dateStr: "Tue, 2026-10-20 • Kothrud Main Campus (HQ)",
    },
    {
      id: "h-5",
      month: "OCT",
      day: "24",
      title: "Diwali Balipratipada",
      category: "FESTIVAL",
      status: "Upcoming",
      dateStr: "Sat, 2026-10-24 • All Campuses",
    },
    {
      id: "h-6",
      month: "NOV",
      day: "15",
      title: "Guru Nanak Jayanti",
      category: "NATIONAL",
      status: "Upcoming",
      dateStr: "Sun, 2026-11-15 • All Campuses",
    },
  ])

  // New Holiday Form State with demo rich values
  const [newHolidayTitle, setNewHolidayTitle] = useState("Diwali Padwa Campus Closure")
  const [newHolidayCategory, setNewHolidayCategory] = useState("Festival Break (Cultural & Religious Campus Celebration)")
  const [newHolidayBranches, setNewHolidayBranches] = useState("All Campuses (Kothrud HQ + FC Road + Viman Nagar Hub - 355 Desks)")
  const [newHolidayShifts, setNewHolidayShifts] = useState("All Shifts (Full Day 24×7, Morning, Evening, Night)")

  // Student directory with avatars matching the website design
  const manualStudentList = [
    {
      id: "std-103",
      code: "SHR-0103",
      name: "Aditya Kulkarni",
      avatar: "/images/avatars/male-01.svg",
      seat: "Seat C-08",
      shift: "Evening Shift (04:00 PM - 10:00 PM)",
      status: "Expected Today",
      statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      biometricId: "BIO-8842",
      attendanceRate: "94% (21/23 days)",
      guardian: "Ramesh Kulkarni • +91 98220 14890",
    },
    {
      id: "std-101",
      code: "SHR-0101",
      name: "Rohan Sharma",
      avatar: "/images/avatars/male-02.svg",
      seat: "Seat A-04",
      shift: "Full Day (24×7 Reading Hall)",
      status: "Inside Now",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      biometricId: "BIO-8820",
      attendanceRate: "98% (23/23 days)",
      guardian: "Sunil Sharma • +91 98220 54120",
    },
    {
      id: "std-104",
      code: "SHR-0104",
      name: "Sneha Deshmukh",
      avatar: "/images/avatars/female-01.svg",
      seat: "Seat A-11",
      shift: "Full Day (24×7 Reading Hall)",
      status: "Inside Now",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      biometricId: "BIO-8891",
      attendanceRate: "91% (20/23 days)",
      guardian: "Anil Deshmukh • +91 98221 89730",
    },
    {
      id: "std-107",
      code: "SHR-0107",
      name: "Kunal Jadhav",
      avatar: "/images/avatars/male-01.svg",
      seat: "Seat D-01",
      shift: "24×7 Pro Study Room",
      status: "Inside Now",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      biometricId: "BIO-8905",
      attendanceRate: "96% (22/23 days)",
      guardian: "Sanjay Jadhav • +91 98223 33140",
    },
    {
      id: "std-102",
      code: "SHR-0102",
      name: "Priya Patel",
      avatar: "/images/avatars/female-02.svg",
      seat: "Seat B-02",
      shift: "Morning Shift (06:00 AM - 12:00 PM)",
      status: "Shift Over",
      statusColor: "text-neutral-400 bg-neutral-500/10 border-neutral-500/30",
      biometricId: "BIO-8815",
      attendanceRate: "88% (19/23 days)",
      guardian: "Dinesh Patel • +91 98224 45670",
    },
    {
      id: "std-105",
      code: "SHR-0105",
      name: "Tanmay More",
      avatar: "/images/avatars/male-02.svg",
      seat: "No Seat (Locker Access)",
      shift: "Full Day (Standard Access)",
      status: "Absent Today",
      statusColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      biometricId: "BIO-8930",
      attendanceRate: "72% (16/23 days)",
      guardian: "Prakash More • +91 98225 11230",
    },
    {
      id: "std-106",
      code: "SHR-0106",
      name: "Vikram Rathore",
      avatar: "/images/avatars/female-03.svg",
      seat: "Seat C-02",
      shift: "Full Day (24×7 Desk)",
      status: "Expected Today",
      statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      biometricId: "BIO-8854",
      attendanceRate: "85% (18/23 days)",
      guardian: "Mahendra Rathore • +91 98226 77890",
    },
  ]

  // Manual Attendance Entry Modal State
  const [markAttendanceModalOpen, setMarkAttendanceModalOpen] = useState(false)
  const [manualSelectedStudentId, setManualSelectedStudentId] = useState("std-103")
  const [manualDateTime, setManualDateTime] = useState<Date | undefined>(new Date(2026, 9, 29, 8, 30))
  const [manualDate, setManualDate] = useState<Date | undefined>(new Date(2026, 9, 29)) // 29 Oct 2026
  const [manualDatePickerOpen, setManualDatePickerOpen] = useState(false)
  const [manualInTime, setManualInTime] = useState("08:30 AM")
  const [manualStatus, setManualStatus] = useState<"Present" | "Late" | "Half Day">("Present")
  const [manualGate, setManualGate] = useState("Kothrud Main Turnstile (Gate A)")
  const [manualReason, setManualReason] = useState("Indoor GPS glitch on mobile")

  // Print Poster Modal State
  const [printPosterModalOpen, setPrintPosterModalOpen] = useState(false)

  // ============================================================
  // Task 2 State: Day Off Checklist & Weekly Schedule Builder
  // ============================================================
  const [dayOffWeekdays, setDayOffWeekdays] = useState<number[]>([0]) // 0: Sunday, 6: Saturday
  const [dayOffWeeks, setDayOffWeeks] = useState<number[]>([1, 2, 3, 4, 5]) // Weeks 1-5 of month
  const [dayOffBranch, setDayOffBranch] = useState("All Campuses (Kothrud HQ + FC Road)")
  const [dayOffApplySuccess, setDayOffApplySuccess] = useState(false)

  // Calculate matching off days in October 2026 based on admin's checklist
  const calculatedOffDays = useMemo(() => {
    const daysInMonth = 31 // October 2026
    const list: { dayNum: number; weekdayName: string; weekNum: number; dateFormatted: string }[] = []
    const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(2026, 9, day) // October 2026
      const dayOfWeek = d.getDay()
      const weekNum = Math.ceil(day / 7)

      if (dayOffWeekdays.includes(dayOfWeek) && dayOffWeeks.includes(weekNum)) {
        list.push({
          dayNum: day,
          weekdayName: weekdayLabels[dayOfWeek],
          weekNum,
          dateFormatted: `${weekdayLabels[dayOfWeek]}, ${day.toString().padStart(2, "0")} Oct 2026`,
        })
      }
    }
    return list
  }, [dayOffWeekdays, dayOffWeeks])

  // Apply Day-Off Schedule to Matrix
  const handleApplyDayOffSchedule = () => {
    setDayOffApplySuccess(true)
    setTimeout(() => setDayOffApplySuccess(false), 3000)
  }

  // ============================================================
  // Task 3 State: Attendance Rules Full CRUD
  // ============================================================
  interface AttendanceRuleItem {
    id: string
    name: string
    category: "Punctuality" | "Geofence" | "Auto-Action" | "Warning" | "Policy"
    value: string
    appliedTo: string
    description: string
    enabled: boolean
  }

  const [rulesList, setRulesList] = useState<AttendanceRuleItem[]>([
    {
      id: "rule-1",
      name: "Late Arrival Grace Window",
      category: "Punctuality",
      value: "15 Minutes",
      appliedTo: "All Shifts",
      description: "Mark student arrival as 'Late' if checked in after this grace period from shift start time.",
      enabled: true,
    },
    {
      id: "rule-2",
      name: "Auto-Checkout Execution",
      category: "Auto-Action",
      value: "23:59 PM",
      appliedTo: "All Desks",
      description: "Automatically clocks out un-swiped active student sessions before midnight daily.",
      enabled: true,
    },
    {
      id: "rule-3",
      name: "Consecutive Absence Warning",
      category: "Warning",
      value: "7 Days",
      appliedTo: "Reserved Seats",
      description: "Alerts library administration of potential abandoned seat reservation for reallocation.",
      enabled: true,
    },
    {
      id: "rule-4",
      name: "Permitted QR Radius",
      category: "Geofence",
      value: "100 Meters",
      appliedTo: "Mobile Kiosk",
      description: "GPS geofence radius calculated from branch central coordinates for valid mobile camera check-in.",
      enabled: true,
    },
    {
      id: "rule-5",
      name: "TOTP Salt Rotation Cadence",
      category: "Geofence",
      value: "15 Seconds",
      appliedTo: "All Kiosks",
      description: "Kiosk QR cryptographic salt rotation cadence to eliminate photo or screenshot sharing over chat.",
      enabled: true,
    },
    {
      id: "rule-6",
      name: "Sunday Attendance Status",
      category: "Policy",
      value: "Auto-Applied Off",
      appliedTo: "All Campuses",
      description: "Marked automatically as Sunday off in monthly register without absence penalties.",
      enabled: true,
    },
    {
      id: "rule-7",
      name: "Minimum Hours for Full Day",
      category: "Punctuality",
      value: "6.0 Hours",
      appliedTo: "Full Day Shift",
      description: "Minimum recorded continuous session time required to qualify for full-day attendance credit.",
      enabled: true,
    },
    {
      id: "rule-8",
      name: "Half-Day Session Threshold",
      category: "Punctuality",
      value: "3.5 Hours",
      appliedTo: "All Students",
      description: "Attendance sessions between 3.5h and 6h credited as valid half-day attendance.",
      enabled: false,
    },
  ])

  const [ruleSearchQuery, setRuleSearchQuery] = useState("")
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState("all")
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AttendanceRuleItem | null>(null)
  const [ruleFormName, setRuleFormName] = useState("")
  const [ruleFormCategory, setRuleFormCategory] = useState<AttendanceRuleItem["category"]>("Punctuality")
  const [ruleFormValue, setRuleFormValue] = useState("")
  const [ruleFormAppliedTo, setRuleFormAppliedTo] = useState("All Shifts")
  const [ruleFormDescription, setRuleFormDescription] = useState("")
  const [ruleFormEnabled, setRuleFormEnabled] = useState(true)

  const handleOpenAddRule = () => {
    setEditingRule(null)
    setRuleFormName("")
    setRuleFormCategory("Punctuality")
    setRuleFormValue("15 Minutes")
    setRuleFormAppliedTo("All Shifts")
    setRuleFormDescription("")
    setRuleFormEnabled(true)
    setIsRuleModalOpen(true)
  }

  const handleOpenEditRule = (rule: AttendanceRuleItem) => {
    setEditingRule(rule)
    setRuleFormName(rule.name)
    setRuleFormCategory(rule.category)
    setRuleFormValue(rule.value)
    setRuleFormAppliedTo(rule.appliedTo)
    setRuleFormDescription(rule.description)
    setRuleFormEnabled(rule.enabled)
    setIsRuleModalOpen(true)
  }

  const handleSaveRule = () => {
    if (!ruleFormName.trim() || !ruleFormValue.trim()) return
    if (editingRule) {
      setRulesList((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? {
              ...r,
              name: ruleFormName,
              category: ruleFormCategory,
              value: ruleFormValue,
              appliedTo: ruleFormAppliedTo,
              description: ruleFormDescription,
              enabled: ruleFormEnabled,
            }
            : r
        )
      )
    } else {
      const newRule: AttendanceRuleItem = {
        id: `rule-${Date.now()}`,
        name: ruleFormName,
        category: ruleFormCategory,
        value: ruleFormValue,
        appliedTo: ruleFormAppliedTo,
        description: ruleFormDescription,
        enabled: ruleFormEnabled,
      }
      setRulesList((prev) => [newRule, ...prev])
    }
    setIsRuleModalOpen(false)
  }

  const handleDeleteRule = (id: string) => {
    setRulesList((prev) => prev.filter((r) => r.id !== id))
  }

  const handleToggleRule = (id: string) => {
    setRulesList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    )
  }

  // ============================================================
  // Task 4 State: QR Code Tab Interactive Features & Live Scans
  // ============================================================
  // Task 4 State: QR Code Tab Custom Duration in Days (min 1d, max 30d / 1 month)
  const [qrDurationDays, setQrDurationDays] = useState(15) // default 15 days
  const [qrCustomDaysInput, setQrCustomDaysInput] = useState("15")
  const [qrRemainingSec, setQrRemainingSec] = useState(15 * 86400) // seconds remaining
  const [autoRegenerate, setAutoRegenerate] = useState(true)
  const [qrRadius, setQrRadius] = useState(100) // 100 meters
  const [qrSessionId, setQrSessionId] = useState("KTH-2026-X948")
  const [qrScansFilter, setQrScansFilter] = useState<"all" | "verified" | "flagged">("all")
  const [qrScanPage, setQrScanPage] = useState(1)
  const qrScanPageSize = 5
  const [qrIsRegenerating, setQrIsRegenerating] = useState(false)

  // Real-time Student Scans against this QR Session
  const [qrScans, setQrScans] = useState([
    {
      id: "scn-1",
      studentName: "Rohan Sharma",
      studentCode: "SHR-0101",
      avatar: "/images/avatars/male-02.svg",
      seat: "A-04",
      scanTime: "08:24 AM",
      distance: 14,
      device: "iPhone 15 • Safari",
    },
    {
      id: "scn-2",
      studentName: "Priya Patel",
      studentCode: "SHR-0102",
      avatar: "/images/avatars/female-02.svg",
      seat: "B-02",
      scanTime: "08:28 AM",
      distance: 38,
      device: "Pixel 8 • Chrome",
    },
    {
      id: "scn-3",
      studentName: "Aditya Kulkarni",
      studentCode: "SHR-0103",
      avatar: "/images/avatars/male-01.svg",
      seat: "C-08",
      scanTime: "08:31 AM",
      distance: 142,
      device: "Samsung S23 • Chrome",
    },
    {
      id: "scn-4",
      studentName: "Sneha Deshmukh",
      studentCode: "SHR-0104",
      avatar: "/images/avatars/female-01.svg",
      seat: "A-11",
      scanTime: "08:42 AM",
      distance: 8,
      device: "OnePlus 12 • Chrome",
    },
    {
      id: "scn-5",
      studentName: "Vikram Malhotra",
      studentCode: "SHR-0105",
      avatar: "/images/avatars/male-03.svg",
      seat: "D-01",
      scanTime: "08:55 AM",
      distance: 215,
      device: "iPhone 14 • Chrome",
    },
    {
      id: "scn-6",
      studentName: "Ananya Joshi",
      studentCode: "SHR-0106",
      avatar: "/images/avatars/female-02.svg",
      seat: "B-06",
      scanTime: "09:05 AM",
      distance: 22,
      device: "Pixel 7 • Chrome",
    },
  ])

  // QR Session countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setQrRemainingSec((prev) => {
        if (prev <= 1) {
          if (autoRegenerate) {
            setQrSessionId(`KTH-2026-X${Math.floor(100 + Math.random() * 900)}`)
            return qrDurationDays * 86400
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [autoRegenerate, qrDurationDays])

  // Generate New QR Button Action
  const handleGenerateNewQR = () => {
    setQrIsRegenerating(true)
    setQrSessionId(`KTH-2026-X${Math.floor(100 + Math.random() * 900)}`)
    setQrRemainingSec(qrDurationDays * 86400)
    setTimeout(() => setQrIsRegenerating(false), 500)
  }

  // Change QR duration handler (clamped between 1 day min and 30 days max)
  const handleChangeQrDurationDays = (days: number) => {
    const clamped = Math.max(1, Math.min(30, days))
    setQrDurationDays(clamped)
    setQrCustomDaysInput(String(clamped))
    setQrRemainingSec(clamped * 86400)
  }

  // Format countdown string: e.g. 14d 23h 59m 45s
  const formatDayCountdown = (sec: number) => {
    const days = Math.floor(sec / 86400)
    const hours = Math.floor((sec % 86400) / 3600)
    const minutes = Math.floor((sec % 3600) / 60)
    const seconds = sec % 60
    if (days > 0) {
      return `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
    }
    return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}s`
  }

  // QR Code Dynamic TOTP countdown
  const [qrCountdown, setQrCountdown] = useState(14)

  // Check out student action
  const handleCheckOut = (studentId: string) => {
    setLiveStudents((prev) => prev.filter((s) => s.id !== studentId))
  }

  // Approve / Dismiss flagged scan
  const handleResolveFlaggedScan = (scanId: string, approve: boolean) => {
    const item = flaggedScans.find((s) => s.id === scanId)
    setFlaggedScans((prev) => prev.filter((s) => s.id !== scanId))
    if (approve && item) {
      setLiveStudents((prev) => [
        ...prev,
        {
          id: item.studentId,
          code: "SHR-0105",
          name: item.studentName,
          avatar: item.avatar,
          seat: item.seat,
          shift: item.shift,
          inTime: item.scanTime,
          timeInside: "Just now",
          doorCheck: "Staff Override",
          isLocationOk: true,
          phone: item.phone,
          status: "Inside",
        },
      ])
    }
  }

  // Declare new holiday action using selected Date object & demo dropdown information
  const handleDeclareHoliday = () => {
    if (!newHolidayTitle.trim()) return
    const dateObj = holidayDate || new Date(2026, 9, 24)
    const day = String(dateObj.getDate()).padStart(2, "0")
    const month = dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
    const dateStr = dateObj.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })

    const newHol = {
      id: `h-${Date.now()}`,
      month: month,
      day: day,
      title: newHolidayTitle,
      category: newHolidayCategory.toUpperCase().includes("FESTIVAL") ? "FESTIVAL" : "NATIONAL",
      status: "Upcoming",
      dateStr: `${dateStr} • ${newHolidayBranches.split(" (")[0]}`,
    }
    setHolidays([newHol, ...holidays])
    setNewHolidayTitle("")
    setHolidayTab("history")
  }

  // Manual Attendance Confirm Action using rich student & date picker state
  const handleManualAttendanceConfirm = () => {
    const chosenStudent = manualStudentList.find((s) => s.id === manualSelectedStudentId) || manualStudentList[0]

    const existingIndex = liveStudents.findIndex(
      (s) => s.name.toLowerCase() === chosenStudent.name.toLowerCase()
    )

    if (existingIndex >= 0) {
      const updated = [...liveStudents]
      updated[existingIndex] = {
        ...updated[existingIndex],
        inTime: manualDateTime ? manualDateTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "08:30 AM",
        doorCheck: "Manual Entry",
      }
      setLiveStudents(updated)
    } else {
      const newStudent = {
        id: chosenStudent.id,
        code: chosenStudent.code,
        name: chosenStudent.name,
        avatar: chosenStudent.avatar,
        seat: chosenStudent.seat.replace("Seat ", ""),
        shift: chosenStudent.shift,
        inTime: manualDateTime ? manualDateTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "08:30 AM",
        timeInside: "Just now",
        doorCheck: "Manual Entry",
        isLocationOk: true,
        phone: "+91 99042 11234",
        status: "Inside",
      }
      setLiveStudents([newStudent, ...liveStudents])
    }
    setMarkAttendanceModalOpen(false)
  }

  // Helper to get status of a student for a given day in the selected month & year
  const getDayStatus = (std: (typeof matrixStudents)[0], dayNum: number, isSunday: boolean) => {
    // 1. Check override
    const key = `${std.code}-${selectedYear}-${selectedMonth}-${dayNum}`
    if (statusOverrides[key]) {
      return statusOverrides[key]
    }
    // 2. Sunday is automatically SUN
    if (isSunday) return "SUN"
    // 3. Check declared holiday
    const dayStr = String(dayNum).padStart(2, "0")
    const isHoliday = holidays.some((h) => h.month === selectedMonth.toUpperCase() && h.day === dayStr)
    if (isHoliday) return "HD"
    // 4. Deterministic status from student profile
    const seed = (std.name.charCodeAt(0) + dayNum * 7 + (MONTH_INDEX_MAP[selectedMonth] ?? 0)) % 100
    if (std.profileRate >= 95) {
      if (seed < 88) return "P"
      if (seed < 95) return "L"
      return "AB"
    } else if (std.profileRate >= 90) {
      if (seed < 80) return "P"
      if (seed < 90) return "L"
      return "AB"
    } else {
      if (seed < 70) return "P"
      if (seed < 85) return "L"
      return "AB"
    }
  }

  // Quick Status Override Handler (strictly WITHOUT Holiday option)
  const handleOverrideStatus = (newStatus: "P" | "L" | "AB") => {
    if (!editStatusCell) return
    const key = `${editStatusCell.studentCode}-${selectedYear}-${selectedMonth}-${parseInt(editStatusCell.dayNum, 10)}`
    setStatusOverrides((prev) => ({
      ...prev,
      [key]: newStatus,
    }))
    setEditStatusCell(null)
  }

  // Filtered Matrix based on search and shift
  const filteredMatrix = matrixStudents.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(matrixSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(matrixSearch.toLowerCase()) ||
      s.seat.toLowerCase().includes(matrixSearch.toLowerCase())
    const matchesShift =
      matrixShiftFilter === "All Shifts" || s.shift === matrixShiftFilter
    return matchesSearch && matchesShift
  })

  const matrixTotalPages = Math.max(1, Math.ceil(filteredMatrix.length / matrixPageSize))
  const paginatedMatrixStudents = filteredMatrix.slice(
    (matrixPage - 1) * matrixPageSize,
    matrixPage * matrixPageSize
  )

  // Filtered Holidays based on all/upcoming/past
  const filteredHolidays = holidays.filter((h) => {
    if (holidayFilter === "upcoming") return h.status === "Upcoming"
    if (holidayFilter === "past") return h.status === "Passed"
    return true
  })

  const upcomingCount = holidays.filter((h) => h.status === "Upcoming").length
  const pastCount = holidays.filter((h) => h.status === "Passed").length

  return (
    <TooltipProvider delayDuration={150}>
      <div className="w-full space-y-6 p-4 sm:p-6 text-foreground">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Attendance
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Who is at the library today • Thu 29 Oct 2026 • Kothrud Campus (HQ)
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-border bg-card hover:bg-muted text-xs font-medium cursor-pointer"
              onClick={() => setPrintPosterModalOpen(true)}
            >
              <Printer className="size-4 text-muted-foreground" />
              Print poster
            </Button>

            <Button
              size="sm"
              className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 rounded-lg shadow-xs cursor-pointer"
              onClick={() => setMarkAttendanceModalOpen(true)}
            >
              <UserCheck className="size-4" />
              Mark attendance
            </Button>
          </div>
        </div>

        {/* 4 KPI Stat Cards matching website theme & reduced height */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Inside now */}
          <div className="rounded-lg border border-border bg-card p-3.5 shadow-xs flex flex-col justify-between min-h-[92px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Inside now
              </span>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-card-foreground">
                {liveStudents.length}
              </span>
              <span className="text-xs font-medium text-emerald-400">
                studying right now
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Check-ins running smoothly
            </p>
          </div>

          {/* Card 2: Came today */}
          <div className="rounded-lg border border-border bg-card p-3.5 shadow-xs flex flex-col justify-between min-h-[92px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Came today
              </span>
              <span className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-md font-medium">
                Present
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-card-foreground">5</span>
              <span className="text-xs font-normal text-muted-foreground">
                of 6 expected
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              1 student absent today
            </p>
          </div>

          {/* Card 3: Late arrivals */}
          <div className="rounded-lg border border-border bg-card p-3.5 shadow-xs flex flex-col justify-between min-h-[92px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Late arrivals
              </span>
              <span className="border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded-md font-medium">
                Shift 1
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-500">2</span>
              <span className="text-xs font-medium text-amber-400">
                &gt;15 mins late
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Shift starts at 7:00 AM
            </p>
          </div>

          {/* Card 4: Scans to check (Cyan Border) */}
          <div className="rounded-lg border border-cyan-500/40 bg-card p-3.5 shadow-xs flex flex-col justify-between min-h-[92px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-cyan-400">
                Scans to check
              </span>
              <span className="border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 text-[10px] px-2 py-0.5 rounded-md font-medium">
                Needs Review
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-cyan-400">
                {flaggedScans.length}
              </span>
              <span className="text-xs font-medium text-cyan-400">
                outside radius
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab("live")
                setLiveViewMode("scans")
              }}
              className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:underline cursor-pointer"
            >
              <span>Review scans</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Tabs (Scans to check integrated inside Live & QR code tabs) */}
        <div className="w-full overflow-x-auto pb-1 scrollbar-none">
          <nav
            aria-label="Attendance navigation tabs"
            className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-card/70 border border-border backdrop-blur-md shadow-xs"
          >
            {[
              {
                id: "live" as const,
                label: "Today (Live list)",
                icon: Clock,
                badge: flaggedScans.length > 0 ? `${flaggedScans.length} to check` : undefined,
              },
              { id: "matrix" as const, label: "Month view (Register)", icon: Calendar },
              { id: "qr" as const, label: "QR code for attendance", icon: QrCode },
              { id: "rules" as const, label: "Attendance rules", icon: SlidersHorizontal },
            ].map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium cursor-pointer select-none whitespace-nowrap transition-all duration-200 ease-out",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold scale-[1.01]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0 transition-transform duration-200",
                      isActive ? "scale-105" : ""
                    )}
                  />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={cn(
                        "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold transition-colors",
                        isActive
                          ? "bg-primary-foreground text-primary shadow-xs"
                          : "bg-destructive text-destructive-foreground animate-pulse"
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Contents with Animated Transition */}
        <div
          key={activeTab}
          className="w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out fill-mode-forwards"
        >
          {/* ============================================================ */}
          {/* TAB 1: Today (Live list) + Flagged Scans Options             */}
          {/* ============================================================ */}
          {activeTab === "live" && (
            <Card className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
              {/* Option Selector: Active Inside Now vs Scans to Check (Integrated per user request) */}
              <div className="p-3.5 px-4 sm:px-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
                <div className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-card border border-border shadow-xs">
                  <button
                    type="button"
                    onClick={() => setLiveViewMode("inside")}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-all",
                      liveViewMode === "inside"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Users className="size-3.5" />
                    <span>Active Inside Now</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                        liveViewMode === "inside" ? "bg-primary-foreground text-primary" : "bg-muted text-foreground"
                      )}
                    >
                      {liveStudents.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLiveViewMode("scans")}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-all",
                      liveViewMode === "scans"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <AlertTriangle className={cn("size-3.5", liveViewMode === "scans" ? "text-primary-foreground" : "text-amber-500")} />
                    <span>Scans to Check</span>
                    {flaggedScans.length > 0 && (
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                          liveViewMode === "scans" ? "bg-primary-foreground text-primary" : "bg-destructive text-destructive-foreground animate-pulse"
                        )}
                      >
                        {flaggedScans.length}
                      </span>
                    )}
                  </button>
                </div>

                <div className="text-xs text-muted-foreground">
                  {liveViewMode === "inside" ? (
                    <span>Real-time active student headcount inside study hall</span>
                  ) : (
                    <span className="text-amber-500 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5" />
                      {flaggedScans.length} scans pending review (outside 100m permitted perimeter)
                    </span>
                  )}
                </div>
              </div>

              {liveViewMode === "inside" ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                            STUDENT
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                            SEAT &amp; SHIFT
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                            IN TIME
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                            TIME INSIDE
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                            DOOR CHECK
                          </TableHead>
                          <TableHead className="text-right text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                            ACTIONS
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {liveStudents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                              No active students inside right now. Check-in walk-in students using "Mark attendance".
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedLiveStudents.map((std) => (
                            <TableRow
                              key={std.id}
                              onClick={() => router.push(`/${lang}/pages/students/${std.id}`)}
                              className="border-border/60 hover:bg-muted/50 cursor-pointer transition-colors group"
                              title="Click to view student profile"
                            >
                              {/* Student Profile */}
                              <TableCell className="py-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="size-9 border border-border group-hover:ring-2 group-hover:ring-primary/40 transition-all">
                                    <AvatarImage src={std.avatar} alt={std.name} />
                                    <AvatarFallback className="text-xs font-medium">
                                      {std.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                      {std.name}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                      Student ID: {std.id}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Seat & Shift */}
                              <TableCell className="py-3">
                                <div className="text-xs font-bold text-primary">
                                  {std.seat}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {std.shift}
                                </div>
                              </TableCell>

                              {/* In Time */}
                              <TableCell className="py-3 font-semibold text-xs text-foreground font-mono">
                                {std.inTime}
                              </TableCell>

                              {/* Time Inside */}
                              <TableCell className="py-3">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                  <span className="size-1.5 rounded-full bg-emerald-500" />
                                  <span>{std.timeInside}</span>
                                </div>
                              </TableCell>

                              {/* Door Check Pill - max 2 words */}
                              <TableCell className="py-3">
                                <Badge
                                  variant="outline"
                                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] px-2.5 py-1 rounded-full font-medium"
                                >
                                  ✓ {std.doorCheck}
                                </Badge>
                              </TableCell>

                              {/* Actions: WhatsApp Direct Connect */}
                              <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-md border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-500 text-xs font-medium px-3 gap-1.5 cursor-pointer shadow-2xs transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const cleanPhone = std.phone.replace(/[^0-9]/g, "")
                                      const msg = encodeURIComponent(`Hello ${std.name}, regarding your library attendance today at Kothrud Campus...`)
                                      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank")
                                    }}
                                  >
                                    <MessageCircle className="size-3.5 shrink-0" />
                                    <span>WhatsApp</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Bottom Website Pagination Component Bar */}
                  <div className="p-3.5 px-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-muted/10 text-muted-foreground">
                    <div>
                      Showing <strong className="text-foreground">{liveStudents.length === 0 ? 0 : (livePage - 1) * livePageSize + 1}</strong> to{" "}
                      <strong className="text-foreground">{Math.min(livePage * livePageSize, liveStudents.length)}</strong> of{" "}
                      <strong className="text-foreground">{liveStudents.length}</strong> live students
                    </div>

                    {liveTotalPages > 1 && (
                      <Pagination className="mx-0 w-auto justify-end">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setLivePage((p) => Math.max(1, p - 1))
                              }}
                              className={livePage === 1 ? "pointer-events-none opacity-40 text-xs h-8 px-2.5" : "cursor-pointer text-xs h-8 px-2.5"}
                            />
                          </PaginationItem>
                          {Array.from({ length: liveTotalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                isActive={livePage === page}
                                onClick={(e) => {
                                  e.preventDefault()
                                  setLivePage(page)
                                }}
                                className="cursor-pointer size-8 text-xs font-semibold"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setLivePage((p) => Math.min(liveTotalPages, p + 1))
                              }}
                              className={livePage === liveTotalPages ? "pointer-events-none opacity-40 text-xs h-8 px-2.5" : "cursor-pointer text-xs h-8 px-2.5"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>
                </>
              ) : (
                /* Flagged Scans Verification Queue Table (Integrated inside Live Tab) */
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                          STUDENT
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                          SEAT &amp; SHIFT
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                          SCAN TIME
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                          GEOFENCE DISTANCE
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                          ANOMALY REASON
                        </TableHead>
                        <TableHead className="text-right text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                          REVIEW ACTION
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flaggedScans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                            ✓ No flagged scans pending review. All mobile scans are within valid campus geofence perimeter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        flaggedScans.map((scan) => (
                          <TableRow
                            key={scan.id}
                            onClick={() => router.push(`/${lang}/pages/students/${scan.studentId}`)}
                            className="border-border/60 hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <TableCell className="py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="size-9 border border-border">
                                  <AvatarImage src={scan.avatar} alt={scan.studentName} />
                                  <AvatarFallback className="text-xs">
                                    {scan.studentName.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-xs font-semibold text-foreground">
                                    {scan.studentName}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground font-mono">
                                    {scan.studentId}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-3 text-xs">
                              <span className="font-bold text-primary">{scan.seat}</span> • {scan.shift}
                            </TableCell>

                            <TableCell className="py-3 text-xs font-mono text-foreground font-semibold">
                              {scan.scanTime}
                            </TableCell>

                            <TableCell className="py-3">
                              <Badge
                                variant="outline"
                                className="border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-300 text-[11px] px-2.5 py-1 rounded-full font-semibold gap-1.5"
                              >
                                <AlertTriangle className="size-3 shrink-0 text-rose-500 dark:text-rose-300" />
                                <span>{scan.distance}</span>
                                <span className="text-[10px] text-rose-600/80 dark:text-rose-200/80 font-normal">(Outside Perimeter)</span>
                              </Badge>
                            </TableCell>

                            <TableCell className="py-3 text-xs text-muted-foreground">
                              {scan.reason}
                            </TableCell>

                            <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-2xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleResolveFlaggedScan(scan.id, true)
                                  }}
                                >
                                  <Check className="size-3.5 mr-1" />
                                  Approve Override
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 text-xs cursor-pointer shadow-2xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleResolveFlaggedScan(scan.id, false)
                                  }}
                                >
                                  Reject
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-md border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium px-2.5 gap-1 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const cleanPhone = scan.phone.replace(/[^0-9]/g, "")
                                    window.open(`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(scan.studentName)}`, "_blank")
                                  }}
                                >
                                  <MessageCircle className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          )}

          {/* ============================================================ */}
          {/* TAB 2: Month view (Register) - Dynamic Year, Month, Week with Scroll Pagination */}
          {/* ============================================================ */}
          {activeTab === "matrix" && (
            <Card className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs">
              {/* Header Row: Title, Month/Year Picker, Dynamic Week Filter according to selected month, and Actions */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                      Attendance Matrix
                    </h2>
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      {selectedMonth} {selectedYear}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Showing {dynamicWeeks.find((w) => w.value === matrixWeek)?.title} ({dynamicWeeks.find((w) => w.value === matrixWeek)?.subtitle}) • {selectedMonth} {selectedYear}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Year & Month Picker Popover */}
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2 h-9 rounded-md bg-muted/40 border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <span>{selectedMonth} {selectedYear}</span>
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${datePickerOpen ? "rotate-180" : ""}`} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      onFocusOutside={(e) => e.preventDefault()}
                      className="w-72 p-4 rounded-lg bg-popover border border-border shadow-xl text-popover-foreground z-[200] pointer-events-auto"
                    >
                      {/* Header: YEAR Selector with Prev / Next */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          SELECT YEAR
                        </span>
                        <div className="w-full flex items-center justify-between mt-1 px-1">
                          <button
                            type="button"
                            onClick={() => setSelectedYear((y) => y - 1)}
                            className="p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          >
                            <ChevronLeft className="size-4" />
                          </button>
                          <span className="text-lg font-bold text-foreground tracking-wide">
                            {selectedYear}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedYear((y) => y + 1)}
                            className="p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        </div>
                      </div>

                      {/* 4x3 Month Grid */}
                      <div className="grid grid-cols-4 gap-1.5 mt-4">
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => {
                          const isSelected = selectedMonth === m
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setSelectedMonth(m)
                                setDatePickerOpen(false)
                              }}
                              className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${isSelected
                                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                              {m}
                            </button>
                          )
                        })}
                      </div>

                      {/* Popover Footer */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <button
                          type="button"
                          onClick={() => setSelectedYear(2026)}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        >
                          Reset (2026)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedYear(2026)
                            setSelectedMonth("Oct")
                            setDatePickerOpen(false)
                          }}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                        >
                          Current Month
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Week Filter Dropdown - Matches reference screenshot */}
                  <Popover open={weekDropdownOpen} onOpenChange={setWeekDropdownOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2 h-9 rounded-md bg-muted/40 border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <span>{dynamicWeeks.find((w) => w.value === matrixWeek)?.title || "Full Month"}</span>
                        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform duration-200 ${weekDropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      sideOffset={6}
                      className="w-56 p-1 rounded-md bg-popover border border-border text-popover-foreground shadow-lg z-[200] pointer-events-auto"
                    >
                      <div className="space-y-1">
                        {dynamicWeeks.map((w) => {
                          const isSelected = matrixWeek === w.value
                          return (
                            <button
                              key={w.value}
                              type="button"
                              onClick={() => {
                                setMatrixWeek(w.value)
                                setWeekDropdownOpen(false)
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-left transition-colors cursor-pointer",
                                isSelected
                                  ? "bg-primary/15 text-primary hover:bg-primary/20"
                                  : "hover:bg-muted/60 text-foreground"
                              )}
                            >
                              <div className="flex flex-col">
                                <span className={cn("text-xs font-bold leading-tight", isSelected ? "text-primary" : "text-foreground")}>
                                  {w.title}
                                </span>
                                <span className={cn("text-[11px] mt-0.5", isSelected ? "text-primary/80" : "text-muted-foreground")}>
                                  {w.subtitle}
                                </span>
                              </div>
                              {isSelected && <Check className="size-4 text-primary shrink-0 stroke-[2.5]" />}
                            </button>
                          )
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Holiday Button */}
                  <button
                    type="button"
                    className="flex items-center gap-1.5 h-9 rounded-md bg-muted/40 border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => setHolidayModalOpen(true)}
                  >
                    <Calendar className="size-3.5 text-muted-foreground" />
                    <span>Holiday</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 h-9 rounded-md bg-muted/40 border border-border px-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="size-3.5 text-emerald-500" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Filter Bar with Search, Shift Pills, and Legend */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-t border-border pt-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search student or seat..."
                      className="h-8 pl-8 text-xs bg-muted/40 border-border"
                      value={matrixSearch}
                      onChange={(e) => setMatrixSearch(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    {["All Shifts", "Morning", "Evening", "Full Day"].map((shift) => (
                      <button
                        key={shift}
                        type="button"
                        onClick={() => setMatrixShiftFilter(shift)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${matrixShiftFilter === shift
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                      >
                        {shift}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Legend */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span>Late</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-destructive" />
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-cyan-500" />
                    <span>Holiday</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-muted-foreground/50" />
                    <span>Sunday</span>
                  </div>
                </div>
              </div>

              {/* Matrix Grid Table with Pagination */}
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="min-w-[190px] text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                          STUDENT PROFILE
                        </TableHead>

                        {/* Header columns: Days of selected week / month */}
                        {matrixDays.map((d, i) => (
                          <TableHead
                            key={i}
                            className={`text-center p-1.5 min-w-[36px] text-xs font-semibold ${d.isSunday ? "text-muted-foreground/60 bg-muted/20" : "text-muted-foreground"
                              }`}
                          >
                            <div className="text-[10px] font-mono">{d.num}</div>
                            <div className={`text-[9px] font-bold ${d.isSunday ? "text-amber-500/70" : ""}`}>
                              {d.day}
                            </div>
                          </TableHead>
                        ))}

                        <TableHead className="text-center min-w-[65px] text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                          PRESENT
                        </TableHead>
                        <TableHead className="text-center min-w-[60px] text-xs font-bold text-destructive uppercase">
                          ABSENT
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredMatrix.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={matrixDays.length + 3} className="text-center py-12 text-xs text-muted-foreground">
                            No students matching your filter criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedMatrixStudents.map((std) => {
                          // Calculate stats for current view
                          let presentCount = 0
                          let absentCount = 0

                          const dayStatuses = matrixDays.map((d) => {
                            const st = getDayStatus(std, d.dayNum, d.isSunday)
                            if (st === "P" || st === "L") presentCount++
                            if (st === "AB") absentCount++
                            return { day: d, status: st }
                          })

                          return (
                            <TableRow key={std.id} className="border-border/60 hover:bg-muted/30">
                              {/* Student Profile with Avatar and Status indicator */}
                              <TableCell className="py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="relative">
                                    <Avatar className="size-8 border border-border">
                                      <AvatarImage src={std.avatar} alt={std.name} />
                                      <AvatarFallback className="text-[10px]">
                                        {std.name.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold text-foreground leading-tight">
                                      {std.name}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-mono">
                                      {std.code} • <span className="text-primary font-semibold">{std.seat}</span>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Matrix Day Status Cells */}
                              {dayStatuses.map(({ day, status }, cellIdx) => (
                                <TableCell key={cellIdx} className={`p-1 text-center ${day.isSunday ? "bg-muted/10" : ""}`}>
                                  <Tooltip delayDuration={100}>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditStatusCell({
                                            studentName: std.name,
                                            studentCode: std.code,
                                            studentSeat: std.seat,
                                            dayNum: day.num,
                                            dayName: day.day,
                                            dayIndex: cellIdx,
                                            currentStatus:
                                              status === "P"
                                                ? "Present"
                                                : status === "L"
                                                  ? "Late"
                                                  : status === "AB"
                                                    ? "Absent"
                                                    : status === "HD"
                                                      ? "Holiday"
                                                      : "Sunday",
                                          })
                                        }}
                                        className="cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                                      >
                                        {status === "P" ? (
                                          <span className="inline-flex size-6 items-center justify-center rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                            P
                                          </span>
                                        ) : status === "HD" ? (
                                          <span className="inline-flex size-6 items-center justify-center rounded bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-bold text-cyan-600 dark:text-cyan-400">
                                            HD
                                          </span>
                                        ) : status === "SUN" ? (
                                          <span className="inline-flex size-6 items-center justify-center text-[10px] font-medium text-muted-foreground/60">
                                            SUN
                                          </span>
                                        ) : status === "AB" ? (
                                          <span className="inline-flex size-6 items-center justify-center rounded bg-destructive/15 border border-destructive/30 text-[9px] font-bold text-destructive">
                                            AB
                                          </span>
                                        ) : status === "L" ? (
                                          <span className="inline-flex size-6 items-center justify-center rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                            L
                                          </span>
                                        ) : null}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      sideOffset={6}
                                      className="z-[200] rounded-md border border-border bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md backdrop-blur-md"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-foreground text-[11px] tracking-tight">
                                          {day.day} {day.num} {selectedMonth}
                                        </span>
                                        <span className="text-muted-foreground/40 text-[10px]">•</span>
                                        <span
                                          className={cn(
                                            "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border",
                                            status === "P" && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                                            status === "L" && "bg-amber-500/15 text-amber-400 border-amber-500/30",
                                            status === "AB" && "bg-destructive/15 text-rose-400 border-destructive/30",
                                            status === "HD" && "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
                                            status === "SUN" && "bg-muted/60 text-muted-foreground border-border/60"
                                          )}
                                        >
                                          <span
                                            className={cn(
                                              "size-1.5 rounded-full shrink-0",
                                              status === "P" && "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]",
                                              status === "L" && "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
                                              status === "AB" && "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]",
                                              status === "HD" && "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]",
                                              status === "SUN" && "bg-muted-foreground/60"
                                            )}
                                          />
                                          <span>
                                            {status === "P"
                                              ? "Present"
                                              : status === "L"
                                                ? "Late"
                                                : status === "AB"
                                                  ? "Absent"
                                                  : status === "HD"
                                                    ? "Holiday"
                                                    : "Sunday Off"}
                                          </span>
                                        </span>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                              ))}

                              {/* Summary Columns */}
                              <TableCell className="text-center font-bold text-xs text-emerald-600 dark:text-emerald-400 font-mono py-2.5">
                                {presentCount}
                              </TableCell>
                              <TableCell className="text-center font-bold text-xs text-destructive font-mono py-2.5">
                                {absentCount}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Bottom Website Pagination Component Bar */}
                <div className="p-3.5 px-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-muted/10 text-muted-foreground">
                  <div>
                    Showing <strong className="text-foreground">{filteredMatrix.length === 0 ? 0 : (matrixPage - 1) * matrixPageSize + 1}</strong> to{" "}
                    <strong className="text-foreground">{Math.min(matrixPage * matrixPageSize, filteredMatrix.length)}</strong> of{" "}
                    <strong className="text-foreground">{filteredMatrix.length}</strong> students
                  </div>

                  {matrixTotalPages > 1 && (
                    <Pagination className="mx-0 w-auto justify-end">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setMatrixPage((p) => Math.max(1, p - 1))
                            }}
                            className={matrixPage === 1 ? "pointer-events-none opacity-40 text-xs h-8 px-2.5" : "cursor-pointer text-xs h-8 px-2.5"}
                          />
                        </PaginationItem>
                        {Array.from({ length: matrixTotalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              isActive={matrixPage === page}
                              onClick={(e) => {
                                e.preventDefault()
                                setMatrixPage(page)
                              }}
                              className="cursor-pointer size-8 text-xs font-semibold"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setMatrixPage((p) => Math.min(matrixTotalPages, p + 1))
                            }}
                            className={matrixPage === matrixTotalPages ? "pointer-events-none opacity-40 text-xs h-8 px-2.5" : "cursor-pointer text-xs h-8 px-2.5"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* ============================================================ */}
          {/* TAB 3: QR code for attendance                                */}
          {/* ============================================================ */}
          {activeTab === "qr" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* Left Column (5 cols): Dynamic Live Kiosk QR, Session Countdown, Duration & Controls */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="rounded-lg border border-border bg-card p-6 flex flex-col items-center text-center space-y-5 shadow-xs">
                  {/* Header Badge & Campus */}
                  <div className="space-y-1.5 w-full flex flex-col items-center">
                    <div className="flex items-center justify-between w-full">
                      <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs gap-1.5 py-0.5">
                        <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                        Live Kiosk Active
                      </Badge>
                      <span className="font-mono text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border">
                        ID: {qrSessionId}
                      </span>
                    </div>

                  </div>

                  {/* QR Code Container with High-tech Framing */}
                  <div className="relative p-6 rounded-lg border border-border bg-white text-black shadow-md flex items-center justify-center">
                    <div className={cn("transition-transform duration-300", qrIsRegenerating && "scale-90 rotate-180 opacity-50")}>
                      <QrCode className="size-52 text-black" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="size-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                        LMS
                      </div>
                    </div>
                    {/* Visual Corner accents */}
                    <div className="absolute top-2 left-2 size-3 border-t-2 border-l-2 border-primary pointer-events-none" />
                    <div className="absolute top-2 right-2 size-3 border-t-2 border-r-2 border-primary pointer-events-none" />
                    <div className="absolute bottom-2 left-2 size-3 border-b-2 border-l-2 border-primary pointer-events-none" />
                    <div className="absolute bottom-2 right-2 size-3 border-b-2 border-r-2 border-primary pointer-events-none" />
                  </div>

                  {/* Compact QR Validity & Expiration Row (Timeline removed, reduced size) */}
                  <div className="w-full rounded-md border border-border bg-muted/20 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Timer className="size-3.5 text-primary" />
                      <span>Expires in <strong className="font-mono text-foreground font-bold">{formatDayCountdown(qrRemainingSec)}</strong></span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Valid until <strong className="text-foreground">{format(new Date(Date.now() + qrRemainingSec * 1000), "dd MMM yyyy")}</strong>
                    </span>
                  </div>

                  {/* Custom Duration Selection (Min 1 day, 6 days, 15 days, 1 month max, custom input) */}
                  <div className="w-full space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-foreground">QR Duration Presets</Label>
                      <span className="text-[11px] text-muted-foreground font-normal">Active: {qrDurationDays} Day{qrDurationDays > 1 ? "s" : ""}</span>
                    </div>

                    {/* Preset Pills - Reduced size */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: "1 Day", days: 1, desc: "Min" },
                        { label: "6 Days", days: 6, desc: "Week" },
                        { label: "15 Days", days: 15, desc: "Half Mo" },
                        { label: "1 Month", days: 30, desc: "30d Max" },
                      ].map((dur) => (
                        <button
                          key={dur.days}
                          type="button"
                          onClick={() => handleChangeQrDurationDays(dur.days)}
                          className={cn(
                            "py-1.5 px-1 text-center rounded-md border text-xs transition-all cursor-pointer",
                            qrDurationDays === dur.days
                              ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <div className="font-bold text-xs">{dur.label}</div>
                          <div className="text-[10px] opacity-75">{dur.desc}</div>
                        </button>
                      ))}
                    </div>

                    {/* Custom Days Input & Stepper - Compact */}
                    <div className="p-2 rounded-md border border-border bg-muted/20 space-y-1">
                      <div className="text-[11px] font-medium text-foreground flex items-center justify-between">
                        <span>Custom Duration Input (Write Days):</span>
                        <span className="text-[10px] text-muted-foreground">Min 1d • Max 30d</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleChangeQrDurationDays(qrDurationDays - 1)}
                          disabled={qrDurationDays <= 1}
                        >
                          - 1d
                        </Button>
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            value={qrCustomDaysInput}
                            onChange={(e) => {
                              const val = e.target.value
                              setQrCustomDaysInput(val)
                              const num = parseInt(val, 10)
                              if (!isNaN(num)) {
                                const clamped = Math.max(1, Math.min(30, num))
                                setQrDurationDays(clamped)
                                setQrRemainingSec(clamped * 86400)
                              }
                            }}
                            placeholder="e.g. 15"
                            className="h-7 text-xs font-mono font-bold text-center bg-card border-border pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium pointer-events-none">
                            Days
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleChangeQrDurationDays(qrDurationDays + 1)}
                          disabled={qrDurationDays >= 30}
                        >
                          + 1d
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Auto-Regenerate Switch - Compact */}
                  <div className="w-full flex items-center justify-between p-2 px-2.5 rounded-md border border-border bg-muted/20">
                    <div className="text-left space-y-0.5">
                      <div className="text-xs font-medium text-foreground">Auto-Regenerate QR</div>
                      <div className="text-[10px] text-muted-foreground">
                        Automatically rotates on session expiry
                      </div>
                    </div>
                    <Switch
                      checked={autoRegenerate}
                      onCheckedChange={setAutoRegenerate}
                      aria-label="Auto-Regenerate QR"
                    />
                  </div>

                  {/* New QR Generate Button & Print - Compact */}
                  <div className="w-full grid grid-cols-2 gap-2 pt-0.5">
                    <Button
                      type="button"
                      className="w-full text-xs h-8 gap-1.5 cursor-pointer shadow-xs font-medium"
                      onClick={handleGenerateNewQR}
                    >
                      <RefreshCw className={cn("size-3.5", qrIsRegenerating && "animate-spin")} />
                      <span>Generate New QR</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-xs h-8 gap-1.5 cursor-pointer"
                      onClick={() => setPrintPosterModalOpen(true)}
                    >
                      <Printer className="size-3.5" />
                      <span>Print Standee</span>
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Right Column (7 cols): Geofence Radius Configurator & That QR Scanned List */}
              <div className="lg:col-span-7 space-y-4">
                {/* Geofence Radius Configurator - Reduced Element Sizes */}
                <Card className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ShieldCheck className="size-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Geofence Perimeter &amp; Allowed Radius</h4>
                        <p className="text-[11px] text-muted-foreground">
                          Mobile check-in GPS validation boundary for Kothrud Main Campus
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-[11px] px-2 py-0.5 text-primary border-primary/30 bg-primary/10">
                      Radius: {qrRadius} Meters
                    </Badge>
                  </div>

                  {/* Interactive Radius Selector Buttons & Stepper - Compact */}
                  <div className="space-y-2 pt-0.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Quick Radius Presets:</span>
                      <span className="font-medium text-foreground">
                        {qrRadius <= 50 ? "Strict (Desk Only)" : qrRadius <= 100 ? "Standard (Building)" : qrRadius <= 200 ? "Generous (Premises)" : "Campus Wide"}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { label: "50m", val: 50, desc: "Strict" },
                        { label: "100m", val: 100, desc: "Standard" },
                        { label: "150m", val: 150, desc: "Generous" },
                        { label: "250m", val: 250, desc: "Wide" },
                        { label: "500m", val: 500, desc: "Campus" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setQrRadius(item.val)}
                          className={cn(
                            "flex flex-col items-center justify-center py-1.5 px-1 rounded-md border text-xs transition-all cursor-pointer",
                            qrRadius === item.val
                              ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="font-bold text-xs">{item.label}</span>
                          <span className="text-[9px] opacity-80">{item.desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Stepper with compact buttons and bar */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setQrRadius((r) => Math.max(20, r - 10))}
                        disabled={qrRadius <= 20}
                      >
                        - 10m
                      </Button>
                      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden relative">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${Math.min(100, (qrRadius / 500) * 100)}%` }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setQrRadius((r) => Math.min(1000, r + 10))}
                        disabled={qrRadius >= 1000}
                      >
                        + 10m
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-0.5 text-xs">
                    <div className="rounded-md bg-muted/20 p-2 border border-border">
                      <span className="text-muted-foreground text-[10px]">Campus GPS Anchor:</span>
                      <div className="font-mono font-medium text-[11px] mt-0.5 text-foreground flex items-center gap-1">
                        <MapPin className="size-3 text-primary" />
                        18.5074° N, 73.8077° E
                      </div>
                    </div>
                    <div className="rounded-md bg-muted/20 p-2 border border-border">
                      <span className="text-muted-foreground text-[10px]">Enforcement Mode:</span>
                      <div className="font-medium text-[11px] mt-0.5 text-emerald-500 flex items-center gap-1">
                        <Check className="size-3" />
                        Active Geofence Filtering
                      </div>
                    </div>
                  </div>
                </Card>

                {/* That QR Scanned List with Fixed Size & Pagination */}
                <Card className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Activity className="size-3.5 text-primary" />
                        Scanned with this QR Session
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Real-time live attendance scans registered for session ID: {qrSessionId}
                      </p>
                    </div>

                    {/* Filter pills: All, Verified, Flagged */}
                    <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-md border border-border text-xs">
                      {(["all", "verified", "flagged"] as const).map((flt) => {
                        const allCount = qrScans.length + flaggedScans.length
                        const verifiedCount = qrScans.filter((s) => s.distance <= qrRadius).length
                        const flaggedCount = qrScans.filter((s) => s.distance > qrRadius).length + flaggedScans.length
                        const count = flt === "all" ? allCount : flt === "verified" ? verifiedCount : flaggedCount

                        return (
                          <button
                            key={flt}
                            type="button"
                            onClick={() => {
                              setQrScansFilter(flt)
                              setQrScanPage(1)
                            }}
                            className={cn(
                              "px-2.5 py-0.5 rounded text-xs font-medium cursor-pointer transition-colors capitalize",
                              qrScansFilter === flt
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {flt} ({count})
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Scanned List Table with Fixed Size and Website Pagination Component */}
                  {(() => {
                    const filteredFlagged = (qrScansFilter === "all" || qrScansFilter === "flagged") ? flaggedScans : []
                    const filteredRegular = qrScans.filter((s) => {
                      const isOk = s.distance <= qrRadius
                      if (qrScansFilter === "verified") return isOk
                      if (qrScansFilter === "flagged") return !isOk
                      return true
                    })

                    type CombinedScanItem =
                      | { type: "flagged"; data: typeof flaggedScans[0] }
                      | { type: "regular"; data: typeof qrScans[0] }

                    const combinedList: CombinedScanItem[] = [
                      ...filteredFlagged.map((d) => ({ type: "flagged" as const, data: d })),
                      ...filteredRegular.map((d) => ({ type: "regular" as const, data: d })),
                    ]

                    const totalPages = Math.max(1, Math.ceil(combinedList.length / qrScanPageSize))
                    const currentPage = Math.min(qrScanPage, totalPages)
                    const paginatedItems = combinedList.slice((currentPage - 1) * qrScanPageSize, currentPage * qrScanPageSize)

                    return (
                      <div className="rounded-md border border-border overflow-hidden">
                        {/* Fixed height container to prevent table height jumping */}
                        <div className="min-h-[310px] overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-muted/40">
                              <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-xs uppercase text-muted-foreground py-2.5">STUDENT</TableHead>
                                <TableHead className="text-xs uppercase text-muted-foreground py-2.5">SEAT &amp; SCAN TIME</TableHead>
                                <TableHead className="text-xs uppercase text-muted-foreground py-2.5">DISTANCE &amp; GEOFENCE</TableHead>
                                <TableHead className="text-xs uppercase text-muted-foreground py-2.5 text-right">ACTION / REVIEW</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedItems.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="h-44 text-center text-xs text-muted-foreground">
                                    No scans found for the selected filter.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                paginatedItems.map((item) => {
                                  if (item.type === "flagged") {
                                    const scan = item.data
                                    return (
                                      <TableRow key={`flg-${scan.id}`} className="border-border/60 bg-amber-500/5 hover:bg-amber-500/10 h-14">
                                        <TableCell className="py-2">
                                          <div className="flex items-center gap-2.5">
                                            <Avatar className="size-7 border border-border">
                                              <AvatarImage src={scan.avatar} alt={scan.studentName} />
                                              <AvatarFallback className="text-[10px]">
                                                {scan.studentName.slice(0, 2).toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <div className="text-xs font-semibold text-foreground">
                                                {scan.studentName}
                                              </div>
                                              <div className="text-[10px] text-amber-500 font-mono">
                                                {scan.studentId} • Pending Review
                                              </div>
                                            </div>
                                          </div>
                                        </TableCell>

                                        <TableCell className="py-2">
                                          <div className="text-xs font-semibold text-primary">{scan.seat}</div>
                                          <div className="text-[10px] text-muted-foreground font-mono">{scan.scanTime}</div>
                                        </TableCell>

                                        <TableCell className="py-2">
                                          <Badge
                                            variant="outline"
                                            className="text-[11px] px-2 py-0.5 rounded-full font-semibold gap-1 border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-300"
                                          >
                                            <AlertTriangle className="size-3 shrink-0 text-rose-500 dark:text-rose-300" />
                                            <span className="font-bold">{scan.distance}</span>
                                            <span className="text-[10px] text-rose-600/90 dark:text-rose-200/90 font-medium">(Outside Perimeter)</span>
                                          </Badge>
                                        </TableCell>

                                        <TableCell className="py-2 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                              type="button"
                                              size="sm"
                                              className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                                              onClick={() => handleResolveFlaggedScan(scan.id, true)}
                                            >
                                              Approve
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="destructive"
                                              className="h-6 px-2 text-[10px] cursor-pointer"
                                              onClick={() => handleResolveFlaggedScan(scan.id, false)}
                                            >
                                              Reject
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  } else {
                                    const scan = item.data
                                    const isWithin = scan.distance <= qrRadius
                                    return (
                                      <TableRow key={scan.id} className="border-border/60 hover:bg-muted/20 h-14">
                                        <TableCell className="py-2">
                                          <div className="flex items-center gap-2.5">
                                            <Avatar className="size-7 border border-border">
                                              <AvatarImage src={scan.avatar} alt={scan.studentName} />
                                              <AvatarFallback className="text-[10px]">
                                                {scan.studentName.slice(0, 2).toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <div className="text-xs font-semibold text-foreground">
                                                {scan.studentName}
                                              </div>
                                              <div className="text-[10px] text-muted-foreground font-mono">
                                                {scan.studentCode} • {scan.device}
                                              </div>
                                            </div>
                                          </div>
                                        </TableCell>

                                        <TableCell className="py-2">
                                          <div className="text-xs font-semibold text-primary">{scan.seat}</div>
                                          <div className="text-[10px] text-muted-foreground font-mono">{scan.scanTime}</div>
                                        </TableCell>

                                        <TableCell className="py-2">
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              "text-[11px] px-2 py-0.5 rounded-full font-semibold gap-1",
                                              isWithin
                                                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                                                : "border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-300"
                                            )}
                                          >
                                            {isWithin ? (
                                              <Check className="size-3 shrink-0 text-emerald-600 dark:text-emerald-300" />
                                            ) : (
                                              <AlertTriangle className="size-3 shrink-0 text-rose-500 dark:text-rose-300" />
                                            )}
                                            <span className="font-bold">{scan.distance}m</span>
                                            <span className="text-[10px] opacity-90 font-medium">
                                              ({isWithin ? `✓ Within ${qrRadius}m` : `⚠ Outside ${qrRadius}m`})
                                            </span>
                                          </Badge>
                                        </TableCell>

                                        <TableCell className="py-2 text-right">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs text-primary hover:bg-primary/10 cursor-pointer"
                                            onClick={() => router.push(`/${lang}/pages/students/std-101`)}
                                          >
                                            View Profile
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  }
                                })
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Website Pagination Component Bar */}
                        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20 text-xs">
                          <span className="text-muted-foreground text-[11px]">
                            Showing {combinedList.length > 0 ? (currentPage - 1) * qrScanPageSize + 1 : 0} -{" "}
                            {Math.min(currentPage * qrScanPageSize, combinedList.length)} of {combinedList.length} scans
                          </span>
                          {totalPages > 1 && (
                            <Pagination className="mx-0 w-auto justify-end">
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setQrScanPage((p) => Math.max(1, p - 1))
                                    }}
                                    className={cn("h-7 px-2 text-xs cursor-pointer", currentPage <= 1 && "pointer-events-none opacity-50")}
                                  />
                                </PaginationItem>
                                {Array.from({ length: totalPages }).map((_, idx) => {
                                  const page = idx + 1
                                  return (
                                    <PaginationItem key={page}>
                                      <PaginationLink
                                        href="#"
                                        isActive={currentPage === page}
                                        onClick={(e) => {
                                          e.preventDefault()
                                          setQrScanPage(page)
                                        }}
                                        className="h-7 w-7 text-xs cursor-pointer"
                                      >
                                        {page}
                                      </PaginationLink>
                                    </PaginationItem>
                                  )
                                })}
                                <PaginationItem>
                                  <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setQrScanPage((p) => Math.min(totalPages, p + 1))
                                    }}
                                    className={cn("h-7 px-2 text-xs cursor-pointer", currentPage >= totalPages && "pointer-events-none opacity-50")}
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </Card>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: Attendance rules with Full CRUD (Add, Edit, Delete)   */}
          {/* ============================================================ */}
          {activeTab === "rules" && (
            <div className="space-y-5">
              {/* Top Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card shadow-xs">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Sliders className="size-4 text-primary" />
                    Attendance Rules &amp; Enforcement Policies
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Define punctuality grace periods, geofence radius, auto-actions, and absence alert thresholds
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleOpenAddRule}
                    className="text-xs h-9 gap-1.5 cursor-pointer font-semibold shadow-xs"
                  >
                    <Plus className="size-3.5" />
                    <span>+ Add Attendance Rule</span>
                  </Button>
                </div>
              </div>

              {/* Filter & Search Controls */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                  {[
                    { id: "all", label: "All Rules" },
                    { id: "Punctuality", label: "Punctuality" },
                    { id: "Geofence", label: "Geofence" },
                    { id: "Auto-Action", label: "Auto-Action" },
                    { id: "Warning", label: "Warning" },
                    { id: "Policy", label: "Policy" },
                  ].map((cat) => {
                    const count = cat.id === "all" ? rulesList.length : rulesList.filter((r) => r.category === cat.id).length
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setRuleCategoryFilter(cat.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors whitespace-nowrap",
                          ruleCategoryFilter === cat.id
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                        )}
                      >
                        {cat.label} ({count})
                      </button>
                    )
                  })}
                </div>

                {/* Live Search */}
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search rules by name or description..."
                    value={ruleSearchQuery}
                    onChange={(e) => setRuleSearchQuery(e.target.value)}
                    className="pl-9 h-8 text-xs bg-card border-border rounded-md"
                  />
                </div>
              </div>

              {/* Rules Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rulesList
                  .filter((r) => {
                    const matchesCat = ruleCategoryFilter === "all" || r.category === ruleCategoryFilter
                    const matchesQuery =
                      r.name.toLowerCase().includes(ruleSearchQuery.toLowerCase()) ||
                      r.description.toLowerCase().includes(ruleSearchQuery.toLowerCase()) ||
                      r.value.toLowerCase().includes(ruleSearchQuery.toLowerCase())
                    return matchesCat && matchesQuery
                  })
                  .map((rule) => (
                    <Card
                      key={rule.id}
                      className={cn(
                        "rounded-lg border border-border p-5 flex flex-col justify-between space-y-4 shadow-xs transition-all",
                        rule.enabled ? "bg-card" : "bg-muted/20 opacity-75"
                      )}
                    >
                      <div className="space-y-3">
                        {/* Card Header with Badges & Quick Switch */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-foreground">
                                {rule.name}
                              </h4>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full font-medium",
                                  rule.category === "Punctuality"
                                    ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                    : rule.category === "Geofence"
                                      ? "border-blue-500/30 bg-blue-500/10 text-blue-500"
                                      : rule.category === "Auto-Action"
                                        ? "border-purple-500/30 bg-purple-500/10 text-purple-500"
                                        : rule.category === "Warning"
                                          ? "border-destructive/30 bg-destructive/10 text-destructive"
                                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                )}
                              >
                                {rule.category}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                              <span>Applies to:</span>
                              <strong className="text-foreground">{rule.appliedTo}</strong>
                            </div>
                          </div>

                          {/* Enable / Disable Switch */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {rule.enabled ? "Active" : "Off"}
                            </span>
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={() => handleToggleRule(rule.id)}
                              aria-label={`Toggle ${rule.name}`}
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {rule.description}
                        </p>
                      </div>

                      {/* Card Footer: Value Threshold + Edit & Delete Actions */}
                      <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground font-medium">Value:</span>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                            {rule.value}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted gap-1 cursor-pointer"
                            onClick={() => handleOpenEditRule(rule)}
                          >
                            <Pencil className="size-3.5 text-primary" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>

              {/* Empty state if filtered */}
              {rulesList.filter((r) => {
                const matchesCat = ruleCategoryFilter === "all" || r.category === ruleCategoryFilter
                const matchesQuery =
                  r.name.toLowerCase().includes(ruleSearchQuery.toLowerCase()) ||
                  r.description.toLowerCase().includes(ruleSearchQuery.toLowerCase())
                return matchesCat && matchesQuery
              }).length === 0 && (
                  <div className="p-8 text-center text-xs text-muted-foreground rounded-lg border border-border bg-card">
                    No attendance rules found matching your filter. Click "+ Add Attendance Rule" to create one.
                  </div>
                )}
            </div>
          )}

          {/* Modal: Add / Edit Attendance Rule */}
          <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
            <DialogContent className="sm:max-w-[540px] rounded-lg bg-card border border-border text-foreground shadow-2xl p-6">
              <DialogHeader className="text-left space-y-1">
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sliders className="size-4 text-primary" />
                  <span>{editingRule ? "Update Attendance Rule" : "Create New Attendance Rule"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Configure policy parameters, thresholds, and operational constraints for campus attendance.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Rule Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="rule-name" className="text-xs font-semibold text-foreground">
                    Rule Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="rule-name"
                    placeholder="e.g. Late Arrival Grace Window"
                    value={ruleFormName}
                    onChange={(e) => setRuleFormName(e.target.value)}
                    className="h-9 text-xs bg-muted/30 border-border"
                  />
                </div>

                {/* Category & Threshold Value */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Policy Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={ruleFormCategory}
                      onValueChange={(val) => setRuleFormCategory(val as AttendanceRuleItem["category"])}
                    >
                      <SelectTrigger className="h-9 text-xs bg-muted/30 border-border">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Punctuality">Punctuality</SelectItem>
                        <SelectItem value="Geofence">Geofence</SelectItem>
                        <SelectItem value="Auto-Action">Auto-Action</SelectItem>
                        <SelectItem value="Warning">Warning</SelectItem>
                        <SelectItem value="Policy">Policy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rule-value" className="text-xs font-semibold text-foreground">
                      Threshold Value <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="rule-value"
                      placeholder="e.g. 15 Minutes or 100 Meters"
                      value={ruleFormValue}
                      onChange={(e) => setRuleFormValue(e.target.value)}
                      className="h-9 text-xs bg-muted/30 border-border"
                    />
                  </div>
                </div>

                {/* Applied To */}
                <div className="space-y-1.5">
                  <Label htmlFor="rule-applied" className="text-xs font-semibold text-foreground">
                    Applies To Scope
                  </Label>
                  <Input
                    id="rule-applied"
                    placeholder="e.g. All Shifts, Reserved Desks, Mobile Kiosk"
                    value={ruleFormAppliedTo}
                    onChange={(e) => setRuleFormAppliedTo(e.target.value)}
                    className="h-9 text-xs bg-muted/30 border-border"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="rule-desc" className="text-xs font-semibold text-foreground">
                    Rule Description &amp; Enforcement Action
                  </Label>
                  <Textarea
                    id="rule-desc"
                    rows={3}
                    placeholder="Explain when this rule triggers and what action LMS takes..."
                    value={ruleFormDescription}
                    onChange={(e) => setRuleFormDescription(e.target.value)}
                    className="text-xs bg-muted/30 border-border"
                  />
                </div>

                {/* Enabled Switch */}
                <div className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/20">
                  <div>
                    <div className="text-xs font-semibold text-foreground">Enable Rule Immediately</div>
                    <div className="text-[11px] text-muted-foreground">Active rules take effect across registers &amp; mobile checks</div>
                  </div>
                  <Switch
                    checked={ruleFormEnabled}
                    onCheckedChange={setRuleFormEnabled}
                    aria-label="Enable rule"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 cursor-pointer"
                  onClick={() => setIsRuleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="text-xs h-9 cursor-pointer font-semibold shadow-xs"
                  onClick={handleSaveRule}
                  disabled={!ruleFormName.trim() || !ruleFormValue.trim()}
                >
                  {editingRule ? "Update Rule" : "Save New Rule"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* ============================================================ */}
        {/* MODAL 1: Branch Holiday History & Schedule                   */}
        {/* ============================================================ */}
        <Dialog open={holidayModalOpen} onOpenChange={setHolidayModalOpen}>
          <DialogContent
            onPointerDownOutside={(e) => {
              const target = e.target as HTMLElement | null
              if (
                target?.closest?.("[data-radix-popper-content-wrapper]") ||
                target?.closest?.("[data-slot=\"popover-content\"]") ||
                target?.closest?.(".rdp")
              ) {
                e.preventDefault()
              }
            }}
            className="sm:max-w-[1240px] w-[95vw] h-[86vh] max-h-[840px] p-0 flex flex-col overflow-hidden rounded-lg bg-card border border-border text-foreground shadow-2xl"
          >
            {/* Pinned Header */}
            <div className="p-6 pb-3 border-b border-border shrink-0">
              <DialogHeader className="text-start space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-primary" />
                    <DialogTitle className="text-base font-bold text-foreground tracking-tight">
                      Branch Holiday History &amp; Schedule
                    </DialogTitle>
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    {holidays.length} Total Holidays • {upcomingCount} Upcoming
                  </div>
                </div>

              </DialogHeader>

              {/* Modal Navigation Tabs */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHolidayTab("declare")}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-colors ${holidayTab === "declare"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                >
                  <Plus className="size-3.5" />
                  <span>+ Declare New Holiday</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHolidayTab("history")}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-colors ${holidayTab === "history"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                >
                  <History className="size-3.5" />
                  <span>Holiday History ({holidays.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHolidayTab("weekly")}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-colors ${holidayTab === "weekly"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                >
                  <Clock className="size-3.5" />
                  <span>Weekly Offs</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* TAB 1: + Declare New Holiday */}
              {holidayTab === "declare" && (
                <div className="grid grid-cols-12 gap-8 p-7 overflow-y-auto flex-1 min-h-0">
                  {/* Left Column (7 cols): Form */}
                  <div className="col-span-12 lg:col-span-7 space-y-4">
                    {/* Quick Demo Templates */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Quick Demo Templates (Click to Auto-Fill)
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewHolidayTitle("Diwali Padwa Campus Closure")
                            setNewHolidayCategory("Festival Break (Cultural & Religious Campus Celebration)")
                            setNewHolidayBranches("All Campuses (Kothrud HQ + FC Road + Viman Nagar Hub - 355 Desks)")
                            setHolidayDate(new Date(2026, 9, 24))
                          }}
                          className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                        >
                          Diwali Padwa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewHolidayTitle("Republic Day National Holiday")
                            setNewHolidayCategory("National Gazetted Holiday (Mandatory Campus Closure - Govt. Notified)")
                            setNewHolidayBranches("All Campuses (Kothrud HQ + FC Road + Viman Nagar Hub - 355 Desks)")
                            setHolidayDate(new Date(2027, 0, 26))
                          }}
                          className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                        >
                          Republic Day
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewHolidayTitle("Independence Day")
                            setNewHolidayCategory("National Gazetted Holiday (Mandatory Campus Closure - Govt. Notified)")
                            setNewHolidayBranches("All Campuses (Kothrud HQ + FC Road + Viman Nagar Hub - 355 Desks)")
                            setHolidayDate(new Date(2026, 7, 15))
                          }}
                          className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                        >
                          Independence Day
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewHolidayTitle("Gandhi Jayanti")
                            setNewHolidayCategory("National Gazetted Holiday (Mandatory Campus Closure - Govt. Notified)")
                            setNewHolidayBranches("All Campuses (Kothrud HQ + FC Road + Viman Nagar Hub - 355 Desks)")
                            setHolidayDate(new Date(2026, 9, 2))
                          }}
                          className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                        >
                          Gandhi Jayanti
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewHolidayTitle("Campus Deep Clean & Safety Audit")
                            setNewHolidayCategory("Campus Deep Maintenance & Electrical Safety Audit")
                            setNewHolidayBranches("Kothrud Main Campus HQ Only (Plot 42, Mayur Colony - 185 Desks)")
                            setHolidayDate(new Date(2026, 9, 31))
                          }}
                          className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                        >
                          Campus Deep Clean
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewHolidayTitle("Semester Exam Study Prep Break")
                            setNewHolidayCategory("Semester Exam Prep Break (Reading Hall Open 24/7, No Classes)")
                            setNewHolidayBranches("All Campuses (Kothrud HQ + FC Road + Viman Nagar Hub - 355 Desks)")
                            setHolidayDate(new Date(2026, 10, 10))
                          }}
                          className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                        >
                          Exam Study Prep
                        </button>
                      </div>
                    </div>

                    {/* Holiday Title */}
                    <div className="space-y-1.5">
                      <Label htmlFor="hol-title" className="text-xs font-semibold text-foreground">
                        Holiday Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="hol-title"
                        placeholder="e.g. Diwali Padwa, Makar Sankranti, Campus Deep Clean"
                        className="h-10 rounded-lg bg-card border-border text-foreground text-sm font-medium"
                        value={newHolidayTitle}
                        onChange={(e) => setNewHolidayTitle(e.target.value)}
                      />
                    </div>

                    {/* Date Picker + Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Holiday Date */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Holiday Date <span className="text-destructive">*</span>
                        </Label>
                        <Popover open={holidayDatePickerOpen} onOpenChange={setHolidayDatePickerOpen} modal={true}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Calendar className="size-4 text-primary shrink-0" />
                                <span>
                                  {holidayDate
                                    ? holidayDate.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
                                    : "Select Holiday Date"}
                                </span>
                              </div>
                              <ChevronDown className="size-3.5 text-muted-foreground" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            onCloseAutoFocus={(e) => e.preventDefault()}
                            onFocusOutside={(e) => e.preventDefault()}
                            className="w-auto p-0 bg-popover border border-border rounded-lg shadow-xl z-[200] pointer-events-auto"
                            align="start"
                          >
                            <CalendarPicker
                              mode="single"
                              selected={holidayDate}
                              onSelect={(d) => {
                                if (d) setHolidayDate(d)
                                setHolidayDatePickerOpen(false)
                              }}
                              initialFocus
                            />
                            <div className="flex items-center justify-between border-t border-border p-2 bg-muted/20 text-xs">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => {
                                  setHolidayDate(new Date(2026, 9, 24))
                                  setHolidayDatePickerOpen(false)
                                }}
                              >
                                24 Oct (Diwali)
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => {
                                  setHolidayDate(new Date(2026, 10, 15))
                                  setHolidayDatePickerOpen(false)
                                }}
                              >
                                15 Nov (Guru Nanak)
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Category Dropdown */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Category Dropdown
                        </Label>
                        <Select value={newHolidayCategory} onValueChange={setNewHolidayCategory}>
                          <SelectTrigger className="h-10 rounded-lg bg-card border-border text-foreground text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent hideScrollButtons className="z-[200] bg-popover border border-border text-popover-foreground rounded-lg max-h-60">
                            <SelectItem value="Festival Break (Cultural & Religious Campus Celebration)">
                              Festival Break (Cultural &amp; Religious)
                            </SelectItem>
                            <SelectItem value="National Gazetted Holiday (Mandatory Campus Closure - Govt. Notified)">
                              National Gazetted Holiday (Govt. Notified)
                            </SelectItem>
                            <SelectItem value="Semester Exam Prep Break (Reading Hall Open 24/7, No Classes)">
                              Semester Exam Prep (Reading Hall Open)
                            </SelectItem>
                            <SelectItem value="Campus Deep Maintenance & Electrical Safety Audit">
                              Campus Deep Maintenance &amp; Audit
                            </SelectItem>
                            <SelectItem value="Emergency Weather / Monsoon Red Alert">
                              Emergency Weather / Red Alert
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Applicable Branches & Shifts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Applicable Campus
                        </Label>
                        <Select value={newHolidayBranches} onValueChange={setNewHolidayBranches}>
                          <SelectTrigger className="h-10 rounded-lg bg-card border-border text-foreground text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[200] bg-popover border border-border text-popover-foreground rounded-lg">
                            <SelectItem value="All Campuses (Kothrud HQ + FC Road + Viman Nagar Hub - 355 Desks)">
                              All Campuses (Kothrud HQ + FC Road + Viman)
                            </SelectItem>
                            <SelectItem value="Kothrud Main Campus HQ Only (Plot 42, Mayur Colony - 185 Desks)">
                              Kothrud Main Campus HQ (185 Desks)
                            </SelectItem>
                            <SelectItem value="FC Road Branch Only (3rd Floor, Deccan Mall - 110 Desks)">
                              FC Road Branch (110 Desks)
                            </SelectItem>
                            <SelectItem value="Viman Nagar Express Hub Only (Phoenix Arcade - 60 Desks)">
                              Viman Nagar Hub (60 Desks)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Affected Shifts
                        </Label>
                        <Select value={newHolidayShifts} onValueChange={setNewHolidayShifts}>
                          <SelectTrigger className="h-10 rounded-lg bg-card border-border text-foreground text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[200] bg-popover border border-border text-popover-foreground rounded-lg">
                            <SelectItem value="All Shifts (Full Day 24×7, Morning, Evening, Night)">
                              All Shifts (Full Day, Morning, Evening)
                            </SelectItem>
                            <SelectItem value="Morning Shift Only (06:00 AM - 02:00 PM)">
                              Morning Shift Only (06:00 AM - 02:00 PM)
                            </SelectItem>
                            <SelectItem value="Evening Shift Only (02:00 PM - 10:00 PM)">
                              Evening Shift Only (02:00 PM - 10:00 PM)
                            </SelectItem>
                            <SelectItem value="Night Owl Shift Only (10:00 PM - 06:00 AM)">
                              Night Owl Shift (10:00 PM - 06:00 AM)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (5 cols): Live Preview & Automation Policy */}
                  <div className="col-span-12 lg:col-span-5 flex flex-col justify-between space-y-4 rounded-lg border border-border bg-card/60 p-5">
                    <div className="space-y-4">
                      <div className="text-xs font-bold text-foreground flex items-center justify-between">
                        <span>Live Preview Card</span>
                        <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                          Auto Generated
                        </Badge>
                      </div>

                      {/* Live Holiday Preview Card */}
                      <div className="flex items-center gap-3.5 rounded-lg border border-border bg-card p-4 shadow-xs">
                        <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 border border-primary/20 px-3.5 py-2.5 text-center min-w-[56px]">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                            {holidayDate ? holidayDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase() : "OCT"}
                          </span>
                          <span className="text-xl font-black text-foreground leading-tight">
                            {holidayDate ? String(holidayDate.getDate()).padStart(2, "0") : "24"}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-bold text-foreground truncate">
                              {newHolidayTitle || "Holiday Title"}
                            </span>
                            <span className="rounded-md bg-purple-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                              {newHolidayCategory.includes("National") ? "NATIONAL" : "FESTIVAL"}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {holidayDate ? holidayDate.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : "24 Oct 2026"}
                          </div>
                          <div className="text-[10px] text-primary/80 mt-0.5 truncate font-medium">
                            {newHolidayBranches.split(" (")[0]}
                          </div>
                        </div>
                      </div>

                      {/* Policy & Automation Notice */}
                      <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-xs text-muted-foreground">
                        <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="size-4 text-emerald-500" />
                          <span>Automated System Policies</span>
                        </div>
                        <ul className="space-y-1.5 text-xs leading-relaxed">
                          <li>• Register cells marked as closed (<strong className="text-foreground">HD / HOL</strong>).</li>
                          <li>• Automated missed-hour penalty fines waived for all students.</li>
                          <li>• WhatsApp notification broadcast queued 24h prior to all active students.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Footer Buttons Pinned */}
                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground text-xs"
                        onClick={() => setHolidayTab("history")}
                      >
                        View History
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-5 rounded-lg shadow-xs cursor-pointer gap-1.5"
                        onClick={handleDeclareHoliday}
                      >
                        <Check className="size-3.5" />
                        <span>Declare &amp; Add</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Holiday History */}
              {holidayTab === "history" && (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  {/* Filter Row */}
                  <div className="shrink-0 px-7 pt-4 pb-3 flex items-center justify-between text-xs border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHolidayFilter("all")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${holidayFilter === "all"
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        All ({holidays.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setHolidayFilter("upcoming")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${holidayFilter === "upcoming"
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        Upcoming ({upcomingCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setHolidayFilter("past")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${holidayFilter === "past"
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        Past ({pastCount})
                      </button>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      All Sundays auto-applied across campuses
                    </span>
                  </div>

                  {/* Holiday Cards in 2/3-Column Grid */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-7">
                    {filteredHolidays.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredHolidays.map((hol) => (
                          <div
                            key={hol.id}
                            className="flex items-center justify-between rounded-lg border border-border bg-card/60 hover:bg-muted/30 p-4 transition-colors shadow-xs"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              {/* Date Box */}
                              <div className="flex flex-col items-center justify-center rounded-lg bg-muted/60 border border-border px-3 py-2 text-center min-w-[54px] shrink-0">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  {hol.month}
                                </span>
                                <span className="text-xl font-black text-foreground leading-tight">
                                  {hol.day}
                                </span>
                              </div>

                              {/* Title & Badges */}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-foreground truncate">
                                    {hol.title}
                                  </span>
                                  {hol.category === "NATIONAL" ? (
                                    <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                                      NATIONAL
                                    </span>
                                  ) : (
                                    <span className="rounded-md bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                      FESTIVAL
                                    </span>
                                  )}
                                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {hol.status}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 truncate">
                                  {hol.dateStr}
                                </div>
                              </div>
                            </div>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => setHolidays(holidays.filter((h) => h.id !== hol.id))}
                              className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/10 cursor-pointer transition-colors shrink-0 ml-2"
                              title="Delete Holiday"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 space-y-2">
                        <Calendar className="size-8 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-muted-foreground">
                          No holidays found in this category
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          Switch filter tabs or declare a new gazetted holiday
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Weekly Offs & Day-Off Schedule Checklist */}
              {holidayTab === "weekly" && (
                <div className="flex-1 min-h-0 p-6 space-y-6 overflow-y-auto">
                  {/* Top Intro Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border bg-card/60">
                    <div>
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Calendar className="size-4 text-primary" />
                        Branch Day-Off Schedule &amp; Weekly Recurring Rules
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Configure regular weekly closures (e.g. all Sundays, 2nd &amp; 4th Saturdays) and define specific active weeks of the month.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="text-xs h-8 font-semibold shadow-xs gap-1.5 cursor-pointer"
                        onClick={handleApplyDayOffSchedule}
                      >
                        <Check className="size-3.5" />
                        <span>Save &amp; Apply Schedule</span>
                      </Button>
                    </div>
                  </div>

                  {/* Feedback Banner on Save */}
                  {dayOffApplySuccess && (
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in-0 duration-200">
                      <CheckCircle2 className="size-4" />
                      <span>Day-off schedule successfully saved! {calculatedOffDays.length} days applied as scheduled off in October 2026.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Form: Checklist Controls (7 cols) */}
                    <div className="lg:col-span-7 space-y-5">
                      {/* 1. Days of Week Checklist */}
                      <Card className="p-5 rounded-lg border border-border bg-card space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">1</span>
                            <span>Select Days of Week (Checklist)</span>
                          </Label>
                          <span className="text-[11px] text-muted-foreground">
                            {dayOffWeekdays.length} day(s) selected
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Choose which days the campus remains closed (e.g. check Sunday and Saturday):
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          {[
                            { dayNum: 0, label: "Sunday", short: "SUN", highlight: true },
                            { dayNum: 1, label: "Monday", short: "MON" },
                            { dayNum: 2, label: "Tuesday", short: "TUE" },
                            { dayNum: 3, label: "Wednesday", short: "WED" },
                            { dayNum: 4, label: "Thursday", short: "THU" },
                            { dayNum: 5, label: "Friday", short: "FRI" },
                            { dayNum: 6, label: "Saturday", short: "SAT", highlight: true },
                          ].map((item) => {
                            const isChecked = dayOffWeekdays.includes(item.dayNum)
                            return (
                              <button
                                key={item.dayNum}
                                type="button"
                                onClick={() => {
                                  if (isChecked) {
                                    setDayOffWeekdays((prev) => prev.filter((d) => d !== item.dayNum))
                                  } else {
                                    setDayOffWeekdays((prev) => [...prev, item.dayNum])
                                  }
                                }}
                                className={cn(
                                  "flex items-center gap-2 p-2.5 rounded-md border text-xs font-medium cursor-pointer transition-all text-left",
                                  isChecked
                                    ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                                    : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                              >
                                <div
                                  className={cn(
                                    "size-4 rounded flex items-center justify-center border text-[10px] shrink-0",
                                    isChecked
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "border-muted-foreground/40 bg-card"
                                  )}
                                >
                                  {isChecked && <Check className="size-3" />}
                                </div>
                                <div className="leading-tight">
                                  <div className="text-xs font-semibold">{item.label}</div>
                                  <div className="text-[10px] opacity-70">{item.short}</div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </Card>

                      {/* 2. Weeks of the Month Checklist */}
                      <Card className="p-5 rounded-lg border border-border bg-card space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">2</span>
                            <span>Select Which Weeks of the Month (Checklist)</span>
                          </Label>
                          <span className="text-[11px] text-muted-foreground">
                            {dayOffWeeks.length} of 5 weeks selected
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Specify recurrence in month (e.g. all weeks, or 2nd &amp; 4th alternate weeks):
                        </p>

                        {/* Quick Recurrence Presets */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {[
                            { label: "Every Week (All)", weeks: [1, 2, 3, 4, 5] },
                            { label: "Alternate (2nd & 4th)", weeks: [2, 4] },
                            { label: "1st & 3rd Weeks", weeks: [1, 3] },
                            { label: "1st & 4th Weeks", weeks: [1, 4] },
                          ].map((p) => (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => setDayOffWeeks(p.weeks)}
                              className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>

                        {/* Individual Week Checkboxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {[
                            { week: 1, label: "Week 1", days: "Days 01–07 of month" },
                            { week: 2, label: "Week 2", days: "Days 08–14 of month" },
                            { week: 3, label: "Week 3", days: "Days 15–21 of month" },
                            { week: 4, label: "Week 4", days: "Days 22–28 of month" },
                            { week: 5, label: "Week 5", days: "Days 29–31 of month" },
                          ].map((item) => {
                            const isChecked = dayOffWeeks.includes(item.week)
                            return (
                              <button
                                key={item.week}
                                type="button"
                                onClick={() => {
                                  if (isChecked) {
                                    setDayOffWeeks((prev) => prev.filter((w) => w !== item.week))
                                  } else {
                                    setDayOffWeeks((prev) => [...prev, item.week])
                                  }
                                }}
                                className={cn(
                                  "flex items-center gap-2.5 p-2.5 rounded-md border text-xs cursor-pointer transition-all text-left",
                                  isChecked
                                    ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                                    : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                              >
                                <div
                                  className={cn(
                                    "size-4 rounded flex items-center justify-center border text-[10px] shrink-0",
                                    isChecked
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "border-muted-foreground/40 bg-card"
                                  )}
                                >
                                  {isChecked && <Check className="size-3" />}
                                </div>
                                <div>
                                  <div className="text-xs font-semibold">{item.label}</div>
                                  <div className="text-[10px] opacity-70">{item.days}</div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </Card>

                      {/* 3. Branch & Scope Selector */}
                      <Card className="p-4 rounded-lg border border-border bg-card space-y-2 shadow-xs">
                        <Label className="text-xs font-bold text-foreground">
                          3. Branch &amp; Campus Scope
                        </Label>
                        <Select value={dayOffBranch} onValueChange={setDayOffBranch}>
                          <SelectTrigger className="h-9 text-xs bg-muted/30 border-border">
                            <SelectValue placeholder="Select campus" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All Campuses (Kothrud HQ + FC Road)">
                              All Campuses (Kothrud HQ + FC Road)
                            </SelectItem>
                            <SelectItem value="Kothrud Main Campus HQ Only">
                              Kothrud Main Campus HQ Only
                            </SelectItem>
                            <SelectItem value="FC Road Branch Only">
                              FC Road Branch Only
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Card>
                    </div>

                    {/* Right Column: Live Calendar Impact & Dates List Preview (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                      <Card className="p-5 rounded-lg border border-border bg-card space-y-4 shadow-xs">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Activity className="size-3.5 text-primary" />
                            <span>October 2026 Off Days Preview</span>
                          </h5>
                          <Badge className="bg-primary text-primary-foreground text-xs font-bold">
                            {calculatedOffDays.length} Days Off
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Based on your selected days and weeks, the following dates will be automatically treated as off:
                        </p>

                        {/* List of affected dates */}
                        {calculatedOffDays.length === 0 ? (
                          <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md">
                            No off days selected. Select at least one day of the week and one week above.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                            {calculatedOffDays.map((d) => (
                              <div
                                key={d.dayNum}
                                className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/30 text-xs font-medium"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "size-2 rounded-full",
                                      d.weekdayName === "Sun" ? "bg-cyan-500" : "bg-primary"
                                    )}
                                  />
                                  <span className="font-semibold text-foreground">{d.dateFormatted}</span>
                                </div>
                                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                  Week {d.weekNum}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="p-3 rounded-md bg-muted/40 border border-border text-[11px] text-muted-foreground space-y-1">
                          <div className="font-semibold text-foreground flex items-center gap-1">
                            <ShieldCheck className="size-3 text-emerald-500" />
                            No Absence Penalties Applied
                          </div>
                          <div>
                            Students are not penalized on configured weekly off days. Monthly attendance matrix shows 'SUN' or 'HD' indicator.
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ============================================================ */}
        {/* MODAL 2: Manual Attendance Form Modal with Website Components */}
        {/* ============================================================ */}
        <Dialog open={markAttendanceModalOpen} onOpenChange={setMarkAttendanceModalOpen}>
          <DialogContent
            onPointerDownOutside={(e) => {
              const target = e.target as HTMLElement | null
              if (
                target?.closest?.("[data-radix-popper-content-wrapper]") ||
                target?.closest?.("[data-slot=\"popover-content\"]") ||
                target?.closest?.(".rdp")
              ) {
                e.preventDefault()
              }
            }}
            className="sm:max-w-[1080px] w-[94vw] max-h-[90vh] p-0 flex flex-col overflow-hidden rounded-lg bg-card border border-border text-foreground shadow-2xl"
          >
            {/* Pinned Header */}
            <div className="p-6 pb-4 border-b border-border shrink-0 flex items-center justify-between gap-4">
              <DialogHeader className="text-start space-y-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-4 text-primary" />
                  <DialogTitle className="text-base font-bold text-foreground">
                    Manual Attendance Entry
                  </DialogTitle>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    Staff Verified
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Record manual walk-in presence, biometric override, or GPS radius exemption with official staff verification.
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Scrollable Form Body - 2 Columns Layout for Wide Dialog */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Student Selection & Profile Card (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Student Select with Website Avatar Component */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-foreground">
                        Select Student <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-[11px] text-muted-foreground">
                        {manualStudentList.length} registered students
                      </span>
                    </div>

                    <Select value={manualSelectedStudentId} onValueChange={setManualSelectedStudentId}>
                      <SelectTrigger className="h-11 rounded-lg border border-border bg-card px-3 text-left w-full hover:bg-muted/30 transition-colors">
                        <SelectValue placeholder="Select student">
                          {(() => {
                            const current = manualStudentList.find((s) => s.id === manualSelectedStudentId) || manualStudentList[0]
                            if (!current) return null
                            return (
                              <div className="flex items-center gap-2.5 w-full min-w-0">
                                <Avatar className="size-6 rounded-full shrink-0 border border-border">
                                  <AvatarImage src={current.avatar} alt={current.name} />
                                  <AvatarFallback className="text-[10px]">
                                    {current.name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-xs text-foreground truncate">{current.name}</span>
                                <span className="text-muted-foreground font-mono text-[10px]">({current.code})</span>
                                <span className="text-muted-foreground text-[10px] ml-auto truncate">• {current.seat}</span>
                              </div>
                            )
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent hideScrollButtons className="z-[200] bg-popover border border-border text-popover-foreground rounded-lg max-h-72">
                        {manualStudentList.map((st) => (
                          <SelectItem key={st.id} value={st.id} className="py-2.5 cursor-pointer">
                            <div className="flex items-center gap-3 w-full">
                              <Avatar className="size-7 rounded-full shrink-0 border border-border">
                                <AvatarImage src={st.avatar} alt={st.name} />
                                <AvatarFallback className="text-[10px]">
                                  {st.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col text-left min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs text-foreground">{st.name}</span>
                                  <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] text-muted-foreground font-mono">
                                    {st.code}
                                  </span>
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                  {st.seat} • {st.shift}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Student Profile Summary Card */}
                  {(() => {
                    const current = manualStudentList.find((s) => s.id === manualSelectedStudentId) || manualStudentList[0]
                    if (!current) return null
                    return (
                      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3.5">
                        <div className="flex items-start gap-3.5">
                          <Avatar className="size-13 rounded-full border-2 border-primary/30 shrink-0">
                            <AvatarImage src={current.avatar} alt={current.name} />
                            <AvatarFallback className="text-sm font-bold">
                              {current.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-sm font-bold text-foreground truncate">{current.name}</h4>
                              <span className={"px-2 py-0.5 rounded-full text-[10px] font-semibold border " + current.statusColor}>
                                {current.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                              <span>{current.code}</span>
                              <span>•</span>
                              <span>{current.seat}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">{current.shift}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[11px]">
                          <div className="rounded-lg bg-card/60 p-2 border border-border/40">
                            <span className="text-[10px] text-muted-foreground block font-medium">Biometric ID</span>
                            <span className="font-semibold text-foreground">{current.biometricId || "BIO-8842"}</span>
                          </div>
                          <div className="rounded-lg bg-card/60 p-2 border border-border/40">
                            <span className="text-[10px] text-muted-foreground block font-medium">Monthly Score</span>
                            <span className="font-semibold text-emerald-400">{current.attendanceRate || "94% Good"}</span>
                          </div>
                          <div className="col-span-2 rounded-lg bg-card/60 p-2 border border-border/40 flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Guardian Contact</span>
                            <span className="font-medium text-foreground">{current.guardian || "Parent: +91 98220 14890"}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* RIGHT COLUMN: Date/Time Picker, Gate, Status & Reason (7 Cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Attendance Date & Time + Gate Location in 2 Sub-Columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Website Unified Date & Time Picker */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Attendance Date &amp; Time <span className="text-destructive">*</span>
                      </Label>
                      <DateTimePicker
                        value={manualDateTime}
                        onValueChange={setManualDateTime}
                        formatStr="EEE, dd MMM yyyy • hh:mm a"
                        buttonClassName="h-10 rounded-lg bg-card border-border text-xs font-medium text-foreground hover:bg-muted/30"
                        placeholder="Pick date and time"
                        popoverContentClassName="z-[200]"
                        modal={true}
                      />
                    </div>

                    {/* Gate / Biometric Location with Website Dropdown Component */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Gate / Biometric Location <span className="text-destructive">*</span>
                      </Label>
                      <Select value={manualGate} onValueChange={setManualGate}>
                        <SelectTrigger className="h-10 w-full rounded-lg bg-card border-border text-xs text-foreground">
                          <SelectValue placeholder="Select gate location" />
                        </SelectTrigger>
                        <SelectContent className="z-[200] bg-popover border border-border text-popover-foreground rounded-lg">
                          <SelectItem value="Kothrud Main Turnstile (Gate A)">
                            Kothrud Main Turnstile (Gate A)
                          </SelectItem>
                          <SelectItem value="FC Road Branch (3rd Floor Biometric)">
                            FC Road Branch (3rd Floor Biometric)
                          </SelectItem>
                          <SelectItem value="Manual Staff Reception Desk (Exemption)">
                            Manual Staff Reception Desk (Exemption)
                          </SelectItem>
                          <SelectItem value="Library Study Hall North Turnstile">
                            Library Study Hall North Turnstile
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Attendance Status Selection */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Attendance Status To Mark
                    </Label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setManualStatus("Present")}
                        className={"flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer " + (
                          manualStatus === "Present"
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500"
                            : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>Present</span>
                        <span className="text-[10px] font-mono opacity-80">(P)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualStatus("Late")}
                        className={"flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer " + (
                          manualStatus === "Late"
                            ? "border-amber-500 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500"
                            : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>Late</span>
                        <span className="text-[10px] font-mono opacity-80">(L)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualStatus("Half Day")}
                        className={"flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer " + (
                          manualStatus === "Half Day"
                            ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500"
                            : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>Half Day</span>
                        <span className="text-[10px] font-mono opacity-80">(HD)</span>
                      </button>
                    </div>
                  </div>

                  {/* Reason for manual mark with Demo Chips */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-foreground">
                        Reason for manual mark <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-[11px] text-muted-foreground">Click demo preset below:</span>
                    </div>
                    <Input
                      value={manualReason}
                      onChange={(e) => setManualReason(e.target.value)}
                      placeholder="e.g. Indoor GPS glitch on mobile, biometric scanner offline"
                      className="h-10 rounded-lg bg-card border-border px-3.5 text-xs text-foreground placeholder:text-muted-foreground font-medium"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setManualReason("Indoor GPS glitch on mobile")}
                        className="rounded border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      >
                        Indoor GPS glitch
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualReason("Phone battery died before scan")}
                        className="rounded border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      >
                        Phone battery died
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualReason("Biometric turnstile finger sensor failed")}
                        className="rounded border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      >
                        Biometric sensor failed
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualReason("ID card forgotten, verified by supervisor")}
                        className="rounded border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      >
                        Card forgotten (Supervisor verified)
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualReason("Approved emergency late arrival")}
                        className="rounded border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      >
                        Approved late arrival
                      </button>
                    </div>
                  </div>

                  {/* Staff Verification Audit Note */}
                  <div className="rounded-lg bg-muted/30 border border-border/50 p-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <ShieldCheck className="size-3.5 text-primary shrink-0" />
                    <span>Official Staff Action • Logged under ID #ADM-04 with campus audit timestamp</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned Footer */}
            <div className="p-4 px-6 border-t border-border flex items-center justify-between shrink-0 bg-muted/10">
              <div className="text-xs text-muted-foreground hidden sm:block">
                Marking <span className="font-semibold text-foreground">{manualStudentList.find((s) => s.id === manualSelectedStudentId)?.name || "student"}</span> as{" "}
                <span className="font-semibold text-foreground">{manualStatus}</span> on{" "}
                <span className="font-semibold text-foreground">
                  {manualDateTime ? format(manualDateTime, "dd MMM yyyy, hh:mm a") : "selected time"}
                </span>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMarkAttendanceModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleManualAttendanceConfirm}
                  className="h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-xs cursor-pointer gap-1.5"
                >
                  <UserCheck className="size-3.5" />
                  <span>Confirm &amp; Mark Attendance</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ============================================================ */}
        {/* MODAL 3: Print Poster Ready Modal                            */}
        {/* ============================================================ */}
        <Dialog open={printPosterModalOpen} onOpenChange={setPrintPosterModalOpen}>
          <DialogContent className="max-w-md rounded-lg bg-card border border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <Printer className="size-4 text-primary" />
                Print Official Attendance QR Standee
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Place this high-contrast poster at the entrance reception desk
              </DialogDescription>
            </DialogHeader>

            {/* Printable Poster Sheet Preview */}
            <div className="rounded-lg border border-border bg-white text-black p-6 flex flex-col items-center text-center space-y-3">
              <div className="text-sm font-extrabold uppercase tracking-widest text-blue-600">
                KOTHRUD CAMPUS (HQ)
              </div>
              <div className="text-xs font-medium text-neutral-600">
                Central Reading &amp; Study Library
              </div>

              <div className="p-3 border-2 border-black rounded-lg bg-white my-1">
                <QrCode className="size-44 text-black" />
              </div>

              <div className="space-y-0.5">
                <div className="text-xs font-bold uppercase text-black">
                  SCAN TO CLOCK ATTENDANCE
                </div>
                <div className="text-[10px] text-neutral-500">
                  Open phone camera or student app • GPS geofence enabled
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrintPosterModalOpen(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => {
                  window.print()
                  setPrintPosterModalOpen(false)
                }}
              >
                <Printer className="size-3.5" />
                Print Poster (A4)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ============================================================ */}
        {/* MODAL 4: Quick Status Override Dialog (matching Image 4)     */}
        {/* NOTE: Strictly WITHOUT Holiday option as instructed by user   */}
        {/* ============================================================ */}
        <Dialog
          open={!!editStatusCell}
          onOpenChange={(open) => {
            if (!open) setEditStatusCell(null)
          }}
        >
          <DialogContent className="max-w-sm p-6 rounded-lg bg-card border border-border text-foreground shadow-2xl">
            <DialogHeader className="text-start space-y-0.5">
              <DialogTitle className="text-base font-bold text-foreground">
                {editStatusCell?.studentName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {editStatusCell?.dayNum} Oct {selectedYear} • Day {parseInt(editStatusCell?.dayNum || "1", 10)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Current Status Box */}
              <div className="rounded-lg bg-muted/40 border border-border p-3.5 flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Current Status:</span>
                <span className="font-bold text-foreground">{editStatusCell?.currentStatus}</span>
              </div>

              {/* Instruction prompt */}
              <p className="text-xs text-muted-foreground">
                Select a quick status to override attendance for this day:
              </p>

              {/* Status Button Grid (WITHOUT Holiday Option as requested) */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOverrideStatus("P")}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold py-2.5 text-xs cursor-pointer transition-colors"
                >
                  <span>P • Present</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOverrideStatus("L")}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold py-2.5 text-xs cursor-pointer transition-colors"
                >
                  <span>L • Late</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOverrideStatus("AB")}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 font-semibold py-2.5 text-xs cursor-pointer transition-colors"
                >
                  <span>AB • Absent</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditStatusCell(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
