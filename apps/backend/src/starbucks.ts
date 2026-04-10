import type { NutritionInfo, TemperatureOption } from '../../../shared/meeting'

export type StarbucksCatalogMenu = {
  categoryName: string
  name: string
  price: number
  availableTemperatures: TemperatureOption[]
  nutritionInfo: NutritionInfo
}

type StarbucksMenuResponse = {
  list: Array<{
    product_CD?: string
    product_NM?: string
    kcal?: string
    sugars?: string
    protein?: string
    sodium?: string
    sat_FAT?: string
    caffeine?: string
  }>
}

type StarbucksCategory = {
  code: string
  name: string
  defaultTemperatures: TemperatureOption[]
}

const STARBUCKS_CATEGORY_DEFINITIONS: StarbucksCategory[] = [
  { code: 'W0000171', name: '콜드 브루', defaultTemperatures: ['ICE'] },
  { code: 'W0000060', name: '브루드 커피', defaultTemperatures: ['HOT'] },
  { code: 'W0000003', name: '에스프레소', defaultTemperatures: ['HOT'] },
  { code: 'W0000004', name: '프라푸치노', defaultTemperatures: ['ICE'] },
  { code: 'W0000005', name: '블렌디드', defaultTemperatures: ['ICE'] },
  { code: 'W0000422', name: '스타벅스 리프레셔', defaultTemperatures: ['ICE'] },
  { code: 'W0000061', name: '스타벅스 피지오', defaultTemperatures: ['ICE'] },
  { code: 'W0000075', name: '티', defaultTemperatures: ['HOT'] },
  { code: 'W0000053', name: '기타 제조 음료', defaultTemperatures: ['HOT'] },
  { code: 'W0000062', name: '스타벅스 주스', defaultTemperatures: ['ICE'] },
]

const STARBUCKS_MENU_BASE_URL = 'https://www.starbucks.co.kr/upload/json/menu'
const CACHE_TTL_MS = 1000 * 60 * 60 * 6

// 가격 테이블 (스타벅스 앱 기준, Tall 사이즈)
const PRICE_TABLE: Record<string, number> = {
  // 에스프레소 / 커피
  '슈크림라떼': 6700, '슈폼라떼': 6700, '스타벅스에어로카노': 4900,
  '시그니처코르타도': 5800, '코르타도': 5800, '밀크카라멜라떼': 5800,
  '플랫화이트': 5800, '카페아메리카노': 4700, '카페라떼': 5200,
  '바닐라라떼': 5200, '스타벅스돌체라떼': 6100, '카페모카': 5700,
  '카푸치노': 5200, '카라멜마키아또': 6100, '화이트초콜릿모카': 6100,
  '커피스타벅스더블샷': 5300, '바닐라스타벅스더블샷': 5300, '헤이즐넛스타벅스더블샷': 5300,
  '에스프레소': 3900, '에스프레소마키아또': 3900, '에스프레소콘파나': 4100,
  '스타벅스꿀호떡라떼': 9000, '인절미크림라떼': 9000,
  '스타벅스1호점카페아메리카노': 6000, '스타벅스1호점카페라떼': 6500, '스타벅스1호점크림라떼': 7500,
  // 디카페인 커피
  '디카페인슈폼라떼': 7000, '디카페인슈크림라떼': 7000,
  '1/2디카페인슈폼라떼': 7000, '1/2디카페인슈크림라떼': 7000,
  '디카페인스타벅스에어로카노': 5200, '1/2디카페인스타벅스에어로카노': 5200,
  '디카페인코르타도': 6100, '1/2디카페인코르타도': 6100,
  '디카페인밀크카라멜라떼': 6100, '1/2디카페인밀크카라멜라떼': 6100,
  '디카페인플랫화이트': 6100, '1/2디카페인플랫화이트': 6100,
  '디카페인카페아메리카노': 5000, '디카페인카페라떼': 5500,
  '디카페인바닐라라떼': 5500, '디카페인스타벅스돌체라떼': 6400,
  '디카페인카라멜마키아또': 6400, '디카페인카페모카': 6000,
  '디카페인카푸치노': 5500, '디카페인화이트초콜릿모카': 6400,
  '디카페인커피스타벅스더블샷': 5600, '디카페인바닐라스타벅스더블샷': 5600,
  '디카페인헤이즐넛스타벅스더블샷': 5600,
  '디카페인에스프레소': 4200, '디카페인에스프레소마키아또': 4200, '디카페인에스프레소콘파나': 4400,
  // 콜드 브루
  '바삭피스타치오바닐라크림콜드브루': 7500, '바닐라크림콜드브루': 6000,
  '돌체콜드브루': 6000, '콜드브루': 5100, '베르가못콜드브루': 6000,
  '오트콜드브루': 6000, '나이트로바닐라크림': 6300, '나이트로콜드브루': 6200,
  '서울막걸리향콜드브루': 7500,
  // 기타 (딸기 라떼, 초콜릿 음료)
  '슈크림딸기라떼': 6700, '슈폼딸기라떼': 6700, '스타벅스딸기라떼': 6500,
  '시그니처핫초콜릿': 5900, '티라미수초콜릿': 9400,
  '딸기콜드폼초콜릿': 8400, '딸기콜드폼딸기라떼': 8400,
  '스팀우유': 4100, '우유': 4100, '플러피판다핫초콜릿': 6500,
}

