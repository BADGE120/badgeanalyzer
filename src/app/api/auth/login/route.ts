export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, signToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 })
    const valid = await verifyPassword(password, user.password)
    if (!valid) return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 })
    const token = signToken({ userId: user.id, email: user.email })
    const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, tokens: user.tokens } })
    res.cookies.set("auth-token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" })
    return res
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
