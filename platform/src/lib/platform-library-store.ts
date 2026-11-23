"use client"

import type { PlatformLibraryRecord } from "@/data/platform/platform-data"

export interface StoredDocument {
  id: string
  title: string
  documentNumber?: string
  fileName: string
  fileSize: string
  fileType: "pdf" | "image"
  fileUrl: string
  uploadedAt: string
}

export interface StoredNote {
  id: string
  author: string
  date: string
  text: string
}

export interface StoredStaff {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  branch: string
  status: "Active" | "Pending" | "Disabled"
  twoFactor: boolean
}

export interface StoredLibrary extends PlatformLibraryRecord {
  billingCycle?: string
  statusReason?: string
  staff?: StoredStaff[]
}

const STORAGE_KEY = "platform_libraries_v2"

function safeGetStorage(): StoredLibrary[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeSetStorage(libs: StoredLibrary[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(libs))
    window.dispatchEvent(new CustomEvent("platform_libraries_changed"))
  } catch (e) {
    console.error("Failed to persist libraries to localStorage:", e)
  }
}

export const platformLibraryStore = {
  getAll(): StoredLibrary[] {
    return safeGetStorage()
  },

  getById(idOrCode: string): StoredLibrary | null {
    if (!idOrCode) return null
    const libs = safeGetStorage()
    const target = idOrCode.toLowerCase()
    return (
      libs.find(
        (l) =>
          String(l.id).toLowerCase() === target ||
          String(l.code).toLowerCase() === target
      ) || null
    )
  },

  create(input: Partial<StoredLibrary>): StoredLibrary {
    const libs = safeGetStorage()
    const now = new Date()
    const id = input.id || `lib-${Date.now()}`
    const code =
      input.code?.trim() || `LIB-${Math.floor(1000 + Math.random() * 9000)}`

    const newLibrary: StoredLibrary = {
      id,
      code,
      name: input.name?.trim() || "Untitled Library",
      logo: input.logo || "",
      logoUrl: input.logoUrl || input.logo || null,
      city: input.city?.trim() || "",
      state: input.state?.trim() || "",
      address: input.address?.trim() || "",
      ownerName: input.ownerName?.trim() || "",
      ownerPhone: input.ownerPhone?.trim() || "",
      ownerEmail: input.ownerEmail?.trim() || "",
      planName: input.planName?.trim() || "Starter",
      planFee: Number(input.planFee || 0),
      planBillingCycle: input.planBillingCycle || "Annual",
      planStatus: input.planStatus || "Active",
      libraryStatus: input.libraryStatus || "Active",
      planEndDate:
        input.planEndDate ||
        new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(
          "en-IN"
        ),
      nextDueDate:
        input.nextDueDate ||
        new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(
          "en-IN"
        ),
      branchesCount: Number(input.branchesCount || 1),
      totalSeats: Number(input.totalSeats || 0),
      liveStudents: Number(input.liveStudents || 0),
      joinedDate: input.joinedDate || now.toLocaleDateString("en-IN"),
      emailConnection: (input.emailConnection === "Connected"
        ? "Connected"
        : input.emailConnection === "Needs reconnect"
          ? "Needs reconnect"
          : "Not connected") as PlatformLibraryRecord["emailConnection"],
      gstNumber: input.gstNumber?.trim() || "",
      micrositeSlug: input.micrositeSlug?.trim() || code.toLowerCase(),
      documents: input.documents || [],
      notes: input.notes || [],
      staff: input.staff || [],
    }

    const updated = [newLibrary, ...libs.filter((l) => l.id !== id)]
    safeSetStorage(updated)
    return newLibrary
  },

  update(
    idOrCode: string,
    updates: Partial<StoredLibrary>
  ): StoredLibrary | null {
    const libs = safeGetStorage()
    const target = idOrCode.toLowerCase()
    const index = libs.findIndex(
      (l) =>
        String(l.id).toLowerCase() === target ||
        String(l.code).toLowerCase() === target
    )

    if (index === -1) {
      // If not present yet, create it
      return this.create({ ...updates, id: idOrCode })
    }

    const existing = libs[index]
    const updated: StoredLibrary = {
      ...existing,
      ...updates,
      id: existing.id,
      code: updates.code || existing.code,
      name: updates.name !== undefined ? updates.name : existing.name,
      city: updates.city !== undefined ? updates.city : existing.city,
      state: updates.state !== undefined ? updates.state : existing.state,
      address:
        updates.address !== undefined ? updates.address : existing.address,
      ownerName:
        updates.ownerName !== undefined
          ? updates.ownerName
          : existing.ownerName,
      ownerPhone:
        updates.ownerPhone !== undefined
          ? updates.ownerPhone
          : existing.ownerPhone,
      ownerEmail:
        updates.ownerEmail !== undefined
          ? updates.ownerEmail
          : existing.ownerEmail,
      planName: updates.planName || existing.planName,
      planFee:
        updates.planFee !== undefined
          ? Number(updates.planFee)
          : existing.planFee,
      totalSeats:
        updates.totalSeats !== undefined
          ? Number(updates.totalSeats)
          : existing.totalSeats,
      branchesCount:
        updates.branchesCount !== undefined
          ? Number(updates.branchesCount)
          : existing.branchesCount,
      planStatus: updates.planStatus || existing.planStatus,
      libraryStatus: updates.libraryStatus || existing.libraryStatus,
      gstNumber:
        updates.gstNumber !== undefined
          ? updates.gstNumber
          : existing.gstNumber,
      documents:
        updates.documents !== undefined
          ? updates.documents
          : existing.documents,
      notes: updates.notes !== undefined ? updates.notes : existing.notes,
    }

    libs[index] = updated
    safeSetStorage([...libs])
    return updated
  },

  delete(idOrCode: string): boolean {
    const libs = safeGetStorage()
    const target = idOrCode.toLowerCase()
    const filtered = libs.filter(
      (l) =>
        String(l.id).toLowerCase() !== target &&
        String(l.code).toLowerCase() !== target
    )
    safeSetStorage(filtered)
    return filtered.length < libs.length
  },

  lock(idOrCode: string, reason?: string): StoredLibrary | null {
    return this.update(idOrCode, {
      libraryStatus: "Locked",
      planStatus: "Locked",
      statusReason: reason || "Locked by Super Admin",
    })
  },

  unlock(idOrCode: string, reason?: string): StoredLibrary | null {
    return this.update(idOrCode, {
      libraryStatus: "Active",
      planStatus: "Active",
      statusReason: reason || "Unlocked by Super Admin",
    })
  },

  suspend(idOrCode: string, reason?: string): StoredLibrary | null {
    return this.update(idOrCode, {
      libraryStatus: "Suspended",
      statusReason: reason || "Suspended by Super Admin",
    })
  },

  unsuspend(idOrCode: string): StoredLibrary | null {
    return this.update(idOrCode, {
      libraryStatus: "Active",
      statusReason: "",
    })
  },

  recordPayment(idOrCode: string, amount: number): StoredLibrary | null {
    const existing = this.getById(idOrCode)
    if (!existing) return null
    return this.update(idOrCode, {
      planFee: amount,
      planStatus: "Active",
    })
  },
}
