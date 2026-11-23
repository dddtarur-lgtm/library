"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Coffee,
  Edit2,
  Lock,
  Plus,
  Power,
  Shield,
  Smile,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  Users,
  Video,
  Wifi,
  Wind,
  Zap,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

export default function FacilitiesAchieversSettings() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  // Facilities list
  const [facilities, setFacilities] = useState([
    { id: "fac-1", name: "High-Speed Optical Wi-Fi (500 Mbps)", enabled: true, icon: Wifi },
    { id: "fac-2", name: "Dual-Zone Central Air Conditioning", enabled: true, icon: Wind },
    { id: "fac-3", name: "100% Inverter & Generator Power Backup", enabled: true, icon: Zap },
    { id: "fac-4", name: "24x7 HD CCTV Surveillance & Security", enabled: true, icon: Video },
    { id: "fac-5", name: "Personal Dedicated Storage Lockers", enabled: true, icon: Lock },
    { id: "fac-6", name: "RO + UV Purified Hot/Cold Drinking Water", enabled: true, icon: Smile },
    { id: "fac-7", name: "Dining Lounge & Cafeteria Pantry", enabled: true, icon: Coffee },
    { id: "fac-8", name: "Ergonomic High-Back Cushioned Desks", enabled: true, icon: Sparkles },
  ])

  // Achievers / Toppers Hall of fame
  const [achievers, setAchievers] = useState([
    {
      id: "ach-1",
      name: "Sneha Dave",
      exam: "UPSC CSE 2025",
      rank: "AIR 42",
      studyDuration: "14 months at Central Library",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      quote: "The pin-drop silence and uninterrupted power backup allowed me to put in 10 productive hours daily without burnout.",
      isPublished: true,
    },
    {
      id: "ach-2",
      name: "Karan Singhal",
      exam: "CA Final Exam",
      rank: "AIR 18",
      studyDuration: "8 months at Central Library",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      quote: "Excellent night shift atmosphere. Surrounded by disciplined peers made all the difference in clearing both groups.",
      isPublished: true,
    },
    {
      id: "ach-3",
      name: "Dr. Ananya Joshi",
      exam: "NEET-PG 2026",
      rank: "AIR 94",
      studyDuration: "11 months at Central Library",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      quote: "The reserved seat in the silent floor gave me complete peace of mind. Truly a home away from home for medical aspirants.",
      isPublished: true,
    },
  ])

  const [isAddAchieverOpen, setIsAddAchieverOpen] = useState(false)
  const [newAchieverName, setNewAchieverName] = useState("")
  const [newAchieverExam, setNewAchieverExam] = useState("")
  const [newAchieverRank, setNewAchieverRank] = useState("")
  const [newAchieverQuote, setNewAchieverQuote] = useState("")

  const toggleFacility = (id: string) => {
    setFacilities((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    )
  }

  const toggleAchieverPublish = (id: string) => {
    setAchievers((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isPublished: !a.isPublished } : a))
    )
  }

  const handleCreateAchiever = () => {
    if (!newAchieverName || !newAchieverExam) return
    const newItem = {
      id: `ach-${Date.now()}`,
      name: newAchieverName,
      exam: newAchieverExam,
      rank: newAchieverRank || "Qualified",
      studyDuration: "10 months at Central Library",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      quote: newAchieverQuote || "Amazing study environment!",
      isPublished: true,
    }
    setAchievers([newItem, ...achievers])
    setIsAddAchieverOpen(false)
    setNewAchieverName("")
    setNewAchieverExam("")
    setNewAchieverRank("")
    setNewAchieverQuote("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={ensureLocalizedPathname("/pages/settings-library", lang)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Library Settings
            </Link>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">Facilities &amp; Achievers</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Facilities &amp; Achievers Wall (PRD §57)
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage public amenities displayed to prospective students and showcase past students who cracked competitive examinations.
          </p>
        </div>

        <Dialog open={isAddAchieverOpen} onOpenChange={setIsAddAchieverOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 gap-1.5">
              <Plus className="size-4" />
              Add Topper / Achiever
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                Add Student to Hall of Fame
              </DialogTitle>
              <DialogDescription>
                Showcase student rank and exam success on your public microsite
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="ach-name">Student Full Name</Label>
                <Input
                  id="ach-name"
                  placeholder="e.g. Sneha Dave"
                  value={newAchieverName}
                  onChange={(e) => setNewAchieverName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ach-exam">Competitive Exam</Label>
                  <Input
                    id="ach-exam"
                    placeholder="e.g. UPSC CSE 2025"
                    value={newAchieverExam}
                    onChange={(e) => setNewAchieverExam(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ach-rank">Rank / Score</Label>
                  <Input
                    id="ach-rank"
                    placeholder="e.g. AIR 42"
                    value={newAchieverRank}
                    onChange={(e) => setNewAchieverRank(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="ach-quote">Testimonial Quote</Label>
                <Textarea
                  id="ach-quote"
                  placeholder="How did studying in this library contribute to their success?"
                  rows={3}
                  value={newAchieverQuote}
                  onChange={(e) => setNewAchieverQuote(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsAddAchieverOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateAchiever}>
                Publish to Wall
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Facilities Grid */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Library Amenities &amp; Facilities
              </CardTitle>
              <CardDescription>
                Toggle features enabled in your branches to display badges on the public landing page
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {facilities.filter((f) => f.enabled).length} of {facilities.length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {facilities.map((facility) => {
              const Icon = facility.icon
              return (
                <div
                  key={facility.id}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                    facility.enabled
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/60 bg-muted/20 opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`rounded-lg p-2 ${
                        facility.enabled
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <span className="text-xs font-medium leading-snug">
                      {facility.name}
                    </span>
                  </div>
                  <Switch
                    checked={facility.enabled}
                    onCheckedChange={() => toggleFacility(facility.id)}
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Achievers Hall of Fame */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            Achievers &amp; Toppers Hall of Fame
          </CardTitle>
          <CardDescription>
            Real success stories that inspire new students and establish credibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Student Profile</TableHead>
                  <TableHead className="text-xs">Exam Cleared</TableHead>
                  <TableHead className="text-xs">Rank / Merit</TableHead>
                  <TableHead className="text-xs">Testimonial Quote</TableHead>
                  <TableHead className="text-xs">Public Visibility</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {achievers.map((ach) => (
                  <TableRow key={ach.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8 border border-border/60">
                          <AvatarImage src={ach.avatar} alt={ach.name} />
                          <AvatarFallback>{ach.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-xs font-semibold">{ach.name}</div>
                          <div className="text-[10px] text-muted-foreground">{ach.studyDuration}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs font-medium">
                      {ach.exam}
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-amber-500 text-white text-[10px] font-mono">
                        {ach.rank}
                      </Badge>
                    </TableCell>

                    <TableCell className="max-w-xs text-xs text-muted-foreground italic">
                      "{ach.quote}"
                    </TableCell>

                    <TableCell>
                      <Switch
                        checked={ach.isPublished}
                        onCheckedChange={() => toggleAchieverPublish(ach.id)}
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-7">
                          <Edit2 className="size-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7 text-rose-500">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

