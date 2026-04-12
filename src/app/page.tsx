import Link from "next/link"

export default function HomePage() {
  return (
    <main style={{ fontFamily: "var(--font-display)", minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>BA</div>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>BadgeAnalyzer</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/login" style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border2)", color: "var(--text2)", textDecoration: "none", fontSize: 14 }}>Se connecter</Link>
          <Link href="/register" style={{ padding: "8px 18px", borderRadius: 8, background: "var(--accent)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Commencer</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: "rgba(124,111,255,0.12)", border: "1px solid rgba(124,111,255,0.25)", marginBottom: 32, fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-code)", letterSpacing: "0.05em" }}>
          ◆ ANALYSE NFC / RFID / MIFARE
        </div>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 24, maxWidth: 700 }}>
          Détectez les protections<br />
          <span style={{ color: "var(--accent)" }}>anti-copie de vos badges</span>
        </h1>
        <p style={{ fontSize: 18, color: "var(--text2)", maxWidth: 520, lineHeight: 1.7, marginBottom: 40 }}>
          Importez un dump brut et obtenez en secondes une analyse complète des mécanismes de protection : OTP, clés, compteurs, chiffrement.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/register" style={{ padding: "14px 32px", borderRadius: 10, background: "var(--accent)", color: "#fff", textDecoration: "none", fontSize: 16, fontWeight: 700 }}>
            Essayer gratuitement — 3 jetons offerts
          </Link>
        </div>

        {/* Features grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginTop: 80, maxWidth: 800, width: "100%" }}>
          {[
            { icon: "🔍", title: "8 vérifications", desc: "OTP, UID, clés, accès, entropie, signatures…" },
            { icon: "⚡", title: "Résultat instantané", desc: "Analyse en moins d'une seconde" },
            { icon: "🎯", title: "Formats supportés", desc: ".bin .mfd .nfc .hex .json" },
            { icon: "🪙", title: "Pay-as-you-go", desc: "1 jeton = 1 analyse, sans abonnement" },
          ].map(f => (
            <div key={f.title} style={{ padding: "20px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, textAlign: "left" }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
