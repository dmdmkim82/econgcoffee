import express from 'express'
import { rateLimit } from 'express-rate-limit'
import type { Snapshot } from '../../../shared/meeting'
import {
  listMeetings,
  readStore,
  removeMeeting,
  upsertMeeting,
  writeStore,
} from './store'
import { fetchStarbucksDrinkCatalog } from './starbucks'

const app = express()
const port = Number(process.env.PORT || 8787)

// Rate limiting: 일반 읽기 — IP당 1분에 120회
const readLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})

// Rate limiting: 쓰기(PUT/DELETE) — IP당 1분에 30회
const writeLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})
const allowedOrigins = (process.env.CORS_ORIGIN ??
  'http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173').split(',')

app.use(express.json({ limit: '10mb' }))
app.use((request, response, next) => {
  const origin = request.headers.origin

  if (origin && allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin)
  }

  response.setHeader('Vary', 'Origin')
  response.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization',
  )
  response.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  )

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  next()
})

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, date: new Date().toISOString() })
})

app.get('/api/catalogs/starbucks/drinks', async (_request, response, next) => {
  try {
    const catalog = await fetchStarbucksDrinkCatalog()
    response.json(catalog)
  } catch (error) {
    next(error)
  }
})

app.get('/api/meetings', readLimiter, async (_request, response, next) => {
  try {
    const store = await readStore()
    response.json({ meetings: listMeetings(store) })
  } catch (error) {
    next(error)
  }
})

app.get<{ shareCode: string }>('/api/meetings/:shareCode', readLimiter, async (request, response, next) => {
  try {
    const store = await readStore()
    const shareCode = request.params.shareCode.toUpperCase()
    const meeting = store[shareCode]

    if (!meeting) {
      response.status(404).json({ message: 'Meeting not found' })
      return
    }

    response.json({ meeting })
  } catch (error) {
    next(error)
  }
})

app.put<{ shareCode: string }>('/api/meetings/:shareCode', writeLimiter, async (request, response, next) => {
  try {
    const shareCode = request.params.shareCode.toUpperCase()
    const meeting = request.body?.meeting as Snapshot | undefined

    if (!meeting || !meeting.meeting?.shareCode) {
      response.status(400).json({ message: 'Meeting payload is required' })
      return
    }

    if (meeting.meeting.shareCode.toUpperCase() !== shareCode) {
      response.status(400).json({ message: 'Share code mismatch' })
      return
    }

    const store = await readStore()
    const nextStore = upsertMeeting(store, meeting)
    await writeStore(nextStore)

    response.json({ meeting: nextStore[shareCode] })
  } catch (error) {
    next(error)
  }
})

app.delete<{ shareCode: string }>('/api/meetings/:shareCode', writeLimiter, async (request, response, next) => {
  try {
    const shareCode = request.params.shareCode.toUpperCase()
    const store = await readStore()

    if (!store[shareCode]) {
      response.status(404).json({ message: 'Meeting not found' })
      return
    }

    await writeStore(removeMeeting(store, shareCode))
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    void next
    const message =
      error instanceof Error ? error.message : 'Unknown server error'
    response.status(500).json({ message })
  },
)

app.listen(port, () => {
  console.log(`Ekong Coffee server listening on http://127.0.0.1:${port}`)
})
