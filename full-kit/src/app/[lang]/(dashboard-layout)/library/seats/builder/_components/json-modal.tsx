"use client"

import React, { useState } from "react"
import { Check, Copy, RefreshCw, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { CanvasElement } from "../seating-editor-types"

interface JsonModalProps {
  open: boolean
  name: string
  elements: CanvasElement[]
  canvasWidth?: number
  canvasHeight?: number
  onClose: () => void
  onLoadLayout: (
    name: string,
    elements: CanvasElement[],
    canvasWidth?: number,
    canvasHeight?: number
  ) => void
  onResetSample: () => void
}

export function JsonModal({
  open,
  name,
  elements,
  canvasWidth,
  canvasHeight,
  onClose,
  onLoadLayout,
  onResetSample,
}: JsonModalProps) {
  const [jsonText, setJsonText] = useState("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update textarea when opened
  React.useEffect(() => {
    if (open) {
      setJsonText(
        JSON.stringify({ name, elements, canvasWidth, canvasHeight }, null, 2)
      )
      setError(null)
      setCopied(false)
    }
  }, [open, name, elements, canvasWidth, canvasHeight])

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLoad = () => {
    try {
      const parsed = JSON.parse(jsonText)
      if (!parsed.elements || !Array.isArray(parsed.elements)) {
        setError("Invalid layout structure: missing 'elements' array.")
        return
      }
      onLoadLayout(
        parsed.name || name,
        parsed.elements,
        parsed.canvasWidth,
        parsed.canvasHeight
      )
      onClose()
    } catch {
      setError("Syntax error: Invalid JSON formatted text.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl rounded-2xl bg-card/95 backdrop-blur-md border-border shadow-2xl z-[200]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <span>Layout JSON Data</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Export your seating layout to JSON, or paste an existing layout to
            load it onto the canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value)
              setError(null)
            }}
            className="h-64 font-mono text-xs bg-muted/40 border-border rounded-xl resize-none"
            spellCheck={false}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs gap-1.5 rounded-xl"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onResetSample()
                onClose()
              }}
              className="text-xs gap-1.5 text-muted-foreground hover:text-foreground rounded-xl"
            >
              <RefreshCw className="size-3.5" />
              <span>Reset Sample</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleLoad}
              className="text-xs gap-1.5 rounded-xl font-semibold bg-primary"
            >
              <Upload className="size-3.5" />
              <span>Load Layout</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
