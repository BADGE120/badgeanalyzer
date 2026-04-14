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
    id: "pack_2",
    name: "Starter",
    tokens: 2,
    price: 100,
    priceDisplay: "1 €",
    perToken: "0,50 €/jeton",
    popular: false,
  },
  {
    id: "pack_10",
    name: "Pro",
    tokens: 10,
    price: 500,
    priceDisplay: "5 €",
    perToken: "0,50 €/jeton",
    popular: true,
  },
  {
    id: "pack_50",
    name: "Expert",
    tokens: 50,
    price: 2000,
    priceDisplay: "20 €",
    perToken: "0,40 €/jeton",
    popular: false,
  },
]