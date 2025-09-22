import { useMemo, useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import Card from '../layout/Card'
import ViewToggle from '../ui/ViewToggle'
import { useAppData } from '../../context/AppProvider'
import { 
  transformSnapshots, 
  DisplayMode,
  getDataTypeLabel,
  formatChartValue 
} from '../../utils/chartData'
import { getAssetColorMap } from '../../utils/colors'

export default function TimeSeries() {
  const { data, updateUI, snapshots } = useAppData()
  const { mainView, performanceView, ownershipView, showByAsset, displayMode, visibleAssets } = data.ui.chartSettings
  const assetsInitialized = useRef(false)
  const previousSelectionRef = useRef<string[] | null>(null)
  
  // Map new settings to existing logic
  const dataType = mainView === 'performance' ? 'returns' : ownershipView === 'allocation' ? 'allocation' : 'portfolio'
  const viewType = mainView === 'performance' ? performanceView : 'cumulative'
  
  // Get available assets (excluding debt)
  const availableAssets = useMemo(() => {
    const assets = [...new Set(data.entries.map(e => e.investment))].filter(asset => asset !== 'Debt')
    return assets.sort()
  }, [data.entries])
  
  useEffect(() => {
    if (!assetsInitialized.current && visibleAssets.length === 0 && availableAssets.length > 0) {
      const initialAssets = availableAssets.slice(0, 4)
      updateUI({
        chartSettings: {
          ...data.ui.chartSettings,
          visibleAssets: initialAssets
        }
      })
      assetsInitialized.current = true
    }
    if (visibleAssets.length > 0 && !assetsInitialized.current) {
      assetsInitialized.current = true
    }
  }, [visibleAssets, availableAssets, data.ui.chartSettings, updateUI])

  const visibleAssetsSet = useMemo(() => new Set(visibleAssets), [visibleAssets])

  // Transform real data instead of using mock data
  const chartData = useMemo(() => {
    // Limit to last 36 months for readability
    const displaySnapshots = snapshots.length > 36 ? snapshots.slice(-36) : snapshots
    return transformSnapshots(displaySnapshots, dataType, viewType, displayMode)
  }, [snapshots, dataType, viewType, displayMode])


  const toggleAssetVisibility = (asset: string) => {
    const newVisible = new Set(visibleAssets)
    if (newVisible.has(asset)) {
      newVisible.delete(asset)
    } else {
      newVisible.add(asset)
    }
    updateUI({
      chartSettings: {
        ...data.ui.chartSettings,
        visibleAssets: Array.from(newVisible)
      }
    })
  }

  const setVisibleAssets = (assets: string[]) => {
    updateUI({
      chartSettings: {
        ...data.ui.chartSettings,
        visibleAssets: assets
      }
    })
  }

  const selectAllAssets = () => setVisibleAssets(availableAssets)
  const selectNoneAssets = () => setVisibleAssets([])
  const invertAssets = () => {
    const inverted = availableAssets.filter(a => !visibleAssetsSet.has(a))
    setVisibleAssets(inverted)
  }

  // Generate human-friendly tick marks for Y axes
  const computeNiceTicks = (min: number, max: number, maxTicks: number = 5): number[] => {
    if (!isFinite(min) || !isFinite(max)) return [0]
    if (min === max) {
      const step = Math.abs(min) || 1
      min -= step
      max += step
    }
    const niceNumber = (range: number, round: boolean): number => {
      const exponent = Math.floor(Math.log10(range))
      const fraction = range / Math.pow(10, exponent)
      let niceFraction: number
      if (round) {
        if (fraction < 1.5) niceFraction = 1
        else if (fraction < 3) niceFraction = 2
        else if (fraction < 7) niceFraction = 5
        else niceFraction = 10
      } else {
        if (fraction <= 1) niceFraction = 1
        else if (fraction <= 2) niceFraction = 2
        else if (fraction <= 5) niceFraction = 5
        else niceFraction = 10
      }
      return niceFraction * Math.pow(10, exponent)
    }
    const rawRange = max - min
    const range = rawRange === 0 ? 1 : rawRange
    const step = niceNumber(range / Math.max(2, maxTicks - 1), true)
    const tickMin = Math.floor(min / step) * step
    const tickMax = Math.ceil(max / step) * step
    const ticks: number[] = []
    for (let v = tickMin; v <= tickMax + step * 0.5; v += step) {
      const vv = Math.abs(v) < step * 1e-6 ? 0 : v
      ticks.push(Number(vv.toFixed(10)))
      if (ticks.length > 8) break
    }
    return ticks
  }

  const isolateAsset = (asset: string) => {
    if (asset === 'Total Portfolio') return
    const isIsolated = visibleAssets.length === 1 && visibleAssets[0] === asset
    if (isIsolated) {
      setVisibleAssets(previousSelectionRef.current || [])
      previousSelectionRef.current = null
    } else {
      previousSelectionRef.current = visibleAssets
      setVisibleAssets([asset])
    }
  }

  const LegendControls = () => {
    if (!showByAsset) return null
    return (
      <div className="flex items-center gap-2 text-xs mb-2">
        <button onClick={selectAllAssets} className="px-2 py-0.5 rounded bg-surface-hover hover:bg-surface border border-border text-text-secondary">All</button>
        <button onClick={selectNoneAssets} className="px-2 py-0.5 rounded bg-surface-hover hover:bg-surface border border-border text-text-secondary">None</button>
        <button onClick={invertAssets} className="px-2 py-0.5 rounded bg-surface-hover hover:bg-surface border border-border text-text-secondary">Invert</button>
      </div>
    )
  }

  // Add keyboard shortcuts for chart controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only work if we're in the TimeSeries tab
      if (data.ui.viewMode !== 'timeseries') return
      
      // Ignore shortcuts when modifier keys are pressed
      if (event.ctrlKey || event.metaKey || event.altKey) return
      
      // Ignore shortcuts when user is typing in input fields
      const target = event.target as HTMLElement
      const isInputFocused = target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.contentEditable === 'true' ||
        target.closest('input, textarea, select, [contenteditable]')
      )
      
      if (isInputFocused) return
      
      switch (event.key.toLowerCase()) {
        case 'p':
          // Switch to Performance view
          updateUI({
            chartSettings: {
              ...data.ui.chartSettings,
              mainView: 'performance'
            }
          })
          break
        case 'o':
          // Switch to Ownership view
          updateUI({
            chartSettings: {
              ...data.ui.chartSettings,
              mainView: 'ownership'
            }
          })
          break
        case 'k':
          // Toggle bottom level options (left option)
          if (mainView === 'performance') {
            updateUI({
              chartSettings: {
                ...data.ui.chartSettings,
                performanceView: 'cumulative'
              }
            })
          } else {
            updateUI({
              chartSettings: {
                ...data.ui.chartSettings,
                ownershipView: 'allocation'
              }
            })
          }
          break
        case 'l':
          // Toggle bottom level options (right option)
          if (mainView === 'performance') {
            updateUI({
              chartSettings: {
                ...data.ui.chartSettings,
                performanceView: 'period'
              }
            })
          } else {
            updateUI({
              chartSettings: {
                ...data.ui.chartSettings,
                ownershipView: 'value'
              }
            })
          }
          break
        case 'a':
          // Toggle "Show by asset" (only available in Performance view)
          if (mainView === 'performance') {
            updateUI({
              chartSettings: {
                ...data.ui.chartSettings,
                showByAsset: !showByAsset
              }
            })
          }
          break
        case 'd':
          // Toggle display mode (only available in Performance view)
          if (mainView === 'performance') {
            updateUI({
              chartSettings: {
                ...data.ui.chartSettings,
                displayMode: displayMode === 'percentage' ? 'absolute' : 'percentage'
              }
            })
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [data.ui.viewMode, data.ui.chartSettings, mainView, showByAsset, displayMode, updateUI])




  // Shared component for chart date labels
  const ChartDateLabels = ({ data }: { data: any[] }) => (
    <div className="flex justify-between text-xs text-text-muted mt-3 px-2">
      {data.filter((_, index) => index % Math.ceil(data.length / 6) === 0).map((month, index) => (
        <span key={index}>{month.date}</span>
      ))}
    </div>
  )

  // Line chart component for cumulative performance
  const LineChart = ({ data, assets }: { data: any[], assets: string[] }) => {
    const filteredAssets = assets.filter(asset => 
      asset === 'Total Portfolio' || visibleAssetsSet.has(asset)
    )
    // Generate dynamic color mapping for all available assets
    const colors = getAssetColorMap([...availableAssets, 'Total Portfolio'])

    const containerRef = useRef<HTMLDivElement>(null)
    const [hoverState, setHoverState] = useState<{ index: number; x: number; visible: boolean }>({ index: 0, x: 0, visible: false })

    // For cumulative view, data is already cumulative
    // For period view, we need to calculate cumulative values for line chart
    const cumulativeData = data.map((month, index) => {
      const cumulative: any = { date: month.date }
      
      if (viewType === 'cumulative') {
        // Data is already cumulative, just reshape it
        filteredAssets.forEach(asset => {
          if (asset === 'Total Portfolio') {
            cumulative[asset] = month.total
          } else {
            cumulative[asset] = month.assets[asset] || 0
          }
        })
      } else {
        // For period view, accumulate the values
        filteredAssets.forEach(asset => {
          if (asset === 'Total Portfolio') {
            cumulative[asset] = data.slice(0, index + 1).reduce((sum, m) => sum + m.total, 0)
          } else {
            cumulative[asset] = data.slice(0, index + 1).reduce((sum, m) => sum + (m.assets[asset] || 0), 0)
          }
        })
      }
      
      return cumulative
    })

    const allValues = cumulativeData.flatMap(d => filteredAssets.map(asset => d[asset]))

    // Domain
    let maxVal: number, minVal: number
    const includeZero = dataType !== 'allocation'
    if (dataType === 'allocation') {
      maxVal = 100
      minVal = 0
    } else {
      maxVal = Math.max(...allValues, includeZero ? 0 : -Infinity)
      minVal = Math.min(...allValues, includeZero ? 0 : Infinity)
      // For period returns, prefer symmetric domain around 0 when values cross zero
      if (viewType === 'period' && minVal < 0 && maxVal > 0) {
        const maxAbs = Math.max(Math.abs(maxVal), Math.abs(minVal))
        maxVal = maxAbs
        minVal = -maxAbs
      } else {
        const padding = Math.max((maxVal - minVal) * 0.05, 1e-6)
        maxVal += padding
        minVal -= padding
      }
    }
    const range = maxVal - minVal || 1

    // Map values to vertical percent (0% top, 100% bottom)
    const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))
    const valueToPercent = (val: number): number => {
      if (maxVal === minVal) return 0
      return (1 - (val - minVal) / (maxVal - minVal)) * 100
    }
    const middleValue = dataType === 'allocation' ? (maxVal + minVal) / 2 : 0

    const chartWidth = 600 // Fixed width for calculations
    const chartHeight = 200 // Fixed height for calculations

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      if (cumulativeData.length === 0) return
      const rect = e.currentTarget.getBoundingClientRect()
      const ratio = rect.width > 0 ? Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) : 0
      const index = Math.max(0, Math.min(cumulativeData.length - 1, Math.round(ratio * (cumulativeData.length - 1))))
      const xView = ratio * chartWidth
      setHoverState({ index, x: xView, visible: true })
    }

    const handleMouseLeave = () => setHoverState(s => ({ ...s, visible: false }))

    return (
      <div className="bg-surface-hover/30 rounded-lg p-4 relative">
        {/* Y-axis ticks */}
        {(() => {
          const ticks = computeNiceTicks(minVal, maxVal, 5)
          return (
            <div className="absolute left-0 top-0 h-52 w-14 text-[10px] text-text-muted">
              {ticks.map((t) => (
                <span key={t} className="absolute left-0 -translate-y-1/2" style={{ top: `${clamp(valueToPercent(t), 0, 100)}%` }}>
                  {formatChartValue(t, dataType, viewType, displayMode)}
                </span>
              ))}
            </div>
          )
        })()}

        {/* Chart area */}
        <div className="ml-14 h-52 relative" ref={containerRef}>
          <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            {/* Gridlines */}
            {computeNiceTicks(minVal, maxVal, 5).map((t) => (
              <line key={t} x1="0" x2={chartWidth} y1={chartHeight * (valueToPercent(t) / 100)} y2={chartHeight * (valueToPercent(t) / 100)} stroke="#2f2f2f" strokeWidth="1" strokeDasharray="1,3" />
            ))}
            {/* Zero baseline */}
            {includeZero && (
              <line
                x1="0"
                y1={chartHeight - ((0 - minVal) / range * chartHeight)}
                x2={chartWidth}
                y2={chartHeight - ((0 - minVal) / range * chartHeight)}
                stroke="#525252"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            )}
            {/* Crosshair */}
            {hoverState.visible && (
              <line
                x1={hoverState.x}
                y1={0}
                x2={hoverState.x}
                y2={chartHeight}
                stroke="#6b7280"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
            )}
            {filteredAssets.map((asset) => {
              const pathPoints = cumulativeData.map((d, index) => {
                const x = (index / (cumulativeData.length - 1)) * chartWidth
                const y = chartHeight - ((d[asset] - minVal) / range * chartHeight)
                return { x, y, value: d[asset], date: d.date }
              })

              const pathData = pathPoints.map((point, index) => 
                `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
              ).join(' ')

              return (
                <g key={asset}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={colors[asset] || '#10b981'}
                    strokeWidth="2"
                    className="transition-all duration-300"
                  />
                  {/* Data points */}
                  {pathPoints.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="3"
                      fill={colors[asset] || '#10b981'}
                      className="hover:r-4 transition-all duration-200 cursor-pointer"
                    >
                      <title>{point.date}: {formatChartValue(point.value, dataType, viewType, displayMode)}</title>
                    </circle>
                  ))}
                </g>
              )
            })}
          </svg>
          {/* Grouped tooltip */}
          {hoverState.visible && cumulativeData[hoverState.index] && (
            <div
              className="absolute bg-surface border border-border rounded px-2 py-1 text-xs text-text-primary pointer-events-none"
              style={{ left: Math.min(Math.max(((hoverState.x / chartWidth) * (containerRef.current?.clientWidth || chartWidth)) + 8, 0), (containerRef.current?.clientWidth || chartWidth) - 120), top: 8 }}
            >
              <div className="font-medium mb-1 text-text-secondary">{cumulativeData[hoverState.index].date}</div>
              {(() => {
                const d = cumulativeData[hoverState.index]
                const rows = filteredAssets.map(name => ({ name, value: d[name] as number }))
                  .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
                return rows.map(row => (
                  <div key={row.name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded" style={{ backgroundColor: colors[row.name] || '#10b981' }} />
                      <span className="text-text-secondary">{row.name}</span>
                    </div>
                    <span>{formatChartValue(row.value, dataType, viewType, displayMode)}</span>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>

        {/* Date labels */}
        <ChartDateLabels data={cumulativeData} />

        {/* Legend */}
        <div className="mt-4 flex flex-col gap-2 text-xs">
          <LegendControls />
          <div className="flex flex-wrap gap-4">
          {assets.map((asset: string) => (
            <button
              key={asset}
              onClick={() => asset !== 'Total Portfolio' && toggleAssetVisibility(asset)}
              onDoubleClick={() => asset !== 'Total Portfolio' && isolateAsset(asset)}
              className={`flex items-center space-x-2 transition-opacity ${
                asset === 'Total Portfolio' ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
              } ${
                asset === 'Total Portfolio' || visibleAssetsSet.has(asset) ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <div 
                className="w-3 h-0.5 rounded"
                style={{ backgroundColor: colors[asset] || '#10b981' }}
              />
              <span className="text-text-secondary">{asset}</span>
            </button>
          ))}
          </div>
        </div>
      </div>
    )
  }

  // Stacked area chart for ownership values
  const StackedAreaChart = ({ data, assets }: { data: any[], assets: string[] }) => {
    const filteredAssets = assets.filter(asset => 
      asset !== 'Total Portfolio' && (asset === 'Total Portfolio' || visibleAssetsSet.has(asset))
    )
    const colors = getAssetColorMap([...availableAssets, 'Total Portfolio'])

    // Calculate cumulative stacking for each time point
    const stackedData = data.map(month => {
      const stacked: any = { date: month.date }
      let cumulativeSum = 0
      
      filteredAssets.forEach(asset => {
        const value = month.assets[asset] || 0
        stacked[asset] = cumulativeSum + value
        cumulativeSum += value
      })
      
      return stacked
    })

    const maxValue = Math.max(...stackedData.map(d => 
      Math.max(...filteredAssets.map(asset => d[asset]))
    ))

    // Map values to vertical percent (0% top, 100% bottom)
    const minVal = 0
    const stackedRange = maxValue - minVal || 1
    const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))
    const valueToPercent = (val: number): number => {
      if (stackedRange === 0) return 0
      return (1 - (val - minVal) / stackedRange) * 100
    }
    // midPercent no longer used; ticks are generated via computeNiceTicks

    return (
      <div className="bg-surface-hover/30 rounded-lg p-4 relative">
        {/* Y-axis ticks */}
        {(() => {
          const ticks = computeNiceTicks(minVal, maxValue, 5)
          return (
            <div className="absolute left-0 top-0 h-52 w-14 text-[10px] text-text-muted">
              {ticks.map((t) => (
                <span key={t} className="absolute left-0 -translate-y-1/2" style={{ top: `${clamp(valueToPercent(t), 0, 100)}%` }}>
                  {formatChartValue(t, dataType, viewType, displayMode)}
                </span>
              ))}
            </div>
          )
        })()}

        {/* Chart area */}
        <div className="ml-14 h-52 relative">
          <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
            {filteredAssets.map((asset) => {
              const areaPoints = stackedData.map((d, index) => {
                const x = (index / (stackedData.length - 1)) * 600
                const y = 200 - (d[asset] / maxValue * 200)
                return `${x},${y}`
              })
              
              // Create bottom line (previous asset's top line)
              const bottomPoints = stackedData.map((_, index) => {
                const x = (index / (stackedData.length - 1)) * 600
                const prevAssetIndex = filteredAssets.indexOf(asset) - 1
                const prevValue = prevAssetIndex >= 0 ? 
                  stackedData[index][filteredAssets[prevAssetIndex]] : 0
                const y = 200 - (prevValue / maxValue * 200)
                return `${x},${y}`
              })

              const pathData = `M ${areaPoints.join(' L ')} L ${bottomPoints.reverse().join(' L ')} Z`

              return (
                <path
                  key={asset}
                  d={pathData}
                  fill={colors[asset] || '#10b981'}
                  fillOpacity="0.7"
                  stroke={colors[asset] || '#10b981'}
                  strokeWidth="1"
                />
              )
            })}
          </svg>
        </div>

        <ChartDateLabels data={stackedData} />

        {/* Legend */}
        <div className="mt-4 flex flex-col gap-2 text-xs">
          <LegendControls />
          <div className="flex flex-wrap gap-3">
          {filteredAssets.map((asset) => (
            <button
              key={asset}
              onClick={() => toggleAssetVisibility(asset)}
              onDoubleClick={() => isolateAsset(asset)}
              className="flex items-center space-x-1.5 transition-opacity cursor-pointer hover:opacity-80"
            >
              <div 
                className="w-2.5 h-2.5 rounded"
                style={{ backgroundColor: colors[asset] || '#10b981' }}
              />
              <span className="text-text-secondary text-xs">{asset}</span>
            </button>
          ))}
          </div>
        </div>
      </div>
    )
  }

  // Vertical bar chart for monthly performance
  const MonthlyBars = ({ data, assets }: { data: any[], assets: string[] }) => {
    // Tooltip state
    // Local per-rect hover content (setter reused for positioning during hover)
    const [, setTooltip] = useState<{ x: number; y: number; content: ReactNode; visible: boolean }>({ x: 0, y: 0, content: null, visible: false })
    const containerRef = useRef<HTMLDivElement>(null)
    const [hoverState, setHoverState] = useState<{ x: number; index: number; visible: boolean }>({ x: 0, index: 0, visible: false })

    const filteredAssets = assets.filter(asset => 
      asset === 'Total Portfolio' || visibleAssetsSet.has(asset)
    )
    // Generate dynamic color mapping for all available assets
    const colors = getAssetColorMap([...availableAssets, 'Total Portfolio'])

    // Get all values to determine scale
    const allValues = data.flatMap(month =>
      filteredAssets.map((asset: string) => 
        asset === 'Total Portfolio' ? month.total : (month.assets[asset] || 0)
      )
    )
    
    // For allocation view, fix the scale to 0-100%
    let maxVal, minVal, actualRange
    if (dataType === 'allocation') {
      maxVal = 100
      minVal = 0
      actualRange = 100
    } else {
      maxVal = Math.max(...allValues)
      minVal = Math.min(...allValues)
      // Symmetric domain when crossing zero (period returns only)
      if (viewType === 'period' && minVal < 0 && maxVal > 0) {
        const maxAbs = Math.max(Math.abs(maxVal), Math.abs(minVal))
        maxVal = maxAbs
        minVal = -maxAbs
      }
      actualRange = maxVal - minVal
    }
    
    const chartWidth = 600
    const chartHeight = 200
    const barGroupWidth = chartWidth / data.length
    
    // Calculate zero line position based on actual data range
    const zeroLine = minVal < 0 ? chartHeight * (maxVal / actualRange) : chartHeight

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      if (data.length === 0) return
      const rect = e.currentTarget.getBoundingClientRect()
      const ratio = rect.width > 0 ? Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) : 0
      const xViewRaw = ratio * chartWidth
      const barGroupWidth = chartWidth / data.length
      const idx = Math.max(0, Math.min(data.length - 1, Math.round((xViewRaw - (barGroupWidth / 2)) / barGroupWidth)))
      const xViewCenter = (idx * barGroupWidth) + (barGroupWidth / 2)
      setHoverState({ x: xViewCenter, index: idx, visible: true })
    }

    const handleMouseLeave = () => setHoverState(s => ({ ...s, visible: false }))

    // Map values to vertical percent (0% top, 100% bottom) for labels
    const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))
    const valueToPercent = (val: number): number => {
      if (actualRange === 0) return 0
      return (1 - (val - minVal) / actualRange) * 100
    }
    const middleValue = dataType === 'allocation' ? (maxVal + minVal) / 2 : 0

    return (
      <div className="bg-surface-hover/30 rounded-lg p-4 relative">
        {/* Y-axis ticks */}
        {(() => {
          const ticks = computeNiceTicks(minVal, maxVal, 5)
          return (
            <div className="absolute left-0 top-0 h-52 w-14 text-[10px] text-text-muted">
              {ticks.map((t) => (
                <span key={t} className="absolute left-0 -translate-y-1/2" style={{ top: `${clamp(valueToPercent(t), 0, 100)}%` }}>
                  {formatChartValue(t, dataType, viewType, displayMode)}
                </span>
              ))}
            </div>
          )
        })()}

        {/* Chart area */}
        <div className="ml-12 h-52 relative" ref={containerRef}>
          <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            {/* Gridlines */}
            {computeNiceTicks(minVal, maxVal, 5).map((t) => (
              <line key={t} x1="0" x2={chartWidth} y1={chartHeight * (valueToPercent(t) / 100)} y2={chartHeight * (valueToPercent(t) / 100)} stroke="#2f2f2f" strokeWidth="1" strokeDasharray="1,3" />
            ))}
            {/* Zero line */}
            <line
              x1="0"
              y1={zeroLine}
              x2={chartWidth}
              y2={zeroLine}
              stroke="#525252"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            {/* Crosshair */}
            {hoverState.visible && (
              <line x1={hoverState.x} y1={0} x2={hoverState.x} y2={chartHeight} stroke="#6b7280" strokeWidth="1" strokeDasharray="3,3" />
            )}
            
            {/* Bars */}
            {data.map((month, monthIndex) => {
              const barX = monthIndex * barGroupWidth + barGroupWidth * 0.1
              const barWidthSingle = barGroupWidth * 0.8

              if (filteredAssets.length === 1 || filteredAssets[0] === 'Total Portfolio') {
                // Single bar for total portfolio
                const value = filteredAssets[0] === 'Total Portfolio' ? month.total : (month.assets[filteredAssets[0]] || 0)
                const barHeight = Math.abs(value - (value >= 0 ? 0 : minVal)) / actualRange * chartHeight
                const barY = value >= 0 ? zeroLine - ((value - 0) / actualRange * chartHeight) : zeroLine

                return (
                  <g key={`${monthIndex}-${filteredAssets[0]}`}>
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidthSingle}
                      height={barHeight}
                      fill={value >= 0 ? colors[filteredAssets[0]] || '#10b981' : '#ef4444'}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                      
                      onMouseEnter={(e) => {
                        if (containerRef.current) {
                          const rect = containerRef.current.getBoundingClientRect()
                          setTooltip({
                            visible: true,
                            content: (
                              <div className="flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded" style={{ backgroundColor: colors[filteredAssets[0]] || '#10b981' }} />
                                <span className="text-text-secondary">{filteredAssets[0]}</span>
                                <span>{formatChartValue(value, dataType, viewType, displayMode)}</span>
                              </div>
                            ),
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top - 8
                          })
                        }
                      }}
                      onMouseMove={(e) => {
                        if (containerRef.current) {
                          const rect = containerRef.current.getBoundingClientRect()
                          setTooltip(t => ({ ...t, x: e.clientX - rect.left, y: e.clientY - rect.top - 8 }))
                        }
                      }}
                      onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                      >
                    </rect>
                  </g>
                )
              } else {
                // Stacked bars for individual investments
                const assetValues = filteredAssets.map((asset: string) => ({
                  asset,
                  value: month.assets[asset] || 0
                }))

                // Separate positive and negative values for proper stacking
                const positiveValues = assetValues.filter(item => item.value >= 0)
                const negativeValues = assetValues.filter(item => item.value < 0)

                let positiveOffset = 0
                let negativeOffset = 0

                return (
                  <g key={`${monthIndex}-stacked`}>
                    {/* Positive stack */}
                    {positiveValues.map(({ asset, value }) => {
                      const segmentHeight = (value / actualRange) * chartHeight
                      const segmentY = zeroLine - positiveOffset - segmentHeight
                      positiveOffset += segmentHeight

                      return (
                        <rect
                          key={`${monthIndex}-${asset}`}
                          x={barX}
                          y={segmentY}
                          width={barWidthSingle}
                          height={segmentHeight}
                          fill={colors[asset] || '#10b981'}
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                          
                          onMouseEnter={(e) => {
                            if (containerRef.current) {
                              const rect = containerRef.current.getBoundingClientRect()
                              setTooltip({
                                visible: true,
                                content: (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded" style={{ backgroundColor: colors[asset] || '#10b981' }} />
                                    <span className="text-text-secondary">{asset}</span>
                                    <span>{formatChartValue(value, dataType, viewType, displayMode)}</span>
                                  </div>
                                ),
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top - 8
                              })
                            }
                          }}
                          onMouseMove={(e) => {
                            if (containerRef.current) {
                              const rect = containerRef.current.getBoundingClientRect()
                              setTooltip(t => ({ ...t, x: e.clientX - rect.left, y: e.clientY - rect.top - 8 }))
                            }
                          }}
                          onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                          >
                        </rect>
                      )
                    })}
                    
                    {/* Negative stack */}
                    {negativeValues.map(({ asset, value }) => {
                      const segmentHeight = (Math.abs(value) / actualRange) * chartHeight
                      const segmentY = zeroLine + negativeOffset
                      negativeOffset += segmentHeight

                      return (
                        <rect
                          key={`${monthIndex}-${asset}`}
                          x={barX}
                          y={segmentY}
                          width={barWidthSingle}
                          height={segmentHeight}
                          fill={colors[asset] || '#ef4444'}
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                          
                          onMouseEnter={(e) => {
                            if (containerRef.current) {
                              const rect = containerRef.current.getBoundingClientRect()
                              setTooltip({
                                visible: true,
                                content: (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded" style={{ backgroundColor: colors[asset] || '#ef4444' }} />
                                    <span className="text-text-secondary">{asset}</span>
                                    <span>{formatChartValue(value, dataType, viewType, displayMode)}</span>
                                  </div>
                                ),
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top - 8
                              })
                            }
                          }}
                          onMouseMove={(e) => {
                            if (containerRef.current) {
                              const rect = containerRef.current.getBoundingClientRect()
                              setTooltip(t => ({ ...t, x: e.clientX - rect.left, y: e.clientY - rect.top - 8 }))
                            }
                          }}
                          onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                          >
                        </rect>
                      )
                    })}
                  </g>
                )
              }
            })}
          </svg>

          {/* Grouped tooltip: month + visible series for hovered index */}
          {hoverState.visible && data[hoverState.index] && (
            <div
              className="absolute px-2 py-1 text-xs bg-surface border border-border rounded text-text-primary pointer-events-none"
              style={{ left: Math.min(Math.max(((hoverState.x / chartWidth) * (containerRef.current?.clientWidth || chartWidth)) + 8, 0), (containerRef.current?.clientWidth || chartWidth) - 140), top: 8 }}
            >
              <div className="font-medium mb-1 text-text-secondary">{data[hoverState.index].date}</div>
              {(() => {
                const month = data[hoverState.index]
                const isTotalOnly = (filteredAssets[0] === 'Total Portfolio' && filteredAssets.length === 1)
                const rows = isTotalOnly
                  ? [{ name: 'Total Portfolio', value: month.total }]
                  : filteredAssets.map(name => ({ name, value: month.assets[name] || 0 }))
                rows.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))

                const totalVisible = isTotalOnly
                  ? rows[0].value
                  : rows.reduce((sum, r) => sum + r.value, 0)

                return (
                  <>
                    {!isTotalOnly && dataType === 'returns' && viewType === 'period' && (
                      <div className="flex items-center justify-between gap-3 mb-1 pb-1 border-b border-border">
                        <span className="text-text-secondary">Total change</span>
                        <span className="font-medium">{formatChartValue(totalVisible, dataType, viewType, displayMode)}</span>
                      </div>
                    )}
                    {rows.map(r => (
                      <div key={r.name} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded" style={{ backgroundColor: colors[r.name] || '#10b981' }} />
                          <span className="text-text-secondary">{r.name}</span>
                        </div>
                        <span>{formatChartValue(r.value, dataType, viewType, displayMode)}</span>
                      </div>
                    ))}
                  </>
                )
              })()}
            </div>
          )}
        </div>

        {/* Date labels */}
        <ChartDateLabels data={data} />

        {/* Legend */}
        {assets.length > 1 && (
          <div className="mt-4 flex flex-col gap-2 text-xs">
            <LegendControls />
            <div className="flex flex-wrap gap-3">
            {assets.map((asset: string) => (
              <button
                key={asset}
                onClick={() => asset !== 'Total Portfolio' && toggleAssetVisibility(asset)}
                onDoubleClick={() => asset !== 'Total Portfolio' && isolateAsset(asset)}
                className={`flex items-center space-x-1.5 transition-opacity ${
                  asset === 'Total Portfolio' ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
                } ${
                  asset === 'Total Portfolio' || visibleAssetsSet.has(asset) ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div 
                  className="w-2.5 h-2.5 rounded"
                  style={{ backgroundColor: colors[asset] || '#10b981' }}
                />
                <span className="text-text-secondary text-xs">{asset}</span>
              </button>
            ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Simple portfolio evolution data
  const portfolioEvolution = useMemo(() => {
    // Limit to last 36 months for readability
    const displaySnapshots = snapshots.length > 36 ? snapshots.slice(-36) : snapshots
    return transformSnapshots(displaySnapshots, 'portfolio', 'cumulative')
  }, [snapshots])

  const maxValue = Math.max(...portfolioEvolution.map(d => d.total))
  const minValue = Math.min(...portfolioEvolution.map(d => d.total))

  return (
    <div className="space-y-6">
      {/* Simple Portfolio Evolution Overview */}
      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-6">Portfolio Evolution</h3>
        
        <div className="relative h-64 mb-8 bg-surface-hover/30 rounded-lg p-4">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-text-muted">
            <span>${(maxValue / 1000).toFixed(0)}k</span>
            <span>${((maxValue + minValue) / 2 / 1000).toFixed(0)}k</span>
            <span>${(minValue / 1000).toFixed(0)}k</span>
          </div>
          
          {/* Chart area */}
          <div className="ml-12 h-full flex items-end justify-between space-x-1">
            {portfolioEvolution.map((point, index) => {
              const heightPercentage = ((point.total - minValue) / (maxValue - minValue)) * 100
              const heightPx = Math.max((heightPercentage / 100) * 200, 4) // 200px max height
              return (
                <div key={index} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-surface border border-border rounded px-2 py-1 text-xs text-text-primary whitespace-nowrap z-10">
                    ${(point.total / 1000).toFixed(0)}k
                  </div>
                  {/* Bar */}
                  <div 
                    className="w-full bg-accent rounded-t transition-all duration-300 group-hover:bg-accent/80 cursor-pointer"
                    style={{ height: `${heightPx}px` }}
                    title={`${point.date}: $${point.total.toLocaleString()}`}
                  />
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Date labels */}
        <div className="flex justify-between text-xs text-text-muted mb-4">
          {portfolioEvolution.filter((_, index) => index % Math.ceil(portfolioEvolution.length / 6) === 0).map((point, index) => (
            <span key={index}>{point.date}</span>
          ))}
        </div>
      </Card>

      {/* Enhanced Analysis */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-text-primary">{getDataTypeLabel(dataType)}</h3>
          
                  {/* Level 1: Main View Toggle */}
        <ViewToggle
          options={[
            { value: 'ownership', label: 'Ownership', shortcut: 'o' },
            { value: 'performance', label: 'Performance', shortcut: 'p' }
          ]}
          value={mainView}
          onChange={(value) => updateUI({
            chartSettings: {
              ...data.ui.chartSettings,
              mainView: value as 'performance' | 'ownership'
            }
          })}
        />
        </div>

        {/* Level 2: Sub-view Toggle */}
        <div className="flex justify-end mb-6">
          {mainView === 'performance' ? (
            <ViewToggle
              options={[
                { value: 'cumulative', label: 'Cumulative Returns', shortcut: 'k' },
                { value: 'period', label: 'Period Returns', shortcut: 'l' }
              ]}
              value={performanceView}
              onChange={(value) => updateUI({
                chartSettings: {
                  ...data.ui.chartSettings,
                  performanceView: value as 'cumulative' | 'period'
                }
              })}
            />
          ) : (
            <ViewToggle
              options={[
                { value: 'allocation', label: 'Allocation %', shortcut: 'k' },
                { value: 'value', label: 'Value $', shortcut: 'l' }
              ]}
              value={ownershipView}
              onChange={(value) => updateUI({
                chartSettings: {
                  ...data.ui.chartSettings,
                  ownershipView: value as 'allocation' | 'value'
                }
              })}
            />
          )}
        </div>
        
        {mainView === 'performance' ? (
          // Performance charts
          viewType === 'cumulative' ? (
            <>
              <LineChart 
                data={chartData} 
                assets={showByAsset ? availableAssets : ['Total Portfolio']}
              />
              <div className="mt-8 pt-4 border-t border-border flex justify-between items-center">
                <div className="text-xs text-text-muted">
                  Showing cumulative returns since {chartData[0]?.date || 'start'}
                  {snapshots.length > 36 && ' (last 36 months)'}
                </div>
                <div className="flex items-center space-x-6">
                  <ViewToggle
                    options={[
                      { value: 'percentage', label: '%', shortcut: 'd' },
                      { value: 'absolute', label: '$', shortcut: 'd' }
                    ]}
                    value={displayMode}
                    onChange={(value) => updateUI({
                      chartSettings: {
                        ...data.ui.chartSettings,
                        displayMode: value as DisplayMode
                      }
                    })}
                    className="scale-75"
                  />
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={showByAsset}
                      onChange={(e) => updateUI({
                        chartSettings: {
                          ...data.ui.chartSettings,
                          showByAsset: e.target.checked
                        }
                      })}
                      className="rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="text-xs text-text-secondary">Split by asset</span>
                    {showByAsset && (
                      <span
                        className="text-[10px] text-text-muted"
                        title="Debt and other negative assets are excluded from this breakdown"
                        aria-label="Debt and other negative assets are excluded from this breakdown"
                      >ⓘ</span>
                    )}
                    <span className="text-xs text-text-muted">a</span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
              <MonthlyBars 
                data={chartData} 
                assets={showByAsset ? availableAssets : ['Total Portfolio']}
              />
              <div className="mt-8 pt-4 border-t border-border flex justify-between items-center">
                <div className="text-xs text-text-muted">
                  Showing period returns from {chartData[0]?.date} to {chartData[chartData.length - 1]?.date}
                  {snapshots.length > 36 && ' (last 36 months)'}
                </div>
                <div className="flex items-center space-x-6">
                  <ViewToggle
                    options={[
                      { value: 'percentage', label: '%', shortcut: 'd' },
                      { value: 'absolute', label: '$', shortcut: 'd' }
                    ]}
                    value={displayMode}
                    onChange={(value) => updateUI({
                      chartSettings: {
                        ...data.ui.chartSettings,
                        displayMode: value as DisplayMode
                      }
                    })}
                    className="scale-75"
                  />
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={showByAsset}
                      onChange={(e) => updateUI({
                        chartSettings: {
                          ...data.ui.chartSettings,
                          showByAsset: e.target.checked
                        }
                      })}
                      className="rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="text-xs text-text-secondary">Split by asset</span>
                    {showByAsset && (
                      <span
                        className="text-[10px] text-text-muted"
                        title="Debt and other negative assets are excluded from this breakdown"
                        aria-label="Debt and other negative assets are excluded from this breakdown"
                      >ⓘ</span>
                    )}
                    <span className="text-xs text-text-muted">a</span>
                  </label>
                </div>
              </div>
            </>
          )
        ) : (
          // Ownership charts - always show by asset
          ownershipView === 'allocation' ? (
            <>
              <MonthlyBars 
                data={chartData} 
                assets={availableAssets}
              />
              <div className="mt-8 pt-4 border-t border-border text-xs text-text-muted">
                Showing asset allocation percentages from {chartData[0]?.date} to {chartData[chartData.length - 1]?.date}
                {snapshots.length > 36 && ' (last 36 months)'}
              </div>
            </>
          ) : (
            <>
              <StackedAreaChart 
                data={chartData} 
                assets={availableAssets}
              />
              <div className="mt-8 pt-4 border-t border-border text-xs text-text-muted">
                Showing portfolio value evolution from {chartData[0]?.date} to {chartData[chartData.length - 1]?.date}
                {snapshots.length > 36 && ' (last 36 months)'}
              </div>
            </>
          )
        )}
      </Card>
    </div>
  )
}