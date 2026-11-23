"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  KeyRound,
  Lock,
  Mail,
  MailCheck,
  RefreshCw,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Unplug,
  X,
  XCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface OauthAccountState {
  isConnected: boolean
  provider: "google" | "microsoft" | null
  emailAddress: string
  displayName: string
  accountType: "personal" | "workspace" | "outlook" | "m365"
  connectedAt: string | null
  status: "connected" | "disconnected" | "cancelled" | "needs_reconnect"
  scopes: string[]
  hasRefreshToken: boolean
  lastTestResult: {
    status: "Success" | "Failed"
    recipient: string
    timestamp: string
    latencyMs: number
    message: string
  } | null
}

export function ConnectedEmailOauthCard() {
  const searchParams = useSearchParams()

  const [account, setAccount] = useState<OauthAccountState>({
    isConnected: true,
    provider: "google",
    emailAddress: "apexstudyhub.library@gmail.com",
    displayName: "Apex Study Hub & Library",
    accountType: "workspace",
    connectedAt: "03 Nov 2026, 10:30 AM",
    status: "connected",
    scopes: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    hasRefreshToken: true,
    lastTestResult: {
      status: "Success",
      recipient: "library.owner.pune@gmail.com",
      timestamp: "03 Nov 2026, 10:35 AM",
      latencyMs: 380,
      message: "Direct 1-click handshake verified with GOOGLE API. Send-only scope (no inbox reading) active.",
    },
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isBeforeConnectOpen, setIsBeforeConnectOpen] = useState(false)
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false)
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false)
  const [isTestingInProgress, setIsTestingInProgress] = useState(false)

  // Test email inputs
  const [testRecipient, setTestRecipient] = useState("owner.test@gmail.com")
  const [testSubject, setTestSubject] = useState("Verification: Official Library Email Dispatch Test")

  // Selected testing account for Step 6 simulation
  const [simulateAccountType, setSimulateAccountType] = useState<
    "workspace" | "personal" | "outlook" | "m365"
  >("workspace")

  // Read query params from callback
  useEffect(() => {
    const oauthStatus = searchParams.get("oauth_status")
    const email = searchParams.get("email")
    const provider = searchParams.get("provider") as "google" | "microsoft" | null

    if (oauthStatus === "connected" && email) {
      setAccount((prev) => ({
        ...prev,
        isConnected: true,
        status: "connected",
        emailAddress: email,
        provider: provider || prev.provider,
        connectedAt: "Just now",
      }))
      toast.success("Library email connected successfully!", {
        description: `Now sending official student notices from ${email}.`,
      })
    } else if (oauthStatus === "cancelled") {
      setAccount((prev) => ({
        ...prev,
        status: "cancelled",
      }))
      toast.info("Connection cancelled", {
        description: "You pressed Cancel or closed the provider window. No changes were made.",
      })
    } else if (oauthStatus === "failed") {
      setAccount((prev) => ({
        ...prev,
        status: "needs_reconnect",
      }))
      toast.error("Connection failed or expired. Please try connecting again.")
    }
  }, [searchParams])

  // Fetch initial status from server API
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/email/oauth/status")
      if (res.ok) {
        const data = await res.json()
        setAccount(data)
      }
    } catch {
      // Keep state
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  // Start OAuth Flow (Step 3)
  const handleStartOAuth = async (
    provider: "google" | "microsoft",
    accountType: "workspace" | "personal" | "outlook" | "m365" = "workspace",
    simulateCancel: boolean = false
  ) => {
    setIsLoading(true)
    setIsBeforeConnectOpen(false)

    try {
      if (simulateCancel) {
        // Step 5: Test Cancel Path
        await fetch("/api/mcp/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "simulate_cancel" }),
        })
        setAccount((prev) => ({ ...prev, status: "cancelled" }))
        setIsLoading(false)
        toast.info("Connection cancelled. Try again whenever you're ready.")
        return
      }

      // Call backend to build provider authorization link with PKCE & state (Step 3)
      const res = await fetch(
        `/api/email/oauth/connect?provider=${provider}&accountType=${accountType}&simulate=true`
      )
      const data = await res.json()

      if (data.authUrl) {
        toast.loading(`Connecting to ${provider === "google" ? "Google" : "Microsoft"}...`, {
          duration: 1200,
        })
        // Redirect browser to authorization URL (Step 3)
        window.location.href = data.authUrl
      }
    } catch (err: any) {
      toast.error("Failed to start email connection: " + err.message)
      setIsLoading(false)
    }
  }

  // Handle Disconnect (Step 5)
  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/email/oauth/disconnect", {
        method: "POST",
      })
      if (res.ok) {
        setAccount((prev) => ({
          ...prev,
          isConnected: false,
          status: "disconnected",
          hasRefreshToken: false,
        }))
        setIsDisconnectDialogOpen(false)
        toast.success("Library email disconnected", {
          description: "Encrypted refresh token deleted from vault. Emails will now route via shared platform SMTP.",
        })
      }
    } catch (err: any) {
      toast.error("Failed to disconnect: " + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Send Test Email (Step 5)
  const handleSendTestEmail = async () => {
    if (!testRecipient) {
      toast.error("Please enter a test recipient email.")
      return
    }

    setIsTestingInProgress(true)
    try {
      const res = await fetch("/api/email/oauth/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: testRecipient,
          subject: testSubject,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success("Test email delivered successfully!", {
          description: `Dispatched from ${data.sender} to ${data.recipient} in ${data.deliveryTimeMs}ms.`,
        })
        setIsTestEmailOpen(false)
        fetchStatus()
      } else {
        toast.error(data.error || "Failed sending test email.")
      }
    } catch (err: any) {
      toast.error("Error: " + err.message)
    } finally {
      setIsTestingInProgress(false)
    }
  }

  // Simulate Token Expiry / Needs Reconnect (Step 5 & 6)
  const handleSimulateTokenExpiry = async () => {
    await fetch("/api/mcp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "simulate_expire" }),
    })
    setAccount((prev) => ({
      ...prev,
      status: "needs_reconnect",
    }))
    toast.warning("Token marked as expired / revoked for testing.")
  }

  return (
    <>
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        {/* Header Strip */}
        <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <MailCheck className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Connected Library Email Address</span>
                  <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                    1-Click OAuth
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Send official admission receipts, fee reminders, and student notices directly from your library email address.
                </CardDescription>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {account.isConnected && account.status === "connected" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTestEmailOpen(true)}
                    className="h-8 text-xs font-semibold border-border hover:bg-accent text-foreground gap-1.5"
                  >
                    <Send className="size-3.5 text-primary" />
                    <span>Send Test Email</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDisconnectDialogOpen(true)}
                    className="h-8 text-xs font-semibold border-destructive/30 hover:bg-destructive/10 text-destructive gap-1.5"
                  >
                    <Unplug className="size-3.5" />
                    <span>Disconnect</span>
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsBeforeConnectOpen(true)}
                  className="h-8 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs gap-1.5"
                >
                  <Mail className="size-3.5" />
                  <span>Connect Library Email</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* STEP 5: STATE 1 - CONNECTED */}
          {account.isConnected && account.status === "connected" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-foreground">
                        {account.emailAddress}
                      </span>
                      <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        {account.provider === "google" ? "Google Workspace / Gmail" : "Microsoft 365"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                        Verified
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      Connected on <span className="font-semibold text-foreground">{account.connectedAt}</span> &bull; Encrypted Refresh Token active in AES-256 vault.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => setIsTestEmailOpen(true)}
                    className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                  >
                    <Send className="size-3.5" />
                    <span>Send Test Email</span>
                  </Button>
                </div>
              </div>

              {/* Scopes & Privacy Guarantee Info Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="size-3 text-primary" />
                    Granted Scopes (Send-Only)
                  </span>
                  <p className="font-mono text-foreground font-semibold">
                    {account.provider === "google" ? "gmail.send" : "Mail.Send"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Minimal permissions only. Inbox read access is strictly unrequested and blocked.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="size-3 text-emerald-600" />
                    Deliverability Health
                  </span>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Direct Domain Authenticated
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Emails bypass spam filters because they arrive directly from your authenticated domain.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCw className="size-3 text-purple-600" />
                    Offline Access Token
                  </span>
                  <p className="font-semibold text-foreground">
                    Auto-Refreshing (No Re-login)
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Background transactional emails deliver seamlessly 24/7.
                  </p>
                </div>
              </div>

              {/* Last Test Email Result (if any) */}
              {account.lastTestResult && (
                <div className="p-3 rounded-lg border border-border/80 bg-background text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-muted-foreground">Last dispatch test:</span>
                    <span className="font-medium text-foreground">{account.lastTestResult.message}</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                    {account.lastTestResult.timestamp}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: STATE 2 - CANCELLED */}
          {account.status === "cancelled" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 mt-0.5">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Connection cancelled, try again
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You or your provider cancelled the OAuth consent screen. No error occurred, and your previous settings remain unchanged.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => setIsBeforeConnectOpen(true)}
                  className="h-8 px-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Try Again</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: STATE 3 - NEEDS RECONNECT (FAILED / EXPIRED) */}
          {account.status === "needs_reconnect" && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-600 mt-0.5">
                  <ShieldAlert className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>Needs reconnect</span>
                    <Badge variant="destructive" className="text-[10px]">Token Expired</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    The authorization token for <span className="font-mono font-semibold text-foreground">{account.emailAddress}</span> was revoked or expired. Click Reconnect to resume sending emails.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => setIsBeforeConnectOpen(true)}
                  className="h-8 px-3 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Reconnect Email</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: STATE 4 - DISCONNECTED / INITIAL */}
          {!account.isConnected && account.status === "disconnected" && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3 bg-muted/10">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Mail className="size-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-foreground">
                  No Personal or Workspace Email Connected
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your library is currently falling back to the shared Platform SMTP. Connect your Google Workspace, Gmail, or Microsoft 365 account to send emails from your own domain.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsBeforeConnectOpen(true)}
                className="h-9 px-4 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs"
              >
                <Mail className="size-4" />
                <span>Connect Library Email</span>
              </Button>
            </div>
          )}

          {/* STEP 6: Developer & Admin Interactive Testing Panel */}
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Step 6: Account &amp; Path Testing Matrix
              </span>
              <span className="text-[11px] text-muted-foreground">
                Verify all 4 provider account types &amp; failure paths
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] text-muted-foreground">Quick test accounts:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStartOAuth("google", "workspace")}
                className="h-7 text-[11px] border-border bg-card hover:bg-accent text-foreground"
              >
                Google Workspace
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStartOAuth("google", "personal")}
                className="h-7 text-[11px] border-border bg-card hover:bg-accent text-foreground"
              >
                Personal Gmail
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStartOAuth("microsoft", "m365")}
                className="h-7 text-[11px] border-border bg-card hover:bg-accent text-foreground"
              >
                Microsoft 365
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStartOAuth("microsoft", "outlook")}
                className="h-7 text-[11px] border-border bg-card hover:bg-accent text-foreground"
              >
                Outlook.com
              </Button>

              <div className="ms-auto flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStartOAuth("google", "workspace", true)}
                  className="h-7 text-[11px] text-amber-600 hover:bg-amber-500/10"
                >
                  Test Cancel Path
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSimulateTokenExpiry}
                  className="h-7 text-[11px] text-rose-600 hover:bg-rose-500/10"
                >
                  Test Expired Path
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STEP 1: “Before you connect” Modal */}
      <Dialog open={isBeforeConnectOpen} onOpenChange={setIsBeforeConnectOpen}>
        <DialogContent className="max-w-md p-6 border-border bg-card">
          <DialogHeader className="text-center sm:text-center space-y-3">
            {/* Logo and Icon */}
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/25 shadow-xs">
              <MailCheck className="size-7" />
            </div>

            <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
              Connect your library email
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Send fee receipts and library notifications to students directly from your official address.
            </DialogDescription>
          </DialogHeader>

          {/* Plain-Language Bullets (Step 1 requirement) */}
          <div className="space-y-3 py-3 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 mt-0.5">
                <Send className="size-3.5" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-foreground">
                  We will send emails to your students from your address
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Admission confirmations, monthly fees receipts, and attendance updates appear under your verified name.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mt-0.5">
                <Lock className="size-3.5" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-foreground">
                  We cannot read your inbox
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  We only request the minimal <code className="bg-background px-1 py-0.2 rounded font-mono text-primary font-bold">gmail.send</code> / <code className="bg-background px-1 py-0.2 rounded font-mono text-primary font-bold">Mail.Send</code> scope. Your inbox, drafts, and personal emails remain 100% private.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 mt-0.5">
                <Unplug className="size-3.5" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-foreground">
                  You can disconnect anytime
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Revoke access instantly with one click from this dashboard or directly from your Google/Microsoft account security settings.
                </p>
              </div>
            </div>
          </div>

          {/* Provider Selection Buttons (Step 1 requirement) */}
          <div className="space-y-2 pt-2">
            {/* Continue with Google */}
            <Button
              type="button"
              onClick={() => handleStartOAuth("google", simulateAccountType)}
              disabled={isLoading}
              className="w-full h-11 bg-card hover:bg-accent border border-border text-foreground font-bold shadow-xs flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.43 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.57 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>

            {/* Continue with Microsoft */}
            <Button
              type="button"
              onClick={() => handleStartOAuth("microsoft", simulateAccountType)}
              disabled={isLoading}
              className="w-full h-11 bg-card hover:bg-accent border border-border text-foreground font-bold shadow-xs flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="size-5 shrink-0" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              <span>Continue with Microsoft</span>
            </Button>

            {/* Cancel Button */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsBeforeConnectOpen(false)}
              className="w-full h-9 text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Cancel
            </Button>
          </div>

          {/* STEP 2: In-App Documentation for Google & Microsoft Console Setup */}
          <div className="pt-2 border-t border-border">
            <details className="text-xs text-muted-foreground group">
              <summary className="font-semibold text-foreground cursor-pointer flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="size-3.5 text-primary" />
                  Step 2: Provider Branding &amp; Minimal Scopes Setup
                </span>
                <span className="text-[10px] text-primary group-open:rotate-90 transition-transform">
                  &gt;
                </span>
              </summary>
              <div className="mt-2 space-y-2 p-3 rounded-lg bg-background border border-border text-[11px] leading-relaxed">
                <div>
                  <strong className="text-foreground">Google Cloud Console:</strong>
                  <ul className="list-disc ps-4 mt-0.5 space-y-0.5">
                    <li>Set App Name: &ldquo;Apex Study Hub &amp; Library&rdquo;</li>
                    <li>Add authorized redirect URI: <code className="font-mono text-primary">/api/email/oauth/callback</code></li>
                    <li>Restricted scopes: Add only <code className="font-mono text-primary">https://www.googleapis.com/auth/gmail.send</code></li>
                  </ul>
                </div>
                <div>
                  <strong className="text-foreground">Microsoft Entra / Azure:</strong>
                  <ul className="list-disc ps-4 mt-0.5 space-y-0.5">
                    <li>Register web app with Web Redirect URI</li>
                    <li>API Permissions: Select Microsoft Graph &gt; Delegated &gt; <code className="font-mono text-primary">Mail.Send</code></li>
                  </ul>
                </div>
              </div>
            </details>
          </div>
        </DialogContent>
      </Dialog>

      {/* SEND TEST EMAIL DIALOG (Step 5 requirement) */}
      <Dialog open={isTestEmailOpen} onOpenChange={setIsTestEmailOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-1 border border-primary/20">
              <Send className="size-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Send Test Email
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Verify your connected account can dispatch transactional student notices without delivery errors.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Sending From (Connected Address)</Label>
              <Input
                value={account.emailAddress}
                disabled
                className="h-8 text-xs font-mono bg-muted/40 border-border"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Recipient Email Address</Label>
              <Input
                placeholder="your.email@example.com"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                className="h-8 text-xs font-mono border-border bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Subject Line</Label>
              <Input
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                className="h-8 text-xs border-border bg-background"
              />
            </div>

            <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-[11px] text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-600" />
                Live Preview Content:
              </span>
              <p className="italic">
                &ldquo;Hello! This confirms that your library email gateway is live. All student fee receipts, overdue notices, and study alerts will be sent from this account.&rdquo;
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTestEmailOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendTestEmail}
              disabled={isTestingInProgress}
              className="bg-primary text-primary-foreground font-bold gap-1.5 shadow-xs"
            >
              {isTestingInProgress ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Send Test Email</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DISCONNECT CONFIRMATION DIALOG (Step 5 requirement) */}
      <Dialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-1 border border-destructive/20">
              <Unplug className="size-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Disconnect Library Email?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to disconnect <span className="font-mono font-semibold text-foreground">{account.emailAddress}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              When disconnected, your encrypted refresh token will be permanently erased from the server.
            </p>
            <p className="text-foreground font-medium">
              Student emails will automatically fall back to the shared Platform SMTP until you reconnect.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDisconnectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="font-bold gap-1.5"
            >
              <Unplug className="size-3.5" />
              <span>Confirm Disconnect</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

