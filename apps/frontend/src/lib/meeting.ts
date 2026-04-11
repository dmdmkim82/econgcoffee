import type {
  Attendee,
  MeetingSettings,
  MenuItem,
  NutritionInfo,
  Snapshot,
  TemperatureOption,
} from '../../../../shared/meeting'
import { findNutritionInfo } from './nutrition'

export type {
  Attendee,
  MenuItem,
  MeetingSettings,
  NutritionInfo,
  Snapshot,
  TemperatureOption,
}

export const STORAGE_KEY = 'ekong-coffee-state-v1'
export const LATELIER_CAFE_NAME = "L'atelier"
export const STARBUCKS_CAFE_NAME = '스타벅스'
export const PAUL_BASSETT_CAFE_NAME = '폴 바셋'
export const CAFE_PRESETS = [LATELIER_CAFE_NAME, STARBUCKS_CAFE_NAME, PAUL_BASSETT_CAFE_NAME] as const
export type CafePresetName = (typeof CAFE_PRESETS)[number]

const TEMPERATURE_ORDER: TemperatureOption[] = ['HOT', 'ICE']
const HOT_AND_ICE: TemperatureOption[] = ['HOT', 'ICE']
const ICE_ONLY: TemperatureOption[] = ['ICE']
export const DECAF_SURCHARGE = 700

const COFFEE_KEYWORDS = [
  '아메리카노',
  '에스프레소',
  '카페',
  '콜드브루',
  '마끼아또',
  '플랫화이트',
  '아인슈페너',
  '라떼',
]

const NON_COFFEE_KEYWORDS = [
  '초코',
  '말차',
  '밀크티',
  '고구마',
  '미숫가루',
  '곡물',
  '우유',
  '두유',
  '티',
  '주스',
  '스무디',
  '에이드',
  '버블',
]

type PresetMenuItem = Omit<MenuItem, 'id' | 'source' | 'nutritionInfo'> & {
  nutritionInfo?: NutritionInfo | null
}

export type CreateMenuSeed = Pick<
  MenuItem,
  'name' | 'price' | 'availableTemperatures' | 'nutritionInfo'
>

type BuildDefaultSnapshotOptions = {
  title?: string
  attendeeNames?: string[]
  cafeName?: string
  menuSeeds?: CreateMenuSeed[]
}

