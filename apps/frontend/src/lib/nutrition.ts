import type { NutritionBasis, NutritionInfo } from '../../../../shared/meeting'

type NutritionMetrics = Pick<
  NutritionInfo,
  | 'caloriesKcal'
  | 'sugarG'
  | 'proteinG'
  | 'sodiumMg'
  | 'saturatedFatG'
  | 'caffeineMg'
>

const STARBUCKS_OFFICIAL_LABEL = '스타벅스 코리아 공개 영양정보'
const STARBUCKS_MAPPED_LABEL = '스타벅스 코리아 유사 메뉴 기준'
const GONGCHA_OFFICIAL_LABEL = '공차 공개 영양정보'
const GONGCHA_MAPPED_LABEL = '공차 유사 메뉴 기준'
const ESTIMATED_LABEL = '일반 레시피 기준 추정치'
const PAUL_BASSETT_ESTIMATED_LABEL = '폴 바셋 유사 메뉴 기준 추정치'

export function normalizeMenuLookupKey(name: string) {
  return name.normalize('NFKC').replace(/\s+/g, '').toLowerCase()
}

function createNutritionInfo(
  metrics: NutritionMetrics,
  options?: {
    basis?: NutritionBasis
    sourceLabel?: string
    referenceName?: string
  },
): NutritionInfo {
  return {
    ...metrics,
    basis: options?.basis ?? 'official',
    sourceLabel: options?.sourceLabel ?? STARBUCKS_OFFICIAL_LABEL,
    referenceName: options?.referenceName,
  }
}

function toMetrics(nutritionInfo: NutritionInfo): NutritionMetrics {
  return {
    caloriesKcal: nutritionInfo.caloriesKcal,
    sugarG: nutritionInfo.sugarG,
    proteinG: nutritionInfo.proteinG,
    sodiumMg: nutritionInfo.sodiumMg,
    saturatedFatG: nutritionInfo.saturatedFatG,
    caffeineMg: nutritionInfo.caffeineMg,
  }
}

function officialStarbucks(metrics: NutritionMetrics) {
  return createNutritionInfo(metrics, {
    basis: 'official',
    sourceLabel: STARBUCKS_OFFICIAL_LABEL,
  })
}

function officialGongCha(metrics: NutritionMetrics) {
  return createNutritionInfo(metrics, {
    basis: 'official',
    sourceLabel: GONGCHA_OFFICIAL_LABEL,
  })
}

function mappedNutrition(
  nutritionInfo: NutritionInfo,
  sourceLabel: string,
  referenceName: string,
) {
  return createNutritionInfo(toMetrics(nutritionInfo), {
    basis: 'mapped',
    sourceLabel,
    referenceName,
  })
}

function estimatedNutrition(metrics: NutritionMetrics) {
  return createNutritionInfo(metrics, {
    basis: 'estimated',
    sourceLabel: ESTIMATED_LABEL,
  })
}

function createLookup(entries: Record<string, NutritionInfo>) {
  return Object.fromEntries(
    Object.entries(entries).map(([name, nutritionInfo]) => [
      normalizeMenuLookupKey(name),
      nutritionInfo,
    ]),
  ) as Record<string, NutritionInfo>
}

function getCatalogReference(
  catalog: Record<string, NutritionInfo>,
  referenceName: string,
) {
  const nutritionInfo = catalog[referenceName]

  if (!nutritionInfo) {
    throw new Error(`Missing nutrition reference: ${referenceName}`)
  }

  return nutritionInfo
}

