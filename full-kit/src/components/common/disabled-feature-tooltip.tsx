"use client"

import React, { ReactNode } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface DisabledFeatureTooltipProps {
  children: ReactNode
  reasonEn?: string
  reasonHi?: string
  reasonGu?: string
  lang?: string
  featureId?: string
}

const DEFAULT_REASONS = {
  en: "This feature is currently not available yet.",
  hi: "यह सुविधा वर्तमान में उपलब्ध नहीं है।",
  gu: "આ સુવિધા હાલમાં ઉપલબ્ધ નથી.",
}

export function DisabledFeatureTooltip({
  children,
  reasonEn = DEFAULT_REASONS.en,
  reasonHi = DEFAULT_REASONS.hi,
  reasonGu = DEFAULT_REASONS.gu,
  lang = "en",
  featureId,
}: DisabledFeatureTooltipProps) {
  const message =
    lang === "hi"
      ? reasonHi
      : lang === "gu"
        ? reasonGu
        : reasonEn

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex cursor-not-allowed opacity-60"
            data-feature-id={featureId}
            aria-disabled="true"
          >
            {React.isValidElement(children)
              ? React.cloneElement(children as React.ReactElement<any>, {
                  disabled: true,
                  "aria-disabled": "true",
                  tabIndex: -1,
                })
              : children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs font-medium">
          {message}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default DisabledFeatureTooltip

