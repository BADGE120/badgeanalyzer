import Stripe from "stripe"

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set")
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  })
}

export const TOKEN_PACKS = [
  {
    id: "pack_10",
    name: "Starter",
    tokens: 10,
    price: 200,
    priceDisplay: "2 €",
    perToken: "0,20 €/jeton",
    popular: false,
  },
  {
    id: "pack_50",
    name: "Pro",
    tokens: 50,
    price: 800,
    priceDisplay: "8 €",
    perToken: "0,16 €/jeton",
    popular: true,
  },
  {
    id: "pack_200",
    name: "Expert",
    tokens: 200,
    price: 2500,
    priceDisplay: "25 €",
    perToken: "0,125 €/jeton",
    popular: false,
  },
]
