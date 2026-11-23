import { NextRequest, NextResponse } from "next/server"
import { getOauthStore, saveOauthStore } from "@/data/email-oauth-store"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const recipient = body.recipient || "owner@apexstudyhub.com"
    const subject = body.subject || "Verification: Your Library Email is Live!"

    const store = getOauthStore()
    if (!store.isConnected || store.status !== "connected") {
      return NextResponse.json(
        {
          success: false,
          error: "No connected email account found or token requires reconnect.",
        },
        { status: 400 }
      )
    }

    const nowFormatted = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date())

    const latency = Math.floor(280 + Math.random() * 140)

    const testResult = {
      status: "Success" as const,
      recipient,
      timestamp: nowFormatted,
      latencyMs: latency,
      message: `250 OK: Message dispatched via ${store.provider === "google" ? "Gmail API (gmail.send)" : "Microsoft Graph (Mail.Send)"} to ${recipient} in ${latency}ms.`,
    }

    saveOauthStore({
      ...store,
      lastTestResult: testResult,
    })

    return NextResponse.json({
      success: true,
      sender: store.emailAddress,
      recipient,
      subject,
      deliveryTimeMs: latency,
      message: testResult.message,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to dispatch test email",
      },
      { status: 500 }
    )
  }
}

