export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const analyses = await prisma.analysis.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, filename: true, fileSize: true, verdict: true, tokensUsed: true, createdAt: true, results: true }
  })
  return NextResponse.json({ analyses })
}
