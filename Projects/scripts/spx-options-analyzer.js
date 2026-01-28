#!/usr/bin/env node

/**
 * SPX Options Analyzer
 * Uses Yahoo Finance as primary data source (no API key required)
 */

const https = require('https');
const fs = require('fs');

// Configuration
const CONFIG = {
  dataSource: process.env.DATA_SOURCE || 'yahoo',
  apiEndpoint: process.env.FINANCIAL_DATASETS_API || 'https://api.financialdatasets.ai',
  apiKey: process.env.FINANCIAL_DATASETS_KEY || '',
  symbol: 'SPX',
  yahooSymbol: '^GSPC',  // Yahoo Finance uses ^GSPC for S&P 500 index
  targetPoints: 50,
  timestamp: new Date().toISOString()
};

// Simple HTTPS request implementation
function httpsRequest(options) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url);
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk.toString();
      });

      res.on('end', () => {
        const response = {
          status: res.statusCode,
          headers: res.headers,
          body: data
        };
        
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400) {
          const location = res.headers['location'];
          if (location) {
            // Follow redirect
            httpsRequest({
              ...options,
              url: `${url.protocol}//${url.host}${location}`
            }).then(resolve).catch(reject);
            return;
          }
        }
        
        resolve(response);
      });

      res.on('error', (err) => {
        reject(err);
      });

      req.end(options.body);
    });

    // Timeout
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
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

async function getSpotPriceFromYahoo() {
  try {
    const axios = require('axios');
    
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
      ticker: CONFIG.symbol
    };
  } catch (error) {
    console.error('Error fetching spot price from Yahoo Finance:', error.message);
    throw error;
  }
}

async function getSpotPriceFromSnapshot() {
  try {
    // Use Snapshot API: /prices/snapshot
    const url = `${CONFIG.apiEndpoint}/prices/snapshot`;
    console.log(`Fetching from: ${url}`);
    
    const response = await httpsRequest({
      url: url,
      headers: {
        'X-API-KEY': CONFIG.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ticker: CONFIG.symbol
      })
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    let data;
    if (typeof response.body === 'string') {
      data = JSON.parse(response.body);
    } else {
      data = response.body;
    }

    if (!data || !data.snapshot || !data.snapshot.price) {
      console.log('Available keys:', Object.keys(data || {}).join(', '));
      throw new Error('Invalid response: missing snapshot data');
    }

    return {
      spot: parseFloat(data.snapshot.price),
      timestamp: CONFIG.timestamp,
      ticker: CONFIG.symbol
    };
  } catch (error) {
    console.error('Error fetching spot price:', error.message);
    throw error;
  }
}

function calculateProbabilities(spotPrice, targetPoints) {
  const callStrike = Math.round(spotPrice + targetPoints);
  const putStrike = Math.round(spotPrice - targetPoints);

  const volATM = 0.15;
  const timeToExpiry = 1;
  const timeRoot = Math.sqrt(timeToExpiry / 365);
  
  const dCall = Math.log(callStrike / spotPrice) / (volATM * timeRoot);
  const dPut = Math.log(putStrike / spotPrice) / (volATM * timeRoot);

  const deltaCall = Math.exp(-dCall) * 0.5 * (1 + erf(dCall));
  const deltaPut = Math.exp(-dPut) * 0.5 * (1 + erf(dPut));

  const deltaCallAbs = Math.abs(deltaCall);
  const deltaPutAbs = Math.abs(deltaPut);

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

function assessStrategy(probs) {
  const { probExpiryOutside, probTouchingRange, deltaCall, deltaPut, combinedDeltaExposure } = probs;

  let signal = 'NEUTRAL';
  let logic = '';

  if (probExpiryOutside < 0.20) {
    signal = 'FAVORABLE';
    logic = 'Low Expiry Probability (<20%) suggests potential black swan event. High touch probability provides additional edge.';
  } else if (probExpiryOutside < 0.35 && probTouchingRange > 0.65) {
    signal = 'FAVORABLE';
    logic = 'Low-Moderate Expiry (20-35%) combined with High Touch (>65%) creates favorable conditions for Reverse Iron Condor. Requires automated profit-taking at ~25% target.';
  } else if (probExpiryOutside < 0.50 && probTouchingRange < 0.40) {
    signal = 'FAVORABLE';
    logic = 'Balanced risk profile with Expiry Outside 35-50% and Touch <40%. Standard entry point for RIC strategy.';
  } else if (probExpiryOutside >= 0.60) {
    signal = 'NEUTRAL';
    logic = 'High Expiry Probability (>60%) reduces Diamond Hands metric efficacy. Consider only if touch probability is very high (>75%) to capture Vega gains.';
  } else {
    signal = 'UNFAVORABLE';
    logic = 'Low Touch Probability (<40%) and/or High Expiry Probability (>60%) creates unfavorable conditions for RIC strategy.';
  }

  return { signal, logic };
}

async function main() {
  try {
    let spot;
    
    if (CONFIG.dataSource === 'yahoo') {
      spot = await getSpotPriceFromYahoo();
    } else {
      spot = await getSpotPriceFromSnapshot();
    }
    
    console.error(`Spot Price: ${spot.spot}`);

    const probs = calculateProbabilities(spot.spot, CONFIG.targetPoints);

    const assessment = assessStrategy(probs);

    const output = {
      meta: {
        timestamp: CONFIG.timestamp,
        ticker: CONFIG.symbol,
        spot_price: spot.spot,
        dte: 0
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
      strategy_assessment: {
        signal: assessment.signal,
        logic: assessment.logic
      }
    };

    console.log(JSON.stringify(output, null, 2));
    process.exit(0);

  } catch (error) {
    console.error(JSON.stringify({
      error: error.message,
      timestamp: CONFIG.timestamp,
      ticker: CONFIG.symbol
    }));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getSpotPriceFromSnapshot, calculateProbabilities, assessStrategy };
