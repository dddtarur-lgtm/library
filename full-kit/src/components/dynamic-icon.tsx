// Refer to Lucide documentation for more details https://lucide.dev/guide/packages/lucide-react
import { memo } from "react"
import { icons } from "lucide-react"

import type { DynamicIconNameType } from "@/types"
import type { LucideProps } from "lucide-react"

interface DynamicIconProps extends LucideProps {
  name: DynamicIconNameType
}

const iconAliases: Record<string, keyof typeof icons> = {
  AlertTriangle: "TriangleAlert",
  AlertCircle: "CircleAlert",
  CheckCircle: "CircleCheck",
  XCircle: "CircleX",
}

// Component to render a dynamic Lucide icon based on its name (memoized for instantaneous rendering).
export const DynamicIcon = memo(function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const resolvedName = iconAliases[name] || name
  const LucideIcon = icons[resolvedName] // Dynamically retrieve the icon by name.

  // Return null if the icon name is invalid.
  if (!LucideIcon) return null

  return <LucideIcon {...props} />
})
