import type { NextAuthOptions } from "next-auth"

import CredentialsProvider from "next-auth/providers/credentials"

// Extend NextAuth's Session and User interfaces to include custom properties
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string | null
      name: string
      avatar: string | null
      status: string
      role?: string
      accessToken?: string
    }
  }

  interface User {
    id: string
    email: string | null
    name: string
    avatar: string | null
    status: string
    role?: string
    accessToken?: string
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string | null
    name: string
    avatar: string | null
    status: string
    role?: string
    accessToken?: string
  }
}

// Configuration for NextAuth with custom adapters and providers
// NextAuth.js documentation: https://next-auth.js.org/getting-started/introduction
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      // Real DRF Super Admin authorization
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        try {
          const backendUrl =
            process.env.DJANGO_API_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            process.env.API_URL ||
            "http://localhost:8000/api/v1"

          const res = await fetch(`${backendUrl.replace(/\/$/, "")}/auth/sign-in/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          const rawData = await res.json()

          if (!res.ok) {
            const errorMsg =
              rawData?.error?.message ||
              rawData?.detail ||
              (rawData?.non_field_errors && rawData?.non_field_errors[0]) ||
              "Invalid email or password"
            throw new Error(errorMsg)
          }

          // Unpack envelope: StandardJSONRenderer returns { data: { ... }, meta: { ... } }
          const data = rawData?.data || rawData
          const userRole = (data?.role || "").toUpperCase()

          // Enforce Super Admin role
          if (userRole !== "SUPER_ADMIN") {
            throw new Error("Access denied. Only Super Administrators can sign in to this portal.")
          }

          return {
            id: String(data.id),
            name: data.name || data.email,
            email: data.email,
            avatar: data.avatar || null,
            status: data.status || "Active",
            role: userRole,
            accessToken: data.access || data.access_token,
          }
        } catch (e: unknown) {
          throw new Error(
            e instanceof Error ? e.message : "Authentication failed."
          )
        }
      },
    }),
  ],
  pages: {
    signIn: "/sign-in", // Custom sign-in page
  },
  session: {
    strategy: "jwt", // Use JWT strategy for sessions
    maxAge: 30 * 24 * 60 * 60, // Set session expiration to 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.avatar = user.avatar
        token.email = user.email
        token.status = user.status
        token.role = (user as any).role
        token.accessToken = (user as any).accessToken
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.avatar = token.avatar
        session.user.email = token.email
        session.user.status = token.status
        session.user.role = token.role
        session.user.accessToken = token.accessToken
      }

      return session
    },
  },
}
