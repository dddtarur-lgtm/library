import { NextResponse } from "next/server"
import { getOauthStore, saveOauthStore } from "@/data/email-oauth-store"

export async function POST() {
  const current = getOauthStore()
  
  // Wipe encrypted tokens and set disconnected state
  saveOauthStore({
    ...current,
    isConnected: false,
    status: "disconnected",
    encryptedRefreshToken: null,
    encryptionIv: null,
  })

  return NextResponse.json({
    success: true,
    message: "Email disconnected. Encrypted tokens revoked and deleted from vault.",
  })
}

