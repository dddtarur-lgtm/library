"use client"

import { useState } from "react"
import {
  Check,
  LayoutGrid,
  Search,
  Sparkles,
} from "lucide-react"

import {
  seatingTemplates,
  type SeatingTemplate,
} from "@/data/seating-templates"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TemplatePickerDialogProps {
  open: boolean
  onClose: () => void
  onSelectTemplate: (template: SeatingTemplate) => void
}

export function TemplatePickerDialog({
  open,
  onClose,
  onSelectTemplate,
}: TemplatePickerDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const filteredTemplates = seatingTemplates.filter((t) => {
    if (selectedCategory !== "All" && t.category !== selectedCategory)
      return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = t.name.toLowerCase().includes(q)
      const matchDesc = t.description.toLowerCase().includes(q)
      const matchSeats = t.seatCount.toString().includes(q)
      if (!matchName && !matchDesc && !matchSeats) return false
    }
    return true
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border border-border/80 shadow-2xl rounded-2xl z-[200] bg-card/95 backdrop-blur-md">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-xs">
                <LayoutGrid className="size-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <span>Library Seating Chart Presets</span>
                  <Badge variant="secondary" className="text-[11px] rounded-lg font-mono">
                    20 Real-World Templates
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Choose a pre-configured library floor arrangement matching your capacity and layout style
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Filter and Search Bar */}
        <div className="p-3 sm:px-5 border-b border-border/60 bg-card/60 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Capacity Categories */}
          <Tabs
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="w-full md:w-auto"
          >
            <TabsList className="h-8 p-1 bg-muted/60 rounded-xl w-full md:w-auto overflow-x-auto justify-start">
              <TabsTrigger value="All" className="text-xs h-6 px-3 rounded-lg">
                All (20)
              </TabsTrigger>
              <TabsTrigger
                value="15-25 Seats"
                className="text-xs h-6 px-3 rounded-lg"
              >
                15-25 Seats (5)
              </TabsTrigger>
              <TabsTrigger
                value="30-45 Seats"
                className="text-xs h-6 px-3 rounded-lg"
              >
                30-45 Seats (5)
              </TabsTrigger>
              <TabsTrigger
                value="50-65 Seats"
                className="text-xs h-6 px-3 rounded-lg"
              >
                50-65 Seats (5)
              </TabsTrigger>
              <TabsTrigger
                value="70-100 Seats"
                className="text-xs h-6 px-3 rounded-lg"
              >
                70-100 Seats (5)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search Box */}
          <div className="relative w-full md:w-[220px]">
            <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by name, seats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-background/80 rounded-xl border-border/60"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto no-scrollbar">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              No templates match your search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  onClick={() => {
                    onSelectTemplate(template)
                    onClose()
                  }}
                  className="group cursor-pointer border border-border/80 bg-card hover:border-primary/70 hover:shadow-md transition-all flex flex-col justify-between rounded-xl"
                >
                  <CardContent className="p-3.5 space-y-2.5">
                    {/* Top row: Name & Capacity badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {template.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {template.rows} × {template.cols} Grid Layout
                        </p>
                      </div>
                      <Badge
                        variant="default"
                        className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px] shrink-0 rounded-md"
                      >
                        {template.seatCount} Seats
                      </Badge>
                    </div>

                    {/* Mini Grid Blueprint Preview */}
                    <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
                      <div
                        className="grid gap-0.5 mx-auto w-fit"
                        style={{
                          gridTemplateColumns: `repeat(${template.cols}, minmax(0, 1fr))`,
                        }}
                      >
                        {template.cells.slice(0, 48).map((cell, idx) => (
                          <div
                            key={idx}
                            className={`size-2 rounded-[2px] ${
                              cell.type === "seat"
                                ? "bg-primary/80"
                                : cell.type === "cabin"
                                  ? "bg-purple-500/80"
                                  : cell.type === "computer"
                                    ? "bg-blue-500/80"
                                    : cell.type === "door"
                                      ? "bg-amber-500"
                                      : cell.type === "reception"
                                        ? "bg-emerald-500"
                                        : cell.type === "rack"
                                          ? "bg-orange-500"
                                          : cell.type === "water"
                                            ? "bg-cyan-500"
                                            : "bg-muted-foreground/15"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>

                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectTemplate(template)
                        onClose()
                      }}
                      className="w-full h-7 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground group-hover:bg-primary/90 rounded-lg shadow-xs"
                    >
                      <Check className="size-3" />
                      <span>Load Template ({template.seatCount} Seats)</span>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
