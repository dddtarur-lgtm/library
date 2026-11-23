"use client"

import { useState } from "react"
import {
  Activity,
  FileCode2,
  Inbox,
  Link2,
  Send,
  Settings2,
} from "lucide-react"

import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ConnectionsPanel,
  DeliveryLogsPanel,
  GatewaySettingsPanel,
  TemplatesPanel,
} from "./_components/mail-infra-panels"
import { MailboxWorkspace } from "./_components/mailbox-workspace"

type EmailWorkspaceTab =
  | "mailbox"
  | "connections"
  | "templates"
  | "logs"
  | "gateway"

const WORKSPACE_TABS: {
  id: EmailWorkspaceTab
  label: string
  icon: typeof Inbox
  badge?: string
}[] = [
  { id: "mailbox", label: "Mailbox", icon: Inbox },
  { id: "connections", label: "Connections", icon: Link2, badge: "1 Alert" },
  { id: "templates", label: "Templates", icon: FileCode2 },
  { id: "logs", label: "Delivery Logs", icon: Activity },
  { id: "gateway", label: "Gateway & DNS", icon: Settings2 },
]

export default function EmailWorkspacePage() {
  const [activeTab, setActiveTab] = useState<EmailWorkspaceTab>("mailbox")

  return (
    <section className="container space-y-4 py-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Email &amp; Mailbox
              </h1>
              <Badge
                variant="secondary"
                className="bg-emerald-500/15 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
              >
                99.2% Delivery • 1 Alert
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Unified platform inbox, tenant OAuth/SMTP health, templates, logs,
              and DNS settings.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="Email workspace sections"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background/80 p-1"
          >
            {WORKSPACE_TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            onClick={() =>
              toast({
                title: "Test ping sent",
                description:
                  "Verification email dispatched via Resend API to admin@librarysaas.io.",
              })
            }
          >
            <Send className="size-3.5" />
            Send Test
          </Button>
        </div>
      </div>

      {activeTab === "mailbox" && <MailboxWorkspace />}
      {activeTab === "connections" && <ConnectionsPanel />}
      {activeTab === "templates" && <TemplatesPanel />}
      {activeTab === "logs" && <DeliveryLogsPanel />}
      {activeTab === "gateway" && <GatewaySettingsPanel />}
    </section>
  )
}
