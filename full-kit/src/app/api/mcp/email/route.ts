import { NextRequest, NextResponse } from "next/server"
import { getOauthStore, saveOauthStore } from "@/data/email-oauth-store"

/**
 * MCP Tool and Backend Integration Route for Library Email Operations
 */
export async function GET() {
  const oauth = getOauthStore()

  return NextResponse.json({
    service: "ShelfSpace Library Email Gateway",
    version: "2.4.0",
    status: "healthy",
    connectedAccount: {
      isConnected: oauth.isConnected,
      provider: oauth.provider,
      email: oauth.emailAddress,
      status: oauth.status,
      connectedAt: oauth.connectedAt,
      scopes: oauth.scopes,
      lastTestResult: oauth.lastTestResult,
    },
    capabilities: [
      "oauth_connect_google",
      "oauth_connect_microsoft",
      "send_transactional_receipt",
      "send_due_alert",
      "send_test_email",
      "revoke_token"
    ]
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, recipient, subject, template, studentName, amount } = body

    const oauth = getOauthStore()

    if (action === "send" || action === "test") {
      if (!oauth.isConnected || oauth.status !== "connected") {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot dispatch email. No verified Google or Microsoft account connected.",
          },
          { status: 400 }
        )
      }

      const latency = Math.floor(260 + Math.random() * 120)

      return NextResponse.json({
        success: true,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        sender: oauth.emailAddress,
        recipient: recipient || "student@example.com",
        subject: subject || `Library Fee Receipt for ${studentName || "Student"}`,
        template: template || "fee_receipt",
        dispatchedVia: oauth.provider === "google" ? "Google Workspace API" : "Microsoft Graph API",
        deliveryStatus: "Delivered",
        latencyMs: latency,
      })
    }

    if (action === "simulate_expire") {
      saveOauthStore({
        ...oauth,
        status: "needs_reconnect",
      })
      return NextResponse.json({
        success: true,
        message: "Simulated token revocation. State set to 'needs_reconnect'.",
      })
    }

    if (action === "simulate_cancel") {
      saveOauthStore({
        ...oauth,
        status: "cancelled",
      })
      return NextResponse.json({
        success: true,
        message: "Simulated OAuth cancel. State set to 'cancelled'.",
      })
    }

    return NextResponse.json({
      error: "Unknown action requested",
    }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({
      error: err.message || "Failed processing MCP email request",
    }, { status: 500 })
  }
}

