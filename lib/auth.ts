import type { User } from "./types"

const STORAGE_KEY = "workhubb_user"

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function setCurrentUser(user: User | null) {
  if (typeof window === "undefined") return

  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function logout() {
  setCurrentUser(null)
  window.location.href = "/"
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}
