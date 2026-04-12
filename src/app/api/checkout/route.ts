export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getStripe, TOKEN_PACKS } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const { packId } = await req.json()
  const pack = TOKEN_PACKS.find(p => p.id === packId)
  if (!pack) return NextResponse.json({ error: "Pack invalide" }, { status: 400 })
  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price_data: { currency: "eur", product_data: { name: `BadgeAnalyzer — Pack ${pack.name}`, description: `${pack.tokens} jetons` }, unit_amount: pack.price }, quantity: 1 }],
    mode: "payment",
    success_url: `${appUrl}/dashboard?payment=success&tokens=${pack.tokens}`,
    cancel_url: `${appUrl}/dashboard?payment=cancelled`,
    metadata: { userId: session.userId, packId: pack.id, tokensToAdd: pack.tokens.toString() },
    customer_email: session.email,
  })
  const { prisma } = await import("@/lib/prisma")
  await prisma.transaction.create({ data: { userId: session.userId, stripeSessionId: checkoutSession.id, amount: pack.price, tokensAdded: pack.tokens, status: "pending" } })
  return NextResponse.json({ url: checkoutSession.url })
}