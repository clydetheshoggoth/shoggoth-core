#!/usr/bin/env node

/**
 * ClawdHub OAuth Automation Script
 * Automates browser-based login using Puppeteer
 */

const puppeteer = require('puppeteer-extra');
const { chromiumPath } = require('puppeteer');

async function loginToClawdHub() {
  console.log('🌐 Launching browser for ClawdHub login...');
  
  const browser = await puppeteer.launch({
    headless: true,  // Use headless mode (no GUI required)
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occlusion',
      '--disable-renderer-backgrounding',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-extensions',
      '--disable-features=VizDisplayCompositor',
      '--disable-gpu',
      '--disable-ipc',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--force-color-profile=srgb',
      '--hide-scrollbars',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-zygote',
      '--window-size=1920,1080'
    ]
  });
  
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport(1920, 1080);
  
  // Navigate to ClawdHub
  console.log('📍 Navigating to ClawdHub...');
  await page.goto('https://clawdhub.com/login', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });
  
  // Wait for login page to load
  await page.waitForSelector('.login-form, #login-container, [data-testid="login"]', {
    timeout: 10000
  });
  
  // Check if we're already logged in
  const alreadyLoggedIn = await page.evaluate(() => {
    return document.body.includes('Dashboard') ||
           document.body.includes('Welcome') ||
           document.body.includes('Log out');
  });
  
  if (alreadyLoggedIn && !document.body.includes('Log out')) {
    console.log('✅ Already logged in to ClawdHub');
    await browser.close();
    return { success: true, message: 'Already authenticated' };
  }
  
  console.log('🔐 Login page loaded');
  
  // NOTE: This script provides the browser automation framework
  // Actual login credentials need to be handled
  // For security reasons, we should not hardcode credentials
  
  console.log('⚠️  Browser automation framework ready');
  console.log('📝 Next steps:');
  console.log('   1. Provide authentication method (OAuth flow)');
  console.log('   2. Add credential handling (token, API key, etc.)');
  console.log('   3. Integrate with search and research workflows');
  
  await browser.close();
  
  return {
    success: false,
    message: 'Browser automation framework ready - credentials needed',
    nextSteps: [
      'Implement OAuth flow automation',
      'Add token storage',
      'Add search execution after login'
    ]
  };
}

async function testBrowser() {
  console.log('🧪 Testing browser environment...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.goto('https://example.com');
  
  const title = await page.title();
  console.log(`✅ Browser test successful - page title: ${title}`);
  
  await browser.close();
  
  return { success: true };
}

if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'login':
      loginToClawdHub().catch(err => {
        console.error('❌ Login failed:', err.message);
        process.exit(1);
      });
      break;
      
    case 'test':
      testBrowser().catch(err => {
        console.error('❌ Browser test failed:', err.message);
        process.exit(1);
      });
      break;
      
    default:
      console.log('Usage: node clawdhub-oauth.js [command]');
      console.log('Commands:');
      console.log('  login  - Attempt browser-based login to ClawdHub');
      console.log('  test   - Test browser environment');
      process.exit(0);
  }
}

module.exports = { loginToClawdHub, testBrowser };
