#!/usr/bin/env node

/**
 * SPX Options Analyzer - Debug Mode
 * Fetches full FinancialDatasets response and saves it for inspection
 */

const https = require('https');
const fs = require('fs');

const CONFIG = {
  apiEndpoint: process.env.FINANCIAL_DATASETS_API || 'https://api.financialdatasets.ai',
  apiKey: process.env.FINANCIAL_DATASETS_KEY || '',
  symbol: 'SPX',
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

async function debugAPI() {
  try {
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

    console.log(`Response status: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Body length: ${response.body?.length || 0}`);

    if (response.body) {
      console.log(`Body preview (first 200 chars): ${response.body.substring(0, 200)}`);
      
      const outputDir = '/home/ubuntu/clawd/debug';
      
      // Save full response to file
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      const filePath = `${outputDir}/snapshot-response-${new Date().toISOString()}.txt`;
      fs.writeFileSync(filePath, response.body);
      
      console.log(`Saved response to: ${filePath}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugAPI();