function normalizeKey(name: string): string {
  return name.normalize('NFKC').replace(/\s+/g, '').toLowerCase()
}

function lookupPrice(name: string): number {
  const key = normalizeKey(name)
  if (PRICE_TABLE[key] !== undefined) return PRICE_TABLE[key]
  // 아이스 버전: "아이스 카페 라떼" → "카페 라떼"
  const withoutIce = key.replace(/^아이스/, '')
  if (withoutIce !== key && PRICE_TABLE[withoutIce] !== undefined) {
    return PRICE_TABLE[withoutIce]
  }
  return 0
}

let catalogCache:
  | {
      expiresAt: number
      menus: StarbucksCatalogMenu[]
      fetchedAt: string
    }
  | null = null

function parseNumber(value: string | undefined) {
  if (!value) {
    return 0
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function inferTemperatures(
  productName: string,
  defaultTemperatures: TemperatureOption[],
) {
  if (defaultTemperatures.length === 1 && defaultTemperatures[0] === 'ICE') {
    return ['ICE'] as TemperatureOption[]
  }

  if (productName.startsWith('아이스 ')) {
    return ['ICE'] as TemperatureOption[]
  }

  return [...defaultTemperatures]
}

function createNutritionInfo(entry: StarbucksMenuResponse['list'][number]): NutritionInfo {
  return {
    caloriesKcal: parseNumber(entry.kcal),
    sugarG: parseNumber(entry.sugars),
    proteinG: parseNumber(entry.protein),
    sodiumMg: parseNumber(entry.sodium),
    saturatedFatG: parseNumber(entry.sat_FAT),
    caffeineMg: parseNumber(entry.caffeine),
    basis: 'official',
    sourceLabel: '스타벅스 코리아 공개 영양정보',
  }
}

async function fetchCategory(category: StarbucksCategory) {
  const response = await fetch(
    `${STARBUCKS_MENU_BASE_URL}/${category.code}.js`,
  )

  if (!response.ok) {
    throw new Error(`Failed to load Starbucks catalog: ${category.code}`)
  }

  const payload = (await response.json()) as StarbucksMenuResponse
  const deduped = new Set<string>()

  return payload.list.flatMap((entry) => {
    const name = entry.product_NM?.trim()

    if (!name) {
      return []
    }

    const dedupeKey = name.normalize('NFKC').replace(/\s+/g, '').toLowerCase()

    if (deduped.has(dedupeKey)) {
      return []
    }

    deduped.add(dedupeKey)

    return [
      {
        categoryName: category.name,
        name,
        price: lookupPrice(name),
        availableTemperatures: inferTemperatures(
          name,
          category.defaultTemperatures,
        ),
        nutritionInfo: createNutritionInfo(entry),
      } satisfies StarbucksCatalogMenu,
    ]
  })
}

export async function fetchStarbucksDrinkCatalog() {
  if (catalogCache && catalogCache.expiresAt > Date.now()) {
    return {
      menus: catalogCache.menus,
      fetchedAt: catalogCache.fetchedAt,
    }
  }

  const categoryMenus = await Promise.all(
    STARBUCKS_CATEGORY_DEFINITIONS.map(fetchCategory),
  )
  const deduped = new Map<string, StarbucksCatalogMenu>()

  for (const menus of categoryMenus) {
    for (const menu of menus) {
      const dedupeKey = menu.name
        .normalize('NFKC')
        .replace(/\s+/g, '')
        .toLowerCase()

      if (!deduped.has(dedupeKey)) {
        deduped.set(dedupeKey, menu)
      }
    }
  }

  const menus = [...deduped.values()].sort(
    (left, right) =>
      left.categoryName.localeCompare(right.categoryName, 'ko-KR') ||
      left.name.localeCompare(right.name, 'ko-KR'),
  )
  const fetchedAt = new Date().toISOString()

  catalogCache = {
    menus,
    fetchedAt,
    expiresAt: Date.now() + CACHE_TTL_MS,
  }

  return { menus, fetchedAt }
}
