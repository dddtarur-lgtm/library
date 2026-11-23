"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Banknote,
  BarChart3,
  BookCheck,
  BookMarked,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  CreditCard,
  Download,
  Edit2,
  Edit3,
  FileSpreadsheet,
  FolderPlus,
  HelpCircle,
  Layers,
  LayoutGrid,
  List,
  MapPin,
  MoreHorizontal,
  Plus,
  QrCode,
  Receipt,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  Wallet,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { initialBooksCatalog, type BookItem } from "@/data/library-management-data"
import { studentsDatabase } from "@/data/students-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"
import { cn } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export interface BookCategory {
  id: string
  name: string
  description: string
  color: string
}

export interface BookFineRecord {
  id: string
  studentName: string
  studentCode: string
  bookTitle: string
  barcode: string
  fineType: "Late Return" | "Physical Damage" | "Lost Book" | "Highlighting / Scribbling"
  details: string
  amount: number
  assessedDate: string
  status: "Unpaid" | "Collected" | "Waived"
  collectedMode?: "Cash" | "UPI"
  collectedAt?: string
}

const INITIAL_CATEGORIES: BookCategory[] = [
  {
    id: "cat-1",
    name: "UPSC & Civil Services",
    description: "Polity, Indian economy, modern history, governance & civil services study material.",
    color: "hsl(var(--primary))",
  },
  {
    id: "cat-2",
    name: "Medical & NEET",
    description: "Biology, human anatomy, organic chemistry, botany & clinical reference manuals.",
    color: "hsl(142.1 76.2% 36.3%)", // emerald
  },
  {
    id: "cat-3",
    name: "Engineering & JEE",
    description: "Concepts of physics, advanced calculus, coordinate geometry & mechanics.",
    color: "hsl(217.2 91.2% 59.8%)", // blue
  },
  {
    id: "cat-4",
    name: "Banking & SSC",
    description: "Quantitative aptitude, verbal ability, logical reasoning & mock papers.",
    color: "hsl(37.7 92.1% 50.2%)", // amber
  },
  {
    id: "cat-5",
    name: "Novels & Literature",
    description: "Classic literature, modern biographies, philosophy & self-improvement books.",
    color: "hsl(280 65% 60%)", // purple
  },
  {
    id: "cat-6",
    name: "General Studies",
    description: "Current affairs yearbooks, atlas volumes, and encyclopedias.",
    color: "hsl(180 70% 45%)", // teal
  },
]

const INITIAL_FINES: BookFineRecord[] = [
  {
    id: "fine-1",
    studentName: "Aditya Kulkarni",
    studentCode: "SHR-0103",
    bookTitle: "Indian Polity (7th Edition)",
    barcode: "BK-POL-003",
    fineType: "Late Return",
    details: "4 days overdue past 14-day borrowing allowance (₹5 / day)",
    amount: 20,
    assessedDate: "03 Nov 2026",
    status: "Unpaid",
  },
  {
    id: "fine-2",
    studentName: "Rohan Sharma",
    studentCode: "SHR-0101",
    bookTitle: "Concepts of Physics (Vol 1)",
    barcode: "BK-PHY-001",
    fineType: "Physical Damage",
    details: "Water spill marks and torn page index (Cover replaced)",
    amount: 350,
    assessedDate: "02 Nov 2026",
    status: "Unpaid",
  },
  {
    id: "fine-3",
    studentName: "Priya Patel",
    studentCode: "SHR-0102",
    bookTitle: "Organic Chemistry for NEET",
    barcode: "BK-CHM-002",
    fineType: "Late Return",
    details: "15 days overdue past return date (₹5 / day rate)",
    amount: 75,
    assessedDate: "01 Nov 2026",
    status: "Collected",
    collectedMode: "Cash",
    collectedAt: "02 Nov 2026",
  },
  {
    id: "fine-4",
    studentName: "Kunal Jadhav",
    studentCode: "SHR-0107",
    bookTitle: "Objective Biology for NEET",
    barcode: "BK-BIO-004",
    fineType: "Lost Book",
    details: "Student lost textbook during travel. Replacement charge + ₹100 admin processing",
    amount: 1250,
    assessedDate: "30 Oct 2026",
    status: "Collected",
    collectedMode: "UPI",
    collectedAt: "31 Oct 2026",
  },
  {
    id: "fine-5",
    studentName: "Sneha Deshmukh",
    studentCode: "SHR-0104",
    bookTitle: "General Studies Compendium",
    barcode: "BK-GS-008",
    fineType: "Highlighting / Scribbling",
    details: "Highlighter pen marks across 6 chapters",
    amount: 100,
    assessedDate: "28 Oct 2026",
    status: "Waived",
  },
]

// Circulation analytics dataset
const CIRCULATION_MONTHLY_DATA = [
  { month: "Jun", issued: 85, returned: 78, overdue: 6 },
  { month: "Jul", issued: 110, returned: 98, overdue: 9 },
  { month: "Aug", issued: 145, returned: 132, overdue: 12 },
  { month: "Sep", issued: 130, returned: 124, overdue: 7 },
  { month: "Oct", issued: 165, returned: 152, overdue: 11 },
  { month: "Nov", issued: 142, returned: 130, overdue: 8 },
]

// Custom Recharts Tooltip for high-contrast dark mode display with smooth hover card
const ChartCustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-popover/95 backdrop-blur-md border border-border px-3.5 py-3 rounded-lg shadow-xl text-xs space-y-1.5 min-w-[180px] z-50">
      <div className="font-bold text-foreground border-b border-border pb-1 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] text-muted-foreground font-normal">Monthly Circulation</span>
      </div>
      {payload.map((entry: any, index: number) => (
        <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-muted-foreground">{entry.name}:</span>
          </div>
          <span className="font-mono font-bold text-foreground">{entry.value} books</span>
        </div>
      ))}
    </div>
  )
}

const CategoryChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null
  const item = payload[0]
  return (
    <div className="bg-popover/95 backdrop-blur-md border border-border px-3.5 py-2.5 rounded-lg shadow-xl text-xs space-y-1 min-w-[170px] z-50">
      <div className="font-bold text-foreground border-b border-border pb-1">
        {item?.payload?.fullName || label}
      </div>
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <span className="text-muted-foreground">Currently Borrowed:</span>
        <span className="font-mono font-bold text-blue-500">{item?.value} copies</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Total Titles:</span>
        <span className="font-mono font-bold text-foreground">{item?.payload?.titles}</span>
      </div>
    </div>
  )
}

