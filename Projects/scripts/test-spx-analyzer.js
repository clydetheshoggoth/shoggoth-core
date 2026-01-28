#!/usr/bin/env node

/**
 * SPX Options Analyzer - Simplified
 * Tests SPX options calculation logic with mock data
 */

// Simplified error function for Math.erf fallback
function errorFunction(x) {
  const signX = x < 0 ? -1 : 1;
  xAbs = Math.abs(x);
  const a1 = 0.254829597;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const a6 = 0.3765586;
  const a7 = 0.358023557;
  const a8 = 0.381418652;
  const a9 = 0.274599345;
  const a10 = 0.087941357;
  const a11 = 0.046711542;
  const p = 0.3275911;
  const signX1 = xAbs < 1 ? -1 : 1;
  const n = 1 + Math.floor(xAbs * 0.5);
  const d = 1 + Math.floor(xAbs * 0.5);
  let signX2 = x < 0 ? -1 : 1;
  let y = signX1 * a1 + signX2 * a2 + signX1 * a3 + signX2 * a4;
  let yz = y + signX1 * a5 + signX2 * a6;
  yz = y * y;
  return signX1 * yz;
}

async function test() {
  // Test Case 1: Normal day (no swing)
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Normal day (no swing)');
  console.log('='.repeat(60));

  let spot = { spot: 5000, timestamp: new Date().toISOString(), ticker: 'SPX' };
  let probs = calculateProbabilities(spot.spot, 50);
  let assessment = assessStrategy(probs);

  console.log('Spot Price:', spot.spot);
  console.log('Upper Strike (+50):', probs.callStrike);
  console.log('Lower Strike (-50):', probs.putStrike);
  console.log('Call Delta:', probs.deltaCall.toFixed(3));
  console.log('Put Delta:', probs.deltaPut.toFixed(3));
  console.log('Prob Expiry Outside (+/- 50):', (probs.probExpiryOutside * 100).toFixed(1) + '%');
  console.log('Prob Touching (+/- 50):', (probs.probTouchingRange * 100).toFixed(1) + '%');
  console.log('='.repeat(60));
  console.log('Signal:', assessment.signal);
  console.log('Logic:', assessment.logic);
  console.log('='.repeat(60));

  const output = {
    meta: { timestamp: spot.timestamp, ticker: spot.ticker, spot_price: spot.spot, dte: 0 },
    strikes: { upper_target_50pts: probs.callStrike, lower_target_50pts: probs.putStrike },
    greeks: { upper_call_delta: probs.deltaCall, lower_put_delta: probs.deltaPut, combined_delta_exposure: probs.combinedDeltaExposure },
    probabilities: { prob_expiry_outside_range: Math.round(probs.probExpiryOutside * 100), prob_touching_range: Math.round(probs.probTouchingRange * 100) },
    strategy_assessment: { signal: assessment.signal, logic: assessment.logic }
  };

  console.log('='.repeat(60));
  console.log('📊 JSON OUTPUT:');
  console.log(JSON.stringify(output, null, 2));
  console.log('='.repeat(60));

  // Test Case 2: Big up swing day (swing of 85)
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Big swing day (swing of 85)');
  console.log('='.repeat(60));

  spot.spot = 5085; // +85
  probs = calculateProbabilities(spot.spot, 50);
  assessment = assessStrategy(probs);

  console.log('Spot Price:', spot.spot);
  console.log('Upper Strike (+50):', probs.callStrike);
  console.log('Lower Strike (-50):', probs.putStrike);
  console.log('Call Delta:', probs.deltaCall.toFixed(3));
  console.log('Put Delta:', probs.deltaPut.toFixed(3));
  console.log('Prob Expiry Outside (+/- 50):', (probs.probExpiryOutside * 100).toFixed(1) + '%');
  console.log('Prob Touching (+/- 50):', (probs.probTouchingRange * 100).toFixed(1) + '%');
  console.log('='.repeat(60));
  console.log('Signal:', assessment.signal);
  console.log('Logic:', assessment.logic);
  console.log('='.repeat(60));

  const output2 = {
    meta: { timestamp: spot.timestamp, ticker: spot.ticker, spot_price: spot.spot, dte: 0 },
    strikes: { upper_target_50pts: probs.callStrike, lower_target_50pts: probs.putStrike },
    greeks: { upper_call_delta: probs.deltaCall, lower_put_delta: probs.deltaPut, combined_delta_exposure: probs.combinedDeltaExposure },
    probabilities: { prob_expiry_outside_range: Math.round(probs.probExpiryOutside * 100), prob_touching_range: Math.round(probs.probTouchingRange * 100) },
    strategy_assessment: { signal: assessment.signal, logic: assessment.logic }
  };

  console.log('='.repeat(60));
  console.log('📊 JSON OUTPUT:');
  console.log(JSON.stringify(output2, null, 2));
  console.log('='.repeat(60));

  process.exit(0);
}

function calculateProbabilities(spotPrice, targetPoints) {
  const callStrike = Math.round(spotPrice + targetPoints);
  const putStrike = Math.round(spotPrice - targetPoints);

  const volATM = 0.15;
  const timeToExpiry = 1;
  const timeRoot = Math.sqrt(timeToExpiry / 365);

  const dCall = Math.log(callStrike / spotPrice) / (volATM * timeRoot);
  const dPut = Math.log(putStrike / spotPrice) / (volATM * timeRoot);

  const deltaCall = Math.exp(-dCall) * 0.5 * (1 + errorFunction(dCall));
  const deltaPut = Math.exp(-dPut) * 0.5 * (1 + errorFunction(dPut));

  const deltaCallAbs = Math.abs(deltaCall);
  const deltaPutAbs = Math.abs(deltaPut);

  const probExpiryOutside = deltaCallAbs + deltaPutAbs;
  const probTouchingRange = 2 * Math.max(deltaCallAbs, deltaPutAbs) * 0.95;

  return {
    callStrike,
    putStrike,
    deltaCall,
    deltaPut,
    combinedDeltaExposure: deltaCallAbs + deltaPutAbs,
    probExpiryOutside: Math.min(0.99, probExpiryOutside),
    probTouchingRange: Math.min(0.90, probTouchingRange)
  };
}

function assessStrategy(probs) {
  const probExpiryOutside = probs.probExpiryOutside * 100;
  const probTouchingRange = probs.probTouchingRange * 100;

  let signal = 'NEUTRAL';
  let logic = '';

  if (probExpiryOutside < 20) {
    signal = 'FAVORABLE';
    logic = 'Low Expiry Probability (<20%) suggests potential black swan event. High touch probability provides additional edge.';
  } else if (probExpiryOutside < 35 && probTouchingRange > 65) {
    signal = 'FAVORABLE';
    logic = 'Low-Moderate Expiry (20-35%) combined with High Touch (>65%) creates favorable conditions for Reverse Iron Condor. Requires automated profit-taking at ~25% target.';
  } else if (probExpiryOutside < 50 && probTouchingRange < 40) {
    signal = 'FAVORABLE';
    logic = 'Balanced risk profile with Expiry Outside 35-50% and Touch <40%. Standard entry point for RIC strategy.';
  } else if (probExpiryOutside >= 60) {
    signal = 'NEUTRAL';
    logic = 'High Expiry Probability (>60%) reduces Diamond Hands metric efficacy. Consider only if touch probability is very high (>75%) to capture Vega gains.';
  } else {
    signal = 'UNFAVORABLE';
    logic = 'Low Touch Probability (<40%) and/or High Expiry Probability (>60%) creates unfavorable conditions for RIC strategy.';
  }

  return { signal, logic };
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
