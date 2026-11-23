"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"

import type { LocaleType, SignInFormType } from "@/types"

import { SignInSchema } from "@/schemas/sign-in-schema"

import { toast } from "@/hooks/use-toast"
import { ButtonLoading } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export function SignInForm() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const redirectPathname =
    searchParams.get("redirectTo") ||
    process.env.NEXT_PUBLIC_HOME_PATHNAME ||
    "/en/platform/dashboard"

  const form = useForm<SignInFormType>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const effectiveLocale = (params?.lang as LocaleType) || "en"
  const { isSubmitting } = form.formState
  const isDisabled = isSubmitting

  async function onSubmit(data: SignInFormType) {
    const { email, password } = data

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      let rawJson: any
      try {
        const apiRes = await fetch(`${apiUrl.replace(/\/$/, "")}/auth/sign-in/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        rawJson = await apiRes.json()

        if (!apiRes.ok) {
          const errorMsg =
            rawJson?.error?.message ||
            rawJson?.detail ||
            rawJson?.error?.details?.[0]?.issue ||
            (rawJson?.non_field_errors && rawJson?.non_field_errors[0]) ||
            "Invalid email or password"
          throw new Error(errorMsg)
        }
      } catch (err: any) {
        clearTimeout(timeoutId)
        if (err.name === "AbortError") {
          throw new Error("Backend connection timed out. Please verify that Django server is running on port 8000.")
        }
        throw err
      }

      // Backend wraps responses in StandardJSONRenderer: { data: { role, access, refresh, ... }, meta: { ... } }
      const payload = rawJson?.data || rawJson
      const userRole = (payload?.role || "").toUpperCase()

      if (userRole !== "SUPER_ADMIN") {
        throw new Error("Access denied. Only Super Administrators can sign in to this portal.")
      }

      const access = payload?.access || payload?.tokens?.access_token || payload?.access_token
      const refresh = payload?.refresh || payload?.tokens?.refresh_token || payload?.refresh_token

      if (typeof window !== "undefined") {
        if (access) localStorage.setItem("platform_token", access)
        if (refresh) localStorage.setItem("platform_refresh_token", refresh)
      }

      // Synchronize NextAuth session with credentials
      try {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        })

        if (result && result.error) {
          console.warn("NextAuth credentials error:", result.error)
        }
      } catch (authErr) {
        console.warn("NextAuth session establishment warning:", authErr)
      }

      toast({
        title: "Signed In Successfully",
        description: "Welcome to the Super Admin Platform.",
      })

      const targetPath =
        redirectPathname &&
        redirectPathname !== "/" &&
        !redirectPathname.includes("sign-in")
          ? (redirectPathname.startsWith("/en/") || redirectPathname.startsWith("/hi/") || redirectPathname.startsWith("/gu/")
              ? redirectPathname
              : `/en${redirectPathname.startsWith("/") ? redirectPathname : `/${redirectPathname}`}`)
          : "/en/platform/dashboard"

      if (typeof window !== "undefined") {
        window.location.href = targetPath
      } else {
        router.push(targetPath)
        router.refresh()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : "Authentication error occurred",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <div className="grid grow gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="admin@lmsplatform.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <ButtonLoading
          type="submit"
          isLoading={isSubmitting}
          disabled={isDisabled}
          className="w-full"
        >
          Sign In to Super Admin Panel
        </ButtonLoading>
      </form>
    </Form>
  )
}
