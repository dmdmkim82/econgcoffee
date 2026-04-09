import { type Snapshot } from './meeting'

type MeetingsResponse = {
  meetings: Snapshot[]
}

type MeetingResponse = {
  meeting: Snapshot
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function withApiBase(path: string) {
  return `${API_BASE_URL}${path}`
}

async function request<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function fetchMeetingsFromApi() {
  const payload = await request<MeetingsResponse>(withApiBase('/api/meetings'))
  return payload.meetings
}

export async function fetchMeetingFromApi(shareCode: string) {
  const payload = await request<MeetingResponse>(
    withApiBase(`/api/meetings/${shareCode.toUpperCase()}`),
  )
  return payload.meeting
}

export async function saveMeetingToApi(snapshot: Snapshot) {
  const payload = await request<MeetingResponse>(
    withApiBase(`/api/meetings/${snapshot.meeting.shareCode.toUpperCase()}`),
    {
      method: 'PUT',
      body: JSON.stringify({ meeting: snapshot }),
    },
  )

  return payload.meeting
}

export async function deleteMeetingFromApi(shareCode: string) {
  await request<void>(withApiBase(`/api/meetings/${shareCode.toUpperCase()}`), {
    method: 'DELETE',
  })
}
