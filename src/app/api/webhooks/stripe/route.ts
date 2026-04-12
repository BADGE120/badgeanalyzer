import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!
  const stripe = getStripe()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any
    const { userId, tokensToAdd } = session.metadata

    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { tokens: { increment: parseInt(tokensToAdd) } }
        }),
        prisma.transaction.update({
          where: { stripeSessionId: session.id },
          data: { status: "completed" }
        })
      ])
    } catch (e) {
      console.error("Webhook DB error:", e)
      return NextResponse.json({ error: "DB error" }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
