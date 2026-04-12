export interface CheckResult {
  id: string
  name: string
  description: string
  status: "detected" | "clean" | "partial" | "unknown"
  detail: string
  severity: "high" | "medium" | "low" | "info"
}

export interface AnalysisResult {
  filename: string
  fileSize: number
  cardType: string
  verdict: "protected" | "partial" | "clean"
  score: number // 0-100 anti-copy score
  checks: CheckResult[]
  summary: string
  rawHex?: string
}

function toHex(buf: Buffer): string {
  return buf.toString("hex").toUpperCase()
}

function detectCardType(buf: Buffer): string {
  if (buf.length === 1024) return "Mifare Classic 1K"
  if (buf.length === 4096) return "Mifare Classic 4K"
  if (buf.length === 540) return "NTAG215"
  if (buf.length === 144) return "NTAG213"
  if (buf.length === 888) return "NTAG216"
  if (buf.length === 256) return "Mifare Ultralight"
  if (buf.length === 137) return "iClass 2K"
  return `Unknown (${buf.length} bytes)`
}

// Check 1: OTP lock bits
function checkOTPLockBits(buf: Buffer): CheckResult {
  if (buf.length < 16) {
    return { id: "otp_lock", name: "Bits de verrouillage OTP", description: "Octets de verrouillage en lecture seule", status: "unknown", detail: "Fichier trop court", severity: "high" }
  }
  // Bytes 10-11 are lock bytes in Mifare/NTAG
  const lockByte0 = buf[10]
  const lockByte1 = buf[11]
  const hasLocks = (lockByte0 !== 0x00 || lockByte1 !== 0x00)
  return {
    id: "otp_lock",
    name: "Bits de verrouillage OTP",
    description: "Octets de verrouillage rendant certains blocs en lecture seule",
    status: hasLocks ? "detected" : "clean",
    detail: hasLocks ? `Lock bytes: 0x${lockByte0.toString(16).toUpperCase().padStart(2,'0')} 0x${lockByte1.toString(16).toUpperCase().padStart(2,'0')} — blocs protégés en écriture` : "Aucun bit de verrouillage activé",
    severity: "high"
  }
}

// Check 2: UID structure
function checkUID(buf: Buffer): CheckResult {
  if (buf.length < 7) {
    return { id: "uid", name: "Structure UID", description: "Identifiant unique de la carte", status: "unknown", detail: "Impossible de lire l'UID", severity: "medium" }
  }
  const uid = buf.slice(0, 7)
  const uidHex = toHex(uid)
  // Check for magic cards (UID writeable) - common magic card UIDs start with specific patterns
  const isMagicCard = buf[0] === 0x00 || (buf[0] === buf[3]) // simplified heuristic
  // Check BCC byte
  const bcc0 = buf[3]
  const expectedBCC = buf[0] ^ buf[1] ^ buf[2] ^ 0x88
  const bccValid = bcc0 === expectedBCC
  if (!bccValid) {
    return { id: "uid", name: "Structure UID / BCC", description: "Vérification du byte de contrôle BCC", status: "detected", detail: `BCC invalide (0x${bcc0.toString(16).toUpperCase()} ≠ 0x${expectedBCC.toString(16).toUpperCase()}) — possible carte magique ou UID figé`, severity: "high" }
  }
  return { id: "uid", name: "Structure UID / BCC", description: "Vérification du byte de contrôle BCC", status: "clean", detail: `UID: ${uidHex.slice(0,14)} — BCC cohérent`, severity: "medium" }
}

