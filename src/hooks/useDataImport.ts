import { useCallback } from 'react'
import { useAppData } from '../context/AppProvider'
import { parseCSVFile } from '../utils/csv'
import { ImportResult } from '../types'

export const useDataImport = () => {
  const { data, updateData } = useAppData()
  
  const importCSV = useCallback(async (
    file: File,
    mode: 'replace' | 'merge' = 'merge'
  ): Promise<ImportResult> => {
    try {
      const result = await parseCSVFile(file)
      
      if (result.errors.length > 0) {
        return {
          success: false,
          errors: result.errors.slice(0, 5)
        }
      }
      
      if (result.data.length === 0) {
        return { 
          success: false, 
          errors: ['No valid data found in CSV file'] 
        }
      }
      
      const newEntries = mode === 'replace' 
        ? result.data 
        : [...data.entries, ...result.data]
      
      updateData({ entries: newEntries })
      
      return { 
        success: true, 
        count: result.data.length,
        data: result.data
      }
    } catch (error) {
      return { 
        success: false, 
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      }
    }
  }, [data, updateData])
  
  return { importCSV }
} 