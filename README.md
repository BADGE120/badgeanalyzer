# BadgeAnalyzer — SaaS d'analyse de dumps de badges NFC/RFID

Détecte les systèmes anti-copie dans les dumps de badges (Mifare Classic, NTAG, iClass…).

## Stack
- **Frontend** : Next.js 15 (App Router) + TypeScript
- **Style** : CSS-in-JS inline (variables CSS custom)
- **BDD** : PostgreSQL + Prisma ORM
- **Auth** : JWT + cookies httpOnly (bcrypt)
- **Paiements** : Stripe Checkout (one-time)
- **Police** : Syne + Space Mono (Google Fonts)

## Installation

```bash
# 1. Cloner et installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Remplir DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, etc.

# 3. Initialiser la BDD
npx prisma migrate dev --name init

# 4. Lancer le serveur de développement
npm run dev
```

## Variables d'environnement (.env)

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL PostgreSQL (ex: `postgresql://user:pass@localhost:5432/badgeanalyzer`) |
| `JWT_SECRET` | Secret JWT (min 32 chars) |
| `NEXTAUTH_URL` | URL de l'app (ex: `http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe (`whsec_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (`pk_test_...`) |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'app |

## Stripe — Configuration

### 1. Créer les produits dans le dashboard Stripe
Pas besoin de Price IDs fixes — l'app utilise `price_data` inline dans la session Checkout.

### 2. Configurer le webhook
```bash
# En local avec Stripe CLI :
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Événements à écouter : `checkout.session.completed`

### 3. Paiement de test
Carte : `4242 4242 4242 4242` · Date : n'importe quelle future · CVC : `123`

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── (auth)/
│   │   ├── login/page.tsx    # Connexion
│   │   └── register/page.tsx # Inscription (3 jetons offerts)
│   ├── dashboard/page.tsx    # App principale (analyser / historique / jetons)
│   └── api/
│       ├── auth/             # register, login, logout, me
│       ├── analyze/          # POST — analyse un dump (−1 jeton)
│       ├── analyses/         # GET — historique
│       ├── checkout/         # POST — crée une session Stripe
│       └── webhooks/stripe/  # POST — webhook Stripe
├── lib/
│   ├── badge-analyzer.ts     # Moteur d'analyse (8 vérifications)
│   ├── auth.ts               # JWT, bcrypt, session cookie
│   ├── prisma.ts             # Client Prisma singleton
│   └── stripe.ts             # Client Stripe + packs de jetons
├── middleware.ts             # Protection des routes
└── prisma/
    └── schema.prisma         # Modèles User, Analysis, Transaction
```

## Moteur d'analyse — Vérifications

| ID | Vérification | Sévérité |
|---|---|---|
| `otp_lock` | Bits de verrouillage OTP | Haute |
| `uid` | Structure UID / BCC | Haute |
| `auth_keys` | Clés d'authentification A/B | Haute |
| `access_cond` | Conditions d'accès des blocs | Moyenne |
| `mfr_block` | Intégrité du bloc fabricant | Moyenne |
| `counter` | Compteur anti-rejeu | Moyenne |
| `entropy` | Entropie (données chiffrées) | Variable |
| `signatures` | Signatures anti-copie connues | Info |

## Déploiement (Vercel + Supabase)

```bash
# 1. Créer un projet Supabase → copier DATABASE_URL
# 2. npx prisma migrate deploy
# 3. vercel --prod
# 4. Ajouter les env vars dans le dashboard Vercel
# 5. Mettre à jour l'URL du webhook Stripe
```

## Formats supportés
`.bin` `.mfd` `.nfc` `.hex` `.json` `.dump` (max 10KB)
