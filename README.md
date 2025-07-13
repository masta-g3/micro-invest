# micro-invest 📈

A sleek, modern investment portfolio tracker built with React and TypeScript. Track your investments across multiple platforms, visualize performance over time, and gain insights into your financial growth.

## ✨ Features

### 📊 Portfolio Overview
- **Net Worth Dashboard** - See your total net worth at a glance
- **Monthly Performance** - Track growth and changes month-over-month
- **Top Performers** - Identify your best-performing investments
- **Portfolio Allocation** - Understand your investment distribution

### 📈 Time Series Analysis
- **Interactive Charts** - Visualize returns, portfolio value, and allocation
- **Cumulative vs Period Views** - See long-term trends or month-to-month changes
- **Asset Filtering** - Focus on specific investments
- **Multiple Chart Types** - Line charts for trends, bar charts for periods

### 📸 Portfolio Snapshots
- **Monthly Snapshots** - Detailed view of your portfolio at any point in time
- **Inline Editing** - Update investment values and rates directly
- **Performance Comparison** - See changes from previous month
- **Date Navigation** - Easily browse through your investment history

### ➕ Data Management
- **CSV Import** - Load your investment data from CSV files
- **Manual Entry** - Add new investment snapshots through the UI
- **Data Validation** - Automatic validation and error handling
- **Persistent Storage** - Your data is saved locally in your browser

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd micro-invest
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

## 📋 Data Format

### CSV Structure
Your investment data should be in CSV format with these columns:

```csv
Date,Investment,Amount,Rate
2024-01-01,Wealthfront,50000,5.2
2024-01-01,IRA,75000,7.8
2024-01-01,Debt,-25000,0
```

**Column Definitions:**
- **Date**: ISO format (YYYY-MM-DD)
- **Investment**: Asset name (Wealthfront, IRA, Crypto, etc.)
- **Amount**: Dollar amount (negative for debt)
- **Rate**: Growth rate percentage for that period

### Supported Investment Types
- **Wealthfront** - Robo-advisor investments
- **IRA/Roth IRA** - Retirement accounts
- **Robinhood** - Stock trading platform
- **CETES** - Mexican treasury bonds
- **Crypto** - Cryptocurrency investments
- **Real Estate** - Property investments
- **Debt** - Liabilities (use negative amounts)

## 🎯 How to Use

### 1. Initial Setup
- Place your CSV file in the `public/` directory as `investments.csv`
- The app will automatically load this data on startup
- Sample data is provided to get you started

### 2. Navigation
Use the top navigation bar or keyboard shortcuts:
- **1** - Overview (dashboard)
- **2** - Snapshot (detailed view)
- **3** - Time Series (charts)
- **4** - Add Entry (new data)
- **+** - Add new investment row (when in Add Entry tab)
- **Escape** - Cancel and return to Overview (when in Add Entry tab)

#### Time Series Chart Controls (when in Time Series tab)
- **o** - Switch to Ownership view
- **p** - Switch to Performance view
- **k** - Switch to left sub-option (Allocation/Cumulative)
- **l** - Switch to right sub-option (Value/Period)
- **a** - Toggle "Show by asset" (Performance view only)

### 3. Overview Dashboard
- View your current net worth and monthly performance
- See top-performing investments
- Check portfolio allocation breakdown
- Monitor recent activity

### 4. Portfolio Snapshots
- Navigate between months using arrow buttons
- Edit investment values by clicking the edit icon
- Compare performance with previous month
- View detailed insights and metrics

### 5. Time Series Charts
- Toggle between different data types:
  - **Returns**: Investment performance over time
  - **Portfolio**: Total portfolio value
  - **Allocation**: Asset distribution
- Switch between cumulative and period views
- Show/hide specific assets using the asset controls

### 6. Adding New Data
- Select a date for your new snapshot
- Add investment entries with amounts and growth rates
- Use the "Prefill from Previous" button for quick entry
- Save to update your portfolio

## 📊 Key Metrics

The app calculates several important financial metrics:

- **Total Return**: Overall portfolio growth
- **Monthly Growth Rate**: Average monthly performance
- **Volatility**: Risk measure (standard deviation)
- **Sharpe Ratio**: Risk-adjusted return
- **Max Drawdown**: Largest portfolio decline
- **Diversification Score**: Portfolio diversity measure

## 🔧 Advanced Features

### Data Management
- **Auto-save**: All changes are automatically saved to local storage
- **Data Migration**: Seamlessly migrates from previous versions
- **Error Handling**: Comprehensive validation and error messages
- **Export Options**: Download your data as CSV

### Performance Optimization
- **Precise Calculations**: Uses decimal.js for financial accuracy
- **Efficient Rendering**: Optimized React components
- **Responsive Design**: Works on desktop and mobile
- **Fast Load Times**: Optimized with Vite bundler

## 🛠️ Troubleshooting

### Common Issues

**Data not loading?**
- Check that your CSV file is in `public/investments.csv`
- Verify the CSV format matches the expected structure
- Look for error messages in the browser console

**Charts not displaying?**
- Ensure you have data for multiple dates
- Check that assets are selected in the visibility controls
- Verify your browser supports modern JavaScript features

**Performance issues?**
- Large datasets (>1000 entries) may cause slowdown
- Consider filtering data to recent periods
- Clear browser cache and reload

### Data Validation
The app validates:
- Date format (YYYY-MM-DD)
- Numeric values for amounts and rates
- Required fields are present
- No duplicate entries for same date/investment

## 🤝 Contributing

This is a personal finance tracker designed for individual use. For feature requests or bug reports, please create an issue in the repository.

## 📄 License

MIT License - see LICENSE file for details

## 🔒 Privacy

All data is stored locally in your browser. No information is sent to external servers. Your financial data remains private and secure on your device.

---

Built with ❤️ using React, TypeScript, and modern web technologies. 