const STARBUCKS_REFERENCE_VALUES = {
  '바삭 피스타치오 바닐라 크림 콜드 브루': officialStarbucks({
    caloriesKcal: 210,
    sugarG: 18,
    proteinG: 3,
    sodiumMg: 50,
    saturatedFatG: 9,
    caffeineMg: 125,
  }),
  '서울 막걸리향 콜드브루': officialStarbucks({
    caloriesKcal: 205,
    sugarG: 38,
    proteinG: 3,
    sodiumMg: 55,
    saturatedFatG: 2.1,
    caffeineMg: 79,
  }),
  '나이트로 바닐라 크림': officialStarbucks({
    caloriesKcal: 80,
    sugarG: 10,
    proteinG: 1,
    sodiumMg: 40,
    saturatedFatG: 2,
    caffeineMg: 232,
  }),
  '나이트로 콜드 브루': officialStarbucks({
    caloriesKcal: 5,
    sugarG: 0,
    proteinG: 0,
    sodiumMg: 5,
    saturatedFatG: 0,
    caffeineMg: 245,
  }),
  '카페 아메리카노': officialStarbucks({
    caloriesKcal: 10,
    sugarG: 0,
    proteinG: 1,
    sodiumMg: 5,
    saturatedFatG: 0,
    caffeineMg: 150,
  }),
  '카페 라떼': officialStarbucks({
    caloriesKcal: 180,
    sugarG: 13,
    proteinG: 10,
    sodiumMg: 115,
    saturatedFatG: 5,
    caffeineMg: 75,
  }),
  '바닐라 빈 라떼': officialStarbucks({
    caloriesKcal: 245,
    sugarG: 27,
    proteinG: 9,
    sodiumMg: 150,
    saturatedFatG: 6,
    caffeineMg: 210,
  }),
  '바닐라 라떼': officialStarbucks({
    caloriesKcal: 210,
    sugarG: 24,
    proteinG: 8,
    sodiumMg: 130,
    saturatedFatG: 5,
    caffeineMg: 75,
  }),
  '카라멜 마키아또': officialStarbucks({
    caloriesKcal: 200,
    sugarG: 22,
    proteinG: 8,
    sodiumMg: 130,
    saturatedFatG: 5,
    caffeineMg: 75,
  }),
  '스타벅스 돌체 라떼': officialStarbucks({
    caloriesKcal: 215,
    sugarG: 32,
    proteinG: 12,
    sodiumMg: 190,
    saturatedFatG: 2,
    caffeineMg: 150,
  }),
  '돌체 콜드 브루': officialStarbucks({
    caloriesKcal: 220,
    sugarG: 22,
    proteinG: 6,
    sodiumMg: 80,
    saturatedFatG: 6,
    caffeineMg: 155,
  }),
  '콜드 브루': officialStarbucks({
    caloriesKcal: 5,
    sugarG: 0,
    proteinG: 0,
    sodiumMg: 11,
    saturatedFatG: 0,
    caffeineMg: 155,
  }),
  '바닐라 크림 콜드 브루': officialStarbucks({
    caloriesKcal: 125,
    sugarG: 11,
    proteinG: 3,
    sodiumMg: 58,
    saturatedFatG: 6,
    caffeineMg: 155,
  }),
  '오트 콜드 브루': officialStarbucks({
    caloriesKcal: 120,
    sugarG: 14,
    proteinG: 1,
    sodiumMg: 95,
    saturatedFatG: 0.3,
    caffeineMg: 65,
  }),
  '제주 말차 라떼': officialStarbucks({
    caloriesKcal: 205,
    sugarG: 20,
    proteinG: 9,
    sodiumMg: 130,
    saturatedFatG: 5,
    caffeineMg: 60,
  }),
  '시그니처 핫 초콜릿': officialStarbucks({
    caloriesKcal: 405,
    sugarG: 38,
    proteinG: 12,
    sodiumMg: 130,
    saturatedFatG: 15,
    caffeineMg: 40,
  }),
  우유: officialStarbucks({
    caloriesKcal: 240,
    sugarG: 18,
    proteinG: 12,
    sodiumMg: 200,
    saturatedFatG: 8,
    caffeineMg: 0,
  }),
  '얼 그레이 티': officialStarbucks({
    caloriesKcal: 0,
    sugarG: 0,
    proteinG: 0,
    sodiumMg: 0,
    saturatedFatG: 0,
    caffeineMg: 70,
  }),
  '캐모마일 블렌드 티': officialStarbucks({
    caloriesKcal: 0,
    sugarG: 0,
    proteinG: 0,
    sodiumMg: 0,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
  '민트 블렌드 티': officialStarbucks({
    caloriesKcal: 0,
    sugarG: 0,
    proteinG: 0,
    sodiumMg: 0,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
  '자몽 허니 블랙 티': officialStarbucks({
    caloriesKcal: 125,
    sugarG: 30,
    proteinG: 0,
    sodiumMg: 5,
    saturatedFatG: 0,
    caffeineMg: 70,
  }),
  '유자 민트 티': officialStarbucks({
    caloriesKcal: 140,
    sugarG: 33,
    proteinG: 0,
    sodiumMg: 10,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
  'ABC 클렌즈 190ML': officialStarbucks({
    caloriesKcal: 90,
    sugarG: 16,
    proteinG: 1,
    sodiumMg: 45,
    saturatedFatG: 0.1,
    caffeineMg: 0,
  }),
  '딸기 딜라이트 요거트 블렌디드': officialStarbucks({
    caloriesKcal: 255,
    sugarG: 38,
    proteinG: 7,
    sodiumMg: 100,
    saturatedFatG: 3.5,
    caffeineMg: 0,
  }),
  '망고 바나나 블렌디드': officialStarbucks({
    caloriesKcal: 290,
    sugarG: 45,
    proteinG: 4,
    sodiumMg: 130,
    saturatedFatG: 0.9,
    caffeineMg: 0,
  }),
  '라이트 핑크 자몽 피지오': officialStarbucks({
    caloriesKcal: 70,
    sugarG: 16,
    proteinG: 0,
    sodiumMg: 0,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
  '슈크림 라떼': officialStarbucks({
    caloriesKcal: 265,
    sugarG: 23,
    proteinG: 11,
    sodiumMg: 165,
    saturatedFatG: 7.5,
    caffeineMg: 75,
  }),
  '슈 폼 라떼': officialStarbucks({
    caloriesKcal: 255,
    sugarG: 21,
    proteinG: 12,
    sodiumMg: 175,
    saturatedFatG: 7,
    caffeineMg: 75,
  }),
  '스타벅스 에어로카노': officialStarbucks({
    caloriesKcal: 10,
    sugarG: 0,
    proteinG: 1,
    sodiumMg: 5,
    saturatedFatG: 0,
    caffeineMg: 150,
  }),
  '시그니처 코르타도': officialStarbucks({
    caloriesKcal: 130,
    sugarG: 8,
    proteinG: 8,
    sodiumMg: 100,
    saturatedFatG: 4.5,
    caffeineMg: 150,
  }),
  '밀크카라멜 라떼': officialStarbucks({
    caloriesKcal: 230,
    sugarG: 26,
    proteinG: 10,
    sodiumMg: 145,
    saturatedFatG: 6,
    caffeineMg: 75,
  }),
  '플랫 화이트': officialStarbucks({
    caloriesKcal: 170,
    sugarG: 12,
    proteinG: 10,
    sodiumMg: 135,
    saturatedFatG: 6,
    caffeineMg: 130,
  }),
  '카페 모카': officialStarbucks({
    caloriesKcal: 310,
    sugarG: 30,
    proteinG: 13,
    sodiumMg: 160,
    saturatedFatG: 9,
    caffeineMg: 75,
  }),
  '카푸치노': officialStarbucks({
    caloriesKcal: 140,
    sugarG: 12,
    proteinG: 9,
    sodiumMg: 115,
    saturatedFatG: 4.5,
    caffeineMg: 75,
  }),
  '화이트 초콜릿 모카': officialStarbucks({
    caloriesKcal: 350,
    sugarG: 41,
    proteinG: 12,
    sodiumMg: 200,
    saturatedFatG: 9,
    caffeineMg: 75,
  }),
  '커피 스타벅스 더블 샷': officialStarbucks({
    caloriesKcal: 120,
    sugarG: 16,
    proteinG: 5,
    sodiumMg: 80,
    saturatedFatG: 2,
    caffeineMg: 150,
  }),
  '바닐라 스타벅스 더블 샷': officialStarbucks({
    caloriesKcal: 160,
    sugarG: 21,
    proteinG: 5,
    sodiumMg: 85,
    saturatedFatG: 2,
    caffeineMg: 150,
  }),
  '헤이즐넛 스타벅스 더블 샷': officialStarbucks({
    caloriesKcal: 150,
    sugarG: 18,
    proteinG: 5,
    sodiumMg: 80,
    saturatedFatG: 2,
    caffeineMg: 150,
  }),
  '에스프레소': officialStarbucks({
    caloriesKcal: 20,
    sugarG: 0,
    proteinG: 1,
    sodiumMg: 10,
    saturatedFatG: 0,
    caffeineMg: 150,
  }),
  '에스프레소 마키아또': officialStarbucks({
    caloriesKcal: 25,
    sugarG: 0,
    proteinG: 1,
    sodiumMg: 10,
    saturatedFatG: 0,
    caffeineMg: 150,
  }),
  '에스프레소 콘 파나': officialStarbucks({
    caloriesKcal: 50,
    sugarG: 2,
    proteinG: 1,
    sodiumMg: 10,
    saturatedFatG: 2,
    caffeineMg: 150,
  }),
  '디카페인 슈크림 라떼': officialStarbucks({
    caloriesKcal: 265,
    sugarG: 23,
    proteinG: 11,
    sodiumMg: 165,
    saturatedFatG: 7.5,
    caffeineMg: 15,
  }),
  '디카페인 슈 폼 라떼': officialStarbucks({
    caloriesKcal: 255,
    sugarG: 21,
    proteinG: 12,
    sodiumMg: 175,
    saturatedFatG: 7,
    caffeineMg: 15,
  }),
  '1/2디카페인 슈크림 라떼': officialStarbucks({
    caloriesKcal: 265,
    sugarG: 23,
    proteinG: 11,
    sodiumMg: 165,
    saturatedFatG: 7.5,
    caffeineMg: 45,
  }),
  '1/2디카페인 슈 폼 라떼': officialStarbucks({
    caloriesKcal: 255,
    sugarG: 21,
    proteinG: 12,
    sodiumMg: 175,
    saturatedFatG: 7,
    caffeineMg: 45,
  }),
  '바삭 피스타치오 초콜릿 프라푸치노': officialStarbucks({
    caloriesKcal: 490,
    sugarG: 58,
    proteinG: 7,
    sodiumMg: 220,
    saturatedFatG: 12,
    caffeineMg: 65,
  }),
  '체리블라썸 백도 크림 프라푸치노': officialStarbucks({
    caloriesKcal: 455,
    sugarG: 52,
    proteinG: 6,
    sodiumMg: 200,
    saturatedFatG: 10,
    caffeineMg: 0,
  }),
  '자몽 허니 레몬 블렌디드': officialStarbucks({
    caloriesKcal: 295,
    sugarG: 65,
    proteinG: 1,
    sodiumMg: 10,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
  '더블 에스프레소 칩 프라푸치노': officialStarbucks({
    caloriesKcal: 430,
    sugarG: 51,
    proteinG: 7,
    sodiumMg: 195,
    saturatedFatG: 9,
    caffeineMg: 110,
  }),
} satisfies Record<string, NutritionInfo>

const GONGCHA_REFERENCE_VALUES = {
  '타로 쥬얼리 시그니처 밀크티': officialGongCha({
    caloriesKcal: 332,
    sugarG: 33,
    proteinG: 6,
    sodiumMg: 184,
    saturatedFatG: 8,
    caffeineMg: 0,
  }),
  '더블 말차 밀크티': officialGongCha({
    caloriesKcal: 383,
    sugarG: 43,
    proteinG: 7,
    sodiumMg: 263,
    saturatedFatG: 11,
    caffeineMg: 174,
  }),
  '브라운슈가 시그니처 얼그레이 밀크티 + 펄': officialGongCha({
    caloriesKcal: 413,
    sugarG: 40,
    proteinG: 1,
    sodiumMg: 62,
    saturatedFatG: 12,
    caffeineMg: 126,
  }),
  '납작 복숭아 아이스티 얼그레이': officialGongCha({
    caloriesKcal: 6,
    sugarG: 0,
    proteinG: 0,
    sodiumMg: 1,
    saturatedFatG: 0,
    caffeineMg: 80,
  }),
  '납작복숭아 아이스티 얼그레이 + 샷 (ESP)': officialGongCha({
    caloriesKcal: 16,
    sugarG: 0,
    proteinG: 1,
    sodiumMg: 1,
    saturatedFatG: 0,
    caffeineMg: 251,
  }),
} satisfies Record<string, NutritionInfo>

const REFERENCE_LOOKUP = createLookup({
  ...STARBUCKS_REFERENCE_VALUES,
  ...GONGCHA_REFERENCE_VALUES,
})

function estimatedPaulBassett(metrics: NutritionMetrics) {
  return createNutritionInfo(metrics, {
    basis: 'estimated',
    sourceLabel: PAUL_BASSETT_ESTIMATED_LABEL,
  })
}

function mappedPaulBassett(
  nutritionInfo: NutritionInfo,
  referenceName: string,
) {
  return createNutritionInfo(toMetrics(nutritionInfo), {
    basis: 'mapped',
    sourceLabel: PAUL_BASSETT_ESTIMATED_LABEL,
    referenceName,
  })
}

const PRESET_MENU_LOOKUP = createLookup({
  아메리카노: mappedNutrition(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, '카페 아메리카노'),
    STARBUCKS_MAPPED_LABEL,
    '카페 아메리카노',
  ),
  카페라떼: mappedNutrition(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, '카페 라떼'),
    STARBUCKS_MAPPED_LABEL,
    '카페 라떼',
  ),
  카라멜라떼: mappedNutrition(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, '카라멜 마키아또'),
    STARBUCKS_MAPPED_LABEL,
    '카라멜 마키아또',
  ),
  헤이즐넛라떼: estimatedNutrition({
    caloriesKcal: 220,
    sugarG: 22,
    proteinG: 8,
    sodiumMg: 130,
    saturatedFatG: 5,
    caffeineMg: 75,
  }),
  소이라떼: estimatedNutrition({
    caloriesKcal: 165,
    sugarG: 8,
    proteinG: 7,
    sodiumMg: 100,
    saturatedFatG: 2,
    caffeineMg: 75,
  }),
  바닐라빈라떼: mappedNutrition(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, '바닐라 빈 라떼'),
    STARBUCKS_MAPPED_LABEL,
    '바닐라 빈 라떼',
  ),
  연유카페라떼: mappedNutrition(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, '스타벅스 돌체 라떼'),
    STARBUCKS_MAPPED_LABEL,
    '스타벅스 돌체 라떼',
  ),
  오트라떼: estimatedNutrition({
    caloriesKcal: 175,
    sugarG: 12,
    proteinG: 3,
    sodiumMg: 140,
    saturatedFatG: 1.8,
    caffeineMg: 75,
  }),
  시그니처라떼: estimatedNutrition({
    caloriesKcal: 235,
    sugarG: 20,
    proteinG: 8,
    sodiumMg: 140,
    saturatedFatG: 6,
    caffeineMg: 75,
  }),
  '콜드브루 아메리카노': mappedNutrition(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, '콜드 브루'),
    STARBUCKS_MAPPED_LABEL,
    '콜드 브루',
  ),
  '콜드브루 라떼': estimatedNutrition({
    caloriesKcal: 145,
    sugarG: 12,
    proteinG: 6,
    sodiumMg: 90,
    saturatedFatG: 3.5,
    caffeineMg: 95,
  }),
  '콜드브루 연유라떼': mappedNutrition(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, '돌체 콜드 브루'),
    STARBUCKS_MAPPED_LABEL,
    '돌체 콜드 브루',
  ),
  '타로 버블밀크티': mappedNutrition(
    getCatalogReference(GONGCHA_REFERENCE_VALUES, '타로 쥬얼리 시그니처 밀크티'),
    GONGCHA_MAPPED_LABEL,
    '타로 쥬얼리 시그니처 밀크티',
  ),
  '말차 버블밀크티': mappedNutrition(
    getCatalogReference(GONGCHA_REFERENCE_VALUES, '더블 말차 밀크티'),
    GONGCHA_MAPPED_LABEL,
    '더블 말차 밀크티',
  ),
  '얼그레이 버블밀크티': mappedNutrition(
    getCatalogReference(
      GONGCHA_REFERENCE_VALUES,
      '브라운슈가 시그니처 얼그레이 밀크티 + 펄',
    ),
    GONGCHA_MAPPED_LABEL,
    '브라운슈가 시그니처 얼그레이 밀크티 + 펄',
  ),
  초코라떼: estimatedNutrition({
    caloriesKcal: 320,
    sugarG: 28,
    proteinG: 10,
    sodiumMg: 120,
    saturatedFatG: 8,
    caffeineMg: 20,
  }),
  말차라떼: mappedNutrition(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, '제주 말차 라떼'),
    STARBUCKS_MAPPED_LABEL,
    '제주 말차 라떼',
  ),
  단팥라떼: estimatedNutrition({
    caloriesKcal: 285,
    sugarG: 31,
    proteinG: 8,
    sodiumMg: 120,
    saturatedFatG: 4.5,
    caffeineMg: 0,
  }),
  얼그레이밀크티: estimatedNutrition({
    caloriesKcal: 260,
    sugarG: 28,
    proteinG: 6,
    sodiumMg: 110,
    saturatedFatG: 5,
    caffeineMg: 60,
  }),
  우베라떼: estimatedNutrition({
    caloriesKcal: 240,
    sugarG: 26,
    proteinG: 6,
    sodiumMg: 120,
    saturatedFatG: 4,
    caffeineMg: 0,
  }),
  우유: getCatalogReference(STARBUCKS_REFERENCE_VALUES, '우유'),
  두유: estimatedNutrition({
    caloriesKcal: 170,
    sugarG: 9,
    proteinG: 8,
    sodiumMg: 110,
    saturatedFatG: 1.5,
    caffeineMg: 0,
  }),
  복숭아아이스티: mappedNutrition(
    getCatalogReference(GONGCHA_REFERENCE_VALUES, '납작 복숭아 아이스티 얼그레이'),
    GONGCHA_MAPPED_LABEL,
    '납작 복숭아 아이스티 얼그레이',
  ),
  아샷추: mappedNutrition(
    getCatalogReference(
      GONGCHA_REFERENCE_VALUES,
      '납작복숭아 아이스티 얼그레이 + 샷 (ESP)',
    ),
    GONGCHA_MAPPED_LABEL,
    '납작복숭아 아이스티 얼그레이 + 샷 (ESP)',
  ),
  레샷추: estimatedNutrition({
    caloriesKcal: 95,
    sugarG: 18,
    proteinG: 0,
    sodiumMg: 10,
    saturatedFatG: 0,
    caffeineMg: 75,
  }),
  딸기라떼: estimatedNutrition({
    caloriesKcal: 210,
    sugarG: 27,
    proteinG: 6,
    sodiumMg: 100,
    saturatedFatG: 3.5,
    caffeineMg: 0,
  }),
  미숫가루: estimatedNutrition({
    caloriesKcal: 275,
    sugarG: 29,
    proteinG: 8,
    sodiumMg: 120,
    saturatedFatG: 2,
    caffeineMg: 0,
  }),
  카모마일: mappedNutrition(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, '캐모마일 블렌드 티'),
    STARBUCKS_MAPPED_LABEL,
    '캐모마일 블렌드 티',
  ),
  페퍼민트: mappedNutrition(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, '민트 블렌드 티'),
    STARBUCKS_MAPPED_LABEL,
    '민트 블렌드 티',
  ),
  얼그레이: mappedNutrition(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, '얼 그레이 티'),
    STARBUCKS_MAPPED_LABEL,
    '얼 그레이 티',
  ),
  자스민그린티: estimatedNutrition({
    caloriesKcal: 0,
    sugarG: 0,
    proteinG: 0,
    sodiumMg: 0,
    saturatedFatG: 0,
    caffeineMg: 20,
  }),
  피치카토우롱: estimatedNutrition({
    caloriesKcal: 95,
    sugarG: 21,
    proteinG: 0,
    sodiumMg: 5,
    saturatedFatG: 0,
    caffeineMg: 30,
  }),
  물랑루즈: estimatedNutrition({
    caloriesKcal: 0,
    sugarG: 0,
    proteinG: 0,
    sodiumMg: 0,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
  자몽허니블랙티: mappedNutrition(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, '자몽 허니 블랙 티'),
    STARBUCKS_MAPPED_LABEL,
    '자몽 허니 블랙 티',
  ),
  레몬차: estimatedNutrition({
    caloriesKcal: 130,
    sugarG: 30,
    proteinG: 0,
    sodiumMg: 10,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
  유자차: estimatedNutrition({
    caloriesKcal: 145,
    sugarG: 34,
    proteinG: 0,
    sodiumMg: 10,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
  ABC주스: mappedNutrition(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, 'ABC 클렌즈 190ML'),
    STARBUCKS_MAPPED_LABEL,
    'ABC 클렌즈 190ML',
  ),
  자몽주스: estimatedNutrition({
    caloriesKcal: 105,
    sugarG: 21,
    proteinG: 1,
    sodiumMg: 5,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
  오렌지주스: estimatedNutrition({
    caloriesKcal: 95,
    sugarG: 19,
    proteinG: 1,
    sodiumMg: 5,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
  오몽주스: estimatedNutrition({
    caloriesKcal: 100,
    sugarG: 20,
    proteinG: 1,
    sodiumMg: 5,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
  자몽에이드: mappedNutrition(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, '라이트 핑크 자몽 피지오'),
    STARBUCKS_MAPPED_LABEL,
    '라이트 핑크 자몽 피지오',
  ),
  레몬에이드: estimatedNutrition({
    caloriesKcal: 115,
    sugarG: 26,
    proteinG: 0,
    sodiumMg: 10,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
  딸기바나나스무디: estimatedNutrition({
    caloriesKcal: 265,
    sugarG: 36,
    proteinG: 4,
    sodiumMg: 95,
    saturatedFatG: 1.5,
    caffeineMg: 0,
  }),
  블루베리바나나스무디: estimatedNutrition({
    caloriesKcal: 275,
    sugarG: 34,
    proteinG: 4,
    sodiumMg: 100,
    saturatedFatG: 1.5,
    caffeineMg: 0,
  }),
  아보카도바나나스무디: estimatedNutrition({
    caloriesKcal: 295,
    sugarG: 24,
    proteinG: 4,
    sodiumMg: 90,
    saturatedFatG: 4.5,
    caffeineMg: 0,
  }),

  // ── Paul Bassett ─────────────────────────────────────────────────────────
  룽고: estimatedPaulBassett({
    caloriesKcal: 15,
    sugarG: 0,
    proteinG: 1,
    sodiumMg: 10,
    saturatedFatG: 0,
    caffeineMg: 130,
  }),
  아이스크림카페라떼: estimatedPaulBassett({
    caloriesKcal: 380,
    sugarG: 35,
    proteinG: 12,
    sodiumMg: 170,
    saturatedFatG: 12,
    caffeineMg: 120,
  }),
  '바닐라빈카페라떼': estimatedPaulBassett({
    caloriesKcal: 235,
    sugarG: 22,
    proteinG: 9,
    sodiumMg: 140,
    saturatedFatG: 6,
    caffeineMg: 120,
  }),
  스페니쉬카페라떼: estimatedPaulBassett({
    caloriesKcal: 290,
    sugarG: 32,
    proteinG: 10,
    sodiumMg: 175,
    saturatedFatG: 7,
    caffeineMg: 120,
  }),
  시나몬카페라떼: estimatedPaulBassett({
    caloriesKcal: 200,
    sugarG: 15,
    proteinG: 10,
    sodiumMg: 120,
    saturatedFatG: 5.5,
    caffeineMg: 120,
  }),
  제주말차카페라떼: mappedPaulBassett(
    getCatalogReference(STARBUCKS_REFERENCE_VALUES, '제주 말차 라떼'),
    '제주 말차 라떼 (스타벅스 기준)',
  ),
  '커피큐브with룽고': estimatedPaulBassett({
    caloriesKcal: 60,
    sugarG: 4,
    proteinG: 2,
    sodiumMg: 25,
    saturatedFatG: 0,
    caffeineMg: 200,
  }),
  '커피큐브with카페라떼': estimatedPaulBassett({
    caloriesKcal: 205,
    sugarG: 14,
    proteinG: 10,
    sodiumMg: 120,
    saturatedFatG: 5,
    caffeineMg: 200,
  }),
  디카페인아이스크림카페라떼: estimatedPaulBassett({
    caloriesKcal: 380,
    sugarG: 35,
    proteinG: 12,
    sodiumMg: 170,
    saturatedFatG: 12,
    caffeineMg: 5,
  }),
  디카페인아메리카노: estimatedPaulBassett({
    caloriesKcal: 10,
    sugarG: 0,
    proteinG: 1,
    sodiumMg: 10,
    saturatedFatG: 0,
    caffeineMg: 5,
  }),
  디카페인카페라떼: estimatedPaulBassett({
    caloriesKcal: 185,
    sugarG: 13,
    proteinG: 10,
    sodiumMg: 115,
    saturatedFatG: 5.5,
    caffeineMg: 5,
  }),
  디카페인락토프리카페라떼: estimatedPaulBassett({
    caloriesKcal: 175,
    sugarG: 12,
    proteinG: 10,
    sodiumMg: 110,
    saturatedFatG: 5,
    caffeineMg: 5,
  }),
  디카페인카페오트: estimatedPaulBassett({
    caloriesKcal: 175,
    sugarG: 12,
    proteinG: 3,
    sodiumMg: 140,
    saturatedFatG: 1.5,
    caffeineMg: 5,
  }),
  디카페인카푸치노: estimatedPaulBassett({
    caloriesKcal: 100,
    sugarG: 9,
    proteinG: 7,
    sodiumMg: 90,
    saturatedFatG: 3.5,
    caffeineMg: 5,
  }),
  디카페인플랫화이트: estimatedPaulBassett({
    caloriesKcal: 145,
    sugarG: 10,
    proteinG: 8,
    sodiumMg: 110,
    saturatedFatG: 4.5,
    caffeineMg: 5,
  }),
  디카페인스페니쉬카페라떼: estimatedPaulBassett({
    caloriesKcal: 290,
    sugarG: 32,
    proteinG: 10,
    sodiumMg: 175,
    saturatedFatG: 7,
    caffeineMg: 5,
  }),
  디카페인바닐라빈카페라떼: estimatedPaulBassett({
    caloriesKcal: 235,
    sugarG: 22,
    proteinG: 9,
    sodiumMg: 140,
    saturatedFatG: 6,
    caffeineMg: 5,
  }),
  디카페인시나몬카페라떼: estimatedPaulBassett({
    caloriesKcal: 200,
    sugarG: 15,
    proteinG: 10,
    sodiumMg: 120,
    saturatedFatG: 5.5,
    caffeineMg: 5,
  }),
  디카페인카라멜마키아토: estimatedPaulBassett({
    caloriesKcal: 225,
    sugarG: 24,
    proteinG: 9,
    sodiumMg: 145,
    saturatedFatG: 5.5,
    caffeineMg: 5,
  }),
  멜론라임에이드: estimatedPaulBassett({
    caloriesKcal: 170,
    sugarG: 40,
    proteinG: 0,
    sodiumMg: 15,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
  제주말차아이스크림라떼: estimatedPaulBassett({
    caloriesKcal: 370,
    sugarG: 33,
    proteinG: 10,
    sodiumMg: 160,
    saturatedFatG: 11,
    caffeineMg: 60,
  }),
  납작복숭아에이드: estimatedPaulBassett({
    caloriesKcal: 165,
    sugarG: 38,
    proteinG: 0,
    sodiumMg: 10,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
  밀크초콜릿: estimatedPaulBassett({
    caloriesKcal: 360,
    sugarG: 36,
    proteinG: 12,
    sodiumMg: 150,
    saturatedFatG: 11,
    caffeineMg: 25,
  }),
  제주한라봉티: estimatedPaulBassett({
    caloriesKcal: 120,
    sugarG: 27,
    proteinG: 0,
    sodiumMg: 10,
    saturatedFatG: 0,
    caffeineMg: 30,
  }),
  초콜릿아이스크림라떼: estimatedPaulBassett({
    caloriesKcal: 400,
    sugarG: 38,
    proteinG: 11,
    sodiumMg: 170,
    saturatedFatG: 13,
    caffeineMg: 20,
  }),
  코코넛판단카페라떼: estimatedPaulBassett({
    caloriesKcal: 255,
    sugarG: 18,
    proteinG: 6,
    sodiumMg: 130,
    saturatedFatG: 8,
    caffeineMg: 120,
  }),
  코코넛말차라떼: estimatedPaulBassett({
    caloriesKcal: 230,
    sugarG: 16,
    proteinG: 5,
    sodiumMg: 120,
    saturatedFatG: 7,
    caffeineMg: 60,
  }),
  콜드브루푸룻프룻: estimatedPaulBassett({
    caloriesKcal: 60,
    sugarG: 12,
    proteinG: 1,
    sodiumMg: 15,
    saturatedFatG: 0,
    caffeineMg: 130,
  }),
  콜드브루라떼푸룻프룻: estimatedPaulBassett({
    caloriesKcal: 160,
    sugarG: 16,
    proteinG: 7,
    sodiumMg: 95,
    saturatedFatG: 3.5,
    caffeineMg: 130,
  }),
  체리블라썸아이스크림카페라떼: estimatedPaulBassett({
    caloriesKcal: 385,
    sugarG: 36,
    proteinG: 11,
    sodiumMg: 170,
    saturatedFatG: 12,
    caffeineMg: 120,
  }),
  체리블라썸카페라떼: estimatedPaulBassett({
    caloriesKcal: 215,
    sugarG: 17,
    proteinG: 9,
    sodiumMg: 125,
    saturatedFatG: 5.5,
    caffeineMg: 120,
  }),
  체리블라썸말차라떼: estimatedPaulBassett({
    caloriesKcal: 235,
    sugarG: 19,
    proteinG: 8,
    sodiumMg: 130,
    saturatedFatG: 5,
    caffeineMg: 60,
  }),
  '체리블라썸아이스크림(컵)': estimatedPaulBassett({
    caloriesKcal: 200,
    sugarG: 22,
    proteinG: 4,
    sodiumMg: 60,
    saturatedFatG: 8,
    caffeineMg: 5,
  }),
  체리블라썸요거트프라페: estimatedPaulBassett({
    caloriesKcal: 340,
    sugarG: 42,
    proteinG: 8,
    sodiumMg: 120,
    saturatedFatG: 6,
    caffeineMg: 10,
  }),
  딥초콜릿라떼: estimatedPaulBassett({
    caloriesKcal: 390,
    sugarG: 40,
    proteinG: 11,
    sodiumMg: 175,
    saturatedFatG: 12,
    caffeineMg: 20,
  }),
  고창고구마라떼: estimatedPaulBassett({
    caloriesKcal: 300,
    sugarG: 32,
    proteinG: 8,
    sodiumMg: 150,
    saturatedFatG: 5,
    caffeineMg: 0,
  }),
  고창땅콩카페라떼: estimatedPaulBassett({
    caloriesKcal: 280,
    sugarG: 20,
    proteinG: 12,
    sodiumMg: 170,
    saturatedFatG: 6,
    caffeineMg: 120,
  }),
  고창복분자에이드: estimatedPaulBassett({
    caloriesKcal: 175,
    sugarG: 42,
    proteinG: 0,
    sodiumMg: 10,
    saturatedFatG: 0,
    caffeineMg: 0,
  }),
})

export function findNutritionInfo(menuName: string) {
  const lookupKey = normalizeMenuLookupKey(menuName)

  return REFERENCE_LOOKUP[lookupKey] ?? PRESET_MENU_LOOKUP[lookupKey] ?? null
}
