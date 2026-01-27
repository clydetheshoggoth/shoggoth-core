#!/usr/bin/env node

/**
 * Portfolio Performance Dashboard
 * Tracks and displays trading performance across all strategies
 */

const fs = require('fs');
const path = require('path');

// Load portfolio config
function loadConfig() {
  try {
    const configPath = path.join(__dirname, '../data/portfolio-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading config:', error.message);
  }
  return null;
}

// Load SPX backtest results
function loadBacktestResults() {
  try {
    const resultsPath = path.join(__dirname, '../data/spx-0dte-backtest-results.json');
    if (fs.existsSync(resultsPath)) {
      return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading backtest results:', error.message);
  }
  return null;
}

// Calculate performance metrics from backtest summary
function calculateMetrics(results) {
  if (!results || !results.summary) return null;

  const summary = results.summary;

  return {
    totalTrades: parseInt(summary.totalDays),
    wins: parseInt(summary.totalWins),
    losses: parseInt(summary.totalLosses),
    winRate: parseFloat(summary.overallWinRate).toFixed(1),
    totalPnL: parseFloat(summary.totalPnL).toFixed(2),
    avgWin: parseFloat(summary.avgWin).toFixed(2),
    avgLoss: parseFloat(summary.avgLoss).toFixed(2),
    maxWinStreak: parseInt(summary.maxWinStreak),
    maxLossStreak: parseInt(summary.maxLossStreak),
    profitFactor: Math.abs(parseFloat(summary.avgLoss)) > 0
      ? (parseFloat(summary.avgWin) / Math.abs(parseFloat(summary.avgLoss))).toFixed(2)
      : 0
  };
}

// Get account status
function getAccountStatus(config) {
  if (!config || !config.accounts) return [];

  return Object.entries(config.accounts).map(([name, account]) => {
    const status = account.lastSync
      ? `Last sync: ${new Date(account.lastSync).toLocaleDateString()}`
      : 'Not synced yet';

    return {
      name,
      type: account.type,
      platform: account.platform,
      status,
      active: account.status === 'active'
    };
  });
}

// Format dashboard
function formatDashboard(config, metrics, accounts) {
  const lines = [];

  lines.push('📊 **PORTFOLIO DASHBOARD**');
  lines.push('');
  lines.push(`*Generated: ${new Date().toISOString()}*`);
  lines.push('');

  // Accounts section
  lines.push('## Accounts');
  lines.push('');
  accounts.forEach(account => {
    const status = account.active ? '🟢 Active' : '🔴 Inactive';
    lines.push(`**${account.name}** (${account.platform})`);
    lines.push(`  Type: ${account.type} | ${status}`);
    lines.push(`  ${account.status}`);
    lines.push('');
  });

  // SPX 0DTE Strategy Performance
  if (metrics) {
    lines.push('## SPX 0DTE RIC Strategy (Historical)');
    lines.push('');
    lines.push(`**Total Trades:** ${metrics.totalTrades.toLocaleString()}`);
    lines.push(`**Win Rate:** ${metrics.winRate}%`);
    lines.push(`**Total P/L:** $${parseFloat(metrics.totalPnL) > 0 ? '+' : ''}${metrics.totalPnL}`);
    lines.push(`**Avg Win:** $${metrics.avgWin} | **Avg Loss:** $${metrics.avgLoss}`);
    lines.push(`**Profit Factor:** ${metrics.profitFactor}:1`);
    lines.push('');

    const pnlColor = parseFloat(metrics.totalPnL) > 0 ? '🟢' : parseFloat(metrics.totalPnL) < 0 ? '🔴' : '⚪';
    const winRateColor = parseFloat(metrics.winRate) >= 50 ? '🟢' : parseFloat(metrics.winRate) >= 40 ? '🟡' : '🔴';

    lines.push(`**Assessment:** ${pnlColor} Overall ${parseFloat(metrics.totalPnL) > 0 ? 'profitable' : 'unprofitable'}`);
    lines.push(`Win rate ${winRateColor} ${parseFloat(metrics.winRate) >= 50 ? 'above' : 'below'} 50%`);
    lines.push('');
  }

  // Recent activity placeholder
  lines.push('## Recent Activity');
  lines.push('');
  lines.push('📋 No recent trades recorded');
  lines.push('');
  lines.push('*Sync IBKR, Hyperliquid, and Solana accounts for real-time data*');
  lines.push('');

  return lines.join('\n');
}

// Main function
async function main() {
  console.error('📊 Generating portfolio dashboard...');

  const config = loadConfig();
  const results = loadBacktestResults();
  const metrics = calculateMetrics(results);
  const accounts = getAccountStatus(config);

  const dashboard = formatDashboard(config, metrics, accounts);

  console.log(dashboard);

  // Save dashboard
  const dashboardPath = path.join(__dirname, '../data/portfolio-dashboard.md');
  fs.writeFileSync(dashboardPath, dashboard, 'utf8');
  console.error(`✅ Saved dashboard to ${dashboardPath}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { calculateMetrics, getAccountStatus };
