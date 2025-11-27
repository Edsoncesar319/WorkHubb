"use client"

import { useState, useEffect } from "react"

export function useDatabaseSync() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Since the database is server-side and accessed via API routes,
    // we can consider it initialized immediately
    // If needed, we could add a health check API call here
    setIsInitialized(true)
  }, [])

  return { isInitialized }
}