const LATELIER_MENU_PRESET: PresetMenuItem[] = [
  { name: '아메리카노', price: 1800, availableTemperatures: HOT_AND_ICE },
  { name: '카페라떼', price: 2300, availableTemperatures: HOT_AND_ICE },
  { name: '카라멜라떼', price: 3000, availableTemperatures: HOT_AND_ICE },
  { name: '헤이즐넛라떼', price: 3000, availableTemperatures: HOT_AND_ICE },
  { name: '소이라떼', price: 2300, availableTemperatures: HOT_AND_ICE },
  { name: '바닐라빈라떼', price: 3000, availableTemperatures: HOT_AND_ICE },
  { name: '연유카페라떼', price: 3000, availableTemperatures: HOT_AND_ICE },
  { name: '오트라떼', price: 3000, availableTemperatures: HOT_AND_ICE },
  { name: '시그니처라떼', price: 3500, availableTemperatures: HOT_AND_ICE },
  { name: '콜드브루 아메리카노', price: 3600, availableTemperatures: ICE_ONLY },
  { name: '콜드브루 라떼', price: 3900, availableTemperatures: ICE_ONLY },
  { name: '콜드브루 연유라떼', price: 4200, availableTemperatures: ICE_ONLY },
  { name: '타로 버블밀크티', price: 4300, availableTemperatures: ICE_ONLY },
  { name: '말차 버블밀크티', price: 4300, availableTemperatures: ICE_ONLY },
  { name: '얼그레이 버블밀크티', price: 4300, availableTemperatures: ICE_ONLY },
  { name: '초코라떼', price: 3000, availableTemperatures: HOT_AND_ICE },
  { name: '말차라떼', price: 3200, availableTemperatures: HOT_AND_ICE },
  { name: '단팥라떼', price: 2800, availableTemperatures: HOT_AND_ICE },
  { name: '얼그레이밀크티', price: 3200, availableTemperatures: HOT_AND_ICE },
  { name: '우베라떼', price: 3500, availableTemperatures: HOT_AND_ICE },
  { name: '우유', price: 1800, availableTemperatures: HOT_AND_ICE },
  { name: '두유', price: 1800, availableTemperatures: HOT_AND_ICE },
  { name: '복숭아아이스티', price: 2500, availableTemperatures: ICE_ONLY },
  { name: '아샷추', price: 3000, availableTemperatures: ICE_ONLY },
  { name: '레샷추', price: 3500, availableTemperatures: ICE_ONLY },
  { name: '딸기라떼', price: 4300, availableTemperatures: HOT_AND_ICE },
  { name: '미숫가루', price: 3000, availableTemperatures: HOT_AND_ICE },
  { name: '카모마일', price: 2500, availableTemperatures: HOT_AND_ICE },
  { name: '페퍼민트', price: 2500, availableTemperatures: HOT_AND_ICE },
  { name: '얼그레이', price: 2500, availableTemperatures: HOT_AND_ICE },
  { name: '자스민그린티', price: 2500, availableTemperatures: HOT_AND_ICE },
  { name: '피치카토우롱', price: 2500, availableTemperatures: HOT_AND_ICE },
  { name: '물랑루즈', price: 2500, availableTemperatures: HOT_AND_ICE },
  { name: '자몽허니블랙티', price: 3800, availableTemperatures: HOT_AND_ICE },
  { name: '레몬차', price: 3000, availableTemperatures: HOT_AND_ICE },
  { name: '유자차', price: 3000, availableTemperatures: HOT_AND_ICE },
  { name: 'ABC주스', price: 3800, availableTemperatures: ICE_ONLY },
  { name: '자몽주스', price: 3800, availableTemperatures: ICE_ONLY },
  { name: '오렌지주스', price: 3800, availableTemperatures: ICE_ONLY },
  { name: '오몽주스', price: 3800, availableTemperatures: ICE_ONLY },
  { name: '자몽에이드', price: 3000, availableTemperatures: ICE_ONLY },
  { name: '레몬에이드', price: 3000, availableTemperatures: ICE_ONLY },
  { name: '딸기바나나스무디', price: 4300, availableTemperatures: ICE_ONLY },
  { name: '블루베리바나나스무디', price: 4300, availableTemperatures: ICE_ONLY },
  { name: '아보카도바나나스무디', price: 4300, availableTemperatures: ICE_ONLY },
]