// Check 3: Authentication keys (Mifare Classic)
function checkAuthKeys(buf: Buffer): CheckResult {
  if (buf.length < 64) {
    return { id: "auth_keys", name: "Clés d'authentification", description: "Clés secteur A et B", status: "unknown", detail: "Pas assez de données", severity: "high" }
  }
  const defaultKeyA = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF])
  const defaultKeyB = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF])
  // Sector 0 trailer is at offset 48 (block 3) in Mifare Classic 1K
  const sectorTrailer = buf.slice(48, 64)
  const keyA = sectorTrailer.slice(0, 6)
  const keyB = sectorTrailer.slice(10, 16)
  const keyADefault = keyA.equals(defaultKeyA)
  const keyBDefault = keyB.equals(defaultKeyB)
  if (!keyADefault || !keyBDefault) {
    return { id: "auth_keys", name: "Clés d'authentification non-standard", description: "Clés secteur A/B modifiées depuis la valeur par défaut", status: "detected", detail: `Clé A: ${keyADefault ? 'défaut' : 'personnalisée'} — Clé B: ${keyBDefault ? 'défaut' : 'personnalisée'} — lecture complète impossible sans les clés`, severity: "high" }
  }
  return { id: "auth_keys", name: "Clés d'authentification", description: "Clés secteur A/B", status: "clean", detail: "Clés par défaut (0xFFFFFFFFFFFF) — pas de protection par clé", severity: "high" }
}

// Check 4: Access conditions
function checkAccessConditions(buf: Buffer): CheckResult {
  if (buf.length < 64) {
    return { id: "access_cond", name: "Conditions d'accès", description: "Bits d'accès des blocs secteur", status: "unknown", detail: "Données insuffisantes", severity: "medium" }
  }
  const trailer = buf.slice(48, 64)
  const ac = trailer.slice(6, 9)
  // Default access conditions are 0xFF 0x07 0x80
  const defaultAC = Buffer.from([0xFF, 0x07, 0x80])
  const isDefault = ac.slice(0, 3).equals(defaultAC)
  if (!isDefault) {
    return { id: "access_cond", name: "Conditions d'accès personnalisées", description: "Bits d'accès des blocs modifiés", status: "partial", detail: `Access bits: 0x${ac[0].toString(16).toUpperCase()} 0x${ac[1].toString(16).toUpperCase()} 0x${ac[2].toString(16).toUpperCase()} — accès restreint sur certains blocs`, severity: "medium" }
  }
  return { id: "access_cond", name: "Conditions d'accès", description: "Bits d'accès des blocs secteur", status: "clean", detail: "Conditions d'accès standard — aucune restriction supplémentaire", severity: "medium" }
}

// Check 5: Manufacturer block integrity
function checkManufacturerBlock(buf: Buffer): CheckResult {
  if (buf.length < 16) {
    return { id: "mfr_block", name: "Bloc fabricant", description: "Intégrité du bloc 0", status: "unknown", detail: "Données insuffisantes", severity: "medium" }
  }
  const mfrBlock = buf.slice(0, 16)
  // Check SAK byte (byte 5 in block 0)
  const sak = mfrBlock[5]
  // Common SAK values: 0x08 = Mifare Classic 1K, 0x18 = 4K, 0x00 = Ultralight
  const knownSAK = [0x00, 0x08, 0x09, 0x10, 0x18, 0x20, 0x28, 0x40, 0x48, 0x60, 0x78]
  const unknownSAK = !knownSAK.includes(sak)
  if (unknownSAK) {
    return { id: "mfr_block", name: "Bloc fabricant suspect", description: "SAK inhabituel dans le bloc fabricant", status: "partial", detail: `SAK: 0x${sak.toString(16).toUpperCase()} — valeur non standard, possible émulation ou carte clone`, severity: "medium" }
  }
  return { id: "mfr_block", name: "Bloc fabricant", description: "Intégrité du bloc 0", status: "clean", detail: `SAK: 0x${sak.toString(16).toUpperCase()} — type de carte reconnu`, severity: "medium" }
}

// Check 6: Counter/anti-replay bytes
function checkCounterBytes(buf: Buffer): CheckResult {
  if (buf.length < 32) {
    return { id: "counter", name: "Compteur anti-rejeu", description: "Octets de compteur ou de révocation", status: "unknown", detail: "Données insuffisantes", severity: "medium" }
  }
  // Look for sequential patterns that could be counters in data blocks
  let counterFound = false
  let counterDetail = ""
  for (let i = 16; i < Math.min(buf.length - 4, 80); i += 16) {
    const block = buf.slice(i, i + 4)
    // A counter would be a non-zero, non-max 4-byte value
    const val = block.readUInt32BE(0)
    if (val > 0 && val < 0xFFFFFFFF && val < 100000) {
      counterFound = true
      counterDetail = `Bloc ${Math.floor(i/16)}: valeur 0x${val.toString(16).toUpperCase().padStart(8,'0')} (${val}) — possible compteur d'utilisation`
      break
    }
  }
  return {
    id: "counter",
    name: "Compteur anti-rejeu",
    description: "Détection de mécanismes de compteur ou révocation",
    status: counterFound ? "partial" : "clean",
    detail: counterFound ? counterDetail : "Aucun pattern de compteur détecté",
    severity: "medium"
  }
}

