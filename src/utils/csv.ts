import Papa from 'papaparse'
import { InvestmentEntry } from '../types'

export interface ParseResult {
  data: InvestmentEntry[]
  errors: string[]
}

export const parseCSVFile = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        const data: InvestmentEntry[] = []

        results.data.forEach((row: any, index: number) => {
          try {
            // Validate required fields
            if (!row.Date || !row.Investment || !row.Amount || row.Rate === undefined) {
              errors.push(`Line ${index + 2}: Missing required fields`)
              return
            }

            // Parse numbers
            const amount = parseFloat(row.Amount)
            const rate = parseFloat(row.Rate)

            if (isNaN(amount)) {
              errors.push(`Line ${index + 2}: Invalid amount "${row.Amount}"`)
              return
            }

            if (isNaN(rate)) {
              errors.push(`Line ${index + 2}: Invalid rate "${row.Rate}"`)
              return
            }

            // Validate date format
            const date = row.Date.trim()
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
              errors.push(`Line ${index + 2}: Invalid date format "${date}". Expected YYYY-MM-DD`)
              return
            }

            data.push({
              date,
              investment: row.Investment.trim(),
              amount,
              rate
            })
          } catch (error) {
            errors.push(`Line ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        })

        resolve({ data, errors })
      },
      error: (error) => {
        resolve({ 
          data: [], 
          errors: [`Parse error: ${error.message}`] 
        })
      }
    })
  })
}

export const parseCSVString = (csvString: string): ParseResult => {
  const errors: string[] = []
  const data: InvestmentEntry[] = []

  try {
    const lines = csvString.trim().split('\n')
    
    if (lines.length < 2) {
      return { data: [], errors: ['CSV must have header and at least one data row'] }
    }

    const headers = lines[0].split(',').map(h => h.trim())
    
    // Validate headers
    const expectedHeaders = ['Date', 'Investment', 'Amount', 'Rate']
    if (!expectedHeaders.every(header => headers.includes(header))) {
      return { 
        data: [], 
        errors: [`Invalid headers. Expected: ${expectedHeaders.join(', ')}. Got: ${headers.join(', ')}`] 
      }
    }

    // Find column indices
    const dateIndex = headers.indexOf('Date')
    const investmentIndex = headers.indexOf('Investment')
    const amountIndex = headers.indexOf('Amount')
    const rateIndex = headers.indexOf('Rate')

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const columns = line.split(',').map(col => col.trim())

      if (columns.length !== headers.length) {
        errors.push(`Line ${i + 1}: Expected ${headers.length} columns, got ${columns.length}`)
        continue
      }

      try {
        const date = columns[dateIndex]
        const investment = columns[investmentIndex]
        const amountStr = columns[amountIndex]
        const rateStr = columns[rateIndex]

        // Validate required fields
        if (!date || !investment || !amountStr || rateStr === undefined) {
          errors.push(`Line ${i + 1}: Missing required fields`)
          continue
        }

        // Parse numbers
        const amount = parseFloat(amountStr)
        const rate = parseFloat(rateStr)

        if (isNaN(amount)) {
          errors.push(`Line ${i + 1}: Invalid amount "${amountStr}"`)
          continue
        }

        if (isNaN(rate)) {
          errors.push(`Line ${i + 1}: Invalid rate "${rateStr}"`)
          continue
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          errors.push(`Line ${i + 1}: Invalid date format "${date}". Expected YYYY-MM-DD`)
          continue
        }

        data.push({
          date,
          investment,
          amount,
          rate
        })
      } catch (error) {
        errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  } catch (error) {
    errors.push(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return { data, errors }
}

export const exportToCSV = (entries: InvestmentEntry[]): string => {
  const headers = ['Date', 'Investment', 'Amount', 'Rate']
  const rows = entries.map(entry => [
    entry.date,
    entry.investment,
    entry.amount.toString(),
    entry.rate.toString()
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export const downloadCSV = (csvContent: string, filename: string = 'investments.csv'): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const loadCSVFromFile = async (csvPath: string): Promise<ParseResult> => {
  try {
    const response = await fetch(csvPath)
    
    if (!response.ok) {
      return {
        data: [],
        errors: [`Failed to load CSV file: ${response.statusText}`]
      }
    }
    
    const csvString = await response.text()
    return parseCSVString(csvString)
  } catch (error) {
    return {
      data: [],
      errors: [`Error loading CSV: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
} 