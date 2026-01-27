#!/usr/bin/env node

/**
 * SPX 0DTE Options Analyzer
 * Analyzes same-day expiration options for Reverse Iron Condor viability
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  yahooSymbol: '^GSPC',
  targetPoints: 50,  // +/- 50 point range
  volatility: 0.20,  // 20% volatility for premium estimation
  timestamp: new Date().toISOString()
};

// Load historical patterns if available
let historicalPatterns = null;
try {
  const patternsPath = path.join(__dirname, '../data/spx-0dte-patterns.json');
  if (fs.existsSync(patternsPath)) {
    historicalPatterns = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));
  }
} catch (error) {
  // Patterns file not available, will run without historical context
}

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

async function getSpotPrice() {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${CONFIG.yahooSymbol}?interval=1d&range=1d`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const result = response.data.chart.result[0];
    const meta = result.meta;

    if (!meta || !meta.regularMarketPrice) {
      throw new Error('Invalid response from Yahoo Finance - missing price data');
    }

    return {
      spot: meta.regularMarketPrice,
      timestamp: CONFIG.timestamp,
      ticker: 'SPX'
    };
  } catch (error) {
    console.error('Error fetching spot price:', error.message);
    throw error;
  }
}

function calculate0DTEProbabilities(spotPrice, targetPoints) {
  const callStrike = Math.round(spotPrice + targetPoints);
  const putStrike = Math.round(spotPrice - targetPoints);

  // 0DTE has different volatility characteristics
  // Higher implied volatility, very little time premium decay
  const volATM = 0.20;  // Higher for 0DTE options
  const hoursToExpiry = 6;  // Assuming ~6 hours to market close
  const timeToExpiry = hoursToExpiry / (24 * 365);  // Convert hours to years
  const timeRoot = Math.sqrt(timeToExpiry);

  const dCall = Math.log(callStrike / spotPrice) / (volATM * timeRoot);
  const dPut = Math.log(putStrike / spotPrice) / (volATM * timeRoot);

  const deltaCall = Math.exp(-dCall) * 0.5 * (1 + erf(dCall));
  const deltaPut = Math.exp(-dPut) * 0.5 * (1 + erf(dPut));

  const deltaCallAbs = Math.abs(deltaCall);
  const deltaPutAbs = Math.abs(deltaPut);

  // 0DTE adjustments
  const probExpiryOutside = deltaCallAbs + deltaPutAbs;
  const probTouch = 2 * Math.max(deltaCallAbs, deltaPutAbs) * 0.95;

  return {
    callStrike,
    putStrike,
    deltaCall,
    deltaPut,
    combinedDeltaExposure: deltaCallAbs + deltaPutAbs,
    probExpiryOutside: Math.min(0.99, probExpiryOutside),
    probTouchingRange: Math.min(0.90, probTouch)
  };
}

function assess0DTEStrategy(probs, currentDate = new Date()) {
  const { probExpiryOutside, probTouchingRange } = probs;

  let signal = 'NEUTRAL';
  let confidence = 'Medium';
  let viability = 0;
  let adjustments = [];
  let historicalContext = null;

  // Apply historical pattern adjustments if available
  if (historicalPatterns) {
    historicalContext = applyHistoricalPatterns(historicalPatterns, currentDate, probExpiryOutside);
    adjustments = historicalContext.adjustments;
    viability += historicalContext.viabilityAdjustment;
  }

  // 0DTE-specific criteria
  if (probExpiryOutside < 0.25) {
    signal = 'FAVORABLE';
    confidence = 'High';
    viability = 85;
  } else if (probExpiryOutside < 0.35 && probTouchingRange > 0.65) {
    signal = 'FAVORABLE';
    confidence = 'Medium-High';
    viability = 75;
  } else if (probExpiryOutside < 0.50 && probTouchingRange < 0.40) {
    signal = 'FAVORABLE';
    confidence = 'Medium';
    viability = 60;
  } else if (probExpiryOutside >= 0.70) {
    signal = 'UNFAVORABLE';
    confidence = 'High';
    viability = 15;
  } else {
    signal = 'NEUTRAL';
    viability = 40;
  }

  // Apply historical adjustments
  if (historicalContext) {
    // Adjust signal based on historical patterns
    if (historicalContext.shouldUpgradeSignal && signal !== 'UNFAVORABLE') {
      signal = signal === 'FAVORABLE' ? 'FAVORABLE' : 'FAVORABLE';
      confidence = historicalContext.upgradeConfidence || confidence;
    } else if (historicalContext.shouldDowngradeSignal && signal === 'FAVORABLE') {
      signal = 'NEUTRAL';
      confidence = 'Medium';
    }

    // Update viability with historical adjustment
    viability = Math.min(100, Math.max(0, viability + historicalContext.viabilityAdjustment));
  }

  // For 0DTE, we want slightly higher expiry outside probability (20-40%)
  // because same-day moves can be significant
  const logic = `0DTE Analysis: ${probExpiryOutside < 0.35 ?
    'Low expiry probability suggests controlled range - favorable for RIC' :
    probExpiryOutside < 0.50 ?
    'Moderate expiry probability with acceptable risk' :
    'High expiry probability - range too wide for 0DTE'}${adjustments.length > 0 ? '\nHistorical: ' + adjustments.join('. ') : ''}`;

  return { signal, logic, confidence, viability, historicalContext };
}

function applyHistoricalPatterns(patterns, currentDate, probExpiryOutside) {
  const adjustments = [];
  let viabilityAdjustment = 0;
  let shouldUpgradeSignal = false;
  let shouldDowngradeSignal = false;
  let upgradeConfidence = null;

  const dayOfWeek = currentDate.getDay();  // 0 = Sunday, 1 = Monday
  const month = currentDate.getMonth();  // 0 = January

  // Day of week patterns
  if (patterns.byDayOfWeek && patterns.byDayOfWeek[dayOfWeek]) {
    const dayPattern = patterns.byDayOfWeek[dayOfWeek];
    const winRate = parseFloat(dayPattern.winRate);

    if (dayPattern.total > 50) {  // Only use if we have enough data
      if (winRate > 22) {
        adjustments.push(`${dayPattern.day} has high historical win rate (${winRate}%)`);
        viabilityAdjustment += 5;
        shouldUpgradeSignal = true;
        upgradeConfidence = 'High';
      } else if (winRate < 18) {
        adjustments.push(`${dayPattern.day} has low historical win rate (${winRate}%)`);
        viabilityAdjustment -= 10;
        shouldDowngradeSignal = true;
      }
    }
  }

  // Month patterns
  if (patterns.byMonth && patterns.byMonth[month]) {
    const monthPattern = patterns.byMonth[month];
    const winRate = parseFloat(monthPattern.winRate);

    if (monthPattern.total > 50) {
      if (winRate > 25) {
        adjustments.push(`${monthPattern.month} strong historically (${winRate}%)`);
        viabilityAdjustment += 3;
      } else if (winRate < 15) {
        adjustments.push(`${monthPattern.month} weak historically (${winRate}%)`);
        viabilityAdjustment -= 5;
      }
    }
  }

  // Gap effects (would need current gap data to apply)
  // This would be integrated if we have gap data for today

  // Range patterns (would need current range projection to apply)
  if (probExpiryOutside > 0.60 && patterns.rangePatterns && patterns.rangePatterns.wide) {
    const wideWinRate = (patterns.rangePatterns.wide.wins /
                        (patterns.rangePatterns.wide.wins + patterns.rangePatterns.wide.losses || 1)) * 100;
    if (wideWinRate > 40) {
      adjustments.push(`Wide range days historically favorable for RIC (${wideWinRate.toFixed(1)}%)`);
      viabilityAdjustment += 8;
    }
  }

  // Streak considerations
  if (patterns.streaks) {
    if (patterns.streaks.maxLossStreak > 100) {
      adjustments.push('Historically prone to long losing streaks - use tighter risk management');
      viabilityAdjustment -= 5;
    }
  }

  // Overall win rate adjustment
  if (patterns.summary) {
    const overallWinRate = parseFloat(patterns.summary.overallWinRate);
    if (overallWinRate < 25) {
      adjustments.push(`Historical win rate low (${overallWinRate}%) - requires selective entry`);
      viabilityAdjustment -= 5;
    }
  }

  return {
    adjustments,
    viabilityAdjustment,
    shouldUpgradeSignal,
    shouldDowngradeSignal,
    upgradeConfidence
  };
}

async function main() {
  try {
    console.error('📊 Analyzing 0DTE SPX options...');

    const spot = await getSpotPrice();
    console.error(`Spot Price: ${spot.spot}`);

    const probs = calculate0DTEProbabilities(spot.spot, CONFIG.targetPoints);

    const assessment = assess0DTEStrategy(probs, new Date());

    const output = {
      meta: {
        timestamp: CONFIG.timestamp,
        ticker: 'SPX',
        dte: '0DTE (same-day)',
        spot_price: spot.spot,
        historical_data_available: historicalPatterns !== null
      },
      strikes: {
        upper_target_50pts: probs.callStrike,
        lower_target_50pts: probs.putStrike
      },
      greeks: {
        upper_call_delta: probs.deltaCall.toFixed(3),
        lower_put_delta: probs.deltaPut.toFixed(3),
        combined_delta_exposure: probs.combinedDeltaExposure.toFixed(3)
      },
      probabilities: {
        prob_expiry_outside_range: Math.round(probs.probExpiryOutside * 100),
        prob_touching_range: Math.round(probs.probTouchingRange * 100)
      },
      ric_assessment: {
        signal: assessment.signal,
        viability_percent: assessment.viability,
        confidence: assessment.confidence,
        logic: assessment.logic
      }
    };

    // Include historical context if available
    if (assessment.historicalContext) {
      output.historical_context = {
        patterns_applied: assessment.historicalContext.adjustments,
        viability_adjustment: assessment.historicalContext.viabilityAdjustment,
        signal_upgraded: assessment.historicalContext.shouldUpgradeSignal,
        signal_downgraded: assessment.historicalContext.shouldDowngradeSignal
      };

      // Add historical summary if available
      if (historicalPatterns && historicalPatterns.summary) {
        output.historical_summary = {
          overall_win_rate: historicalPatterns.summary.overallWinRate + '%',
          total_analyzed: historicalPatterns.summary.totalDays,
          avg_win: '$' + historicalPatterns.summary.avgWin,
          avg_loss: '$' + historicalPatterns.summary.avgLoss
        };
      }
    }

    console.log(JSON.stringify(output, null, 2));
    process.exit(0);

  } catch (error) {
    console.error(JSON.stringify({
      error: error.message,
      timestamp: CONFIG.timestamp,
      ticker: 'SPX'
    }));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getSpotPrice,
  calculate0DTEProbabilities,
  assess0DTEStrategy,
  applyHistoricalPatterns
};
