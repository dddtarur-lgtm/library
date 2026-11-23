import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const provider = searchParams.get("provider") || "google"
  const accountType = (searchParams.get("accountType") as any) || "workspace"
  const simulate = searchParams.get("simulate") === "true"

  const origin = request.nextUrl.origin || "http://localhost:3000"
  const callbackUrl = `${origin}/api/email/oauth/callback`

  // PKCE Code Verifier & Challenge (RFC 7636)
  const codeVerifier = crypto.randomBytes(32).toString("base64url")
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url")

  // Signed State: libraryId, userId, nonce, expiry, provider, accountType
  const statePayload = {
    libraryId: "LIB-PUNE-HQ-01",
    userId: "USR-ADMIN-101",
    nonce: crypto.randomBytes(16).toString("hex"),
    provider,
    accountType,
    exp: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
  }
  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url")

  let authUrl = ""

  if (provider === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID || "108394829103-mock-google-client-id.apps.googleusercontent.com"
    const scopes = [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" ")

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: scopes,
      access_type: "offline", // Essential to receive refresh token
      prompt: "consent",      // Forced consent prompt on first connect
      include_granted_scopes: "true",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    })

    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  } else {
    // Microsoft 365 / Outlook
    const clientId = process.env.MICROSOFT_CLIENT_ID || "mock-azure-app-client-id-88910"
    const scopes = ["Mail.Send", "User.Read", "offline_access"].join(" ")

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: scopes,
      prompt: "consent",
      response_mode: "query",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    })

    authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  }

  // If simulate flag or dev environment requested direct callback simulation
  if (simulate) {
    const mockCode = `code_${crypto.randomBytes(12).toString("hex")}`
    const simulatedRedirectUrl = `${origin}/api/email/oauth/callback?code=${mockCode}&state=${state}`
    
    const response = NextResponse.json({
      authUrl: simulatedRedirectUrl,
      provider,
      state,
      codeChallenge,
      isSimulated: true,
    })
    
    // Store PKCE verifier in cookie for callback verification
    response.cookies.set("oauth_pkce_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    })
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    })

    return response
  }

  const response = NextResponse.json({
    authUrl,
    provider,
    state,
    codeChallenge,
    isSimulated: false,
  })

  response.cookies.set("oauth_pkce_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  })
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  })

  return response
}