export default function BookCatalogPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  // First tab defaults to analytics as requested
  const [activeTab, setActiveTab] = useState("analytics")

  // Ensure every book has a bookNumber
  const [books, setBooks] = useState<BookItem[]>(() =>
    initialBooksCatalog.map((b, idx) => ({
      ...b,
      bookNumber: b.bookNumber || `BK-${1001 + idx}`,
    }))
  )
  const [categories, setCategories] = useState<BookCategory[]>(INITIAL_CATEGORIES)
  const [fines, setFines] = useState<BookFineRecord[]>(INITIAL_FINES)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  // Catalog search & filter
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")

  // Book Modal states (Publisher removed, Author optional)
  const [addBookModalOpen, setAddBookModalOpen] = useState(false)
  const [editBookModalOpen, setEditBookModalOpen] = useState(false)
  const [selectedBookForEdit, setSelectedBookForEdit] = useState<BookItem | null>(null)
  const [bookTitle, setBookTitle] = useState("")
  const [bookNumber, setBookNumber] = useState("")
  const [bookAuthor, setBookAuthor] = useState("")
  const [bookIsbn, setBookIsbn] = useState("")
  const [bookCategory, setBookCategory] = useState("UPSC & Civil Services")
  const [bookRack, setBookRack] = useState("Rack A-01 (Shelf 2)")
  const [bookCopies, setBookCopies] = useState(3)
  const [bookPrice, setBookPrice] = useState(650)

  // Quick Issue Book to Student Modal
  const [issueBookModalOpen, setIssueBookModalOpen] = useState(false)
  const [selectedBookForIssue, setSelectedBookForIssue] = useState<BookItem | null>(null)
  const [issueStudentId, setIssueStudentId] = useState(studentsDatabase[0]?.id || "")
  const [issueDurationDays, setIssueDurationDays] = useState(14)

  // Book Return Modal states
  const [returnBookModalOpen, setReturnBookModalOpen] = useState(false)
  const [returnBookId, setReturnBookId] = useState("")
  const [returnStudentCode, setReturnStudentCode] = useState(studentsDatabase[0]?.studentId || "SHR-0103")
  const [returnCondition, setReturnCondition] = useState<"Good" | "Late Return" | "Minor Damage" | "Major Damage">("Good")
  const [returnOverdueDays, setReturnOverdueDays] = useState(0)
  const [returnDamageFee, setReturnDamageFee] = useState(0)
  const [returnNotes, setReturnNotes] = useState("")

  // Category Modal states
  const [addCatModalOpen, setAddCatModalOpen] = useState(false)
  const [editCatModalOpen, setEditCatModalOpen] = useState(false)
  const [selectedCatForEdit, setSelectedCatForEdit] = useState<BookCategory | null>(null)
  const [catName, setCatName] = useState("")
  const [catDesc, setCatDesc] = useState("")
  const [catColor, setCatColor] = useState("hsl(var(--primary))")

  // Fine Modal states
  const [assessFineModalOpen, setAssessFineModalOpen] = useState(false)
  const [collectFineModalOpen, setCollectFineModalOpen] = useState(false)
  const [selectedFineRecord, setSelectedFineRecord] = useState<BookFineRecord | null>(null)
  const [fineStudentName, setFineStudentName] = useState(studentsDatabase[0]?.name || "Aditya Kulkarni")
  const [fineStudentCode, setFineStudentCode] = useState(studentsDatabase[0]?.studentId || "SHR-0103")
  const [fineBookTitle, setFineBookTitle] = useState("")
  const [fineBarcode, setFineBarcode] = useState("")
  const [fineType, setFineType] = useState<BookFineRecord["fineType"]>("Late Return")
  const [fineDetails, setFineDetails] = useState("")
  const [fineAmount, setFineAmount] = useState(50)
  const [collectMode, setCollectMode] = useState<"Cash" | "UPI">("Cash")

  // Helper to retrieve student avatar from template dataset
  const getStudentAvatar = (name: string, code: string) => {
    const student = studentsDatabase.find(
      (s) => s.name.toLowerCase() === name.toLowerCase() || s.studentId === code
    )
    return (
      student?.avatar ||
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`
    )
  }

  // Filtered books (also searches by bookNumber)
  const filteredBooks = books.filter((b) => {
    if (selectedCategory !== "All Categories" && b.category !== selectedCategory) return false
    if (availabilityFilter === "available" && b.availableCopies === 0) return false
    if (availabilityFilter === "loaned" && b.availableCopies > 0) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = b.title.toLowerCase().includes(q)
      const matchAuthor = b.author.toLowerCase().includes(q)
      const matchIsbn = b.isbn.toLowerCase().includes(q)
      const matchRack = b.rackLocation.toLowerCase().includes(q)
      const matchNumber = b.bookNumber ? b.bookNumber.toLowerCase().includes(q) : false
      if (!matchTitle && !matchAuthor && !matchIsbn && !matchRack && !matchNumber) return false
    }
    return true
  })

  // Key Totals
  const totalTitles = books.length
  const totalPhysicalCopies = books.reduce((acc, b) => acc + b.totalCopies, 0)
  const totalIssued = books.reduce((acc, b) => acc + b.issuedCopies, 0)
  const totalAvailable = books.reduce((acc, b) => acc + b.availableCopies, 0)

  // Book Handlers (Author is optional, publisher removed)
  const handleOpenAddBook = () => {
    setBookTitle("")
    setBookNumber(`BK-${1001 + books.length}`)
    setBookAuthor("")
    setBookIsbn(`978-${Math.floor(1000000000 + Math.random() * 9000000000)}`)
    setBookCategory(categories[0]?.name || "UPSC & Civil Services")
    setBookRack("Rack A-01 (Shelf 2)")
    setBookCopies(3)
    setBookPrice(750)
    setAddBookModalOpen(true)
  }

  const handleCreateBook = () => {
    if (!bookTitle.trim()) {
      toast.error("Please provide book title.")
      return
    }
    const newBook: BookItem = {
      id: `book-${Date.now()}`,
      bookNumber: bookNumber.trim() || `BK-${1001 + books.length}`,
      title: bookTitle.trim(),
      author: bookAuthor.trim() || "General Reference",
      isbn: bookIsbn || "978-0000000000",
      category: bookCategory as any,
      rackLocation: bookRack,
      totalCopies: bookCopies,
      availableCopies: bookCopies,
      issuedCopies: 0,
      price: bookPrice,
      publisher: "Standard Library Edition",
      editionYear: 2024,
      coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80",
      rating: 5.0,
    }
    setBooks([newBook, ...books])
    setAddBookModalOpen(false)
    toast.success(`Book "${bookTitle}" (#${newBook.bookNumber}) added to catalog!`)
  }

  const handleOpenEditBook = (b: BookItem) => {
    setSelectedBookForEdit(b)
    setBookTitle(b.title)
    setBookNumber(b.bookNumber || `BK-${b.id}`)
    setBookAuthor(b.author || "")
    setBookIsbn(b.isbn)
    setBookCategory(b.category)
    setBookRack(b.rackLocation)
    setBookCopies(b.totalCopies)
    setBookPrice(b.price)
    setEditBookModalOpen(true)
  }

  const handleSaveEditBook = () => {
    if (!selectedBookForEdit || !bookTitle.trim()) return
    const diffCopies = bookCopies - selectedBookForEdit.totalCopies
    setBooks(
      books.map((b) =>
        b.id === selectedBookForEdit.id
          ? {
              ...b,
              bookNumber: bookNumber.trim() || b.bookNumber,
              title: bookTitle.trim(),
              author: bookAuthor.trim() || "General Reference",
              isbn: bookIsbn.trim(),
              category: bookCategory as any,
              rackLocation: bookRack.trim(),
              totalCopies: bookCopies,
              availableCopies: Math.max(0, b.availableCopies + diffCopies),
              price: bookPrice,
            }
          : b
      )
    )
    setEditBookModalOpen(false)
    toast.success(`Book details for "${bookTitle}" updated!`)
  }

  const handleDeleteBook = (bookId: string, title: string) => {
    setBooks(books.filter((b) => b.id !== bookId))
    toast.success(`Book "${title}" removed from catalog.`)
  }

  // Issue Book Handlers
  const handleOpenIssueBook = (b: BookItem) => {
    if (b.availableCopies <= 0) {
      toast.error(`All copies of "${b.title}" are currently borrowed.`)
      return
    }
    setSelectedBookForIssue(b)
    setIssueDurationDays(14)
    setIssueBookModalOpen(true)
  }

  const handleConfirmIssueBook = () => {
    if (!selectedBookForIssue) return
    const student = studentsDatabase.find((s) => s.id === issueStudentId) || studentsDatabase[0]

    setBooks(
      books.map((b) =>
        b.id === selectedBookForIssue.id
          ? {
              ...b,
              availableCopies: Math.max(0, b.availableCopies - 1),
              issuedCopies: b.issuedCopies + 1,
            }
          : b
      )
    )

    setIssueBookModalOpen(false)
    toast.success(`Issued "${selectedBookForIssue.title}" (${selectedBookForIssue.bookNumber || "BK"}) to ${student.name}!`, {
      description: `Return due in ${issueDurationDays} days. Student ID: ${student.studentId}`,
    })
  }

  // Return Book Handlers
  const handleOpenReturnBook = (b?: BookItem) => {
    const targetBook = b || books.find((bk) => bk.issuedCopies > 0) || books[0]
    setReturnBookId(targetBook?.id || "")
    setReturnCondition("Good")
    setReturnOverdueDays(0)
    setReturnDamageFee(0)
    setReturnNotes("")
    setReturnBookModalOpen(true)
  }

  const handleConfirmReturnBook = () => {
    const book = books.find((b) => b.id === returnBookId)
    if (!book) return

    const student = studentsDatabase.find((s) => s.studentId === returnStudentCode) || studentsDatabase[0]

    // Update book inventory
    setBooks(
      books.map((b) =>
        b.id === returnBookId
          ? {
              ...b,
              availableCopies: Math.min(b.totalCopies, b.availableCopies + 1),
              issuedCopies: Math.max(0, b.issuedCopies - 1),
            }
          : b
      )
    )

    // If fine assessed
    if (returnDamageFee > 0) {
      const newFine: BookFineRecord = {
        id: `fine-${Date.now()}`,
        studentName: student.name,
        studentCode: student.studentId,
        bookTitle: book.title,
        barcode: book.bookNumber || book.isbn,
        fineType: returnCondition === "Late Return" ? "Late Return" : "Physical Damage",
        details:
          returnCondition === "Late Return"
            ? `${returnOverdueDays} days late return past allowance`
            : `Condition on return: ${returnCondition}. ${returnNotes}`.trim(),
        amount: returnDamageFee,
        assessedDate: "Just now",
        status: "Unpaid",
      }
      setFines([newFine, ...fines])
      toast.warning(`Book returned with ₹${returnDamageFee} penalty charged to ${student.name}!`, {
        description: `Fine recorded in Fines & Damage Ledger. Book restocked on ${book.rackLocation}.`,
      })
    } else {
      toast.success(`"${book.title}" returned safely by ${student.name}!`, {
        description: `Restocked on ${book.rackLocation}. Available copies: ${book.availableCopies + 1}/${book.totalCopies}.`,
      })
    }

    setReturnBookModalOpen(false)
  }

  // Category Handlers
  const handleOpenAddCategory = () => {
    setCatName("")
    setCatDesc("")
    setCatColor("hsl(var(--primary))")
    setAddCatModalOpen(true)
  }

  const handleCreateCategory = () => {
    if (!catName.trim()) {
      toast.error("Please enter a category name.")
      return
    }
    const newCat: BookCategory = {
      id: `cat-${Date.now()}`,
      name: catName.trim(),
      description: catDesc.trim() || "Study textbooks and reference volumes.",
      color: catColor,
    }
    setCategories([...categories, newCat])
    setAddCatModalOpen(false)
    toast.success(`Category "${catName}" added!`)
  }

  const handleOpenEditCategory = (cat: BookCategory) => {
    setSelectedCatForEdit(cat)
    setCatName(cat.name)
    setCatDesc(cat.description)
    setCatColor(cat.color)
    setEditCatModalOpen(true)
  }

  const handleSaveEditCategory = () => {
    if (!selectedCatForEdit || !catName.trim()) return
    const oldName = selectedCatForEdit.name
    const newName = catName.trim()

    setCategories(
      categories.map((c) =>
        c.id === selectedCatForEdit.id
          ? { ...c, name: newName, description: catDesc.trim(), color: catColor }
          : c
      )
    )

    if (oldName !== newName) {
      setBooks(
        books.map((b) => (b.category === oldName ? { ...b, category: newName as any } : b))
      )
    }

    setEditCatModalOpen(false)
    toast.success(`Category updated to "${newName}"!`)
  }

  const handleDeleteCategory = (catId: string, name: string) => {
    const booksInCat = books.filter((b) => b.category === name)
    if (booksInCat.length > 0) {
      const fallbackCat = categories.find((c) => c.id !== catId)?.name || "General Studies"
      setBooks(
        books.map((b) => (b.category === name ? { ...b, category: fallbackCat as any } : b))
      )
      toast.info(`${booksInCat.length} books reassigned to "${fallbackCat}".`)
    }
    setCategories(categories.filter((c) => c.id !== catId))
    toast.success(`Category "${name}" deleted.`)
  }

  // Fine Handlers with Student Dropdown
  const handleOpenAssessFine = () => {
    const defaultStudent = studentsDatabase[0]
    setFineStudentName(defaultStudent?.name || "Aditya Kulkarni")
    setFineStudentCode(defaultStudent?.studentId || "SHR-0103")
    setFineBookTitle("Indian Polity (7th Edition)")
    setFineBarcode("BK-POL-003")
    setFineType("Late Return")
    setFineDetails("4 days late returning book (₹5 / day rate)")
    setFineAmount(20)
    setAssessFineModalOpen(true)
  }

  const handleCreateFine = () => {
    if (!fineBookTitle.trim() || !fineAmount) {
      toast.error("Please fill in book and fine amount.")
      return
    }
    const newFine: BookFineRecord = {
      id: `fine-${Date.now()}`,
      studentName: fineStudentName.trim(),
      studentCode: fineStudentCode.trim() || "STU-NEW",
      bookTitle: fineBookTitle.trim(),
      barcode: fineBarcode.trim() || "BK-000",
      fineType,
      details: fineDetails.trim() || "Penalty assessed for library policy violation.",
      amount: fineAmount,
      assessedDate: "Just now",
      status: "Unpaid",
    }
    setFines([newFine, ...fines])
    setAssessFineModalOpen(false)
    toast.success(`Fine of ₹${fineAmount} recorded for ${fineStudentName}!`)
  }

  const handleOpenCollectFine = (record: BookFineRecord) => {
    setSelectedFineRecord(record)
    setCollectMode("Cash")
    setCollectFineModalOpen(true)
  }

  const handleConfirmCollectFine = () => {
    if (!selectedFineRecord) return
    setFines(
      fines.map((f) =>
        f.id === selectedFineRecord.id
          ? {
              ...f,
              status: "Collected",
              collectedMode: collectMode,
              collectedAt: "Just now",
            }
          : f
      )
    )
    setCollectFineModalOpen(false)
    toast.success(`Collected ₹${selectedFineRecord.amount} from ${selectedFineRecord.studentName}!`, {
      description: `Payment recorded via ${collectMode}. Reconciled into Cash Day-Book.`,
    })
  }

  const handleWaiveFine = (recordId: string, studentName: string) => {
    setFines(
      fines.map((f) => (f.id === recordId ? { ...f, status: "Waived" } : f))
    )
    toast.info(`Fine waived for ${studentName}`, {
      description: "Penalty cleared with authorized administrator waiver.",
    })
  }

  // Fine Totals
  const totalFinesCollected = fines
    .filter((f) => f.status === "Collected")
    .reduce((acc, f) => acc + f.amount, 0)
  const totalPendingFines = fines
    .filter((f) => f.status === "Unpaid")
    .reduce((acc, f) => acc + f.amount, 0)
  const unpaidCount = fines.filter((f) => f.status === "Unpaid").length

  // Category distribution data for chart
  const categoryDistributionData = categories.map((cat) => {
    const booksInCat = books.filter((b) => b.category === cat.name)
    const titles = booksInCat.length
    const totalCopies = booksInCat.reduce((acc, b) => acc + b.totalCopies, 0)
    const issuedCopies = booksInCat.reduce((acc, b) => acc + b.issuedCopies, 0)
    return {
      name: cat.name.split("&")[0].trim(),
      fullName: cat.name,
      titles,
      totalCopies,
      issuedCopies,
    }
  })

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 space-y-4 p-4 sm:p-6">
      {/* 1. Header Section - Using website theme border radius and single-row alignment */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-3.5 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
            <BookOpen className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              Library Book Catalog &amp; Circulation
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
              Physical book inventory, subject categories, reading trends, and late return / damage penalties.
            </p>
          </div>
        </div>

        {/* Action Buttons - Includes Return Book, Charge Fine, Add Category, Add Book */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <Button
            size="sm"
            onClick={() => handleOpenReturnBook()}
            variant="outline"
            className="h-8.5 text-xs gap-1.5 border-border hover:bg-blue-500/10 hover:text-blue-500 rounded-lg cursor-pointer font-medium whitespace-nowrap"
          >
            <RotateCcw className="size-3.5 text-blue-500" />
            <span>Return Book</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAssessFine}
            variant="outline"
            className="h-8.5 text-xs gap-1.5 border-border hover:bg-amber-500/10 hover:text-amber-500 rounded-lg cursor-pointer font-medium whitespace-nowrap"
          >
            <AlertTriangle className="size-3.5 text-amber-500" />
            <span>Charge Damage / Fine</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAddCategory}
            variant="outline"
            className="h-8.5 text-xs gap-1.5 border-border hover:bg-muted/30 rounded-lg cursor-pointer font-medium whitespace-nowrap"
          >
            <FolderPlus className="size-3.5 text-primary" />
            <span>Add Category</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAddBook}
            className="h-8.5 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-lg shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Plus className="size-4" />
            <span>Add New Book</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards - Reduced Height with Theme Default Radius */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden transition-all hover:border-primary/40">
          <CardContent className="p-3 sm:p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Total Book Titles</span>
              <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="size-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">{totalTitles} Titles</div>
            <p className="text-[11px] text-muted-foreground truncate">Across {categories.length} organized categories</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden transition-all hover:border-emerald-500/40">
          <CardContent className="p-3 sm:p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Ready on Shelves</span>
              <div className="size-7 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Layers className="size-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground font-mono text-emerald-500">
              {totalAvailable} Copies
            </div>
            <p className="text-[11px] text-emerald-500/90 font-medium truncate">Available for immediate issue</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden transition-all hover:border-blue-500/40">
          <CardContent className="p-3 sm:p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Currently Borrowed</span>
              <div className="size-7 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <BookMarked className="size-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground font-mono text-blue-500">
              {totalIssued} Books Out
            </div>
            <p className="text-[11px] text-muted-foreground truncate">Being read by active students</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden transition-all hover:border-amber-500/40">
          <CardContent className="p-3 sm:p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Unpaid Fines</span>
              <div className="size-7 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Coins className="size-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground font-mono text-amber-500">
              ₹{totalPendingFines}
            </div>
            <p className="text-[11px] text-amber-500/90 font-medium truncate">
              {unpaidCount} student fines pending settlement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Left-Aligned Horizontal Tab Bar with Website Theme Default Radius */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="flex items-center justify-start border-b border-border pb-2.5">
          <TabsList className="inline-flex h-auto p-1 bg-muted/60 border border-border rounded-lg gap-1 shrink-0 overflow-x-auto scrollbar-none">
            {/* FIRST TAB: Borrow Trends & Analytics */}
            <TabsTrigger
              value="analytics"
              className="gap-2 text-xs font-bold py-2 px-3.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-md cursor-pointer"
            >
              <BarChart3 className="size-4 text-blue-500 shrink-0" />
              <span>Borrow Trends &amp; Analytics</span>
            </TabsTrigger>

            {/* SECOND TAB: Book Shelf (All Books) */}
            <TabsTrigger
              value="catalog"
              className="gap-2 text-xs font-bold py-2 px-3.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-md cursor-pointer"
            >
              <BookOpen className="size-4 text-primary shrink-0" />
              <span>Book Shelf (All Books)</span>
            </TabsTrigger>

            {/* THIRD TAB: Book Categories */}
            <TabsTrigger
              value="categories"
              className="gap-2 text-xs font-bold py-2 px-3.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-md cursor-pointer"
            >
              <Tag className="size-4 text-emerald-500 shrink-0" />
              <span>Categories ({categories.length})</span>
            </TabsTrigger>

            {/* FOURTH TAB: Fines & Damage */}
            <TabsTrigger
              value="fines"
              className="gap-2 text-xs font-bold py-2 px-3.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-md cursor-pointer"
            >
              <Coins className="size-4 text-amber-500 shrink-0" />
              <span>Fines &amp; Damage ({unpaidCount} Due)</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ================= TAB 1: BORROW TRENDS & ANALYTICS ================= */}
        <TabsContent value="analytics" className="space-y-4 mt-0 focus-visible:outline-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Chart 1: Monthly Issuance & Return Trends (8 cols) */}
            <Card className="lg:col-span-8 border border-border bg-card rounded-lg shadow-xs overflow-hidden">
              <CardHeader className="p-4 sm:p-5 pb-2 border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp className="size-4 text-primary" />
                    How Many Books Are Borrowed Each Month?
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Monthly comparison of books taken home, books returned safely, and overdue items.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                  Last 6 Months
                </Badge>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-5">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CIRCULATION_MONTHLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                      <Tooltip
                        content={<ChartCustomTooltip />}
                        cursor={{ fill: "hsl(var(--primary) / 0.08)", radius: 6 }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                      <Bar dataKey="issued" name="Books Taken Home" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="returned" name="Books Returned Safely" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="overdue" name="Late Returns" fill="hsl(0 84.2% 60.2%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: Category Breakdown (4 cols) */}
            <Card className="lg:col-span-4 border border-border bg-card rounded-lg shadow-xs overflow-hidden flex flex-col justify-between">
              <CardHeader className="p-4 sm:p-5 pb-2 border-b border-border">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="size-4 text-emerald-500" />
                  Most Popular Subjects
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Number of books currently on loan by domain.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-5 flex-1">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryDistributionData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border) / 0.5)" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} width={85} />
                      <Tooltip
                        content={<CategoryChartTooltip />}
                        cursor={{ fill: "hsl(var(--primary) / 0.08)", radius: 6 }}
                      />
                      <Bar dataKey="issuedCopies" name="Currently Borrowed" fill="hsl(217.2 91.2% 59.8%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top In-Demand Books Leaderboard with Avatar UI from template */}
          <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                Top 5 Most Read Textbooks in Library
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Books with the highest circulation and student borrowing demand.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {books.slice(0, 5).map((b, i) => (
                  <div key={b.id} className="p-3.5 sm:px-5 flex items-center justify-between gap-4 text-xs hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="size-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                        #{i + 1}
                      </div>
                      <Avatar className="size-10 rounded-md border border-border shrink-0 shadow-xs">
                        <AvatarImage src={b.coverImage} alt={b.title} className="object-cover" />
                        <AvatarFallback className="rounded-md text-xs font-bold bg-primary/10 text-primary">
                          {b.title.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm truncate">{b.title}</span>
                          {b.bookNumber && (
                            <Badge variant="outline" className="font-mono text-[10px] bg-primary/5 text-primary border-primary/25 shrink-0">
                              {b.bookNumber}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {b.category} • {b.rackLocation}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-[11px] text-muted-foreground">Active Checkouts</div>
                        <div className="font-mono font-bold text-blue-500 text-xs">{b.issuedCopies} students reading</div>
                      </div>
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 rounded-md">
                        {Math.round((b.issuedCopies / b.totalCopies) * 100)}% In Use
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= TAB 2: BOOK SHELF (ALL BOOKS) ================= */}
        <TabsContent value="catalog" className="space-y-4 mt-0 focus-visible:outline-hidden">
          {/* Search, Filter & View Toggle Bar */}
          <div className="p-3 sm:p-4 rounded-lg border border-border bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by title, Book No (BK-1001), author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 pl-9 text-xs bg-background border-border rounded-md"
              />
            </div>

            {/* Category Dropdown & Availability Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8.5 text-xs w-[170px] bg-background border-border rounded-md">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent hideScrollButtons>
                  <SelectItem value="All Categories">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="h-8.5 text-xs w-[140px] bg-background border-border rounded-md">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent hideScrollButtons>
                  <SelectItem value="all">All Copies</SelectItem>
                  <SelectItem value="available">Ready on Shelf</SelectItem>
                  <SelectItem value="loaned">All Borrowed Out</SelectItem>
                </SelectContent>
              </Select>

              {/* View Switcher: Table vs Cards */}
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-md border border-border shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "p-1.5 rounded-sm cursor-pointer transition-all",
                    viewMode === "table" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Table View"
                >
                  <List className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded-sm cursor-pointer transition-all",
                    viewMode === "grid" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Card Grid View"
                >
                  <LayoutGrid className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Table View - Proper responsive table using website template styling and Avatar UI */}
          {viewMode === "table" ? (
            <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="w-full min-w-[780px]">
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-[11px] font-semibold py-3 px-4 text-muted-foreground uppercase w-28">Book No.</TableHead>
                        <TableHead className="text-[11px] font-semibold py-3 px-4 text-muted-foreground uppercase min-w-[220px]">Book Details</TableHead>
                        <TableHead className="text-[11px] font-semibold py-3 px-3 text-muted-foreground uppercase">Category</TableHead>
                        <TableHead className="text-[11px] font-semibold py-3 px-3 text-muted-foreground uppercase">Shelf / Rack</TableHead>
                        <TableHead className="text-[11px] font-semibold py-3 px-3 text-muted-foreground uppercase text-center">Available Stock</TableHead>
                        <TableHead className="text-[11px] font-semibold py-3 px-3 text-muted-foreground uppercase">Status</TableHead>
                        <TableHead className="text-[11px] font-semibold py-3 px-4 text-muted-foreground uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBooks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-40 text-center text-xs text-muted-foreground">
                            No books match the selected search or category filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBooks.map((b) => (
                          <TableRow key={b.id} className="border-border hover:bg-muted/20 text-xs transition-colors">
                            {/* Book Number Column */}
                            <TableCell className="py-2.5 px-4">
                              <span className="font-mono font-bold text-xs text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20 whitespace-nowrap">
                                {b.bookNumber || `BK-${b.id}`}
                              </span>
                            </TableCell>

                            {/* Book Avatar & Details from Website Template */}
                            <TableCell className="py-2.5 px-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="size-10 rounded-md border border-border shrink-0 shadow-xs">
                                  <AvatarImage src={b.coverImage} alt={b.title} className="object-cover" />
                                  <AvatarFallback className="rounded-md text-xs font-bold bg-primary/10 text-primary">
                                    {b.title.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="font-semibold text-foreground text-xs line-clamp-1">{b.title}</div>
                                  <div className="text-[11px] text-muted-foreground line-clamp-1">
                                    {b.author ? `by ${b.author}` : "General Reference"} {b.editionYear ? `(${b.editionYear})` : ""}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground/80 font-mono mt-0.5">
                                    ISBN: {b.isbn}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            {/* Category Badge */}
                            <TableCell className="py-2.5 px-3">
                              <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-muted/30 border-border whitespace-nowrap">
                                {b.category}
                              </Badge>
                            </TableCell>

                            {/* Rack Location */}
                            <TableCell className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 font-medium text-foreground whitespace-nowrap">
                                <MapPin className="size-3.5 text-primary shrink-0" />
                                <span>{b.rackLocation}</span>
                              </div>
                            </TableCell>

                            {/* Available Stock Counter */}
                            <TableCell className="py-2.5 px-3 text-center">
                              <div className="inline-flex flex-col items-center">
                                <span className="font-mono font-bold text-foreground text-xs whitespace-nowrap">
                                  <span className="text-emerald-500 font-extrabold">{b.availableCopies}</span> / {b.totalCopies} Available
                                </span>
                                <div className="w-20 bg-muted/60 h-1.5 rounded-full overflow-hidden mt-1">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full transition-all"
                                    style={{ width: `${(b.availableCopies / b.totalCopies) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>

                            {/* Status Chip */}
                            <TableCell className="py-2.5 px-3">
                              {b.availableCopies > 0 ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[11px] font-semibold gap-1 whitespace-nowrap">
                                  <CheckCircle2 className="size-3" />
                                  <span>Ready to Lend</span>
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[11px] font-semibold gap-1 whitespace-nowrap">
                                  <Clock className="size-3" />
                                  <span>All Loaned Out</span>
                                </Badge>
                              )}
                            </TableCell>

                            {/* Action Buttons: Issue, Return (if borrowed), Edit, More */}
                            <TableCell className="py-2.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenIssueBook(b)}
                                  disabled={b.availableCopies <= 0}
                                  className="h-7 text-xs border-border hover:bg-primary hover:text-primary-foreground px-2 gap-1 rounded-md cursor-pointer font-semibold"
                                >
                                  <UserCheck className="size-3" />
                                  <span>Issue</span>
                                </Button>

                                {b.issuedCopies > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenReturnBook(b)}
                                    className="h-7 text-xs border-border hover:bg-blue-500/10 hover:text-blue-500 px-2 gap-1 rounded-md cursor-pointer font-semibold"
                                  >
                                    <RotateCcw className="size-3 text-blue-500" />
                                    <span>Return</span>
                                  </Button>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditBook(b)}
                                  className="h-7 text-xs text-primary hover:bg-primary/10 px-2 gap-1 rounded-md cursor-pointer"
                                >
                                  <Edit2 className="size-3" />
                                  <span>Edit</span>
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-7 hover:bg-muted/40 rounded-md cursor-pointer">
                                      <MoreHorizontal className="size-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44 text-xs">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setFineBookTitle(b.title)
                                        setFineBarcode(b.bookNumber || b.isbn)
                                        setAssessFineModalOpen(true)
                                      }}
                                      className="cursor-pointer text-amber-500"
                                    >
                                      <AlertTriangle className="size-3.5 mr-2" />
                                      <span>Report Damage</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteBook(b.id, b.title)}
                                      className="text-red-400 hover:text-red-300 cursor-pointer"
                                    >
                                      <Trash2 className="size-3.5 mr-2" />
                                      <span>Delete Book</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Visual Card Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBooks.map((b) => (
                <Card key={b.id} className="border border-border bg-card rounded-lg shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-sm transition-all group">
                  <div>
                    <div className="h-44 w-full relative overflow-hidden bg-muted">
                      <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-2.5 left-2.5">
                        <Badge className="bg-primary/90 text-primary-foreground font-mono text-[10px] font-bold shadow-xs">
                          {b.bookNumber || `BK-${b.id}`}
                        </Badge>
                      </div>
                      <div className="absolute top-2.5 right-2.5">
                        <Badge className="bg-card/90 text-foreground backdrop-blur-sm text-[10px] font-bold border border-border">
                          {b.category}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2.5 left-2.5">
                        <Badge variant="outline" className="bg-background/90 text-foreground text-[10px] font-mono border-border">
                          📍 {b.rackLocation}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="p-3.5 pb-2">
                      <CardTitle className="text-sm font-bold text-foreground line-clamp-1">{b.title}</CardTitle>
                      <p className="text-xs text-muted-foreground line-clamp-1">by {b.author || "General Reference"}</p>
                    </CardHeader>

                    <CardContent className="p-3.5 pt-0 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] font-mono">ISBN: {b.isbn}</span>
                        <span className="font-bold font-mono text-emerald-500 text-xs">
                          {b.availableCopies} of {b.totalCopies} available
                        </span>
                      </div>
                    </CardContent>
                  </div>

                  <CardFooter className="p-2.5 px-3.5 border-t border-border bg-muted/20 flex items-center justify-between gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenIssueBook(b)}
                      disabled={b.availableCopies <= 0}
                      className="h-7 text-xs border-border hover:bg-primary hover:text-primary-foreground gap-1 flex-1 rounded-md cursor-pointer font-bold"
                    >
                      <UserCheck className="size-3" />
                      <span>Issue</span>
                    </Button>

                    {b.issuedCopies > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReturnBook(b)}
                        className="h-7 text-xs border-border hover:bg-blue-500/10 hover:text-blue-500 px-2 gap-1 rounded-md cursor-pointer font-semibold"
                      >
                        <RotateCcw className="size-3 text-blue-500" />
                        <span>Return</span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditBook(b)}
                      className="h-7 text-xs text-primary px-2 gap-1 rounded-md cursor-pointer"
                    >
                      <Edit2 className="size-3" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFineBookTitle(b.title)
                        setFineBarcode(b.bookNumber || b.isbn)
                        setAssessFineModalOpen(true)
                      }}
                      className="h-7 text-xs text-amber-500 border-border hover:bg-amber-500/10 px-2 rounded-md cursor-pointer"
                      title="Report Damage"
                    >
                      <AlertTriangle className="size-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ================= TAB 3: BOOK CATEGORIES ================= */}
        <TabsContent value="categories" className="space-y-4 mt-0 focus-visible:outline-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border bg-card shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Subject Categories ({categories.length} Categories Active)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Books automatically sort into these categories. Book counts and stock update in real time.
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleOpenAddCategory}
              className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-bold rounded-lg shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <FolderPlus className="size-3.5" />
              <span>Add New Category</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const booksInCat = books.filter((b) => b.category === cat.name)
              const titlesCount = booksInCat.length
              const totalVolumes = booksInCat.reduce((acc, b) => acc + b.totalCopies, 0)
              const issuedCount = booksInCat.reduce((acc, b) => acc + b.issuedCopies, 0)
              const availableCount = booksInCat.reduce((acc, b) => acc + b.availableCopies, 0)
              const borrowPercent = totalVolumes > 0 ? Math.round((issuedCount / totalVolumes) * 100) : 0

              return (
                <Card key={cat.id} className="border border-border bg-card rounded-lg shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-sm transition-all">
                  <CardHeader className="p-4 pb-2.5 border-b border-border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="size-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: cat.color }}
                        />
                        <CardTitle className="text-sm font-bold text-foreground truncate">
                          {cat.name}
                        </CardTitle>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditCategory(cat)}
                          className="size-6.5 hover:bg-muted/40 rounded-md cursor-pointer"
                        >
                          <Edit3 className="size-3 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="size-6.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 rounded-md cursor-pointer"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[30px] pt-1">
                      {cat.description}
                    </p>
                  </CardHeader>

                  <CardContent className="p-4 pt-2.5 space-y-3">
                    {/* Live Statistics Counter Row */}
                    <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-md bg-muted/30 border border-border">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">Titles</div>
                        <div className="text-base font-bold font-mono text-foreground">{titlesCount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">Total Stock</div>
                        <div className="text-base font-bold font-mono text-emerald-500">{totalVolumes}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">Borrowed</div>
                        <div className="text-base font-bold font-mono text-blue-500">{issuedCount}</div>
                      </div>
                    </div>

                    {/* Progress Bar Showing Borrow Ratio */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Shelf Utilization:</span>
                        <span className="font-bold text-foreground font-mono">{borrowPercent}% in circulation</span>
                      </div>
                      <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${borrowPercent}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ================= TAB 4: FINES & DAMAGE PENALTIES ================= */}
        <TabsContent value="fines" className="space-y-4 mt-0 focus-visible:outline-hidden">
          {/* Fines Metric Highlights - Reduced Height with Theme Default Radius */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border border-border bg-card rounded-lg shadow-xs">
              <CardContent className="p-3 sm:p-3.5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Pending Unpaid Fines</span>
                  <div className="size-7 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Coins className="size-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-500">
                  ₹{totalPendingFines}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">Awaiting student counter payment</div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card rounded-lg shadow-xs">
              <CardContent className="p-3 sm:p-3.5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Fines Already Collected</span>
                  <div className="size-7 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Receipt className="size-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-500">
                  ₹{totalFinesCollected}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">Credited directly to Cash Day-Book</div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card rounded-lg shadow-xs">
              <CardContent className="p-3 sm:p-3.5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Damaged Book Incidents</span>
                  <div className="size-7 rounded-md bg-red-500/10 text-red-400 flex items-center justify-center">
                    <AlertTriangle className="size-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">
                  {fines.filter((f) => f.fineType === "Physical Damage" || f.fineType === "Lost Book").length} Cases
                </div>
                <div className="text-[11px] text-muted-foreground truncate">Torn pages, water damage, or lost</div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card rounded-lg shadow-xs">
              <CardContent className="p-3 sm:p-3.5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Daily Late Fine Rate</span>
                  <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <ShieldAlert className="size-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">₹5 / day</div>
                <div className="text-[11px] text-muted-foreground truncate">Grace period: 2 days free</div>
              </CardContent>
            </Card>
          </div>

          {/* Fines Table with Website Template Responsive Styling and Student Avatar UI */}
          <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 sm:p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Coins className="size-4 text-primary" />
                  Late Return &amp; Book Damage Ledger
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Record and collect fees for overdue books, damaged copies, or lost volumes.
                </p>
              </div>

              <Button
                size="sm"
                onClick={handleOpenAssessFine}
                className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-bold rounded-lg shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="size-3.5" />
                <span>Charge Fine / Damage</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="w-full min-w-[780px]">
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-[11px] font-semibold py-3 px-4 text-muted-foreground uppercase min-w-[180px]">Student</TableHead>
                      <TableHead className="text-[11px] font-semibold py-3 px-3 text-muted-foreground uppercase min-w-[180px]">Book Title</TableHead>
                      <TableHead className="text-[11px] font-semibold py-3 px-3 text-muted-foreground uppercase">Penalty Type</TableHead>
                      <TableHead className="text-[11px] font-semibold py-3 px-3 text-muted-foreground uppercase max-w-xs">Details</TableHead>
                      <TableHead className="text-[11px] font-semibold py-3 px-3 text-muted-foreground uppercase">Amount</TableHead>
                      <TableHead className="text-[11px] font-semibold py-3 px-3 text-muted-foreground uppercase">Status</TableHead>
                      <TableHead className="text-[11px] font-semibold py-3 px-4 text-muted-foreground uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fines.map((f) => (
                      <TableRow key={f.id} className="border-border hover:bg-muted/20 text-xs transition-colors">
                        {/* Student with Template Avatar UI */}
                        <TableCell className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="size-8 rounded-full border border-border shrink-0">
                              <AvatarImage src={getStudentAvatar(f.studentName, f.studentCode)} alt={f.studentName} />
                              <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                                {f.studentName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground text-xs truncate">{f.studentName}</div>
                              <div className="text-[10px] font-mono text-muted-foreground">{f.studentCode}</div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Book */}
                        <TableCell className="py-2.5 px-3">
                          <div className="font-medium text-foreground text-xs line-clamp-1">{f.bookTitle}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{f.barcode}</div>
                        </TableCell>

                        {/* Fine Type Badge */}
                        <TableCell className="py-2.5 px-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-semibold gap-1 whitespace-nowrap",
                              f.fineType === "Physical Damage"
                                ? "bg-red-500/10 text-red-400 border-red-500/30"
                                : f.fineType === "Lost Book"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                : f.fineType === "Late Return"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {f.fineType}
                          </Badge>
                        </TableCell>

                        {/* Details */}
                        <TableCell className="py-2.5 px-3 max-w-xs text-muted-foreground text-[11px] leading-relaxed line-clamp-2">
                          {f.details}
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="py-2.5 px-3 font-mono font-bold text-foreground text-xs whitespace-nowrap">
                          ₹{f.amount}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-2.5 px-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap",
                              f.status === "Collected"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : f.status === "Unpaid"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {f.status === "Collected" ? `✓ Paid (${f.collectedMode})` : f.status}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            {f.status === "Unpaid" ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenCollectFine(f)}
                                  className="h-7 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs cursor-pointer"
                                >
                                  <Receipt className="size-3" />
                                  <span>Collect</span>
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleWaiveFine(f.id, f.studentName)}
                                  className="h-7 text-xs text-muted-foreground hover:text-foreground rounded-md cursor-pointer"
                                >
                                  Waive
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground font-mono">
                                {f.collectedAt || "Settled"}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================= MODAL 1: RETURN BOOK & CONDITION CHECK ================= */}
      <Dialog open={returnBookModalOpen} onOpenChange={setReturnBookModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <RotateCcw className="size-5 text-blue-500" />
              Return Book to Library
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Check in the physical volume, verify book condition, and assess fines if damaged or late.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            {/* Select Book being returned */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Select Book to Return <span className="text-red-500">*</span>
              </Label>
              <Select value={returnBookId} onValueChange={setReturnBookId}>
                <SelectTrigger className="h-8.5 text-xs bg-background border-border rounded-md">
                  <SelectValue placeholder="Choose book..." />
                </SelectTrigger>
                <SelectContent hideScrollButtons>
                  {books.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.title} ({b.bookNumber || `BK-${b.id}`}) • {b.issuedCopies} Borrowed
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Returning Student directly from dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Returning Student <span className="text-red-500">*</span>
              </Label>
              <Select value={returnStudentCode} onValueChange={setReturnStudentCode}>
                <SelectTrigger className="h-8.5 text-xs bg-background border-border rounded-md">
                  <SelectValue placeholder="Select student..." />
                </SelectTrigger>
                <SelectContent hideScrollButtons>
                  {studentsDatabase.map((s) => (
                    <SelectItem key={s.id} value={s.studentId}>
                      {s.name} ({s.studentId}) • {s.branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Book Physical Condition Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Physical Condition &amp; Due Check</Label>
              <Select
                value={returnCondition}
                onValueChange={(val: any) => {
                  setReturnCondition(val)
                  if (val === "Good") {
                    setReturnOverdueDays(0)
                    setReturnDamageFee(0)
                  } else if (val === "Late Return") {
                    setReturnOverdueDays(4)
                    setReturnDamageFee(20) // ₹5/day * 4
                  } else if (val === "Minor Damage") {
                    setReturnDamageFee(250)
                  } else if (val === "Major Damage") {
                    setReturnDamageFee(750)
                  }
                }}
              >
                <SelectTrigger className="h-8.5 text-xs bg-background border-border rounded-md">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent hideScrollButtons>
                  <SelectItem value="Good">✅ Good Condition (No damage / on time)</SelectItem>
                  <SelectItem value="Late Return">🕒 Late Return (Overdue past 14 days)</SelectItem>
                  <SelectItem value="Minor Damage">💧 Minor Damage (Torn pages, spine wear)</SelectItem>
                  <SelectItem value="Major Damage">❌ Major Damage / Water soaked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Overdue Days or Damage Fee if applicable */}
            {returnCondition !== "Good" && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-md bg-muted/40 border border-border">
                {returnCondition === "Late Return" ? (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Days Overdue</Label>
                    <Input
                      type="number"
                      min={1}
                      value={returnOverdueDays}
                      onChange={(e) => {
                        const days = Number(e.target.value)
                        setReturnOverdueDays(days)
                        setReturnDamageFee(days * 5)
                      }}
                      className="h-8 text-xs bg-background border-border rounded-md font-mono"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Damage Notes</Label>
                    <Input
                      placeholder="e.g. Broken spine"
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                      className="h-8 text-xs bg-background border-border rounded-md"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Calculated Penalty (₹)</Label>
                  <Input
                    type="number"
                    value={returnDamageFee}
                    onChange={(e) => setReturnDamageFee(Number(e.target.value))}
                    className="h-8 text-xs bg-background border-border rounded-md font-mono font-bold text-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReturnBookModalOpen(false)}
              className="text-xs h-8.5 rounded-md border-border cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmReturnBook}
              className="text-xs h-8.5 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer"
            >
              Confirm Return &amp; Restock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL 2: ISSUE BOOK TO STUDENT ================= */}
      <Dialog open={issueBookModalOpen} onOpenChange={setIssueBookModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <UserCheck className="size-5 text-primary" />
              Issue Book to Student
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Allocate this book to an active student. Borrow record will sync immediately.
            </DialogDescription>
          </DialogHeader>

          {selectedBookForIssue && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 rounded-md bg-muted/40 border border-border flex items-center gap-3">
                <Avatar className="size-12 rounded-md border border-border shrink-0">
                  <AvatarImage src={selectedBookForIssue.coverImage} alt={selectedBookForIssue.title} className="object-cover" />
                  <AvatarFallback className="rounded-md text-xs font-bold bg-primary/10 text-primary">
                    {selectedBookForIssue.title.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm line-clamp-1">{selectedBookForIssue.title}</span>
                    <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0">
                      {selectedBookForIssue.bookNumber || `BK-${selectedBookForIssue.id}`}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">by {selectedBookForIssue.author}</div>
                  <div className="text-[10px] text-emerald-500 font-mono mt-0.5">
                    {selectedBookForIssue.availableCopies} Copies Available on {selectedBookForIssue.rackLocation}
                  </div>
                </div>
              </div>

              {/* Student Picker Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Select Active Student <span className="text-red-500">*</span>
                </Label>
                <Select value={issueStudentId} onValueChange={setIssueStudentId}>
                  <SelectTrigger className="h-8.5 text-xs bg-background border-border rounded-md">
                    <SelectValue placeholder="Choose student..." />
                  </SelectTrigger>
                  <SelectContent hideScrollButtons>
                    {studentsDatabase.slice(0, 15).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.studentId}) • {s.branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Borrow Duration */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Lending Duration</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "7 Days", days: 7 },
                    { label: "14 Days (Standard)", days: 14 },
                    { label: "30 Days (Exam)", days: 30 },
                  ].map((dur) => (
                    <button
                      key={dur.days}
                      type="button"
                      onClick={() => setIssueDurationDays(dur.days)}
                      className={cn(
                        "p-2 rounded-md border text-center transition-all cursor-pointer font-medium",
                        issueDurationDays === dur.days
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                          : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIssueBookModalOpen(false)}
              className="text-xs h-8.5 rounded-md border-border cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmIssueBook}
              className="text-xs h-8.5 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer"
            >
              Confirm Book Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL 3: ADD / EDIT BOOK (Publisher removed, Author Optional) ================= */}
      <Dialog open={addBookModalOpen || editBookModalOpen} onOpenChange={(open) => {
        if (!open) {
          setAddBookModalOpen(false)
          setEditBookModalOpen(false)
        }
      }}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <BookOpen className="size-5 text-primary" />
              {editBookModalOpen ? "Edit Book Details" : "Add New Book to Shelf"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide book title, accession Book Number, and shelf location.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            {/* Book Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Book Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Indian Polity (7th Edition)"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="h-8.5 text-xs bg-background border-border rounded-md"
              />
            </div>

            {/* Book Number & Author (Author is Optional, Publisher removed) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Book Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. BK-1008 or LIB-042"
                  value={bookNumber}
                  onChange={(e) => setBookNumber(e.target.value)}
                  className="h-8.5 text-xs bg-background border-border rounded-md font-mono font-bold text-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Author Name <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
                </Label>
                <Input
                  placeholder="e.g. M. Laxmikanth (Optional)"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  className="h-8.5 text-xs bg-background border-border rounded-md"
                />
              </div>
            </div>

            {/* Category & Shelf Location */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Category</Label>
                <Select value={bookCategory} onValueChange={setBookCategory}>
                  <SelectTrigger className="h-8.5 text-xs bg-background border-border rounded-md">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent hideScrollButtons>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Shelf / Rack Number</Label>
                <Input
                  placeholder="e.g. Rack B-02 (Shelf 3)"
                  value={bookRack}
                  onChange={(e) => setBookRack(e.target.value)}
                  className="h-8.5 text-xs bg-background border-border rounded-md"
                />
              </div>
            </div>

            {/* Total Copies, Price, ISBN */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Total Copies</Label>
                <Input
                  type="number"
                  min={1}
                  value={bookCopies}
                  onChange={(e) => setBookCopies(Number(e.target.value))}
                  className="h-8.5 text-xs bg-background border-border rounded-md font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Cover Price (₹)</Label>
                <Input
                  type="number"
                  value={bookPrice}
                  onChange={(e) => setBookPrice(Number(e.target.value))}
                  className="h-8.5 text-xs bg-background border-border rounded-md font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">ISBN Barcode</Label>
                <Input
                  value={bookIsbn}
                  onChange={(e) => setBookIsbn(e.target.value)}
                  className="h-8.5 text-xs bg-background border-border rounded-md font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAddBookModalOpen(false)
                setEditBookModalOpen(false)
              }}
              className="text-xs h-8.5 rounded-md border-border cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={editBookModalOpen ? handleSaveEditBook : handleCreateBook}
              className="text-xs h-8.5 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer"
            >
              {editBookModalOpen ? "Save Changes" : "Add to Shelf"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL 4: ADD / EDIT CATEGORY ================= */}
      <Dialog open={addCatModalOpen || editCatModalOpen} onOpenChange={(open) => {
        if (!open) {
          setAddCatModalOpen(false)
          setEditCatModalOpen(false)
        }
      }}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <FolderPlus className="size-5 text-primary" />
              {editCatModalOpen ? "Edit Subject Category" : "Add New Subject Category"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Organize books by exam preparation or domain subjects.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. UPSC & Civil Services"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="h-8.5 text-xs bg-background border-border rounded-md"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Description</Label>
              <Textarea
                rows={2}
                placeholder="What types of books belong here?"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="text-xs bg-background border-border rounded-md"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Tag Color</Label>
              <div className="flex items-center gap-2 pt-1">
                {[
                  { name: "Primary Blue", color: "hsl(var(--primary))" },
                  { name: "Emerald Green", color: "hsl(142.1 76.2% 36.3%)" },
                  { name: "Sky Blue", color: "hsl(217.2 91.2% 59.8%)" },
                  { name: "Amber Orange", color: "hsl(37.7 92.1% 50.2%)" },
                  { name: "Purple", color: "hsl(280 65% 60%)" },
                  { name: "Teal", color: "hsl(180 70% 45%)" },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setCatColor(c.color)}
                    className={cn(
                      "size-7 rounded-full transition-transform cursor-pointer border-2",
                      catColor === c.color ? "scale-115 border-foreground" : "border-transparent"
                    )}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAddCatModalOpen(false)
                setEditCatModalOpen(false)
              }}
              className="text-xs h-8.5 rounded-md border-border cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={editCatModalOpen ? handleSaveEditCategory : handleCreateCategory}
              className="text-xs h-8.5 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer"
            >
              {editCatModalOpen ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL 5: ASSESS FINE / DAMAGE (Direct Student Dropdown List) ================= */}
      <Dialog open={assessFineModalOpen} onOpenChange={setAssessFineModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <AlertTriangle className="size-5 text-amber-500" />
              Assess Late Fee or Damage Fine
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select student and record a penalty for overdue return, torn pages, or lost book.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            {/* Direct Student Dropdown List (No manual Name / ID text input) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Select Student <span className="text-red-500">*</span>
              </Label>
              <Select
                value={fineStudentCode}
                onValueChange={(code) => {
                  setFineStudentCode(code)
                  const s = studentsDatabase.find((stu) => stu.studentId === code || stu.id === code)
                  if (s) {
                    setFineStudentName(s.name)
                  }
                }}
              >
                <SelectTrigger className="h-8.5 text-xs bg-background border-border rounded-md">
                  <SelectValue placeholder="Choose student from list..." />
                </SelectTrigger>
                <SelectContent hideScrollButtons>
                  {studentsDatabase.map((s) => (
                    <SelectItem key={s.id} value={s.studentId}>
                      {s.name} ({s.studentId}) • {s.branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Book Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Book Title</Label>
              <Input
                value={fineBookTitle}
                onChange={(e) => setFineBookTitle(e.target.value)}
                className="h-8.5 text-xs bg-background border-border rounded-md"
              />
            </div>

            {/* Penalty Reason */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Penalty Reason</Label>
              <Select
                value={fineType}
                onValueChange={(val: any) => {
                  setFineType(val)
                  if (val === "Late Return") {
                    setFineAmount(20)
                    setFineDetails("4 days late return past due date (₹5 / day)")
                  } else if (val === "Physical Damage") {
                    setFineAmount(350)
                    setFineDetails("Water damage / torn pages requiring repair")
                  } else if (val === "Lost Book") {
                    setFineAmount(1250)
                    setFineDetails("Lost book full replacement fee + processing")
                  } else {
                    setFineAmount(100)
                    setFineDetails("Pen or highlighter markings across pages")
                  }
                }}
              >
                <SelectTrigger className="h-8.5 text-xs bg-background border-border rounded-md">
                  <SelectValue placeholder="Choose fine type" />
                </SelectTrigger>
                <SelectContent hideScrollButtons>
                  <SelectItem value="Late Return">🕒 Late Return (₹5 / day)</SelectItem>
                  <SelectItem value="Physical Damage">💧 Physical Damage (Torn pages, water spill)</SelectItem>
                  <SelectItem value="Lost Book">📦 Lost Book (Replacement cost)</SelectItem>
                  <SelectItem value="Highlighting / Scribbling">🖊️ Highlighting / Scribbling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Violation Details</Label>
              <Input
                value={fineDetails}
                onChange={(e) => setFineDetails(e.target.value)}
                className="h-8.5 text-xs bg-background border-border rounded-md"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Fine Amount (₹ INR) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                <Input
                  type="number"
                  value={fineAmount}
                  onChange={(e) => setFineAmount(Number(e.target.value))}
                  className="h-8.5 pl-7 text-xs bg-background border-border rounded-md font-mono font-bold text-foreground"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssessFineModalOpen(false)}
              className="text-xs h-8.5 rounded-md border-border cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateFine}
              className="text-xs h-8.5 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-md cursor-pointer"
            >
              Charge Fine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL 6: COLLECT FINE PAYMENT ================= */}
      <Dialog open={collectFineModalOpen} onOpenChange={setCollectFineModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Receipt className="size-5 text-emerald-500" />
              Collect Fine Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Receive cash or UPI payment from student and reconcile into today&apos;s Day-Book.
            </DialogDescription>
          </DialogHeader>

          {selectedFineRecord && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3.5 rounded-md bg-muted/40 border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8 rounded-full border border-border">
                    <AvatarImage src={getStudentAvatar(selectedFineRecord.studentName, selectedFineRecord.studentCode)} alt={selectedFineRecord.studentName} />
                    <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                      {selectedFineRecord.studentName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-foreground text-sm">{selectedFineRecord.studentName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {selectedFineRecord.fineType} • {selectedFineRecord.bookTitle}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-extrabold text-xl text-emerald-500">
                    ₹{selectedFineRecord.amount}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Due Amount</span>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Select Payment Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCollectMode("Cash")}
                    className={cn(
                      "p-2.5 rounded-md border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2",
                      collectMode === "Cash"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-xs"
                        : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Banknote className="size-4" />
                    <span>Physical Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCollectMode("UPI")}
                    className={cn(
                      "p-2.5 rounded-md border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2",
                      collectMode === "UPI"
                        ? "bg-blue-500/10 border-blue-500 text-blue-500 shadow-xs"
                        : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <CreditCard className="size-4" />
                    <span>UPI / QR Scan</span>
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>
                  Payment of ₹{selectedFineRecord.amount} will be marked as Collected and logged in today&apos;s Cash Day-Book.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCollectFineModalOpen(false)}
              className="text-xs h-8.5 rounded-md border-border cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmCollectFine}
              className="text-xs h-8.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer"
            >
              Confirm Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
