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
        price: 0,
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
