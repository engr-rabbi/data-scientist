/**
 * Secure upload validation:
 * - Allowed extensions: CSV, XLSX, XLS, PDF, ZIP, DOCX, PNG, JPG, JPEG, WEBP
 * - Max size: 5 MB per file
 * - Rejects executables and anything not explicitly allowed
 */

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB (keeps Google Apps Script requests small and reliable)

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  csv: ['text/csv', 'application/vnd.ms-excel', 'text/plain', 'application/csv'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'],
  xls: ['application/vnd.ms-excel', 'application/octet-stream'],
  pdf: ['application/pdf'],
  zip: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  webp: ['image/webp'],
}

export function validateUploadFile(file: File): string | null {
  if (file.size === 0) return `File "${file.name}" is empty.`
  if (file.size > MAX_FILE_SIZE) {
    return `File "${file.name}" exceeds the 5 MB size limit.`
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ext || !(ext in ALLOWED_EXTENSIONS)) {
    return `File type ".${ext || 'unknown'}" is not allowed. Allowed: CSV, XLSX, XLS, PDF, ZIP, DOCX, PNG, JPG, JPEG, WEBP.`
  }
  const mime = file.type || 'application/octet-stream'
  const allowedMimes = ALLOWED_EXTENSIONS[ext]
  // Some browsers/OS send empty or generic octet-stream; block only clear mismatches.
  if (mime && mime !== 'application/octet-stream' && !allowedMimes.includes(mime)) {
    return `File "${file.name}" has an unexpected content type (${mime}).`
  }
  // Defense in depth: block obvious executables by double extension
  if (/\.(exe|sh|bat|cmd|js|jar|dll|msi|com|scr|php|py)$/i.test(file.name.replace(/\.[a-z0-9]+$/i, ''))) {
    return `File "${file.name}" is not allowed.`
  }
  return null
}
