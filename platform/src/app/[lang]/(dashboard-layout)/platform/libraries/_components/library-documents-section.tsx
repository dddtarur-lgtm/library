"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import {
  Download,
  Eye,
  FileCheck2,
  FileImage,
  FileText,
  FileUp,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface LibraryDocumentItem {
  id: string
  title: string
  documentNumber?: string
  fileName: string
  fileSize: string
  fileType: "image" | "pdf" | "other"
  fileUrl: string
  uploadedAt: string
}

interface LibraryDocumentsSectionProps {
  documents: LibraryDocumentItem[]
  onChange: (docs: LibraryDocumentItem[]) => void
  isAddMode?: boolean
}

const QUICK_TITLES = [
  "Aadhaar Card",
  "PAN Card",
  "GST Certificate",
  "Shop Act License",
  "Rental Lease",
  "Address Proof",
]

export function LibraryDocumentsSection({
  documents,
  onChange,
  isAddMode = false,
}: LibraryDocumentsSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [docTitle, setDocTitle] = useState("")
  const [docNumber, setDocNumber] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [previewDoc, setPreviewDoc] = useState<LibraryDocumentItem | null>(null)

  const handleFile = (file: File) => {
    setSelectedFile(file)
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const resetDialog = () => {
    setDocTitle("")
    setDocNumber("")
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleAddSubmit = () => {
    if (!docTitle.trim()) {
      toast.error("Please enter a document title")
      return
    }
    if (!selectedFile && !previewUrl) {
      toast.error("Please choose a file to upload")
      return
    }

    const isPdf =
      selectedFile?.type === "application/pdf" ||
      selectedFile?.name.endsWith(".pdf")

    const newDoc: LibraryDocumentItem = {
      id: `doc-${Date.now()}`,
      title: docTitle.trim(),
      documentNumber: docNumber.trim() || undefined,
      fileName:
        selectedFile?.name ||
        `${docTitle.toLowerCase().replace(/\s+/g, "_")}.jpg`,
      fileSize: selectedFile ? formatFileSize(selectedFile.size) : "1.2 MB",
      fileType: isPdf
        ? "pdf"
        : selectedFile?.type.startsWith("image/")
          ? "image"
          : "other",
      fileUrl: previewUrl || "#",
      uploadedAt: "Just now",
    }

    onChange([newDoc, ...documents])
    toast.success(`${newDoc.title} uploaded`, {
      description: `${newDoc.fileName} (${newDoc.fileSize}) attached.`,
    })
    resetDialog()
    setAddDialogOpen(false)
  }

  const handleRemove = (doc: LibraryDocumentItem) => {
    onChange(documents.filter((d) => d.id !== doc.id))
    toast.info(`Removed ${doc.title}`)
  }

  return (
    <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
      <CardHeader className="p-3.5 pb-2.5 border-b border-border/80 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <FileCheck2 className="size-4 text-primary shrink-0" />
              <span>Business KYC & Legal Documents</span>
              <Badge
                variant="outline"
                className="text-[10px] font-bold px-1.5 py-0"
              >
                {documents.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              {isAddMode
                ? "Attach owner KYC, shop license, GST certificate, or lease proofs."
                : "Verified business registration proofs and owner identity files."}
            </CardDescription>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs font-bold gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shrink-0"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="size-3.5" />
            <span>Add Document</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 sm:p-4">
        {documents.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border/90 bg-muted/20 flex flex-col items-center justify-center text-center gap-2">
            <FileUp className="size-7 text-muted-foreground/70" />
            <p className="text-xs font-semibold text-foreground">
              No KYC documents attached yet
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold mt-1"
              onClick={() => setAddDialogOpen(true)}
            >
              <UploadCloud className="size-3.5 me-1.5 text-primary" />
              Upload First Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-xl border border-border/80 bg-background/60 flex items-center gap-3 hover:border-primary/40 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="size-12 rounded-lg border border-border/80 bg-muted overflow-hidden flex items-center justify-center shrink-0 cursor-pointer"
                  title="Preview document"
                >
                  {doc.fileType === "image" && doc.fileUrl !== "#" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.fileUrl}
                      alt={doc.title}
                      className="size-full object-cover"
                    />
                  ) : doc.fileType === "image" ? (
                    <FileImage className="size-5 text-primary" />
                  ) : (
                    <FileText className="size-5 text-amber-500" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {doc.title}
                  </p>
                  {doc.documentNumber && (
                    <p className="text-[11px] font-mono text-primary truncate">
                      {doc.documentNumber}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {doc.fileName} • {doc.fileSize}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setPreviewDoc(doc)}
                    aria-label={`Preview ${doc.title}`}
                  >
                    <Eye className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10"
                    onClick={() => handleRemove(doc)}
                    aria-label={`Remove ${doc.title}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Document Dialog */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open)
          if (!open) resetDialog()
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Upload Business KYC Document
            </DialogTitle>
            <DialogDescription className="text-xs">
              Attach scanned image or PDF proof for this library tenant.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Document Title *</Label>
              <Input
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Shop Act License"
                className="h-8.5 text-xs"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_TITLES.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setDocTitle(chip)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors cursor-pointer",
                      docTitle === chip
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">
                Document Number (Optional)
              </Label>
              <Input
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="e.g. 24ABCDE1234F1Z5"
                className="h-8.5 text-xs font-mono"
              />
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border/80 bg-muted/20 hover:border-primary/40"
              )}
            >
              <UploadCloud className="size-6 mx-auto text-primary mb-1.5" />
              <p className="text-xs font-semibold text-foreground">
                {selectedFile
                  ? selectedFile.name
                  : "Click or drag image / PDF here"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                PNG, JPG or PDF up to 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs font-bold bg-primary text-primary-foreground"
              onClick={handleAddSubmit}
            >
              Attach Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      >
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {previewDoc?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {previewDoc?.fileName} • {previewDoc?.fileSize}
              {previewDoc?.documentNumber
                ? ` • No: ${previewDoc.documentNumber}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/30 min-h-[220px] flex items-center justify-center overflow-hidden p-3">
            {previewDoc?.fileType === "image" && previewDoc.fileUrl !== "#" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewDoc.fileUrl}
                alt={previewDoc.title}
                className="max-h-[360px] w-auto object-contain rounded-lg"
              />
            ) : (
              <div className="text-center space-y-2">
                <FileText className="size-10 mx-auto text-amber-500" />
                <p className="text-xs font-semibold text-foreground">
                  {previewDoc?.fileName}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setPreviewDoc(null)}
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs font-bold bg-primary text-primary-foreground gap-1.5"
              onClick={() =>
                toast.success(`Downloading ${previewDoc?.fileName}`)
              }
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
