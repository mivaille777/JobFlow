export interface ExcelImportDuplicate {
  rowNumber: number
  companyName: string
  jobTitle: string
  jobId: string | null
}

export interface ExcelImportPreview {
  sessionId: string
  fileName: string
  totalRows: number
  importableRows: number
  duplicateRows: number
  duplicates: ExcelImportDuplicate[]
}

export interface ExcelImportResult {
  imported: number
  skippedDuplicates: number
}

export interface FileOperationResult {
  filePath: string
  fileName: string
}

export interface BackupRestoreResult {
  companies: number
  applications: number
  events: number
  interviews: number
  settings: number
}
