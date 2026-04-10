export type TemperatureOption = 'HOT' | 'ICE'

export type NutritionBasis = 'official' | 'mapped' | 'estimated'

export type NutritionInfo = {
  caloriesKcal: number
  sugarG: number
  proteinG: number
  sodiumMg: number
  saturatedFatG: number
  caffeineMg: number
  basis?: NutritionBasis
  sourceLabel?: string
  referenceName?: string
}

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
  availableTemperatures: TemperatureOption[]
  nutritionInfo: NutritionInfo | null
  source: 'ocr' | 'manual'
}

export type Attendee = {
  id: string
  name: string
  team: string
  menuItemId: string
  skipped: boolean
  quantity: number
  temperature: '' | TemperatureOption
  decaf: boolean
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
