export type FieldEntityType = 'product' | 'customer' | 'supplier'
export type FieldType = 'text' | 'number' | 'boolean' | 'date' | 'select'

export interface FieldDefinition {
  id: string
  entityType: FieldEntityType
  fieldKey: string
  label: string
  fieldType: FieldType
  options: string[] | null
  isRequired: boolean
  sortOrder: number
}

export interface FieldDefinitionPayload {
  entityType: FieldEntityType
  fieldKey: string
  label: string
  fieldType: FieldType
  options?: string[]
  isRequired?: boolean
  sortOrder?: number
}
