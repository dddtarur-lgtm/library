import { NextResponse } from "next/server"
import { getOauthStore } from "@/data/email-oauth-store"

export async function GET() {
  const store = getOauthStore()
  // Return safe sanitized state (without exposing encryption keys)
  return NextResponse.json({
    isConnected: store.isConnected,
    provider: store.provider,
    emailAddress: store.emailAddress,
    displayName: store.displayName,
    accountType: store.accountType,
    connectedAt: store.connectedAt,
    status: store.status,
    scopes: store.scopes,
    hasRefreshToken: !!store.encryptedRefreshToken,
    lastTestResult: store.lastTestResult,
  })
}