const STARBUCKS_MENU_PRESET: PresetMenuItem[] = [
  // 에스프레소 / 커피
  { name: '슈크림 라떼', price: 6700, availableTemperatures: HOT_AND_ICE },
  { name: '슈 폼 라떼', price: 6700, availableTemperatures: HOT_AND_ICE },
  { name: '스타벅스 에어로카노', price: 4900, availableTemperatures: ICE_ONLY },
  { name: '시그니처 코르타도', price: 5800, availableTemperatures: HOT_AND_ICE },
  { name: '밀크카라멜 라떼', price: 5800, availableTemperatures: HOT_AND_ICE },
  { name: '플랫 화이트', price: 5800, availableTemperatures: HOT_AND_ICE },
  { name: '카페 아메리카노', price: 4700, availableTemperatures: HOT_AND_ICE },
  { name: '카페 라떼', price: 5200, availableTemperatures: HOT_AND_ICE },
  { name: '바닐라 라떼', price: 5200, availableTemperatures: HOT_AND_ICE },
  { name: '스타벅스 돌체 라떼', price: 6100, availableTemperatures: HOT_AND_ICE },
  { name: '카페 모카', price: 5700, availableTemperatures: HOT_AND_ICE },
  { name: '카푸치노', price: 5200, availableTemperatures: HOT_AND_ICE },
  { name: '카라멜 마키아또', price: 6100, availableTemperatures: HOT_AND_ICE },
  { name: '화이트 초콜릿 모카', price: 6100, availableTemperatures: HOT_AND_ICE },
  { name: '커피 스타벅스 더블 샷', price: 5300, availableTemperatures: ICE_ONLY },
  { name: '바닐라 스타벅스 더블 샷', price: 5300, availableTemperatures: ICE_ONLY },
  { name: '헤이즐넛 스타벅스 더블 샷', price: 5300, availableTemperatures: ICE_ONLY },
  { name: '에스프레소', price: 3900, availableTemperatures: HOT_AND_ICE },
  { name: '에스프레소 마키아또', price: 3900, availableTemperatures: HOT_AND_ICE },
  { name: '에스프레소 콘 파나', price: 4100, availableTemperatures: HOT_AND_ICE },
  // 디카페인 커피
  { name: '디카페인 슈 폼 라떼', price: 7000, availableTemperatures: HOT_AND_ICE },
  { name: '디카페인 슈크림 라떼', price: 7000, availableTemperatures: HOT_AND_ICE },
  { name: '1/2디카페인 슈 폼 라떼', price: 7000, availableTemperatures: HOT_AND_ICE },
  { name: '1/2디카페인 슈크림 라떼', price: 7000, availableTemperatures: HOT_AND_ICE },
  // 콜드 브루
  { name: '바삭 피스타치오 바닐라 크림 콜드 브루', price: 7500, availableTemperatures: ICE_ONLY },
  { name: '바닐라 크림 콜드 브루', price: 6000, availableTemperatures: ICE_ONLY },
  { name: '돌체 콜드 브루', price: 6000, availableTemperatures: ICE_ONLY },
  { name: '콜드 브루', price: 5100, availableTemperatures: ICE_ONLY },
  // 프라푸치노 / 블렌디드
  { name: '바삭 피스타치오 초콜릿 프라푸치노', price: 7700, availableTemperatures: ICE_ONLY },
  { name: '체리블라썸 백도 크림 프라푸치노', price: 7700, availableTemperatures: ICE_ONLY },
  { name: '자몽 허니 레몬 블렌디드', price: 6300, availableTemperatures: ICE_ONLY },
  { name: '더블 에스프레소 칩 프라푸치노', price: 6500, availableTemperatures: ICE_ONLY },
]

