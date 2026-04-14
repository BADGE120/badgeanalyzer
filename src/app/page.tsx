import Link from "next/link"

export default function HomePage() {
  return (
    <main style={{ fontFamily: "var(--font-display)", minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      <nav style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>DB</div>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>Detector Badge Minute</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/login" style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border2)", color: "var(--text2)", textDecoration: "none", fontSize: 14 }}>Se connecter</Link>
          <Link href="#tarifs" style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border2)", color: "var(--text2)", textDecoration: "none", fontSize: 14 }}>Tarifs</Link>
          <Link href="/register" style={{ padding: "8px 18px", borderRadius: 8, background: "var(--accent)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Commencer</Link>
        </div>
      </nav>

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
            Nous garantissons le résultat
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginTop: 80, maxWidth: 800, width: "100%" }}>
          {[
            { icon: "🔍", title: "8 vérifications", desc: "OTP, UID, clés, accès, entropie, signatures…" },
            { icon: "⚡", title: "Résultat instantané", desc: "Analyse en moins d'une seconde" },
            { icon: "🎯", title: "Formats supportés", desc: ".bin .mfd .nfc .hex .json .mct" },
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

      <section id="tarifs" style={{ padding: "80px 40px", textAlign: "center", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: "rgba(124,111,255,0.12)", border: "1px solid rgba(124,111,255,0.25)", marginBottom: 24, fontSize: 12, color: "var(--accent)", letterSpacing: "0.05em" }}>
          ◆ TARIFS
        </div>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>Achetez des jetons</h2>
        <p style={{ color: "var(--text2)", fontSize: 16, marginBottom: 48 }}>1 jeton = 1 analyse · Les jetons n'expirent pas</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20, maxWidth: 800, margin: "0 auto" }}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Starter</div>
            <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.03em" }}>2</div>
            <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 16 }}>jetons</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--accent)", marginBottom: 4 }}>1 €</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 24 }}>0,50 € / jeton</div>
            <Link href="/register" style={{ display: "block", padding: "11px", background: "transparent", border: "1px solid var(--border2)", borderRadius: 8, color: "var(--text)", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Commencer</Link>
          </div>
          <div style={{ background: "var(--bg2)", border: "2px solid var(--accent)", borderRadius: 14, padding: "32px 24px", textAlign: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 20 }}>Populaire</div>
            <div style={{ fontSize: 12, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Pro</div>
            <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.03em" }}>10</div>
            <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 16 }}>jetons</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--accent)", marginBottom: 4 }}>5 €</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 24 }}>0,50 € / jeton</div>
            <Link href="/register" style={{ display: "block", padding: "11px", background: "var(--accent)", borderRadius: 8, color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Commencer</Link>
          </div>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Expert</div>
            <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.03em" }}>50</div>
            <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 16 }}>jetons</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--accent)", marginBottom: 4 }}>20 €</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 24 }}>0,40 € / jeton</div>
            <Link href="/register" style={{ display: "block", padding: "11px", background: "transparent", border: "1px solid var(--border2)", borderRadius: 8, color: "var(--text)", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Commencer</Link>
          </div>
        </div>
      </section>

      <footer style={{ padding: "24px 40px", borderTop: "1px solid var(--border)", textAlign: "center", fontSize: 13, color: "var(--text3)" }}>
        © 2026 Detector Badge Minute · Paiement sécurisé Stripe
      </footer>
    </main>
  )
}