export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { analyzeBadge } from "@/lib/badge-analyzer"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  if (user.tokens < 1) return NextResponse.json({ error: "Solde insuffisant" }, { status: 402 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    if (file.size > 500 * 1024) return NextResponse.json({ error: "Fichier trop volumineux (max 500KB)" }, { status: 400 })

    const isMCT = file.name.toLowerCase().endsWith(".mct")
    let input: Buffer | string

    if (isMCT) {
      input = await file.text()
    } else {
      const arrayBuffer = await file.arrayBuffer()
      const buf = Buffer.from(arrayBuffer)
      const textSample = buf.slice(0, 200).toString("utf-8")
      input = textSample.includes("+Sector:") ? buf.toString("utf-8") : buf
    }

    const results = analyzeBadge(input, file.name)

    const [updatedUser, analysis] = await prisma.$transaction([
      prisma.user.update({ where: { id: session.userId }, data: { tokens: { decrement: 1 } } }),
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

    return NextResponse.json({ analysis: { id: analysis.id, ...results }, remainingTokens: updatedUser.tokens })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erreur lors de l'analyse" }, { status: 500 })
  }
}