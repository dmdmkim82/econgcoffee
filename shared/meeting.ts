export type MeetingSettings = {
  title: string
  cafeName: string
  place: string
  organizer: string
  deadline: string
  notes: string
  shareCode: string
  manuallyClosed: boolean
}

export type MenuItem = {
  id: string
  name: string
  price: number
  source: 'ocr' | 'manual'
}

export type Attendee = {
  id: string
  name: string
  team: string
  menuItemId: string
  skipped: boolean
  quantity: number
  temperature: '' | 'ICE' | 'HOT'
  size: '' | 'Regular' | 'Large'
  note: string
}

export type Snapshot = {
  meeting: MeetingSettings
  menuItems: MenuItem[]
  attendees: Attendee[]
  rawOcrText: string
  createdAt: string
  updatedAt: string
}
