#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadConfig() {
  const config = {
    symbol: process.env.MARKET_SYMBOL || '^GSPC',
    threshold: 50,
    dataSource: process.env.DATA_SOURCE || 'yahoo',  // Default to yahoo now
    apiEndpoint: process.env.FINANCIAL_DATASETS_API || 'https://api.financialdatasets.ai',
    alphaVantageKey: process.env.ALPHA_VANTAGE_KEY || '',
    twitterToken: '',
    twitterUsername: 'CShoggoth83269',
    apiKey: ''
  };

  // Load Twitter auth
  const envFile = path.join(__dirname, '.twitter-auth.env');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    const tokenMatch = envContent.match(/TWITTER_AUTH_TOKEN="([^"]+)"/);
    const userMatch = envContent.match(/TWITTER_USERNAME="([^"]+)"/);
    if (tokenMatch) config.twitterToken = tokenMatch[1];
    if (userMatch) config.twitterUsername = userMatch[1];
  }

  // Load FinancialDatasets key
  if (process.env.FINANCIAL_DATASETS_KEY) {
    config.apiKey = process.env.FINANCIAL_DATASETS_KEY;
  }

  return config;
}

function getMockMarketData() {
  const scenarios = [
    { swing: 120, percent: 2.4 },
    { swing: -85, percent: -1.7 },
    { swing: 15, percent: 0.3 },
    { swing: -20, percent: -0.4 },
    { swing: 55, percent: 1.1 }
  ];

  const dayOfMonth = new Date().getDate();
  const scenario = scenarios[dayOfMonth % scenarios.length];

  const basePrice = 5100;
  const previousClose = basePrice;
  const currentClose = previousClose + scenario.swing;
  const swing = currentClose - previousClose;
  const swingPercent = scenario.percent;

  return {
    previousClose,
    currentClose,
    swing,
    swingPercent,
    source: 'Mock (demo mode)'
  };
}

async function getMarketDataFromYahoo() {
  const axios = require('axios');
  const config = loadConfig();
  
  const ticker = config.symbol === '^GSPC' ? '%5EGSPC' : config.symbol;
  
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const result = response.data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators.quote[0];
    
    if (!meta || !quote) {
      throw new Error('Invalid response from Yahoo Finance - missing data');
    }
    
    const currentPrice = meta.regularMarketPrice || quote.close[0];
    const previousClose = meta.previousClose || quote.close[0];
    
    const swing = currentPrice - previousClose;
    const swingPercent = previousClose > 0 ? (swing / previousClose) * 100 : 0;
    
    return {
      previousClose,
      currentPrice,
      swing,
      swingPercent,
      source: 'Yahoo Finance (unofficial)'
    };
  } catch (error) {
    console.error('Error fetching from Yahoo Finance:', error.message);
    throw error;
  }
}

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

async function getMarketDataFromFinancialdatasets() {
  const config = loadConfig();

  if (!config.apiKey) {
    throw new Error('FINANCIAL_DATASETS_KEY environment variable required');
  }

  const ticker = config.symbol === '^GSPC' ? 'SPY' : config.symbol;
  const url = `${config.apiEndpoint}/prices/snapshot`;

  const response = await httpsRequest({
    url: url,
    headers: {
      'X-API-KEY': config.apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ticker: ticker
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
    throw new Error('Invalid response from FinancialDatasets - missing price data');
  }

  const currentPrice = parseFloat(data.snapshot.price);
  const previousClose = parseFloat(data.snapshot.previous_close || 0);

  const swing = currentPrice - previousClose;
  const swingPercent = previousClose > 0 ? (swing / previousClose) * 100 : 0;

  return {
    previousClose,
    currentPrice,
    swing,
    swingPercent,
    source: 'FinancialDatasets'
  };
}

async function getMarketData() {
  try {
    const config = loadConfig();
    let data;

    switch (config.dataSource) {
      case 'financialdatasets':
        data = await getMarketDataFromFinancialdatasets();
        break;
      case 'yahoo':
        data = await getMarketDataFromYahoo();
        break;
      case 'mock':
        data = await getMockMarketData();
        break;
      default:
        throw new Error(`Unknown data source: ${config.dataSource}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching market data:', error.message);
    throw error;
  }
}

function formatAnalysis(data) {
  const direction = data.swing > 0 ? '🟢 UP' : '🔴 DOWN';
  const isSwinging = Math.abs(data.swingPercent) >= data.threshold;

  const currentPrice = data.currentClose || data.currentPrice;

  const message = `
📊 **Daily Market Analysis - S&P 500**

${direction} **${data.swing.toFixed(2)} points** (${data.swingPercent >= 0 ? '+' : ''}${data.swingPercent.toFixed(2)}%)

Source: ${data.source}
Previous Close: ${data.previousClose.toFixed(2)}
Current Price: ${currentPrice.toFixed(2)}

${isSwinging ? '⚠️ SWING ALERT: ' + Math.abs(data.swingPercent).toFixed(2) + '% move detected!' : '✅ Normal trading day'}
`.trim();

  return {
    ...data,
    isSwinging,
    message
  };
}

async function postToX(message) {
  const config = loadConfig();

  if (!config.twitterToken) {
    console.log('⚠️ No Twitter auth token configured, skipping X post');
    return false;
  }

  try {
    console.log('📤 Posting to X...');

    const response = await httpsRequest({
      url: 'https://api.twitter.com/2/tweets',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.twitterToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message
      })
    });

    let responseData;
    try {
      responseData = JSON.parse(response.body);
    } catch (e) {
      console.log('Response was not JSON:', response.body.substring(0, 200));
      return false;
    }

    if (responseData.data && responseData.data.id) {
      console.log(`✅ Posted to X! Tweet ID: ${responseData.data.id}`);
      console.log(`🔗 https://x.com/${config.twitterUsername}/status/${responseData.data.id}`);
      return true;
    } else {
      console.log('❌ Failed to post to X:', responseData);
      return false;
    }
  } catch (error) {
    console.error('❌ Error posting to X:', error.message);
    return false;
  }
}

async function main() {
  console.log('📈 Fetching market data...');

  const data = await getMarketData();
  const analysis = formatAnalysis(data);

  console.log(analysis.message);

  if (analysis.isSwinging) {
    const posted = await postToX(analysis.message);
    if (posted) {
      console.log('✅ Swing alert posted to social media');
    } else {
      console.log('⚠️ Failed to post swing alert');
    }
  } else {
    console.log('ℹ️ No swing detected, not posting to social media');
  }

  process.exit(analysis.isSwinging ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(2);
  });
}

module.exports = { getMarketData, formatAnalysis, postToX };
