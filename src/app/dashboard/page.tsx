"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"

type Tab = "analyze" | "history" | "tokens"
type Verdict = "protected" | "partial" | "clean"

interface CheckResult {
  id: string; name: string; description: string
  status: "detected" | "clean" | "partial" | "unknown"
  detail: string; severity: string
}
interface AnalysisResult {
  id?: string; filename: string; fileSize: number; cardType: string
  verdict: Verdict; score: number; checks: CheckResult[]; summary: string; rawHex?: string
}
interface HistoryItem {
  id: string; filename: string; verdict: Verdict; tokensUsed: number; createdAt: string; results: AnalysisResult
}
interface User { id: string; email: string; name?: string; tokens: number }
interface Pack { id: string; name: string; tokens: number; priceDisplay: string; perToken: string; popular: boolean }

const TOKEN_PACKS: Pack[] = [
  { id: "pack_2", name: "Starter", tokens: 2, priceDisplay: "1 €", perToken: "0,50 €/jeton", popular: false },
  { id: "pack_10", name: "Pro", tokens: 10, priceDisplay: "5 €", perToken: "0,50 €/jeton", popular: true },
  { id: "pack_50", name: "Expert", tokens: 50, priceDisplay: "20 €", perToken: "0,40 €/jeton", popular: false },
]