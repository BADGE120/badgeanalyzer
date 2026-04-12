export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { analyzeBadge } from "@/lib/badge-analyzer"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  if (user.tokens < 1) return NextResponse.json({ error: "Solde de jetons insuffisant" }, { status: 402 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })

    const maxSize = 10 * 1024 // 10KB max for badge dumps
    if (file.size > maxSize) return NextResponse.json({ error: "Fichier trop volumineux (max 10KB)" }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const results = analyzeBadge(buffer, file.name)

    // Deduct token & save in transaction
    const [updatedUser, analysis] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.userId },
        data: { tokens: { decrement: 1 } }
      }),
      prisma.analysis.create({
        data: {
          userId: session.userId,
          filename: file.name,
          fileSize: file.size,
          results: results as any,
          verdict: results.verdict,
          tokensUsed: 1,
        }
      })
    ])

    return NextResponse.json({
      analysis: { id: analysis.id, ...results },
      remainingTokens: updatedUser.tokens
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erreur lors de l'analyse" }, { status: 500 })
  }
}
