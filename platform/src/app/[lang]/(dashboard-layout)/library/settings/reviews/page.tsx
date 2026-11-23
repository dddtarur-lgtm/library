"use client"

import Link from "next/link"
import { use, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  Flag,
  Heart,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  ThumbsUp,
  Trash2,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ReviewsModerationPage(props: {
  params: Promise<{ lang: LocaleType }>
}) {
  const { lang } = use(props.params)

  const [reviews, setReviews] = useState([
    {
      id: "rev-01",
      studentName: "Pooja Varma",
      rollNo: "STU-1045",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      rating: 5,
      date: "02 Nov 2026",
      studyHoursClocked: "420 hrs clocked",
      branch: "Central Library",
      text: "The best silent study library in the city! Power backup is seamless and the chairs are super comfortable even during 10-hour marathon study sessions. Clean washrooms and high-speed Wi-Fi.",
      status: "Published",
      isFeatured: true,
      helpfulVotes: 14,
    },
    {
      id: "rev-02",
      studentName: "Aditya Shah",
      rollNo: "STU-1088",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      rating: 5,
      date: "31 Oct 2026",
      studyHoursClocked: "310 hrs clocked",
      branch: "Central Library",
      text: "Pin drop silence is strictly maintained by the staff. The reserved desk option gives great mental peace knowing no one else can take your spot. Highly recommended for UPSC & CA aspirants.",
      status: "Published",
      isFeatured: true,
      helpfulVotes: 9,
    },
    {
      id: "rev-03",
      studentName: "Rahul Sharma",
      rollNo: "STU-1092",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      rating: 4,
      date: "28 Oct 2026",
      studyHoursClocked: "185 hrs clocked",
      branch: "West Campus",
      text: "Great atmosphere and good AC cooling. Sometimes the cafeteria gets crowded during lunch break, but study halls are top notch.",
      status: "Published",
      isFeatured: false,
      helpfulVotes: 4,
    },
    {
      id: "rev-04",
      studentName: "Anonymous Student",
      rollNo: "STU-1099",
      avatar: "",
      rating: 2,
      date: "25 Oct 2026",
      studyHoursClocked: "24 hrs clocked",
      branch: "Central Library",
      text: "AC temperature on the 2nd floor was set too low at 18 degrees yesterday. Please maintain it at 24 degrees.",
      status: "Pending Review",
      isFeatured: false,
      helpfulVotes: 1,
    },
  ])

  const [filterRating, setFilterRating] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const togglePublish = (id: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "Published" ? "Flagged / Hidden" : "Published" }
          : r
      )
    )
  }

  const toggleFeatured = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFeatured: !r.isFeatured } : r))
    )
  }

  const filteredReviews = reviews.filter((r) => {
    const matchesRating = filterRating === "all" || r.rating.toString() === filterRating
    const matchesStatus = filterStatus === "all" || r.status === filterStatus
    return matchesRating && matchesStatus
  })

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
            <span className="text-xs font-semibold text-primary">Student Reviews Moderation</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Student Reviews &amp; Testimonials Wall (PRD §58)
          </h1>
          <p className="text-sm text-muted-foreground">
            Moderate, feature, and showcase student ratings and feedback on your public library microsite.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Star className="size-3 mr-1 fill-amber-400 text-amber-400" />
            4.9 / 5.0 (148 Google &amp; Web Reviews)
          </Badge>
        </div>
      </div>

      {/* Rating Scorecard Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/80 flex flex-col justify-center items-center p-6 text-center">
          <div className="text-5xl font-extrabold text-primary">4.9</div>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="size-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Based on 148 verified student reviews</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <ThumbsUp className="size-3.5" />
            <span>98% Positive Sentiment</span>
          </div>
        </Card>

        <Card className="border-border/60 bg-card/80 lg:col-span-2 p-6 flex flex-col justify-center">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-12 text-muted-foreground font-medium">5 Star</span>
              <Progress value={92} className="h-2 flex-1" />
              <span className="w-10 text-right font-medium">92%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-12 text-muted-foreground font-medium">4 Star</span>
              <Progress value={6} className="h-2 flex-1" />
              <span className="w-10 text-right font-medium">6%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-12 text-muted-foreground font-medium">3 Star</span>
              <Progress value={1} className="h-2 flex-1" />
              <span className="w-10 text-right font-medium">1%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-12 text-muted-foreground font-medium">2 Star</span>
              <Progress value={0.5} className="h-2 flex-1" />
              <span className="w-10 text-right font-medium">0.5%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-12 text-muted-foreground font-medium">1 Star</span>
              <Progress value={0.5} className="h-2 flex-1" />
              <span className="w-10 text-right font-medium">0.5%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-border/60 bg-card/80">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Star Ratings</SelectItem>
                  <SelectItem value="5">5 Stars Only</SelectItem>
                  <SelectItem value="4">4 Stars Only</SelectItem>
                  <SelectItem value="2">2 Stars Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 w-40 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moderation Status</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Pending Review">Pending Review</SelectItem>
                  <SelectItem value="Flagged / Hidden">Flagged / Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <span className="text-xs text-muted-foreground">
              Showing {filteredReviews.length} reviews
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Cards List */}
      <div className="space-y-3">
        {filteredReviews.map((rev) => (
          <Card key={rev.id} className="border-border/60 bg-card/80">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 border border-border/60">
                    <AvatarImage src={rev.avatar} alt={rev.studentName} />
                    <AvatarFallback>{rev.studentName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold">{rev.studentName}</h4>
                      <Badge variant="outline" className="text-[10px] py-0">
                        {rev.rollNo}
                      </Badge>
                      {rev.isFeatured && (
                        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 text-[10px] py-0 gap-1">
                          <Sparkles className="size-2.5" />
                          Featured on Hero
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span>{rev.branch}</span>
                      <span>·</span>
                      <span className="font-mono text-primary">{rev.studyHoursClocked}</span>
                      <span>·</span>
                      <span>{rev.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`size-3.5 ${s <= rev.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                          }`}
                      />
                    ))}
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      rev.status === "Published"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px]"
                    }
                  >
                    {rev.status}
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed pl-12">
                "{rev.text}"
              </p>

              <div className="flex items-center justify-between border-t border-border/40 pt-2 pl-12 text-xs">
                <span className="text-[11px] text-muted-foreground">
                  {rev.helpfulVotes} students found this review helpful
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1"
                    onClick={() => toggleFeatured(rev.id)}
                  >
                    <Sparkles className="size-3 text-amber-500" />
                    {rev.isFeatured ? "Unfeature" : "Feature on Hero"}
                  </Button>

                  <Button
                    variant={rev.status === "Published" ? "ghost" : "default"}
                    size="sm"
                    className="h-7 text-[11px] gap-1"
                    onClick={() => togglePublish(rev.id)}
                  >
                    {rev.status === "Published" ? (
                      <>
                        <EyeOff className="size-3 text-muted-foreground" />
                        Hide Review
                      </>
                    ) : (
                      <>
                        <Eye className="size-3" />
                        Publish
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

