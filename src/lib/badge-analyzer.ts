export interface CheckResult {
  id: string
  name: string
  description: string
  status: "detected" | "clean" | "partial" | "unknown"
  detail: string
  severity: "high" | "medium" | "low" | "info"
}

export interface SectorAnomaly {
  sector: number
  block: number
  expected: string
  found: string
  ascii?: string
}

export interface AnalysisResult {
  filename: string
  fileSize: number
  cardType: string
  brand: string
  verdict: "protected" | "partial" | "clean"
  score: number
  checks: CheckResult[]
  summary: string
  anomalies: SectorAnomaly[]
  rawHex?: string
  sectors?: string[][]
}

const BRAND_KEYS: Record<string, string> = {
  "414C41524F4E": "NORALSY_ALARON",
  "4143414F5250": "NORALSY_ACAORP",
  "484558414354": "HEXACT_COGELEC",
  "8829DA9DAF76": "URMET",
  "4A6352684677": "COMELIT",
  "434456495243": "CDVI",
  "FFFFFFFFFFFF": "DEFAULT",
  "000000000000": "DEFAULT_ZERO",
}

const BRAND_MASKS: Record<string, (string | null)[][]> = {
  NORALSY_ALARON: [
    [null, "00000000000000000000000000000000", "00000000000000000000000000000000", null],
    ["00000000000000000000000000000000", "00000000000000000000000000000000", null, null],
    ...Array(14).fill(["00000000000000000000000000000000", "00000000000000000000000000000000", "00000000000000000000000000000000", null]),
  ],
  NORALSY_ACAORP: [
    [null, "00000000000000000000000000000000", "00000000000000000000000000000000", null],
    [null, null, null, null],
    [null, null, null, null],
    ...Array(12).fill([null, null, null, null]),
    [null, null, null, null],
    [null, null, null, null],
  ],
  HEXACT_COGELEC: [
    [null, null, null, null],
    ...Array(12).fill(["00000000000000000000000000000000", "00000000000000000000000000000000", "00000000000000000000000000000000", null]),
    ["00000000000000000000000000000000", "00000000000000000000000000000000", null, null],
    ["00000000000000000000000000000000", "00000000000000000000000000000000", "00000000000000000000000000000000", null],
    [null, null, null, null],
  ],
  URMET: [
    [null, null, "00000000000000000000000000000000", null],
    [null, null, null, null],
    [null, null, null, null],
    ...Array(13).fill(["00000000000000000000000000000000", "00000000000000000000000000000000", "00000000000000000000000000000000", null]),
  ],
  COMELIT: [
    [null, "00000000000000000000000000000000", "00000000000000000000000000000000", null],
    ["00000000000000000000000000000000", "00000000000000000000000000000000", "00000000000000000000000000000000", null],
    [null, null, null, null],
    ...Array(13).fill(["00000000000000000000000000000000", "00000000000000000000000000000000", "00000000000000000000000000000000", null]),
  ],
  CDVI: [
    [null, null, null, null],
    ...Array(14).fill(["00000000000000000000000000000000", "00000000000000000000000000000000", "00000000000000000000000000000000", null]),
    [null, null, null, null],
  ],
  DEFAULT: Array(16).fill([null, null, null, null]),
  DEFAULT_ZERO: Array(16).fill([null, null, null, null]),
  }

function hexToAscii(hex: string): string {
  let ascii = ""
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16)
    ascii += code >= 32 && code < 127 ? String.fromCharCode(code) : "."
  }
  return ascii.replace(/\.+$/, "").replace(/^\.+/, "")
}

function parseMCT(text: string): string[][] | null {
  const lines = text.split(/\r?\n/)
  const sectors: string[][] = []
  let currentSector: string[] = []
  let inSector = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith("+Sector:")) {
      if (inSector && currentSector.length > 0) sectors.push(currentSector)
      currentSector = []
      inSector = true
    } else if (inSector && /^[0-9A-Fa-fx]{32}$/.test(trimmed)) {
      currentSector.push(trimmed.toUpperCase())
    } else if (inSector && trimmed.startsWith("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")) {
      currentSector.push("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    }
  }
  if (inSector && currentSector.length > 0) sectors.push(currentSector)
  return sectors.length > 0 ? sectors : null
}

function detectBrand(sectors: string[][]): { brand: string; keyFound: string } {
  for (const sector of sectors) {
    const trailer = sector[sector.length - 1]
    if (!trailer || trailer.includes("X")) continue
    const keyA = trailer.substring(0, 12).toUpperCase()
    for (const [key, brand] of Object.entries(BRAND_KEYS)) {
      if (keyA === key.toUpperCase()) return { brand, keyFound: key }
    }
  }
  return { brand: "UNKNOWN", keyFound: "" }
}

