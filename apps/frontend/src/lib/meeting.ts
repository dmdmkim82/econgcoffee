import type {
  Attendee,
  MeetingSettings,
  MenuItem,
  Snapshot,
} from '../../../../shared/meeting'

export type { Attendee, MeetingSettings, MenuItem, Snapshot }

export const STORAGE_KEY = 'ekong-coffee-state-v1'

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString(36)
    .slice(-4)}`
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

export function buildDefaultSnapshot(): Snapshot {
  const deadline = new Date()
  deadline.setHours(deadline.getHours() + 1)
  const now = new Date().toISOString()

  return {
    meeting: {
      title: 'SK에코플랜트 미팅 커피',
      cafeName: '',
      place: '',
      organizer: '',
      deadline: formatDateTimeInput(deadline),
      notes: '',
      shareCode: `EK-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      manuallyClosed: false,
    },
    menuItems: [],
    attendees: [],
    rawOcrText: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function loadSnapshot(): Snapshot {
  const fallback = buildDefaultSnapshot()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as Partial<Snapshot>

    return {
      meeting: {
        ...fallback.meeting,
        ...(parsed.meeting ?? {}),
        title: pickText(parsed.meeting?.title, fallback.meeting.title),
        cafeName: pickText(parsed.meeting?.cafeName),
        place: pickText(parsed.meeting?.place),
        organizer: pickText(parsed.meeting?.organizer),
        deadline: pickText(parsed.meeting?.deadline, fallback.meeting.deadline),
        notes: pickText(parsed.meeting?.notes),
        shareCode: pickText(parsed.meeting?.shareCode, fallback.meeting.shareCode),
        manuallyClosed: Boolean(parsed.meeting?.manuallyClosed),
      },
      menuItems: Array.isArray(parsed.menuItems)
        ? parsed.menuItems.map((item): MenuItem => ({
            id: pickText(item.id, createId('menu')),
            name: pickText(item.name),
            price: pickNumber(item.price),
            source: item.source === 'ocr' ? 'ocr' : 'manual',
          }))
        : [],
      attendees: Array.isArray(parsed.attendees)
        ? parsed.attendees.map((attendee): Attendee => ({
            id: pickText(attendee.id, createId('attendee')),
            name: pickText(attendee.name),
            team: pickText(attendee.team),
            menuItemId: pickText(attendee.menuItemId),
            skipped: Boolean(attendee.skipped),
            quantity: Math.max(1, pickNumber(attendee.quantity, 1)),
            temperature:
              attendee.temperature === 'ICE' || attendee.temperature === 'HOT'
                ? attendee.temperature
                : '',
            size:
              attendee.size === 'Regular' || attendee.size === 'Large'
                ? attendee.size
                : '',
            note: pickText(attendee.note),
          }))
        : [],
      rawOcrText: pickText(parsed.rawOcrText),
      createdAt: pickText(parsed.createdAt, fallback.createdAt),
      updatedAt: pickText(parsed.updatedAt, fallback.updatedAt),
    }
  } catch {
    return fallback
  }
}

export function mergeMenuItems(currentItems: MenuItem[], nextItems: MenuItem[]) {
  const seen = new Set(
    currentItems.map(
      (item) => `${item.name.trim().toLowerCase()}::${Math.round(item.price)}`,
    ),
  )
  const merged = [...currentItems]

  for (const item of nextItems) {
    const dedupeKey = `${item.name.trim().toLowerCase()}::${Math.round(item.price)}`

    if (seen.has(dedupeKey)) {
      continue
    }

    seen.add(dedupeKey)
    merged.push(item)
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
