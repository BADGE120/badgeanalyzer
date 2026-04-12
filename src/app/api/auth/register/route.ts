export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, signToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 })
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 })
    }
    const hashed = await hashPassword(password)
    const user = await prisma.user.create({
      data: { email, password: hashed, name, tokens: 3 } // 3 free tokens on signup
    })
    const token = signToken({ userId: user.id, email: user.email })
    const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, tokens: user.tokens } })
    res.cookies.set("auth-token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" })
    return res
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
