export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  
  try {
    const { prisma } = await import("@/lib/prisma")
    const analyses = await prisma.analysis.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, filename: true, fileSize: true, verdict: true, tokensUsed: true, createdAt: true, results: true }
    })
    return NextResponse.json({ analyses })
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}