function findAnomalies(sectors: string[][], brand: string): SectorAnomaly[] {
  const mask = BRAND_MASKS[brand] || BRAND_MASKS.DEFAULT
  const anomalies: SectorAnomaly[] = []
  for (let s = 0; s < Math.min(sectors.length, mask.length); s++) {
    const sector = sectors[s]
    const sectorMask = mask[s]
    if (!sectorMask) continue
    for (let b = 0; b < Math.min(sector.length, sectorMask.length); b++) {
      const expected = sectorMask[b]
      const found = sector[b]
      if (expected === null) continue
      if (!found || found.includes("X")) continue
      if (found !== expected) {
        anomalies.push({ sector: s, block: b, expected, found, ascii: hexToAscii(found) })
      }
    }
  }
  return anomalies
}

function analyzeMCT(text: string, filename: string, fileSize: number): AnalysisResult {
  const sectors = parseMCT(text)
  if (!sectors || sectors.length === 0) {
    return {
      filename, fileSize, cardType: "Format MCT invalide", brand: "INCONNU",
      verdict: "clean", score: 0,
      checks: [{ id: "parse", name: "Lecture du fichier", description: "Parsing MCT", status: "unknown", detail: "Impossible de lire le format MCT", severity: "high" }],
      summary: "Fichier MCT invalide ou vide", anomalies: [],
    }
  }

  const { brand, keyFound } = detectBrand(sectors)
  const anomalies = findAnomalies(sectors, brand)
  const unreadSectors = sectors.filter(s => s.some(b => b.includes("X"))).length
  const totalSectors = sectors.length
  const checks: CheckResult[] = []

  const brandLabels: Record<string, string> = {
    NORALSY_ALARON: "Noralsy (clé ALARON)", NORALSY_ACAORP: "Noralsy Vigik+",
    HEXACT_COGELEC: "Hexact / Cogelec", URMET: "Urmet", COMELIT: "Comelit",
    CDVI: "CDVI / Vigik", DEFAULT: "Clé par défaut", DEFAULT_ZERO: "Clé zéro",
    UNKNOWN: "Marque inconnue / clé propriétaire",
  }

  checks.push({ id: "brand", name: "Marque détectée", description: "Identification par la clé secteur", status: brand === "UNKNOWN" ? "detected" : "partial", detail: brand === "UNKNOWN" ? "Clé propriétaire non reconnue — badge potentiellement protégé" : `${brandLabels[brand]} — clé: ${keyFound}`, severity: "high" })
  checks.push({ id: "unread", name: "Secteurs non lus", description: "Secteurs avec clé inconnue", status: unreadSectors > 0 ? "detected" : "clean", detail: unreadSectors > 0 ? `${unreadSectors}/${totalSectors} secteurs illisibles — clé(s) inconnue(s) = protection active` : `Tous les ${totalSectors} secteurs lus`, severity: "high" })
  checks.push({ id: "anomalies", name: "Données hors standard", description: "Blocs différents du masque", status: anomalies.length === 0 ? "clean" : anomalies.length <= 2 ? "partial" : "detected", detail: anomalies.length === 0 ? "Badge conforme au masque — aucune donnée inhabituelle" : `${anomalies.length} bloc(s) différent(s): ${anomalies.slice(0, 3).map(a => `S${a.sector}B${a.block}${a.ascii ? " ("+a.ascii+")" : ""}`).join(", ")}${anomalies.length > 3 ? "…" : ""}`, severity: "medium" })

  if (brand === "NORALSY_ALARON" && sectors[1]?.[2] && !sectors[1][2].includes("X"))
    checks.push({ id: "noralsy_id", name: "Identifiant Noralsy", description: "Secteur 1 bloc 2", status: "partial", detail: `ID: ${sectors[1][2]} | ASCII: ${hexToAscii(sectors[1][2])}`, severity: "info" })

  if (brand === "NORALSY_ACAORP") {
    const xml = sectors.slice(1, 3).flat().filter(b => b && !b.includes("X")).map(b => hexToAscii(b)).join("")
    checks.push({ id: "vigik", name: "Données Vigik+", description: "Protocole WOS", status: "detected", detail: xml.includes("WOS") ? `Protocole: ${xml.substring(0, 80)}` : "Données Vigik présentes", severity: "high" })
  }

  if (brand === "HEXACT_COGELEC") {
    const s15 = sectors[15]?.slice(0, 3).filter(b => b && !b.includes("X")).map(b => hexToAscii(b)).join("") || ""
    checks.push({ id: "hexact_sig", name: "Signature Hexact/Cogelec", description: "Secteur 15", status: "detected", detail: s15 ? `Signature: ${s15.substring(0, 60)}` : "Signature Hexact présente", severity: "high" })
  }

  if (brand === "URMET") {
    const apt = sectors[2]?.[0]
    const aptAscii = apt && !apt.includes("X") ? hexToAscii(apt) : ""
    checks.push({ id: "urmet_apt", name: "Configuration Urmet", description: "Secteur 2 bloc 0", status: aptAscii ? "partial" : "unknown", detail: aptAscii ? `Données: ${apt} | ASCII: ${aptAscii}` : "Données non lisibles", severity: "info" })
  }

  if (brand === "CDVI") {
    const s15 = sectors[15]?.slice(0, 3).filter(b => b && !b.includes("X")).map(b => hexToAscii(b)).join("") || ""
    checks.push({ id: "cdvi_sig", name: "Signature CDVI", description: "Secteur 15", status: "detected", detail: s15 ? `Données: ${s15.substring(0, 80)}` : "Signature CDVI présente", severity: "high" })
  }

  const detectedCount = checks.filter(c => c.status === "detected").length
  const partialCount = checks.filter(c => c.status === "partial").length
  const score = Math.min(100, detectedCount * 20 + partialCount * 10 + unreadSectors * 5)
  const verdict: "protected" | "partial" | "clean" = unreadSectors > 4 || detectedCount >= 2 || brand === "UNKNOWN" ? "protected" : unreadSectors > 0 || anomalies.length > 0 || detectedCount >= 1 ? "partial" : "clean"
  const summary = verdict === "protected" ? `Badge ${brandLabels[brand] || brand} — ${unreadSectors > 0 ? `${unreadSectors} secteur(s) illisible(s)` : `${anomalies.length} anomalie(s)`} — copie directe impossible` : verdict === "partial" ? `Badge ${brandLabels[brand] || brand} — protection partielle${anomalies.length > 0 ? `, ${anomalies.length} bloc(s) non-standard` : ""}` : `Badge ${brandLabels[brand] || brand} — conforme au masque, aucune protection`

  return { filename, fileSize, cardType: `Mifare Classic ${totalSectors <= 16 ? "1K" : "4K"} — MCT`, brand: brandLabels[brand] || brand, verdict, score, checks, summary, anomalies, sectors, rawHex: sectors[0]?.filter(b => !b.includes("X")).join("").substring(0, 128) || "" }
}

