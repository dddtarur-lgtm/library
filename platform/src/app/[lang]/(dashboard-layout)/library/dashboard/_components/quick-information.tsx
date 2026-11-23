import { AlertTriangle, CheckCircle2 } from "lucide-react"

import { quickInformationData } from "../_data/quick-information"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function QuickInformation() {
  return (
    <Card className="flex flex-col justify-between overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold">Quick Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        {quickInformationData.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-x-2 rounded-md border border-border px-3 py-2 transition-colors hover:bg-accent/40 min-w-0"
          >
            <div className="flex min-w-0 items-center gap-x-2">
              {item.avatar ? (
                <Avatar className="size-6 shrink-0 rounded-md">
                  <AvatarImage src={item.avatar} alt={item.title} />
                  <AvatarFallback className="text-[9px]">
                    {item.title.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div
                  className={
                    item.category === "fee"
                      ? "flex size-6 shrink-0 items-center justify-center rounded-md bg-destructive/15 text-destructive"
                      : "flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-foreground"
                  }
                >
                  {item.category === "fee" ? (
                    <AlertTriangle className="size-3" aria-hidden />
                  ) : (
                    <CheckCircle2 className="size-3" aria-hidden />
                  )}
                </div>
              )}
              <span className="truncate text-xs font-medium text-foreground">
                {item.title}
              </span>
            </div>
            <Button
              size="sm"
              variant={item.actionVariant}
              className="h-6 shrink-0 px-2 text-[10px] font-medium"
            >
              {item.actionText}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
