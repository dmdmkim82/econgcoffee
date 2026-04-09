import {
  STORAGE_KEY,
  type Snapshot,
  buildDefaultSnapshot,
  loadSnapshot,
  normalizeSnapshot,
} from './meeting'

export const MEETINGS_STORAGE_KEY = 'ekong-coffee-meetings-v1'

export type MeetingsStore = Record<string, Snapshot>

function hasLegacyContent(snapshot: Snapshot) {
  return Boolean(
    snapshot.meeting.cafeName ||
      snapshot.meeting.organizer ||
      snapshot.menuItems.length > 0 ||
      snapshot.attendees.length > 0 ||
      snapshot.rawOcrText.trim(),
  )
}

export function loadMeetingsStore(): MeetingsStore {
  try {
    const raw = window.localStorage.getItem(MEETINGS_STORAGE_KEY)

    if (raw) {
      const parsed = JSON.parse(raw) as MeetingsStore

      return Object.fromEntries(
        Object.entries(parsed).map(([code, snapshot]) => [
          code,
          normalizeSnapshot(snapshot),
        ]),
      )
    }
  } catch {
    return {}
  }

  try {
    const hasLegacy = window.localStorage.getItem(STORAGE_KEY)

    if (!hasLegacy) {
      return {}
    }

    const legacy = loadSnapshot()

    if (!hasLegacyContent(legacy)) {
      return {}
    }

    const migrated = {
      [legacy.meeting.shareCode]: normalizeSnapshot(legacy),
    }

    window.localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(migrated))

    return migrated
  } catch {
    return {}
  }
}

export function saveMeetingsStore(store: MeetingsStore) {
  window.localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(store))
}

export function createMeetingSnapshot() {
  return buildDefaultSnapshot()
}

export function createMeetingsStore(meetings: Snapshot[]): MeetingsStore {
  return Object.fromEntries(
    meetings.map((snapshot) => [snapshot.meeting.shareCode, normalizeSnapshot(snapshot)]),
  )
}

export function upsertMeeting(
  store: MeetingsStore,
  snapshot: Snapshot,
): MeetingsStore {
  const normalized = normalizeSnapshot({
    ...snapshot,
    updatedAt: new Date().toISOString(),
  })

  return {
    ...store,
    [normalized.meeting.shareCode]: normalized,
  }
}

export function removeMeeting(
  store: MeetingsStore,
  shareCode: string,
): MeetingsStore {
  const nextStore = { ...store }
  delete nextStore[shareCode]
  return nextStore
}

export function listMeetings(store: MeetingsStore) {
  return Object.values(store).sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )
}