const PAUL_BASSETT_MENU_PRESET: PresetMenuItem[] = [
  // 커피
  { name: '룽고', price: 5300, availableTemperatures: ICE_ONLY },
  { name: '카페라떼', price: 5900, availableTemperatures: HOT_AND_ICE },
  { name: '아이스크림 카페라떼', price: 7500, availableTemperatures: ICE_ONLY },
  { name: '바닐라빈 카페 라떼', price: 6500, availableTemperatures: HOT_AND_ICE },
  { name: '스페니쉬 카페 라떼', price: 6500, availableTemperatures: HOT_AND_ICE },
  { name: '시나몬 카페 라떼', price: 6500, availableTemperatures: HOT_AND_ICE },
  { name: '제주말차 카페라떼', price: 6900, availableTemperatures: HOT_AND_ICE },
  { name: '커피큐브 WITH 룽고', price: 6800, availableTemperatures: ICE_ONLY },
  { name: '커피큐브 WITH 카페라떼', price: 7400, availableTemperatures: ICE_ONLY },
  // 디카페인
  { name: '디카페인 아이스크림 카페라떼', price: 8000, availableTemperatures: ICE_ONLY },
  { name: '디카페인 아메리카노', price: 5200, availableTemperatures: HOT_AND_ICE },
  { name: '디카페인 카페라떼', price: 6400, availableTemperatures: HOT_AND_ICE },
  { name: '디카페인 락토프리 카페라떼', price: 6400, availableTemperatures: HOT_AND_ICE },
  { name: '디카페인 카페오트', price: 6400, availableTemperatures: HOT_AND_ICE },
  { name: '디카페인 카푸치노', price: 6400, availableTemperatures: HOT_AND_ICE },
  { name: '디카페인 플랫화이트', price: 6400, availableTemperatures: HOT_AND_ICE },
  { name: '디카페인 스페니쉬 카페라떼', price: 7000, availableTemperatures: HOT_AND_ICE },
  { name: '디카페인 바닐라빈 카페라떼', price: 7000, availableTemperatures: HOT_AND_ICE },
  { name: '디카페인 시나몬 카페라떼', price: 7000, availableTemperatures: HOT_AND_ICE },
  { name: '디카페인 카라멜 마키아토', price: 7000, availableTemperatures: HOT_AND_ICE },
  // 음료
  { name: '멜론 라임 에이드', price: 6900, availableTemperatures: ICE_ONLY },
  { name: '제주 말차 라떼', price: 6300, availableTemperatures: HOT_AND_ICE },
  { name: '제주말차 아이스크림 라떼', price: 7900, availableTemperatures: ICE_ONLY },
  { name: '납작복숭아 에이드', price: 6900, availableTemperatures: ICE_ONLY },
  { name: '밀크 초콜릿', price: 6300, availableTemperatures: HOT_AND_ICE },
  { name: '제주 한라봉티', price: 5900, availableTemperatures: HOT_AND_ICE },
  // 신 메뉴
  { name: '초콜릿 아이스크림 라떼', price: 7800, availableTemperatures: ICE_ONLY },
  { name: '코코넛 판단 카페 라떼', price: 7100, availableTemperatures: HOT_AND_ICE },
  { name: '코코넛 말차 라떼', price: 6800, availableTemperatures: HOT_AND_ICE },
  { name: '콜드브루 푸룻프룻', price: 6000, availableTemperatures: ICE_ONLY },
  { name: '콜드브루 라떼 푸룻프룻', price: 7000, availableTemperatures: ICE_ONLY },
  { name: '체리블라썸 아이스크림 카페라떼', price: 7900, availableTemperatures: ICE_ONLY },
  { name: '체리블라썸 카페라떼', price: 6900, availableTemperatures: HOT_AND_ICE },
  { name: '체리블라썸 말차라떼', price: 6800, availableTemperatures: HOT_AND_ICE },
  { name: '체리블라썸 아이스크림(컵)', price: 4800, availableTemperatures: ICE_ONLY },
  { name: '체리블라썸 요거트 프라페', price: 7200, availableTemperatures: ICE_ONLY },
  { name: '딥 초콜릿 라떼', price: 6900, availableTemperatures: ICE_ONLY },
  { name: '고창 고구마 라떼', price: 6500, availableTemperatures: ICE_ONLY },
  { name: '고창 땅콩 카페라떼', price: 7200, availableTemperatures: ICE_ONLY },
  { name: '고창 복분자 에이드', price: 6900, availableTemperatures: ICE_ONLY },
]

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString(36)
    .slice(-4)}`
}

function normalizeInitialAttendeeNames(names: string[]) {
  const deduped = new Set<string>()
  const normalizedNames: string[] = []

  for (const rawName of names) {
    const trimmed = rawName.trim().replace(/\s+/g, ' ')

    if (!trimmed) {
      continue
    }

    const dedupeKey = trimmed.normalize('NFKC').toLocaleLowerCase('ko-KR')

    if (deduped.has(dedupeKey)) {
      continue
    }

    deduped.add(dedupeKey)
    normalizedNames.push(trimmed)
  }

  return normalizedNames
}

function createDraftAttendee(name: string): Attendee {
  return {
    id: createId('attendee'),
    name,
    team: '',
    menuItemId: '',
    skipped: false,
    quantity: 1,
    temperature: '',
    decaf: false,
    size: '',
    note: '',
  }
}

function formatDateTimeInput(date: Date) {
  const rounded = new Date(date)
  rounded.setMinutes(Math.ceil(rounded.getMinutes() / 10) * 10, 0, 0)

  const timezoneOffset = rounded.getTimezoneOffset() * 60_000
  return new Date(rounded.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function pickText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function pickNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function sortTemperatures(temperatures: TemperatureOption[]) {
  return TEMPERATURE_ORDER.filter((temperature) =>
    temperatures.includes(temperature),
  )
}

function normalizeTemperatureList(
  value: unknown,
  fallback: TemperatureOption[] = HOT_AND_ICE,
) {
  const temperatures = Array.isArray(value)
    ? sortTemperatures(
        [...new Set(value)].filter(
          (item): item is TemperatureOption => item === 'HOT' || item === 'ICE',
        ),
      )
    : []

  if (temperatures.length === 0) {
    return [...fallback]
  }

  return [...temperatures]
}

function getMenuDedupeKey(name: string, price: number) {
  return `${name.trim().toLowerCase()}::${Math.round(price)}`
}

function normalizeNutritionInfo(value: unknown, menuName: string) {
  if (value && typeof value === 'object') {
    const source = value as Partial<NutritionInfo>
    const basis =
      source.basis === 'mapped' ||
      source.basis === 'estimated' ||
      source.basis === 'official'
        ? source.basis
        : 'official'
    const referenceName = pickText(source.referenceName).trim()

    return {
      caloriesKcal: pickNumber(source.caloriesKcal),
      sugarG: pickNumber(source.sugarG),
      proteinG: pickNumber(source.proteinG),
      sodiumMg: pickNumber(source.sodiumMg),
      saturatedFatG: pickNumber(source.saturatedFatG),
      caffeineMg: pickNumber(source.caffeineMg),
      basis,
      sourceLabel: pickText(source.sourceLabel, '등록 영양정보'),
      referenceName: referenceName || undefined,
    }
  }

  return findNutritionInfo(menuName)
}

function createPresetMenuItem(item: PresetMenuItem): MenuItem {
  return {
    id: createId('menu'),
    name: item.name,
    price: item.price,
    availableTemperatures: [...item.availableTemperatures],
    nutritionInfo: normalizeNutritionInfo(item.nutritionInfo, item.name),
    source: 'manual',
  }
}

function createMenuItemFromSeed(item: CreateMenuSeed): MenuItem {
  return {
    id: createId('menu'),
    name: item.name,
    price: item.price,
    availableTemperatures: normalizeTemperatureList(item.availableTemperatures),
    nutritionInfo: normalizeNutritionInfo(item.nutritionInfo, item.name),
    source: 'manual',
  }
}

export function createLatelierMenuItems() {
  return LATELIER_MENU_PRESET.map(createPresetMenuItem)
}

export function createPaulBassettMenuItems() {
  return PAUL_BASSETT_MENU_PRESET.map(createPresetMenuItem)
}

export function createStarbucksMenuItems() {
  return STARBUCKS_MENU_PRESET.map(createPresetMenuItem)
}

function resolveCafePresetName(cafeName?: string): CafePresetName {
  if (cafeName === STARBUCKS_CAFE_NAME) {
    return STARBUCKS_CAFE_NAME
  }

  if (cafeName === PAUL_BASSETT_CAFE_NAME) {
    return PAUL_BASSETT_CAFE_NAME
  }

  return LATELIER_CAFE_NAME
}

function createInitialMenuItems(
  cafeName: CafePresetName,
  menuSeeds: CreateMenuSeed[] = [],
) {
  if (menuSeeds.length > 0) {
    return menuSeeds.map(createMenuItemFromSeed)
  }

  if (cafeName === LATELIER_CAFE_NAME) {
    return createLatelierMenuItems()
  }

  if (cafeName === PAUL_BASSETT_CAFE_NAME) {
    return createPaulBassettMenuItems()
  }

  if (cafeName === STARBUCKS_CAFE_NAME) {
    return createStarbucksMenuItems()
  }

  return []
}

export function inferTemperaturesFromMenuName(name: string): TemperatureOption[] {
  void name
  return [...HOT_AND_ICE]
}

export function isCoffeeMenuName(name: string) {
  const normalized = name.normalize('NFKC').replace(/\s+/g, '').toLowerCase()
  const hasCoffeeKeyword = COFFEE_KEYWORDS.some((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  )
  const hasNonCoffeeKeyword = NON_COFFEE_KEYWORDS.some((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  )

  return hasCoffeeKeyword && !hasNonCoffeeKeyword
}

export function getMenuDisplayPrice(menuItem: MenuItem, decaf: boolean) {
  return menuItem.price + (decaf && isCoffeeMenuName(menuItem.name) ? DECAF_SURCHARGE : 0)
}

export function resolveTemperatureSelection(
  currentValue: '' | TemperatureOption,
  menuItem?: MenuItem,
) {
  if (!menuItem) {
    return currentValue === 'HOT' || currentValue === 'ICE' ? currentValue : ''
  }

  if (currentValue && menuItem.availableTemperatures.includes(currentValue)) {
    return currentValue
  }

  if (menuItem.availableTemperatures.length === 1) {
    return menuItem.availableTemperatures[0]
  }

  return ''
}

function normalizeMenuItem(item: Partial<MenuItem>): MenuItem {
  const name = pickText(item.name)
  const fallbackTemperatures = name
    ? inferTemperaturesFromMenuName(name)
    : HOT_AND_ICE

  return {
    id: pickText(item.id, createId('menu')),
    name,
    price: pickNumber(item.price),
    availableTemperatures: normalizeTemperatureList(
      item.availableTemperatures,
      fallbackTemperatures,
    ),
    nutritionInfo: normalizeNutritionInfo(item.nutritionInfo, name),
    source: item.source === 'ocr' ? 'ocr' : 'manual',
  }
}

function normalizeAttendee(
  attendee: Partial<Attendee>,
  menuLookup: Map<string, MenuItem>,
): Attendee {
  const menuItemId = pickText(attendee.menuItemId)
  const menuItem = menuLookup.get(menuItemId)
  const rawTemperature =
    attendee.temperature === 'HOT' || attendee.temperature === 'ICE'
      ? attendee.temperature
      : ''

  return {
    id: pickText(attendee.id, createId('attendee')),
    name: pickText(attendee.name),
    team: pickText(attendee.team),
    menuItemId,
    skipped: Boolean(attendee.skipped),
    quantity: Math.max(1, pickNumber(attendee.quantity, 1)),
    temperature: resolveTemperatureSelection(rawTemperature, menuItem),
    decaf: Boolean(attendee.decaf) && Boolean(menuItem && isCoffeeMenuName(menuItem.name)),
    size: '',
    note: pickText(attendee.note),
  }
}

export function buildDefaultSnapshot(
  options: BuildDefaultSnapshotOptions = {},
): Snapshot {
  const deadline = new Date()
  deadline.setHours(deadline.getHours() + 1)
  const now = new Date().toISOString()
  const attendeeNames = normalizeInitialAttendeeNames(options.attendeeNames ?? [])
  const title = options.title?.trim() || 'SK에코플랜트 미팅 커피'
  const cafeName = resolveCafePresetName(options.cafeName)
  const menuSeeds = options.menuSeeds ?? []

  return {
    meeting: {
      title,
      cafeName,
      place: '',
      organizer: '',
      deadline: formatDateTimeInput(deadline),
      notes: '',
      shareCode: `EK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      manuallyClosed: false,
    },
    menuItems: createInitialMenuItems(cafeName, menuSeeds),
    attendees: attendeeNames.map(createDraftAttendee),
    rawOcrText: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function normalizeSnapshot(snapshot: Partial<Snapshot>): Snapshot {
  const fallback = buildDefaultSnapshot()
  const menuItems = Array.isArray(snapshot.menuItems)
    ? snapshot.menuItems.map((item) => normalizeMenuItem(item))
    : []
  const menuLookup = new Map(menuItems.map((item) => [item.id, item]))

  return {
    meeting: {
      ...fallback.meeting,
      ...(snapshot.meeting ?? {}),
      title: pickText(snapshot.meeting?.title, fallback.meeting.title),
      cafeName: pickText(snapshot.meeting?.cafeName),
      place: pickText(snapshot.meeting?.place),
      organizer: pickText(snapshot.meeting?.organizer),
      deadline: pickText(snapshot.meeting?.deadline, fallback.meeting.deadline),
      notes: pickText(snapshot.meeting?.notes),
      shareCode: pickText(snapshot.meeting?.shareCode, fallback.meeting.shareCode),
      manuallyClosed: Boolean(snapshot.meeting?.manuallyClosed),
    },
    menuItems,
    attendees: Array.isArray(snapshot.attendees)
      ? snapshot.attendees.map((attendee) => normalizeAttendee(attendee, menuLookup))
      : [],
    rawOcrText: pickText(snapshot.rawOcrText),
    createdAt: pickText(snapshot.createdAt, fallback.createdAt),
    updatedAt: pickText(snapshot.updatedAt, fallback.updatedAt),
  }
}

