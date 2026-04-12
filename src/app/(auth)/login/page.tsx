"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push("/dashboard")
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "var(--bg)", fontFamily: "var(--font-display)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40, textDecoration: "none", color: "var(--text2)", fontSize: 14 }}>
          ← Retour
        </Link>
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, background: "var(--accent)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 20 }}>BA</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>Connexion</h1>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Accédez à votre espace d'analyse</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "var(--text2)", marginBottom: 6, fontWeight: 500 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="vous@exemple.com"
              style={{ width: "100%", padding: "11px 14px", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none", fontFamily: "var(--font-display)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "var(--text2)", marginBottom: 6, fontWeight: 500 }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width: "100%", padding: "11px 14px", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none", fontFamily: "var(--font-display)" }} />
          </div>
          {error && <div style={{ fontSize: 13, color: "var(--red)", padding: "10px 14px", background: "rgba(255,92,92,0.1)", borderRadius: 8 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ padding: "13px", background: loading ? "var(--bg3)" : "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "var(--font-display)" }}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <p style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "var(--text2)" }}>
          Pas encore de compte ?{" "}
          <Link href="/register" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