function detectCardType(buf: Buffer): string {
  if (buf.length === 1024) return "Mifare Classic 1K"
  if (buf.length === 4096) return "Mifare Classic 4K"
  if (buf.length === 540) return "NTAG215"
  if (buf.length === 144) return "NTAG213"
  if (buf.length === 256) return "Mifare Ultralight"
  return `Inconnu (${buf.length} octets)`
}

function analyzeBinary(buf: Buffer, filename: string): AnalysisResult {
  const checks: CheckResult[] = []
  const lockByte0 = buf[10] || 0
  const lockByte1 = buf[11] || 0
  const hasLocks = lockByte0 !== 0 || lockByte1 !== 0
  checks.push({ id: "otp_lock", name: "Bits de verrouillage OTP", description: "Octets de verrouillage", status: hasLocks ? "detected" : "clean", detail: hasLocks ? `Lock bytes: 0x${lockByte0.toString(16).toUpperCase()} 0x${lockByte1.toString(16).toUpperCase()}` : "Aucun bit de verrouillage", severity: "high" })
  if (buf.length >= 7) {
    const bcc0 = buf[3]; const expectedBCC = buf[0] ^ buf[1] ^ buf[2] ^ 0x88
    checks.push({ id: "uid", name: "Structure UID / BCC", description: "Vérification BCC", status: bcc0 !== expectedBCC ? "detected" : "clean", detail: bcc0 !== expectedBCC ? "BCC invalide — possible carte magique" : "UID cohérent", severity: "medium" })
  }
  if (buf.length >= 64) {
    const defaultKey = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF])
    const keyA = buf.slice(48, 54)
    checks.push({ id: "auth_keys", name: "Clés d'authentification", description: "Clés A/B secteur 0", status: !keyA.equals(defaultKey) ? "detected" : "clean", detail: !keyA.equals(defaultKey) ? `Clé A: ${keyA.toString("hex").toUpperCase()}` : "Clés par défaut", severity: "high" })
  }
  const detected = checks.filter(c => c.status === "detected").length
  const score = Math.min(100, detected * 20)
  const verdict: "protected" | "partial" | "clean" = detected >= 2 ? "protected" : detected >= 1 ? "partial" : "clean"
  return { filename, fileSize: buf.length, cardType: detectCardType(buf), brand: "Format binaire", verdict, score, checks, summary: detected >= 2 ? `${detected} protection(s) détectée(s)` : verdict === "partial" ? "Protection partielle" : "Aucune protection", anomalies: [], rawHex: buf.slice(0, 64).toString("hex").toUpperCase() }
}

export function analyzeBadge(bufferOrText: Buffer | string, filename: string): AnalysisResult {
  const fileSize = typeof bufferOrText === "string" ? bufferOrText.length : bufferOrText.length
  const isMCT = filename.toLowerCase().endsWith(".mct") || (typeof bufferOrText === "string" && bufferOrText.includes("+Sector:"))
  if (isMCT || typeof bufferOrText === "string") {
    const text = typeof bufferOrText === "string" ? bufferOrText : bufferOrText.toString("utf-8")
    return analyzeMCT(text, filename, fileSize)
  }
  return analyzeBinary(bufferOrText as Buffer, filename)
}
