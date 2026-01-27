#!/usr/bin/env node
/**
 * SPX 0DTE Reverse Iron Condor (RIC) 10-Year Backtest
 * Simulates RIC strategy on daily SPX data
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  yahooSymbol: '^GSPC',
  years: 10,
  targetPoints: 50,  // +/- 50 point range for wings
  volatility: 0.20,  // 20% volatility for premium estimation
  premiumPerOption: 2.50,  // Estimated premium per option at 0.20 vol
};

// Error function approximation for probability calculations
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

async function fetchSPXData(years = 10) {
  const today = new Date();
  const startDate = new Date();
  startDate.setFullYear(today.getFullYear() - years);
  startDate.setMonth(0);
  startDate.setDate(1);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = today.toISOString().split('T')[0];

  console.error(`Fetching SPX data from ${startStr} to ${endStr}...`);

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${CONFIG.yahooSymbol}?interval=1d&period1=${Math.floor(startDate.getTime()/1000)}&period2=${Math.floor(today.getTime()/1000)}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const result = response.data.chart.result[0];
    
    if (!result || !result.timestamp) {
      throw new Error('Invalid response from Yahoo Finance');
    }

    const data = result.timestamp.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: result.indicators.quote[0].open[i],
      high: result.indicators.quote[0].high[i],
      low: result.indicators.quote[0].low[i],
      close: result.indicators.quote[0].close[i],
      volume: result.indicators.quote[0].volume[i]
    })).filter(d => d.open && d.high && d.low && d.close);

    console.error(`Fetched ${data.length} trading days`);
    return data;
  } catch (error) {
    console.error('Error fetching SPX data:', error.message);
    throw error;
  }
}

function calculateRICPremium(openPrice) {
  // Premium estimation based on 0.20 volatility
  // For 0DTE options, premium is primarily intrinsic value
  // Using a simplified model: base premium + intrinsic adjustment
  
  const basePremium = CONFIG.premiumPerOption;
  const priceAdjustment = (openPrice - 4000) / 10000;  // Adjust for price level
  
  return {
    callPremium: basePremium + priceAdjustment,
    putPremium: basePremium + priceAdjustment,
    totalPremium: (basePremium + priceAdjustment) * 2
  };
}

function simulateRICDay(dayData) {
  const { date, open, high, low, close } = dayData;
  
  // RIC setup: Long call at (open + 50), Long put at (open - 50)
  const callStrike = open + CONFIG.targetPoints;
  const putStrike = open - CONFIG.targetPoints;
  
  const premium = calculateRICPremium(open);
  
  // Check if wings were hit
  const callHit = high >= callStrike;
  const putHit = low <= putStrike;
  
  let result = {
    date,
    open,
    high,
    low,
    close,
    callStrike,
    putStrike,
    callHit,
    putHit,
    wingHit: callHit || putHit,
    totalPremium: premium.totalPremium.toFixed(2)
  };
  
  if (result.wingHit) {
    // Calculate profit
    const moveUp = callHit ? (high - callStrike) : 0;
    const moveDown = putHit ? (putStrike - low) : 0;
    const profit = Math.max(moveUp, moveDown) - premium.totalPremium;
    
    result.pnl = profit.toFixed(2);
    result.result = 'WIN';
    result.profitLoss = profit;
    result.moveUp = moveUp.toFixed(2);
    result.moveDown = moveDown.toFixed(2);
  } else {
    // Loss = premium paid
    const loss = -premium.totalPremium;
    result.pnl = loss.toFixed(2);
    result.result = 'LOSS';
    result.profitLoss = loss;
  }
  
  // Calculate range statistics
  result.range = (high - low).toFixed(2);
  result.rangePercent = ((high - low) / open * 100).toFixed(2);
  
  // Gap analysis
  result.gap = ((open - close) / open * 100).toFixed(2);
  result.gapDirection = parseFloat(result.gap) > 0 ? 'gapUp' : 
                       parseFloat(result.gap) < 0 ? 'gapDown' : 'noGap';
  
  // Day of week and month
  const dateObj = new Date(date);
  result.dayOfWeek = dateObj.getDay();  // 0 = Sunday, 1 = Monday, etc.
  result.month = dateObj.getMonth();  // 0 = January, etc.
  result.year = dateObj.getFullYear();
  
  return result;
}

function analyzePatterns(dailyResults) {
  const patterns = {
    byDayOfWeek: Array(7).fill(null).map(() => ({ wins: 0, losses: 0, totalPnL: 0 })),
    byMonth: Array(12).fill(null).map(() => ({ wins: 0, losses: 0, totalPnL: 0 })),
    byYear: {},
    gapEffects: { gapUp: { wins: 0, losses: 0, totalPnL: 0 }, 
                  noGap: { wins: 0, losses: 0, totalPnL: 0 },
                  gapDown: { wins: 0, losses: 0, totalPnL: 0 } },
    rangePatterns: { narrow: { wins: 0, losses: 0, totalPnL: 0 },  // < 0.5%
                     medium: { wins: 0, losses: 0, totalPnL: 0 },  // 0.5-1%
                     wide: { wins: 0, losses: 0, totalPnL: 0 } },  // > 1%
    winLossStats: {
      wins: [],
      losses: [],
      winStreaks: [],
      lossStreaks: []
    }
  };
  
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  
  dailyResults.forEach(day => {
    const dayIndex = day.dayOfWeek;
    const monthIndex = day.month;
    const year = day.year;
    
    // Initialize year if needed
    if (!patterns.byYear[year]) {
      patterns.byYear[year] = { wins: 0, losses: 0, totalPnL: 0 };
    }
    
    const pnl = parseFloat(day.pnl);
    const isWin = day.result === 'WIN';
    
    // Track by day of week
    patterns.byDayOfWeek[dayIndex].totalPnL += pnl;
    if (isWin) {
      patterns.byDayOfWeek[dayIndex].wins++;
      patterns.winLossStats.wins.push(pnl);
      currentWinStreak++;
      currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else {
      patterns.byDayOfWeek[dayIndex].losses++;
      patterns.winLossStats.losses.push(pnl);
      currentLossStreak++;
      currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    }
    
    // Track by month
    patterns.byMonth[monthIndex].totalPnL += pnl;
    if (isWin) patterns.byMonth[monthIndex].wins++;
    else patterns.byMonth[monthIndex].losses++;
    
    // Track by year
    patterns.byYear[year].totalPnL += pnl;
    if (isWin) patterns.byYear[year].wins++;
    else patterns.byYear[year].losses++;
    
    // Track gap effects
    patterns.gapEffects[day.gapDirection].totalPnL += pnl;
    if (isWin) patterns.gapEffects[day.gapDirection].wins++;
    else patterns.gapEffects[day.gapDirection].losses++;
    
    // Track range patterns
    const rangePercent = parseFloat(day.rangePercent);
    if (rangePercent < 0.5) {
      patterns.rangePatterns.narrow.totalPnL += pnl;
      if (isWin) patterns.rangePatterns.narrow.wins++;
      else patterns.rangePatterns.narrow.losses++;
    } else if (rangePercent < 1.0) {
      patterns.rangePatterns.medium.totalPnL += pnl;
      if (isWin) patterns.rangePatterns.medium.wins++;
      else patterns.rangePatterns.medium.losses++;
    } else {
      patterns.rangePatterns.wide.totalPnL += pnl;
      if (isWin) patterns.rangePatterns.wide.wins++;
      else patterns.rangePatterns.wide.losses++;
    }
  });
  
  patterns.maxWinStreak = maxWinStreak;
  patterns.maxLossStreak = maxLossStreak;
  
  return patterns;
}

function generateInsights(patterns, dailyResults) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Win rates by day
  const winRatesByDay = patterns.byDayOfWeek.map((day, i) => {
    const total = day.wins + day.losses;
    const winRate = total > 0 ? (day.wins / total * 100) : 0;
    return { day: dayNames[i], winRate: winRate.toFixed(1), total, avgPnL: (day.totalPnL / total).toFixed(2) };
  });
  
  // Win rates by month
  const winRatesByMonth = patterns.byMonth.map((month, i) => {
    const total = month.wins + month.losses;
    const winRate = total > 0 ? (month.wins / total * 100) : 0;
    return { month: monthNames[i], winRate: winRate.toFixed(1), total, avgPnL: (month.totalPnL / total).toFixed(2) };
  });
  
  // Best and worst months
  const sortedMonths = [...winRatesByMonth].sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
  const bestMonths = sortedMonths.slice(0, 3);
  const worstMonths = sortedMonths.slice(-3).reverse();
  
  // Win/Loss statistics
  const wins = patterns.winLossStats.wins;
  const losses = patterns.winLossStats.losses;
  const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
  
  // Total statistics
  const totalDays = dailyResults.length;
  const totalWins = wins.length;
  const totalLosses = losses.length;
  const overallWinRate = totalDays > 0 ? (totalWins / totalDays * 100) : 0;
  const totalPnL = dailyResults.reduce((sum, day) => sum + parseFloat(day.pnl), 0);
  
  // Gap effects
  const gapInsights = [
    { type: 'Gap Up', ...patterns.gapEffects.gapUp, winRate: (patterns.gapEffects.gapUp.wins / (patterns.gapEffects.gapUp.wins + patterns.gapEffects.gapUp.losses || 1) * 100).toFixed(1) },
    { type: 'No Gap', ...patterns.gapEffects.noGap, winRate: (patterns.gapEffects.noGap.wins / (patterns.gapEffects.noGap.wins + patterns.gapEffects.noGap.losses || 1) * 100).toFixed(1) },
    { type: 'Gap Down', ...patterns.gapEffects.gapDown, winRate: (patterns.gapEffects.gapDown.wins / (patterns.gapEffects.gapDown.wins + patterns.gapEffects.gapDown.losses || 1) * 100).toFixed(1) }
  ];
  
  // Range insights
  const rangeInsights = [
    { type: 'Narrow (<0.5%)', ...patterns.rangePatterns.narrow, winRate: (patterns.rangePatterns.narrow.wins / (patterns.rangePatterns.narrow.wins + patterns.rangePatterns.narrow.losses || 1) * 100).toFixed(1) },
    { type: 'Medium (0.5-1%)', ...patterns.rangePatterns.medium, winRate: (patterns.rangePatterns.medium.wins / (patterns.rangePatterns.medium.wins + patterns.rangePatterns.medium.losses || 1) * 100).toFixed(1) },
    { type: 'Wide (>1%)', ...patterns.rangePatterns.wide, winRate: (patterns.rangePatterns.wide.wins / (patterns.rangePatterns.wide.wins + patterns.rangePatterns.wide.losses || 1) * 100).toFixed(1) }
  ];
  
  return {
    summary: {
      totalDays,
      totalWins,
      totalLosses,
      overallWinRate: overallWinRate.toFixed(1),
      totalPnL: totalPnL.toFixed(2),
      avgWin: avgWin.toFixed(2),
      avgLoss: avgLoss.toFixed(2),
      maxWinStreak: patterns.maxWinStreak,
      maxLossStreak: patterns.maxLossStreak
    },
    byDayOfWeek: winRatesByDay,
    byMonth: winRatesByMonth,
    bestMonths,
    worstMonths,
    gapEffects: gapInsights,
    rangePatterns: rangeInsights,
    actionableInsights: generateActionableInsights(patterns, winRatesByDay, winRatesByMonth, gapInsights, rangeInsights, overallWinRate)
  };
}

function generateActionableInsights(patterns, winRatesByDay, winRatesByMonth, gapInsights, rangeInsights, overallWinRate) {
  const insights = [];
  
  // Day of week insights
  const bestDays = winRatesByDay.filter(d => d.day !== 'Sunday' && d.day !== 'Saturday')
                                .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))
                                .slice(0, 2);
  const worstDays = winRatesByDay.filter(d => d.day !== 'Sunday' && d.day !== 'Saturday')
                                 .sort((a, b) => parseFloat(a.winRate) - parseFloat(b.winRate))
                                 .slice(0, 2);
  
  if (bestDays.length > 0 && bestDays[0].total > 10) {
    insights.push(`Best trading days: ${bestDays.map(d => d.day).join(', ')} (${bestDays[0].winRate}% win rate)`);
  }
  if (worstDays.length > 0 && worstDays[0].total > 10) {
    insights.push(`Avoid trading on: ${worstDays.map(d => d.day).join(', ')} (${worstDays[0].winRate}% win rate)`);
  }
  
  // Month insights
  const topMonths = winRatesByMonth.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate)).slice(0, 2);
  const bottomMonths = winRatesByMonth.sort((a, b) => parseFloat(a.winRate) - parseFloat(b.winRate)).slice(0, 2);
  
  if (topMonths[0].total > 20) {
    insights.push(`Strongest months: ${topMonths.map(m => m.month).join(', ')} (${topMonths[0].winRate}% win rate)`);
  }
  if (bottomMonths[0].total > 20) {
    insights.push(`Weakest months: ${bottomMonths.map(m => m.month).join(', ')} (${bottomMonths[0].winRate}% win rate)`);
  }
  
  // Gap insights
  if (gapInsights[0].wins + gapInsights[0].losses > 50) {
    insights.push(`Gap up days: ${gapInsights[0].winRate}% win rate - ${parseFloat(gapInsights[0].winRate) > overallWinRate ? 'FAVORABLE' : 'NEUTRAL'}`);
  }
  if (gapInsights[2].wins + gapInsights[2].losses > 50) {
    insights.push(`Gap down days: ${gapInsights[2].winRate}% win rate - ${parseFloat(gapInsights[2].winRate) > overallWinRate ? 'FAVORABLE' : 'CAUTION'}`);
  }
  
  // Range insights
  if (rangeInsights[0].wins + rangeInsights[0].losses > 100) {
    insights.push(`Narrow range days (<0.5%): ${rangeInsights[0].winRate}% win rate - ${parseFloat(rangeInsights[0].winRate) < 30 ? 'AVOID RIC' : 'CONSIDER RIC'}`);
  }
  if (rangeInsights[2].wins + rangeInsights[2].losses > 50) {
    insights.push(`Wide range days (>1%): ${rangeInsights[2].winRate}% win rate - ${parseFloat(rangeInsights[2].winRate) > overallWinRate ? 'FAVORABLE for RIC' : 'AVOID RIC'}`);
  }
  
  // Streak insights
  if (patterns.maxWinStreak >= 3) {
    insights.push(`Maximum win streak: ${patterns.maxWinStreak} days - trend exhaustion opportunity after 2+ wins`);
  }
  if (patterns.maxLossStreak >= 3) {
    insights.push(`Maximum loss streak: ${patterns.maxLossStreak} days - avoid overtrading during losing streaks`);
  }
  
  // Overall strategy
  if (overallWinRate > 50) {
    insights.push(`Overall win rate (${overallWinRate}%) exceeds 50% - RIC strategy has positive edge`);
  } else if (overallWinRate > 45) {
    insights.push(`Overall win rate (${overallWinRate}%) near breakeven - requires selective entry criteria`);
  } else {
    insights.push(`Overall win rate (${overallWinRate}%) below 50% - RIC disadvantage, consider wider wings or different strategy`);
  }
  
  return insights;
}

async function main() {
  try {
    console.error('🚀 Starting SPX 0DTE Reverse Iron Condor Backtest...');
    console.error(`📅 Analyzing ${CONFIG.years} years of historical data`);
    
    // Fetch data
    const spxData = await fetchSPXData(CONFIG.years);
    
    if (spxData.length === 0) {
      throw new Error('No data fetched from Yahoo Finance');
    }
    
    // Simulate RIC for each day
    console.error('\n🔄 Simulating RIC strategy...');
    const dailyResults = spxData.map(simulateRICDay);
    
    // Analyze patterns
    console.error('📊 Analyzing patterns...');
    const patterns = analyzePatterns(dailyResults);
    
    // Generate insights
    const insights = generateInsights(patterns, dailyResults);
    
    // Prepare output data
    const results = {
      meta: {
        generatedAt: new Date().toISOString(),
        symbol: CONFIG.yahooSymbol,
        yearsAnalyzed: CONFIG.years,
        targetPoints: CONFIG.targetPoints,
        volatility: CONFIG.volatility,
        premiumPerOption: CONFIG.premiumPerOption
      },
      summary: insights.summary,
      patterns: {
        byDayOfWeek: patterns.byDayOfWeek.map((d, i) => ({
          day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
          wins: d.wins,
          losses: d.losses,
          total: d.wins + d.losses,
          winRate: ((d.wins / (d.wins + d.losses || 1)) * 100).toFixed(1),
          avgPnL: (d.totalPnL / (d.wins + d.losses || 1)).toFixed(2)
        })),
        byMonth: patterns.byMonth.map((m, i) => ({
          month: ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'][i],
          wins: m.wins,
          losses: m.losses,
          total: m.wins + m.losses,
          winRate: ((m.wins / (m.wins + m.losses || 1)) * 100).toFixed(1),
          avgPnL: (m.totalPnL / (m.wins + m.losses || 1)).toFixed(2)
        })),
        byYear: patterns.byYear,
        gapEffects: patterns.gapEffects,
        rangePatterns: patterns.rangePatterns,
        streaks: {
          maxWinStreak: patterns.maxWinStreak,
          maxLossStreak: patterns.maxLossStreak
        }
      },
      insights: {
        bestMonths: insights.bestMonths,
        worstMonths: insights.worstMonths,
        gapEffects: insights.gapEffects,
        rangePatterns: insights.rangePatterns,
        actionable: insights.actionableInsights
      },
      dailyData: dailyResults
    };
    
    // Save detailed results
    const resultsPath = path.join(__dirname, '../data/spx-0dte-backtest-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.error(`\n✅ Detailed results saved to: ${resultsPath}`);
    
    // Save patterns for daily analyzer
    const patternsOutput = {
      byDayOfWeek: results.patterns.byDayOfWeek,
      byMonth: results.patterns.byMonth,
      gapEffects: results.patterns.gapEffects,
      rangePatterns: results.patterns.rangePatterns,
      streaks: results.patterns.streaks,
      summary: results.summary,
      actionableInsights: insights.actionableInsights
    };
    
    const patternsPath = path.join(__dirname, '../data/spx-0dte-patterns.json');
    fs.writeFileSync(patternsPath, JSON.stringify(patternsOutput, null, 2));
    console.error(`✅ Patterns saved to: ${patternsPath}`);
    
    // Print summary
    console.error('\n' + '='.repeat(60));
    console.error('📈 BACKTEST SUMMARY');
    console.error('='.repeat(60));
    console.error(`Total Days Analyzed: ${insights.summary.totalDays}`);
    console.error(`Wins: ${insights.summary.totalWins} | Losses: ${insights.summary.totalLosses}`);
    console.error(`Win Rate: ${insights.summary.overallWinRate}%`);
    console.error(`Total P/L: $${insights.summary.totalPnL}`);
    console.error(`Avg Win: $${insights.summary.avgWin} | Avg Loss: $${insights.summary.avgLoss}`);
    console.error(`Max Win Streak: ${insights.summary.maxWinStreak} | Max Loss Streak: ${insights.summary.maxLossStreak}`);
    console.error('\nTop 3 Months by Win Rate:');
    insights.bestMonths.slice(0, 3).forEach((m, i) => {
      console.error(`  ${i+1}. ${m.month}: ${m.winRate}% (${m.wins + m.losses} trades)`);
    });
    console.error('\nActionable Insights:');
    insights.actionableInsights.forEach(insight => {
      console.error(`  • ${insight}`);
    });
    console.error('='.repeat(60));
    
    console.log(JSON.stringify({
      status: 'success',
      message: `Backtest completed successfully. Analyzed ${insights.summary.totalDays} trading days.`,
      results: {
        totalDays: insights.summary.totalDays,
        winRate: insights.summary.overallWinRate,
        totalPnL: insights.summary.totalPnL,
        resultsFile: resultsPath,
        patternsFile: patternsPath
      }
    }, null, 2));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during backtest:', error.message);
    console.error(error.stack);
    console.log(JSON.stringify({
      status: 'error',
      message: error.message
    }, null, 2));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchSPXData, simulateRICDay, analyzePatterns, generateInsights };
