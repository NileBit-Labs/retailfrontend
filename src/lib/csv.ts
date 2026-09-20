// A small RFC 4180-style parser: quoted fields, escaped quotes, commas and
// newlines inside quotes. Enough for a spreadsheet exported as CSV.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  const clean = text.replace(/^﻿/, '')

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i]

    if (quoted) {
      if (c === '"' && clean[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        quoted = false
      } else {
        field += c
      }
    } else if (c === '"') {
      quoted = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && clean[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }

  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

// Quotes a cell only when it has to be, so the file opens cleanly in Excel and Sheets.
function cell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(cell).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  // The BOM makes Excel read UTF-8 (names with accents) correctly.
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
