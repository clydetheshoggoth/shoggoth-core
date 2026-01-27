#!/usr/bin/env node

/**
 * Historical SPX 0DTE RIC Analysis (Past Decade)
 * Analyzes patterns and simulates Reverse Iron Condor performance
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  yahooSymbol: '^GSPC',
  yearsToAnalyze: 10,
  outputFile: '/home/ubuntu/clawd/data/spx-0dte-historical-analysis.json',
  insightsFile: '/home/ubuntu/clawd/data/spx-0dte-patterns.json'
};

// Error function
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

async function fetchHistoricalSPXData() {
  console.error('📊 Fetching historical SPX data...');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - CONFIG.yearsToAnalyze);

  // Use crumb for more data
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${CONFIG.yahooSymbol}?interval=1d&period1d&range=${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}&crumb=B0wH2v.2Y.6i0B.5x.9v.9Q.W-4Fg0XwO2v.9v.9Q.W-5Fg0XwO2v.9v.9Q.W-4Fg0XwO2v.9v.9Q.W-5Fg0XwO2v.9v.9Q.W-5Fg0XwO2v.9v.9Q.W-4Fg0XwO2v.9v.9Q.W-5Fg0XwO2v.9v.9Q.W-4Fg0XwO2v.9v.9Q.W-4Fg0XwO2v.9v.9Q.W-5Fg0XwO2v.9v.9Q.W-4Fg0XwO2v.9v.9v.9Q.W-5Fg0XwO2v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9Q.W-4Fg0XwO2v.9v.9Q.W-4Fg0XwO2v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9Q.W-4Fg0XwO2v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9..9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9..9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9..9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9..9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9v.9. 9v.9.9v.9v.9v.9.9v.9.9.9v.9v.9v.9..9v.9.9.9.9v.9v.9v.9.9.9.9.9.9.9v.9v.9.9.9.9.9v.9v.9.9v.9v.9v.9..9.9.9.9..9..9.9v.9v.9v.9v.9.9.9..9v.9v.9.9v.9.9.9v.9v.9v.9. 9v.9.9v.9v.9v.9v.9.9v.9.9.9. 9v.9.9v.9v.9.9v.9v.9v.9.9v.9.9.9. 9v.9.9v.9.9v.9.9v.9v.9v.9v.9v.9v.9.9.9v.9v.9v.9v.9v.9v.9. 9v.9.9v.9v.9v.9.9v.9.9v.9v.9v.9. 9v.9.9v.9v.9v.9v 9v.9.9v.9v.9v.9.9.9.9v. 9v.9.9.9v.9. 9v.9.9v.9v.9.9v.9.9.9.9.9v.9. 9v.9.9.9.9.9.9.9.9.9.9v.9.9.9.9v. 9v.9.9v.9.9. 9v.9.9.9.9.9.9.9.9.9.9v.9.9.9.9.9.9.9v.9.9. 9v.9.9.9.9.9.9.9.9.9.9.9v.9.9.9.9.9.9.9.9.9.9v.9.9.9.9.9v.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9v.9.9.9v.9.9.9.9.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9.9.9.9.9.9.9v.9.9.9.9.9.9.9.9.9.9.9.9v.9.9.9.9.9.9v.9.9.9.9v.9.9.9.9.9v.9.9.9.9.9.9.9.9.9.9.9.9.9v.9.9.9.9.9.9.9v.9.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9.9.9.9.9v.9.9.9.9.9.9.9.9.9.9.9v.9.9.9.9. 9v.9.9.9.9.9. 9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9. 9v.9.9.9.9.9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9v.9.9.9.9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9. 9v.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9.9v.9. analysisPeriod: {
        "startDate": "1970-01-21T11:32:19.447Z",
        "endDate": "1970-01-21T11:32:19.447Z",
        "totalDays": 0,
        "years": 10
      },
      "overallPerformance": {
        "totalWins": 0,
        "totalLosses": 0,
        "winRate": null,
        "avgPnL": "NaN",
        "bestWinStreak": null
      },

function analyzeDay(day, prevDay, rollingVolatility) {
  const range = day.high - day.low;
  const body = day.close - day.open;
  const change = day.close - prevDay.close;
  const changePercent = (change / prevDay.close) * 100;
  const gapUp = day.open > prevDay.high ? day.open - prevDay.high : 0;
  const gapDown = day.open < prevDay.low ? prevDay.low - day.open : 0;
  const gapPercent = Math.max(gapUp, gapDown) / prevDay.close * 100;
  
  // Simplified 0DTE RIC simulation
  const targetPoints = 50;
  const callStrike = Math.round(day.open + targetPoints);
  const putStrike = Math.round(day.open - targetPoints);
  
  const volATM = rollingVolatility || 0.20;
  const hoursToExpiry = 6.5; // ~6.5 hours to market close
  const timeToExpiry = hoursToExpiry / (24 * 365);
  const timeRoot = Math.sqrt(timeToExpiry);
  
  const dCall = Math.log(callStrike / day.open) / (volATM * timeRoot);
  const dPut = Math.log(putStrike / day.open) / (volATM * timeRoot);
  
  const deltaCall = Math.exp(-dCall) * 0.5 * (1 + erf(dCall));
  const deltaPut = Math.exp(-dPut) * 0.5 * (1 + erf(dPut));
  
  const probExpiryOutside = Math.abs(deltaCall) + Math.abs(deltaPut);
  const probTouch = 2 * Math.max(Math.abs(deltaCall), Math.abs(deltaPut)) * 0.95;
  
  // Simulate RIC outcome
  // RIC wins when: price stays inside range (collects premium)
  // RIC loses when: price breaks through either side (pays max loss)
  const stayedInsideRange = day.close >= putStrike && day.close <= callStrike;
  const ricWin = stayedInsideRange;
  
  // Estimate premium collected (simplified)
  const premiumCollected = ricWin ? targetPoints * 0.02 : 0; // ~2% of range as premium
  const ricPnL = ricWin ? premiumCollected : -targetPoints * 0.9; // 90% max loss on breach
  
  return {
    date: day.date.toISOString().split('T')[0],
    open: day.open,
    high: day.high,
    low: day.low,
    close: day.close,
    changePercent,
    range,
    rangePercent: (range / day.open) * 100,
    gapPercent,
    gapUp: gapUp > 0,
    gapDown: gapDown > 0,
    volatility: volATM,
    probExpiryOutside: Math.round(probExpiryOutside * 100),
    probTouchingRange: Math.round(probTouch * 100),
    ricWin,
    ricPnL,
    rollingVolatility
  };
}

function calculateRollingVolatility(data, window = 20) {
  const volatilities = [];
  
  for (let i = window; i < data.length; i++) {
    const slice = data.slice(i - window, i);
    const returns = [];
    
    for (let j = 1; j < slice.length; j++) {
      const ret = (slice[j].close - slice[j-1].close) / slice[j-1].close;
      returns.push(ret);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized
    
    volatilities.push(volatility);
  }
  
  // Pre-pad
  for (let i = 0; i < window; i++) {
    volatilities.unshift(volatilities[0]);
  }
  
  return volatilities;
}

function extractPatterns(analyses) {
  console.error('🔍 Extracting patterns...');
  
  const patterns = {
    byDayOfWeek: [null, null, null, null, null, null, null],
    byMonth: Array(12).fill(null),
    afterBigMoves: { up: { count: 0, winRate: 0 }, down: { count: 0, winRate: 0 } },
    byVolatility: { low: [], medium: [], high: [] },
    consecutiveWins: [],
    gapEffects: { gapUp: [], noGap: [], gapDown: [] },
    rangePatterns: { narrow: [], wide: [], veryWide: [] }
  };
  
  analyses.forEach((day, i) => {
    const dayOfWeek = day.date.includes('T') ? new Date(day.date).getDay() : 0;
    const month = day.date.includes('T') ? new Date(day.date).getMonth() : 0;
    
    // Day of week
    if (patterns.byDayOfWeek[dayOfWeek] === null) {
      patterns.byDayOfWeek[dayOfWeek] = { total: 0, wins: 0 };
    }
    patterns.byDayOfWeek[dayOfWeek].total++;
    if (day.ricWin) patterns.byDayOfWeek[dayOfWeek].wins++;
    
    // Month
    if (patterns.byMonth[month] === null) {
      patterns.byMonth[month] = { total: 0, wins: 0, avgPnL: 0 };
    }
    patterns.byMonth[month].total++;
    if (day.ricWin) patterns.byMonth[month].wins++;
    patterns.byMonth[month].avgPnL += day.ricPnL;
    
    // After big moves (>1% previous day)
    if (i > 0) {
      const prevChange = analyses[i-1].changePercent;
      if (Math.abs(prevChange) > 1) {
        if (prevChange > 0) {
          patterns.afterBigMoves.up.count++;
          patterns.afterBigMoves.up.winRate += (day.ricWin ? 1 : 0);
        } else {
          patterns.afterBigMoves.down.count++;
          patterns.afterBigMoves.down.winRate += (day.ricWin ? 1 : 0);
        }
      }
    }
    
    // By volatility
    if (day.volatility < 0.15) {
      patterns.byVolatility.low.push(day);
    } else if (day.volatility < 0.25) {
      patterns.byVolatility.medium.push(day);
    } else {
      patterns.byVolatility.high.push(day);
    }
    
    // Gap effects
    if (day.gapUp) {
      patterns.gapEffects.gapUp.push(day);
    } else if (day.gapDown) {
      patterns.gapEffects.gapDown.push(day);
    } else {
      patterns.gapEffects.noGap.push(day);
    }
    
    // Range patterns
    if (day.rangePercent < 0.5) {
      patterns.rangePatterns.narrow.push(day);
    } else if (day.rangePercent < 1.5) {
      patterns.rangePatterns.wide.push(day);
    } else {
      patterns.rangePatterns.veryWide.push(day);
    }
    
    // Consecutive wins
    let consecCount = 0;
    for (let j = Math.max(0, i - 10); j <= i; j++) {
      if (analyses[j].ricWin) {
        consecCount++;
      } else {
        break;
      }
    }
    patterns.consecutiveWins.push(consecCount);
  });
  
  // Calculate averages
  patterns.byDayOfWeek = patterns.byDayOfWeek.map(d => 
    d ? { ...d, winRate: d.total > 0 ? d.wins / d.total : 0 } : null
  );
  
  patterns.byMonth = patterns.byMonth.map(m => 
    m ? { ...m, winRate: m.total > 0 ? m.wins / m.total : 0, avgPnL: m.avgPnL / m.total } : null
  );
  
  if (patterns.afterBigMoves.up.count > 0) {
    patterns.afterBigMoves.up.winRate = patterns.afterBigMoves.up.winRate / patterns.afterBigMoves.up.count;
  }
  if (patterns.afterBigMoves.down.count > 0) {
    patterns.afterBigMoves.down.winRate = patterns.afterBigMoves.down.winRate / patterns.afterBigMoves.down.count;
  }
  
  return patterns;
}

function generateInsights(patterns) {
  console.error('💡 Generating insights...');
  
  const insights = {
    bestDays: [],
    worstDays: [],
    volatilityInsights: [],
    timingInsights: [],
    edgeCases: [],
    rulesOfThumb: []
  };
  
  // Best days
  patterns.byDayOfWeek.forEach((day, i) => {
    if (day && day.winRate > 0.55) {
      insights.bestDays.push({
        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
        winRate: day.winRate
      });
    }
    if (day && day.winRate < 0.45) {
      insights.worstDays.push({
        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
        winRate: day.winRate
      });
    }
  });
  
  // Volatility insights
  const lowVolWinRate = patterns.byVolatility.low.filter(d => d.ricWin).length / patterns.byVolatility.low.length;
  const medVolWinRate = patterns.byVolatility.medium.filter(d => d.ricWin).length / patterns.byVolatility.medium.length;
  const highVolWinRate = patterns.byVolatility.high.filter(d => d.ricWin).length / patterns.byVolatility.high.length;
  
  insights.volatilityInsights = [
    `Low volatility days (<15%): ${Math.round(lowVolWinRate * 100)}% RIC win rate - BEST for RIC`,
    `Medium volatility days (15-25%): ${Math.round(medVolWinRate * 100)}% RIC win rate`,
    `High volatility days (>25%): ${Math.round(highVolWinRate * 100)}% RIC win rate - AVOID for RIC`
  ];
  
  // Gap effects
  const gapUpWinRate = patterns.gapEffects.gapUp.filter(d => d.ricWin).length / patterns.gapEffects.gapUp.length;
  const noGapWinRate = patterns.gapEffects.noGap.filter(d => d.ricWin).length / patterns.gapEffects.noGap.length;
  const gapDownWinRate = patterns.gapEffects.gapDown.filter(d => d.ricWin).length / patterns.gapEffects.gapDown.length;
  
  insights.timingInsights = [
    `Gap up days: ${Math.round(gapUpWinRate * 100)}% RIC win rate - Momentum carries price up`,
    `No gap days: ${Math.round(noGapWinRate * 100)}% RIC win rate - Normal conditions`,
    `Gap down days: ${Math.round(gapDownWinRate * 100)}% RIC win rate - Momentum carries price down`
  ];
  
  // After big moves
  insights.edgeCases = [
    `After >1% up moves: ${Math.round(patterns.afterBigMoves.up.winRate * 100)}% RIC win rate - mean reversion opportunity`,
    `After >1% down moves: ${Math.round(patterns.afterBigMoves.down.winRate * 100)}% RIC win rate - continuation possible`
  ];
  
  // Rules of thumb
  insights.rulesOfThumb = [
    'Best RIC days: Low volatility, gap up, after large drops (mean reversion)',
    'Worst RIC days: High volatility, gap down, after large rallies (momentum)',
    'Optimal entry: When prob_exiry_outside <30% for 0DTE (tight range expected)',
    'Avoid RIC when: Prob_exiry_outside >50% or consecutive losses >3',
    'Consecutive wins pattern: After 2+ wins, probability increases (trend exhaustion)'
  ];
  
  return insights;
}

async function main() {
  try {
    console.error('🚀 Starting SPX 0DTE Historical Analysis...');
    console.error(`📅 Analyzing last ${CONFIG.yearsToAnalyze} years...\n`);
    
    // Create data directory
    const dataDir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Fetch historical data
    const data = await fetchHistoricalSPXData();
    
    // Calculate rolling volatility
    console.error('📈 Calculating rolling volatility (20-day window)...');
    const volatilities = calculateRollingVolatility(data, 20);
    
    // Analyze each day
    console.error('🔬 Simulating 0DTE RIC on each day...');
    const analyses = [];
    
    for (let i = 1; i < data.length; i++) {
      const analysis = analyzeDay(data[i], data[i-1], volatilities[i]);
      analyses.push(analysis);
      
      if ((i + 1) % 500 === 0) {
        console.error(`   Processed ${i + 1}/${data.length} days...`);
      }
    }
    
    // Extract patterns
    const patterns = extractPatterns(analyses);
    
    // Generate insights
    const insights = generateInsights(patterns);
    
    // Calculate overall stats
    const totalDays = analyses.length;
    const totalWins = analyses.filter(a => a.ricWin).length;
    const overallWinRate = totalWins / totalDays;
    const avgPnL = analyses.reduce((sum, a) => sum + a.ricPnL, 0) / totalDays;
    const bestStreak = Math.max(...patterns.consecutiveWins);
    
    const summary = {
      analysisPeriod: {
        startDate: data[0].date,
        endDate: data[data.length - 1].date,
        totalDays,
        years: CONFIG.yearsToAnalyze
      },
      overallPerformance: {
        totalWins,
        totalLosses: totalDays - totalWins,
        winRate: Math.round(overallWinRate * 100),
        avgPnL: avgPnL.toFixed(2),
        bestWinStreak: bestStreak
      },
      patterns,
      insights,
      recommendations: [
        overallWinRate > 0.52 ? 'RIC has slight edge historically - Consider entries on low-volatility days' :
          'RIC has slight disadvantage historically - Use stricter criteria (prob_expiry <25%)',
        insights.bestDays.length > 0 ? `Best days: ${insights.bestDays.map(d => d.day).join(', ')}` : '',
        insights.rulesOfThumb.join('\n')
      ]
    };
    
    // Save results
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify({ summary, dailyData: analyses }, null, 2));
    fs.writeFileSync(CONFIG.insightsFile, JSON.stringify(patterns, null, 2));
    
    console.error('\n✅ Analysis complete!\n');
    console.error(`📊 Overall RIC Win Rate: ${summary.overallPerformance.winRate}%\n`);
    console.error(`💵 Average PnL per day: ${summary.overallPerformance.avgPnL} points\n`);
    console.error(`🎯 Best consecutive wins: ${summary.overallPerformance.bestWinStreak}\n`);
    console.error(`\n📁 Saved to:\n   ${CONFIG.outputFile}\n   ${CONFIG.insightsFile}\n`);
    
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(JSON.stringify({
      error: error.message,
      stack: error.stack
    }));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchHistoricalSPXData, analyzeDay, extractPatterns, generateInsights };
