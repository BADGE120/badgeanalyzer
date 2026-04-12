"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"

type Tab = "analyze" | "history" | "tokens"
type Verdict = "protected" | "partial" | "clean"

interface CheckResult {
  id: string; name: string; description: string
  status: "detected" | "clean" | "partial" | "unknown"
  detail: string; severity: string
}
interface AnalysisResult {
  id?: string; filename: string; fileSize: number; cardType: string
  verdict: Verdict; score: number; checks: CheckResult[]; summary: string; rawHex?: string
}
interface HistoryItem {
  id: string; filename: string; verdict: Verdict; tokensUsed: number; createdAt: string; results: AnalysisResult
}
interface User { id: string; email: string; name?: string; tokens: number }
interface Pack { id: string; name: string; tokens: number; priceDisplay: string; perToken: string; popular: boolean }

const TOKEN_PACKS: Pack[] = [
  { id: "pack_10", name: "Starter", tokens: 10, priceDisplay: "2 €", perToken: "0,20 €/jeton", popular: false },
  { id: "pack_50", name: "Pro", tokens: 50, priceDisplay: "8 €", perToken: "0,16 €/jeton", popular: true },
  { id: "pack_200", name: "Expert", tokens: 200, priceDisplay: "25 €", perToken: "0,125 €/jeton", popular: false },
]

const STATUS_COLOR = { detected: "var(--red)", clean: "var(--green)", partial: "var(--amber)", unknown: "var(--text3)" }
const VERDICT_COLOR: Record<Verdict, string> = { protected: "var(--red)", partial: "var(--amber)", clean: "var(--green)" }
const VERDICT_LABEL: Record<Verdict, string> = { protected: "Protégé", partial: "Partiel", clean: "Non protégé" }