export function loadSnapshot(): Snapshot {
  const fallback = buildDefaultSnapshot()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return fallback
    }

    return normalizeSnapshot(JSON.parse(raw) as Partial<Snapshot>)
  } catch {
    return fallback
  }
}

function mergeTemperatureOptions(
  currentValue: TemperatureOption[],
  nextValue: TemperatureOption[],
) {
  return sortTemperatures([...new Set([...currentValue, ...nextValue])])
}

export function mergeMenuItems(currentItems: MenuItem[], nextItems: MenuItem[]) {
  const merged = currentItems.map((item) => normalizeMenuItem(item))
  const indexByKey = new Map(
    merged.map((item, index) => [getMenuDedupeKey(item.name, item.price), index]),
  )

  for (const nextItem of nextItems) {
    const normalizedNextItem = normalizeMenuItem(nextItem)
    const dedupeKey = getMenuDedupeKey(
      normalizedNextItem.name,
      normalizedNextItem.price,
    )
    const existingIndex = indexByKey.get(dedupeKey)

    if (typeof existingIndex === 'number') {
      const existing = merged[existingIndex]
      merged[existingIndex] = {
        ...existing,
        availableTemperatures: mergeTemperatureOptions(
          existing.availableTemperatures,
          normalizedNextItem.availableTemperatures,
        ),
        nutritionInfo:
          existing.nutritionInfo ?? normalizedNextItem.nutritionInfo ?? null,
        source: existing.source === 'manual' ? 'manual' : normalizedNextItem.source,
      }
      continue
    }

    indexByKey.set(dedupeKey, merged.length)
    merged.push(normalizedNextItem)
  }

  return merged
}

export function formatDeadlineLabel(deadline: string) {
  if (!deadline) {
    return '마감시간을 설정해주세요.'
  }

  const date = new Date(deadline)

  if (Number.isNaN(date.getTime())) {
    return '시간 형식을 다시 확인해주세요.'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function formatCountdown(deadline: string) {
  if (!deadline) {
    return '마감시간 미설정'
  }

  const diff = new Date(deadline).getTime() - Date.now()

  if (Number.isNaN(diff)) {
    return '시간 형식 확인 필요'
  }

  if (diff <= 0) {
    return '마감됨'
  }

  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.ceil((diff % 3_600_000) / 60_000)

  if (hours <= 0) {
    return `${minutes}분 남음`
  }

  return `${hours}시간 ${minutes}분 남음`
}
