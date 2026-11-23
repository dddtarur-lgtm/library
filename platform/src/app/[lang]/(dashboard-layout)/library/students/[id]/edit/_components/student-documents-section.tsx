"use client"

import { useRef, useState } from "react"
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
  X,
} from "lucide-react"
import { toast } from "sonner"

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

export interface StudentDocumentItem {
  id: string
  title: string
  documentNumber?: string
  fileName: string
  fileSize: string
  fileType: "image" | "pdf" | "other"
  fileUrl: string
  uploadedAt: string
}

interface StudentDocumentsSectionProps {
  documents: StudentDocumentItem[]
  onChange: (docs: StudentDocumentItem[]) => void
  isAddMode?: boolean
}

const QUICK_TITLES = [
  "Aadhaar Card",
  "College ID",
  "PAN Card",
  "Driving License",
  "Marksheet",
  "Address Proof",
]

export function StudentDocumentsSection({
  documents,
  onChange,
  isAddMode = false,
}: StudentDocumentsSectionProps) {
  // Add Document Dialog State
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [docTitle, setDocTitle] = useState("")
  const [docNumber, setDocNumber] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Document Fullscreen Preview Dialog State
  const [previewDoc, setPreviewDoc] = useState<StudentDocumentItem | null>(null)

  // Handle local file selection
  const handleFile = (file: File) => {
    setSelectedFile(file)
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!docTitle.trim()) {
      toast.error("Please enter a document title")
      return
    }
    if (!selectedFile && !previewUrl) {
      toast.error("Please choose a file to upload")
      return
    }

    const isPdf = selectedFile?.type === "application/pdf" || selectedFile?.name.endsWith(".pdf")
    const newDoc: StudentDocumentItem = {
      id: `doc-${Date.now()}`,
      title: docTitle.trim(),
      documentNumber: docNumber.trim() || undefined,
      fileName: selectedFile?.name || `${docTitle.toLowerCase().replace(/\s+/g, "_")}.jpg`,
      fileSize: selectedFile ? formatFileSize(selectedFile.size) : "1.2 MB",
      fileType: isPdf ? "pdf" : "image",
      fileUrl:
        previewUrl ||
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
      uploadedAt: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    }

    onChange([newDoc, ...documents])
    toast.success(`Document "${newDoc.title}" added successfully!`)

    // Reset Form
    setDocTitle("")
    setDocNumber("")
    setSelectedFile(null)
    setPreviewUrl(null)
    setAddDialogOpen(false)
  }

  const handleDelete = (docId: string, title: string) => {
    onChange(documents.filter((d) => d.id !== docId))
    toast.success(`Document "${title}" removed`)
  }

  return (
    <>
      <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
        <CardHeader className="p-3.5 pb-2.5 border-b border-border/80 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <FileText className="size-4 text-primary shrink-0" />
                <span>Documents & Identity Verification</span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold border-primary/30 text-primary bg-primary/5 px-1.5 py-0"
                >
                  {documents.length} {documents.length === 1 ? "File" : "Files"}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {isAddMode
                  ? "Upload student KYC records (Aadhaar, College ID, Marksheet) with live preview."
                  : "Verified student identity proofs, government records, and academic attachments."}
              </CardDescription>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs font-semibold border-primary/40 text-primary hover:bg-primary/10 shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
              onClick={() => {
                setDocTitle("")
                setDocNumber("")
                setSelectedFile(null)
                setPreviewUrl(null)
                setAddDialogOpen(true)
              }}
            >
              <Plus className="size-3.5" />
              <span>Add Document</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 sm:p-4 space-y-3">
          {documents.length === 0 ? (
            /* Empty State */
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2.5 rounded-xl border border-dashed border-border/80 bg-muted/15 p-6">
              <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                <FileUp className="size-5" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-xs font-bold text-foreground">
                  No documents attached yet
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Upload identity proofs, Aadhaar, or student college cards for KYC record-keeping.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7.5 px-3 text-xs font-semibold gap-1.5 text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="size-3" />
                <span>Upload First Document</span>
              </Button>
            </div>
          ) : (
            /* Documents Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documents.map((doc) => {
                const isImage = doc.fileType === "image"
                return (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors flex items-start gap-3 group relative shadow-2xs"
                  >
                    {/* Thumbnail Preview Area */}
                    <div
                      onClick={() => setPreviewDoc(doc)}
                      className="size-14 sm:size-16 rounded-lg border border-border/90 bg-background overflow-hidden shrink-0 flex items-center justify-center cursor-pointer group-hover:ring-2 group-hover:ring-primary/40 transition-all relative"
                      title="Click to view full preview"
                    >
                      {isImage ? (
                        <img
                          src={doc.fileUrl}
                          alt={doc.title}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-rose-500">
                          <FileText className="size-6" />
                          <span className="text-[9px] font-black uppercase tracking-wider">
                            PDF
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="size-4 text-white" />
                      </div>
                    </div>

                    {/* Metadata Content */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-foreground truncate max-w-[180px]">
                          {doc.title}
                        </h4>
                        {doc.documentNumber && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-mono font-semibold px-1 py-0 h-4 border border-border"
                          >
                            {doc.documentNumber}
                          </Badge>
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground truncate font-mono">
                        {doc.fileName}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium pt-0.5">
                        <span>{doc.fileSize}</span>
                        <span>•</span>
                        <span>Uploaded {doc.uploadedAt}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0 self-start">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                        title="Preview Document"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Delete Document"
                        onClick={() => handleDelete(doc.id, doc.title)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* =========================================================================
          ADD DOCUMENT DIALOG (WITH LIVE PREVIEW & TITLE / DOC NUMBER)
         ========================================================================= */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border p-4 sm:p-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <FileUp className="size-4.5 text-primary shrink-0" />
              <span>Upload Student Document</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add identity verification, Aadhaar, college pass, or academic records.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-3.5 py-1">
            {/* 1. Document Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Document Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Aadhaar Card, College ID, PAN Card"
                className="h-8.5 text-xs font-medium"
                required
              />

              {/* Quick Title Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Quick Select:
                </span>
                {QUICK_TITLES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDocTitle(t)}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border/80 bg-muted/40 hover:bg-primary/10 hover:text-primary hover:border-primary/40 font-medium cursor-pointer transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Document Number (Optional) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Document Number
                </Label>
                <span className="text-[10px] text-muted-foreground">Optional</span>
              </div>
              <Input
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="e.g. 1234-5678-9012 or ID-9982"
                className="h-8.5 text-xs font-mono"
              />
            </div>

            {/* 3. File Upload Area with Dropzone & Live Preview */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">
                Upload File <span className="text-destructive">*</span>
              </Label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {selectedFile ? (
                /* Selected File Preview Box */
                <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="size-12 rounded-lg object-cover border border-primary/20 shrink-0"
                      />
                    ) : (
                      <div className="size-12 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 text-primary">
                        <FileText className="size-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                /* Upload Dropzone */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5 ${
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-border/80 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
                  }`}
                >
                  <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <UploadCloud className="size-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">
                      Click to choose or drag & drop file
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Supports JPG, PNG, WEBP, or PDF (Max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs cursor-pointer"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!docTitle.trim() || (!selectedFile && !previewUrl)}
                className="text-xs font-bold bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90"
              >
                <Plus className="size-3.5 me-1" />
                <span>Upload Document</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          FULLSCREEN DOCUMENT PREVIEW DIALOG
         ========================================================================= */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-2xl bg-card border-border p-4 sm:p-5 max-h-[90vh] flex flex-col">
          {previewDoc && (
            <>
              <DialogHeader className="space-y-1 pb-2 border-b border-border/70 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <FileCheck2 className="size-5 text-emerald-500 shrink-0" />
                    <span>{previewDoc.title}</span>
                  </DialogTitle>
                  {previewDoc.documentNumber && (
                    <Badge variant="outline" className="text-xs font-mono font-bold">
                      {previewDoc.documentNumber}
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>File: {previewDoc.fileName}</span>
                  <span>•</span>
                  <span>{previewDoc.fileSize}</span>
                  <span>•</span>
                  <span>Uploaded {previewDoc.uploadedAt}</span>
                </DialogDescription>
              </DialogHeader>

              {/* Document Display Preview Area */}
              <div className="py-3 flex-1 overflow-auto flex items-center justify-center bg-muted/30 rounded-xl border border-border/80 my-2 min-h-[260px] max-h-[460px]">
                {previewDoc.fileType === "image" ? (
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.title}
                    className="max-h-full max-w-full rounded-lg object-contain shadow-sm"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 space-y-3 text-center">
                    <div className="size-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                      <FileText className="size-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">
                        {previewDoc.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF Document ({previewDoc.fileSize})
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-row items-center justify-between pt-2 border-t border-border/70 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 cursor-pointer"
                  onClick={() => {
                    toast.success(`Downloading ${previewDoc.fileName}`)
                  }}
                >
                  <Download className="size-3.5" />
                  <span>Download File</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="text-xs font-semibold cursor-pointer"
                  onClick={() => setPreviewDoc(null)}
                >
                  Close Preview
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
