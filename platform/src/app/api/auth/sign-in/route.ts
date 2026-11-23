import { NextResponse } from "next/server"

import { SignInSchema } from "@/schemas/sign-in-schema"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsedData = SignInSchema.safeParse(body)

    // If validation fails, return an error response with a 400 status
    if (!parsedData.success) {
      return NextResponse.json(parsedData.error, { status: 400 })
    }

    const { email, password } = parsedData.data
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:8000/api/v1"

    // Authenticate with real Django DRF backend
    const backendRes = await fetch(`${backendUrl.replace(/\/$/, "")}/auth/sign-in/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const rawData = await backendRes.json()

    if (!backendRes.ok) {
      const message =
        rawData?.error?.message ||
        rawData?.detail ||
        (rawData?.non_field_errors && rawData?.non_field_errors[0]) ||
        "Invalid email or password"
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    const data = rawData?.data || rawData
    const userRole = (data?.role || "").toUpperCase()

    // Role check: Only Super Admin is permitted on the platform panel
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Only Super Administrators can sign in to this portal." },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        id: data.id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        status: data.status,
        role: userRole,
        access: data.access,
        refresh: data.refresh,
      },
      { status: 200 }
    )
  } catch (e) {
    console.error("Error signing in via platform API:", e)
    return NextResponse.json(
      { message: "Authentication service unavailable. Please check backend connection." },
      { status: 500 }
    )
  }
}
