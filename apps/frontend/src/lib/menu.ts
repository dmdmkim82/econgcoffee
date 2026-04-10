export type ParsedMenuCandidate = {
  name: string
  price: number
  sourceLine: string
}

const priceFormatter = new Intl.NumberFormat('ko-KR')

const NOISE_KEYWORDS = [
  'receipt',
  'total',
  'subtotal',
  'vat',
  'card',
  'cash',
  'menu',
  'order',
  'payment',
  'phone',
  'break',
  'open',
  'close',
  '\uC601\uC218\uC99D',
  '\uD569\uACC4',
  '\uCD1D\uC561',
  '\uCD1D\uD569',
  '\uCE74\uB4DC',
  '\uD604\uAE08',
  '\uBA54\uB274',
  '\uC8FC\uBB38',
  '\uACB0\uC81C',
  '\uC804\uD654',
  '\uBE0C\uB808\uC774\uD06C',
  '\uC624\uD508',
  '\uB9C8\uAC10',
]

const PRICE_PATTERN =
  /(\d[\d\s,.]{1,10}\d|\d{3,6})\s*(?:\uC6D0|won|krw|w)?/gi

function sanitizeLine(line: string) {
  return line
    .normalize('NFKC')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pickPriceCandidate(line: string) {
  const matches = [...line.matchAll(PRICE_PATTERN)]

  if (matches.length === 0) {
    return null
  }

  const match = matches[matches.length - 1]
  const rawDigits = match[1]?.replace(/[^\d]/g, '') ?? ''
  const price = Number(rawDigits)

  if (!Number.isFinite(price) || price < 1000 || price > 200000) {
    return null
  }

  return {
    matchText: match[0],
    price,
  }
}

function isNoiseLine(line: string) {
  const lower = line.toLowerCase()

  if (line.length < 3) {
    return true
  }

  if (/^[\d\s,.\uC6D0wkr-]+$/i.test(line)) {
    return true
  }

  return NOISE_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()))
}

function sanitizeName(line: string, matchText: string) {
  return line
    .replace(matchText, '')
    .replace(/[|]/g, ' ')
    .replace(/[\u2022\u00B7]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[-/:]$/g, '')
    .trim()
}

export function parseMenuText(rawText: string) {
  const seen = new Set<string>()
  const lines = rawText.split(/\r?\n/)
  const candidates: ParsedMenuCandidate[] = []

  for (const rawLine of lines) {
    const line = sanitizeLine(rawLine)

    if (!line || isNoiseLine(line)) {
      continue
    }

    const priceCandidate = pickPriceCandidate(line)

    if (!priceCandidate) {
      continue
    }

    const name = sanitizeName(line, priceCandidate.matchText)

    if (!name || name.length < 2 || /^[\d\s]+$/.test(name)) {
      continue
    }

    const dedupeKey = `${name.toLowerCase()}::${priceCandidate.price}`

    if (seen.has(dedupeKey)) {
      continue
    }

    seen.add(dedupeKey)
    candidates.push({
      name,
      price: priceCandidate.price,
      sourceLine: line,
    })
  }

  return candidates.sort(
    (left, right) =>
      left.price - right.price || left.name.localeCompare(right.name, 'ko-KR'),
  )
}

export function formatPrice(price: number) {
  return `${priceFormatter.format(price)}원`
}

export function formatVisiblePrice(price: number, showPrices: boolean) {
  if (!showPrices) {
    return '금액 숨김'
  }

  return price > 0 ? formatPrice(price) : '가격 미정'
}
