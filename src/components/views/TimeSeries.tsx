import { useMemo, useEffect } from 'react'
import Card from '../layout/Card'
import ViewToggle from '../ui/ViewToggle'
import { useAppData } from '../../context/AppProvider'
import { 
  transformSnapshots, 
  DataType, 
  getDataTypeLabel,
  formatChartValue 
} from '../../utils/chartData'
import { getAssetColorMap } from '../../utils/colors'

export default function TimeSeries() {
  const { data, updateUI, snapshots } = useAppData()
  const { mainView, performanceView, ownershipView, showByAsset, visibleAssets } = data.ui.chartSettings
  
  // Map new settings to existing logic
  const dataType = mainView === 'performance' ? 'returns' : ownershipView === 'allocation' ? 'allocation' : 'portfolio'
  const viewType = mainView === 'performance' ? performanceView : 'cumulative'
  
  // Get available assets (excluding debt)
  const availableAssets = useMemo(() => {
    const assets = [...new Set(data.entries.map(e => e.investment))].filter(asset => asset !== 'Debt')
    return assets.sort()
  }, [data.entries])
  
  const visibleAssetsSet = useMemo(() => {
    if (visibleAssets.length === 0 && availableAssets.length > 0) {
      const initialAssets = availableAssets.slice(0, 4)
      updateUI({
        chartSettings: {
          ...data.ui.chartSettings,
          visibleAssets: initialAssets
        }
      })
      return new Set(initialAssets)
    }
    return new Set(visibleAssets)
  }, [visibleAssets, availableAssets, data.ui.chartSettings, updateUI])

  // Transform real data instead of using mock data
  const chartData = useMemo(() => {
    return transformSnapshots(snapshots, dataType, viewType)
  }, [snapshots, dataType, viewType])


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
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [data.ui.viewMode, data.ui.chartSettings, mainView, showByAsset, updateUI])


  const ToggleButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded transition-colors ${
        active 
          ? 'bg-accent text-background' 
          : 'bg-surface-hover text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )

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
    
    // For allocation view, fix the scale to 0-100%
    let maxVal, minVal, range
    if (dataType === 'allocation') {
      maxVal = 100
      minVal = 0
      range = 100
    } else {
      maxVal = Math.max(...allValues)
      minVal = Math.min(...allValues)
      range = maxVal - minVal || 1 // Prevent division by zero
    }

    const chartWidth = 600 // Fixed width for calculations
    const chartHeight = 200 // Fixed height for calculations

    return (
      <div className="bg-surface-hover/30 rounded-lg p-4 relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-52 flex flex-col justify-between text-xs text-text-muted py-4">
          <span>{formatChartValue(maxVal, dataType, viewType)}</span>
          <span>{formatChartValue((maxVal + minVal) / 2, dataType, viewType)}</span>
          <span>{formatChartValue(minVal, dataType, viewType)}</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-52 relative">
          <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
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
                      <title>{point.date}: {formatChartValue(point.value, dataType, viewType)}</title>
                    </circle>
                  ))}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Date labels */}
        <ChartDateLabels data={cumulativeData} />

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          {assets.map((asset) => (
            <button
              key={asset}
              onClick={() => asset !== 'Total Portfolio' && toggleAssetVisibility(asset)}
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

    return (
      <div className="bg-surface-hover/30 rounded-lg p-4 relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-52 flex flex-col justify-between text-xs text-text-muted py-4">
          <span>${(maxValue / 1000).toFixed(0)}k</span>
          <span>${(maxValue / 2 / 1000).toFixed(0)}k</span>
          <span>$0</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-52 relative">
          <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
            {filteredAssets.map((asset) => {
              const areaPoints = stackedData.map((d, index) => {
                const x = (index / (stackedData.length - 1)) * 600
                const y = 200 - (d[asset] / maxValue * 200)
                return `${x},${y}`
              })
              
              // Create bottom line (previous asset's top line)
              const bottomPoints = stackedData.map((d, index) => {
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
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          {filteredAssets.map((asset) => (
            <button
              key={asset}
              onClick={() => toggleAssetVisibility(asset)}
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
    )
  }

  // Vertical bar chart for monthly performance
  const MonthlyBars = ({ data, assets }: { data: any[], assets: string[] }) => {
    const filteredAssets = assets.filter(asset => 
      asset === 'Total Portfolio' || visibleAssetsSet.has(asset)
    )
    // Generate dynamic color mapping for all available assets
    const colors = getAssetColorMap([...availableAssets, 'Total Portfolio'])

    // Get all values to determine scale
    const allValues = data.flatMap(month => 
      filteredAssets.map(asset => 
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
      actualRange = maxVal - minVal
    }
    
    const chartWidth = 600
    const chartHeight = 200
    const barGroupWidth = chartWidth / data.length
    
    // Calculate zero line position based on actual data range
    const zeroLine = minVal < 0 ? chartHeight * (maxVal / actualRange) : chartHeight

    return (
      <div className="bg-surface-hover/30 rounded-lg p-4 relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-52 flex flex-col justify-between text-xs text-text-muted py-4">
          <span>{formatChartValue(maxVal, dataType, viewType)}</span>
          <span>{formatChartValue(0, dataType, viewType)}</span>
          <span>{formatChartValue(minVal, dataType, viewType)}</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-52 relative">
          <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
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
                    >
                      <title>{month.date}: {formatChartValue(value, dataType, viewType)}</title>
                    </rect>
                  </g>
                )
              } else {
                // Stacked bars for individual investments
                const assetValues = filteredAssets.map(asset => ({
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
                        >
                          <title>{month.date} - {asset}: {formatChartValue(value, dataType, viewType)}</title>
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
                        >
                          <title>{month.date} - {asset}: {formatChartValue(value, dataType, viewType)}</title>
                        </rect>
                      )
                    })}
                  </g>
                )
              }
            })}
          </svg>
        </div>

        {/* Date labels */}
        <ChartDateLabels data={data} />

        {/* Legend */}
        {assets.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {assets.map((asset) => (
              <button
                key={asset}
                onClick={() => asset !== 'Total Portfolio' && toggleAssetVisibility(asset)}
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
        )}
      </div>
    )
  }

  // Simple portfolio evolution data
  const portfolioEvolution = useMemo(() => {
    return transformSnapshots(snapshots, 'portfolio', 'cumulative')
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
                </div>
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
                  <span className="text-xs text-text-secondary">Show by asset</span>
                  <span className="text-xs text-text-muted">a</span>
                </label>
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
                </div>
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
                  <span className="text-xs text-text-secondary">Show by asset</span>
                  <span className="text-xs text-text-muted">a</span>
                </label>
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
              </div>
            </>
          )
        )}
      </Card>
    </div>
  )
}