// Check 7: Entropy analysis (encrypted data detection)
function checkEntropy(buf: Buffer): CheckResult {
  if (buf.length < 64) {
    return { id: "entropy", name: "Analyse d'entropie", description: "Détection de données chiffrées", status: "unknown", detail: "Données insuffisantes", severity: "low" }
  }
  // Calculate byte frequency distribution
  const freq = new Array(256).fill(0)
  const dataSection = buf.slice(16, Math.min(buf.length, 256))
  for (const byte of dataSection) freq[byte]++
  const nonZero = freq.filter(f => f > 0).length
  const entropy = nonZero / 256
  if (entropy > 0.85) {
    return { id: "entropy", name: "Données chiffrées détectées", description: "Entropie élevée suggérant un chiffrement", status: "detected", detail: `Entropie: ${(entropy * 100).toFixed(1)}% — distribution quasi-uniforme, probablement chiffré`, severity: "high" }
  }
  if (entropy > 0.6) {
    return { id: "entropy", name: "Entropie modérée", description: "Distribution des octets", status: "partial", detail: `Entropie: ${(entropy * 100).toFixed(1)}% — données partiellement aléatoires ou compressées`, severity: "low" }
  }
  return { id: "entropy", name: "Analyse d'entropie", description: "Distribution des octets", status: "clean", detail: `Entropie: ${(entropy * 100).toFixed(1)}% — données structurées normales`, severity: "low" }
}

// Check 8: Known anti-copy signatures
function checkKnownSignatures(buf: Buffer): CheckResult {
  const hexStr = toHex(buf)
  // Known patterns used by anti-copy systems
  const signatures: { pattern: string; name: string }[] = [
    { pattern: "4E46433031", name: "NFC Forum Type 1" },
    { pattern: "D0030000", name: "NDEF lock record" },
    { pattern: "0103A00C", name: "HID Prox format" },
    { pattern: "E110", name: "NDEF OTP area" },
  ]
  const found = signatures.filter(s => hexStr.includes(s.pattern))
  if (found.length > 0) {
    return { id: "signatures", name: "Signatures anti-copie connues", description: "Patterns reconnus dans la base de données", status: "detected", detail: `${found.length} signature(s) détectée(s): ${found.map(f => f.name).join(", ")}`, severity: "high" }
  }
  return { id: "signatures", name: "Signatures anti-copie", description: "Recherche dans la base de signatures connues", status: "clean", detail: "Aucune signature de protection connue trouvée", severity: "info" }
}

export function analyzeBadge(buffer: Buffer, filename: string): AnalysisResult {
  const checks: CheckResult[] = [
    checkOTPLockBits(buffer),
    checkUID(buffer),
    checkAuthKeys(buffer),
    checkAccessConditions(buffer),
    checkManufacturerBlock(buffer),
    checkCounterBytes(buffer),
    checkEntropy(buffer),
    checkKnownSignatures(buffer),
  ]

  const detected = checks.filter(c => c.status === "detected").length
  const partial = checks.filter(c => c.status === "partial").length
  const score = Math.round((detected * 15 + partial * 7))

  let verdict: "protected" | "partial" | "clean"
  let summary: string

  if (detected >= 2 || score >= 20) {
    verdict = "protected"
    summary = `${detected} protection(s) active(s) détectée(s) — la copie directe est probablement inefficace`
  } else if (detected >= 1 || partial >= 2) {
    verdict = "partial"
    summary = `Protection partielle détectée — copie possible mais avec des limitations`
  } else {
    verdict = "clean"
    summary = "Aucune protection significative — badge probablement copiable"
  }

  return {
    filename,
    fileSize: buffer.length,
    cardType: detectCardType(buffer),
    verdict,
    score: Math.min(score, 100),
    checks,
    summary,
    rawHex: toHex(buffer.slice(0, 64))
  }
}
