export interface Unit {
  id: string
  name: string
  abbreviation: string
  isSystem: boolean
}

export interface UnitPayload {
  name: string
  abbreviation: string
}
