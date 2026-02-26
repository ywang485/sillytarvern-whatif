// Server-side PDF text extraction using pdf-parse
// This module must only be imported in Node.js server contexts (API routes, pipeline)

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Use require to avoid ESM/CJS interop issues with pdf-parse
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
  const result = await pdfParse(buffer)
  return result.text
}

export function truncateText(text: string, maxChars = 80000): string {
  if (text.length <= maxChars) return text
  // Try to truncate at a sentence boundary
  const truncated = text.slice(0, maxChars)
  const lastPeriod = truncated.lastIndexOf('.')
  if (lastPeriod > maxChars * 0.9) {
    return truncated.slice(0, lastPeriod + 1)
  }
  return truncated
}
