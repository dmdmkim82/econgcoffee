import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Snapshot } from '../../../shared/meeting'

export type MeetingsStore = Record<string, Snapshot>

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, '../data')
const DATA_FILE = path.join(DATA_DIR, 'meetings.json')

let writeQueue = Promise.resolve()

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true })

  try {
    await readFile(DATA_FILE, 'utf8')
  } catch {
    await writeFile(DATA_FILE, '{}', 'utf8')
  }
}

function normalizeSnapshot(snapshot: Snapshot): Snapshot {
  const now = new Date().toISOString()

  return {
    ...snapshot,
    meeting: {
      ...snapshot.meeting,
      shareCode: snapshot.meeting.shareCode.toUpperCase(),
    },
    createdAt: snapshot.createdAt || now,
    updatedAt: snapshot.updatedAt || now,
  }
}

export async function readStore() {
  await ensureStoreFile()
  const raw = await readFile(DATA_FILE, 'utf8')
  const parsed = JSON.parse(raw) as MeetingsStore

  return Object.fromEntries(
    Object.entries(parsed).map(([shareCode, snapshot]) => [
      shareCode.toUpperCase(),
      normalizeSnapshot(snapshot),
    ]),
  )
}

export async function writeStore(store: MeetingsStore) {
  await ensureStoreFile()

  writeQueue = writeQueue.then(async () => {
    await writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf8')
  })

  await writeQueue
}

export function listMeetings(store: MeetingsStore) {
  return Object.values(store).sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )
}

export function upsertMeeting(store: MeetingsStore, snapshot: Snapshot) {
  const normalized = normalizeSnapshot({
    ...snapshot,
    updatedAt: new Date().toISOString(),
  })

  return {
    ...store,
    [normalized.meeting.shareCode]: normalized,
  }
}

export function removeMeeting(store: MeetingsStore, shareCode: string) {
  const nextStore = { ...store }
  delete nextStore[shareCode.toUpperCase()]
  return nextStore
}
