// Minimal Color Palette for Investment Assets
// Terminal-inspired color palette - muted but distinct
const ASSET_COLORS = [
  '#10b981', // emerald-500 - green (growth/positive)
  '#f59e0b', // amber-500 - amber (active/energy) 
  '#0ea5e9', // sky-500 - bright blue (distinct from purple)
  '#ef4444', // red-500 - red (volatility/risk)
  '#8b5cf6', // violet-500 - violet (innovation)
  '#06b6d4', // cyan-500 - cyan (liquidity)
  '#84cc16', // lime-500 - lime (growth alternative)
  '#f97316', // orange-500 - orange (warmth/energy)
  '#ec4899', // pink-500 - pink (distinctive)
  '#64748b', // slate-500 - slate (conservative/stable)
  '#059669', // emerald-600 - darker green
  '#dc2626', // red-600 - darker red
] as const

// Get color for a specific asset
export const getAssetColor = (assetName: string, allAssets: string[]): string => {
  // Special case for Total Portfolio
  if (assetName === 'Total Portfolio') {
    return ASSET_COLORS[0] // emerald-500
  }
  
  // Sort assets alphabetically for consistent color assignment
  const sortedAssets = [...allAssets].sort()
  const assetIndex = sortedAssets.indexOf(assetName)
  
  if (assetIndex === -1) {
    return ASSET_COLORS[0] // fallback to first color
  }
  
  // Cycle through colors if we have more assets than colors
  return ASSET_COLORS[assetIndex % ASSET_COLORS.length]
}

// Get color mapping for all assets
export const getAssetColorMap = (assets: string[]): Record<string, string> => {
  const colorMap: Record<string, string> = {}
  
  assets.forEach(asset => {
    colorMap[asset] = getAssetColor(asset, assets)
  })
  
  return colorMap
}

// Check if two colors are adjacent in the palette (for better stacking visibility)
export const areColorsAdjacent = (color1: string, color2: string): boolean => {
  const index1 = ASSET_COLORS.indexOf(color1 as any)
  const index2 = ASSET_COLORS.indexOf(color2 as any)
  
  if (index1 === -1 || index2 === -1) return false
  
  return Math.abs(index1 - index2) === 1
} 