function VerdictBadge({ v }: { v: Verdict }) {
  const colors: Record<Verdict, { bg: string; text: string }> = {
    protected: { bg: "rgba(255,92,92,0.12)", text: "var(--red)" },
    partial: { bg: "rgba(255,165,61,0.12)", text: "var(--amber)" },
    clean: { bg: "rgba(61,214,140,0.12)", text: "var(--green)" },
  }
  return <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: colors[v].bg, color: colors[v].text, fontWeight: 600, letterSpacing: "0.03em" }}>{VERDICT_LABEL[v]}</span>
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tab, setTab] = useState<Tab>("analyze")
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 4000) }

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => {
      if (!d) { router.push("/login"); return }
      setUser(d.user)
    })
    const params = new URLSearchParams(window.location.search)
    if (params.get("payment") === "success") {
      notify(`🎉 Paiement confirmé — jetons ajoutés à votre compte`)
      window.history.replaceState({}, "", "/dashboard")
    }
  }, [])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    const r = await fetch("/api/analyses")
    if (r.ok) { const d = await r.json(); setHistory(d.analyses) }
    setHistoryLoading(false)
  }, [])

  useEffect(() => { if (tab === "history") loadHistory() }, [tab])

  const handleFile = (f: File) => { setFile(f); setResult(null) }

  async function runAnalysis() {
    if (!file || !user) return
    if (user.tokens < 1) { setTab("tokens"); return }
    setAnalyzing(true)
    const fd = new FormData(); fd.append("file", file)
    const res = await fetch("/api/analyze", { method: "POST", body: fd })
    const data = await res.json()
    if (!res.ok) { notify("Erreur : " + data.error); setAnalyzing(false); return }
    setResult(data.analysis)
    setUser(u => u ? { ...u, tokens: data.remainingTokens } : u)
    setAnalyzing(false)
  }

  async function buyPack(packId: string) {
    setCheckoutLoading(packId)
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packId }) })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { notify("Erreur Stripe"); setCheckoutLoading(null) }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  if (!user) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--text2)", fontFamily: "var(--font-display)" }}>Chargement…</div>

  const s: React.CSSProperties = { fontFamily: "var(--font-display)" }

  return (
    <div style={{ ...s, minHeight: "100vh", display: "grid", gridTemplateColumns: "220px 1fr", background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside style={{ background: "var(--bg2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "20px 0" }}>
        <div style={{ padding: "0 18px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>BA</div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}>BadgeAnalyzer</span>
        </div>

        {(["analyze", "history", "tokens"] as Tab[]).map(t => {
          const labels: Record<Tab, string> = { analyze: "Analyser", history: "Historique", tokens: "Jetons" }
          const icons: Record<Tab, string> = { analyze: "⬡", history: "◻", tokens: "◈" }
          return (
            <button key={t} onClick={() => setTab(t)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", background: tab === t ? "rgba(124,111,255,0.12)" : "transparent", color: tab === t ? "var(--accent)" : "var(--text2)", border: "none", borderLeft: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`, cursor: "pointer", fontSize: 14, fontWeight: tab === t ? 600 : 400, textAlign: "left", fontFamily: "var(--font-display)" }}>
              <span style={{ fontSize: 14 }}>{icons[t]}</span>{labels[t]}
            </button>
          )
        })}

        <div style={{ flex: 1 }} />

        {/* Token balance */}
        <div style={{ margin: "0 12px 12px", padding: "14px", background: "var(--bg3)", borderRadius: 10, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>Solde</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: user.tokens > 0 ? "var(--accent)" : "var(--red)", letterSpacing: "-0.02em" }}>{user.tokens}</div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10 }}>jetons</div>
          <button onClick={() => setTab("tokens")} style={{ width: "100%", padding: "7px", background: "transparent", border: "1px solid var(--border2)", borderRadius: 6, color: "var(--text2)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-display)" }}>+ Recharger</button>
        </div>

        {/* User */}
        <div style={{ margin: "0 12px", padding: "12px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name || user.email}</div>
            <button onClick={logout} style={{ fontSize: 11, color: "var(--text3)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-display)" }}>Déconnexion</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ padding: "28px 32px", overflowY: "auto" }}>
        {notification && (
          <div style={{ position: "fixed", top: 20, right: 20, padding: "12px 20px", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 10, fontSize: 14, zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
            {notification}
          </div>
        )}

        {/* ANALYZE TAB */}
        {tab === "analyze" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Analyser un dump</h1>
                <p style={{ color: "var(--text2)", fontSize: 13 }}>Coût : 1 jeton par analyse</p>
              </div>
              <div style={{ padding: "6px 14px", background: "rgba(124,111,255,0.1)", border: "1px solid rgba(124,111,255,0.2)", borderRadius: 8, fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-code)" }}>
                {user.tokens} jeton{user.tokens !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Upload zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? "var(--accent)" : file ? "var(--green)" : "var(--border2)"}`, borderRadius: 12, padding: "40px 24px", textAlign: "center", cursor: "pointer", background: dragging ? "rgba(124,111,255,0.05)" : "var(--bg2)", marginBottom: 16, transition: "all 0.2s" }}>
              <input ref={fileRef} type="file" accept=".bin,.mfd,.nfc,.hex,.json,.dump" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: "none" }} />
              <div style={{ fontSize: 32, marginBottom: 12 }}>{file ? "✓" : "↑"}</div>
              {file ? (
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{file.size} octets · Cliquer pour changer</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Glisser-déposer ou cliquer</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>Dump brut ou exporté depuis un lecteur NFC</div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                    {[".bin", ".mfd", ".nfc", ".hex", ".json"].map(f => (
                      <span key={f} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(124,111,255,0.12)", color: "var(--accent)", fontFamily: "var(--font-code)" }}>{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={runAnalysis} disabled={!file || analyzing || user.tokens < 1}
              style={{ width: "100%", padding: "14px", background: !file || analyzing || user.tokens < 1 ? "var(--bg3)" : "var(--accent)", color: !file || analyzing || user.tokens < 1 ? "var(--text3)" : "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: !file || analyzing || user.tokens < 1 ? "not-allowed" : "pointer", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
              {analyzing ? "Analyse en cours…" : user.tokens < 1 ? "Solde insuffisant — rechargez vos jetons" : "Lancer l'analyse (−1 jeton)"}
            </button>

            {/* Results */}
            {result && (
              <div style={{ marginTop: 24 }}>
                {/* Summary header */}
                <div style={{ padding: "20px", background: "var(--bg2)", border: `1px solid ${VERDICT_COLOR[result.verdict]}40`, borderRadius: 12, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <VerdictBadge v={result.verdict} />
                      <span style={{ fontSize: 12, color: "var(--text2)", fontFamily: "var(--font-code)" }}>{result.cardType}</span>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text2)" }}>{result.summary}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: VERDICT_COLOR[result.verdict], letterSpacing: "-0.03em" }}>{result.score}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>score anti-copie</div>
                  </div>
                </div>

                {/* Checks */}
                <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>Détail des vérifications</div>
                  {result.checks.map((c, i) => (
                    <div key={c.id} style={{ padding: "14px 18px", borderBottom: i < result.checks.length - 1 ? "1px solid var(--border)" : "none", display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[c.status], marginTop: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text2)", fontFamily: "var(--font-code)" }}>{c.detail}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: `${STATUS_COLOR[c.status]}18`, color: STATUS_COLOR[c.status], fontWeight: 600, flexShrink: 0 }}>
                        {{ detected: "Détecté", clean: "Absent", partial: "Partiel", unknown: "Inconnu" }[c.status]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Raw hex preview */}
                {result.rawHex && (
                  <div style={{ marginTop: 12, padding: "14px 18px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8, letterSpacing: "0.05em" }}>APERÇU HEX (64 premiers octets)</div>
                    <div style={{ fontSize: 12, fontFamily: "var(--font-code)", color: "var(--accent)", letterSpacing: "0.1em", wordBreak: "break-all", lineHeight: 1.8 }}>
                      {result.rawHex.match(/.{1,32}/g)?.map((line, i) => (
                        <div key={i}><span style={{ color: "var(--text3)", marginRight: 12 }}>{(i * 16).toString(16).padStart(4, "0")}</span>{line.match(/.{2}/g)?.join(" ")}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 24 }}>Historique</h1>
            {historyLoading ? (
              <div style={{ color: "var(--text2)", fontSize: 14 }}>Chargement…</div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text2)" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>◻</div>
                <p>Aucune analyse pour l'instant</p>
              </div>
            ) : (
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                {history.map((h, i) => (
                  <div key={h.id} style={{ padding: "14px 18px", borderBottom: i < history.length - 1 ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.filename}</div>
                      <div style={{ fontSize: 12, color: "var(--text3)" }}>{new Date(h.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--font-code)" }}>−{h.tokensUsed} jeton</div>
                    <VerdictBadge v={h.verdict} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TOKENS TAB */}
        {tab === "tokens" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Acheter des jetons</h1>
              <p style={{ color: "var(--text2)", fontSize: 13 }}>Solde actuel : <strong style={{ color: "var(--accent)" }}>{user.tokens} jetons</strong></p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
              {TOKEN_PACKS.map(pack => (
                <div key={pack.id} style={{ background: "var(--bg2)", border: `${pack.popular ? "2px solid var(--accent)" : "1px solid var(--border)"}`, borderRadius: 14, padding: "24px 20px", textAlign: "center", position: "relative" }}>
                  {pack.popular && <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%) translateY(-50%)", padding: "4px 14px", background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 20 }}>Populaire</div>}
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>{pack.name}</div>
                  <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>{pack.tokens}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>jetons</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.02em", marginBottom: 4 }}>{pack.priceDisplay}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 18 }}>{pack.perToken}</div>
                  <button onClick={() => buyPack(pack.id)} disabled={checkoutLoading === pack.id}
                    style={{ width: "100%", padding: "10px", background: pack.popular ? "var(--accent)" : "transparent", border: `1px solid ${pack.popular ? "var(--accent)" : "var(--border2)"}`, borderRadius: 8, color: pack.popular ? "#fff" : "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-display)" }}>
                    {checkoutLoading === pack.id ? "Redirection…" : "Acheter"}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ padding: "16px 20px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 20 }}>🔒</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>Paiement sécurisé via <strong>Stripe</strong> · CB, Apple Pay, Google Pay · Les jetons n'expirent pas</div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
