#!/usr/bin/env node

/**
 * Master Workflow Controller
 * Runs all daily trading tasks in sequence
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runTask(name, command) {
  try {
    console.error(`\n🔄 Running: ${name}...`);
    execSync(command, {
      cwd: '/home/ubuntu/clawd',
      stdio: 'inherit',
      env: { ...process.env, DATA_SOURCE: 'yahoo' }
    });
    console.error(`✅ Completed: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${name}`);
    return false;
  }
}

function saveReport(tasks) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    tasks,
    summary: {
      total: tasks.length,
      passed: tasks.filter(t => t.success).length,
      failed: tasks.filter(t => !t.success).length
    }
  };

  const reportPath = path.join(__dirname, '../data/workflow-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(`\n📊 Report saved to ${reportPath}`);

  return report;
}

async function main() {
  console.error('🚀 Starting Daily Trading Workflow...\n');

  const tasks = [];

  // Task 1: Daily Trading Summary
  tasks.push({
    name: 'Daily Trading Summary',
    success: runTask(
      'Daily Trading Summary',
      'node scripts/daily-trading-summary.js'
    )
  });

  // Task 2: Portfolio Dashboard
  tasks.push({
    name: 'Portfolio Dashboard',
    success: runTask(
      'Portfolio Dashboard',
      'node scripts/portfolio-dashboard.js'
    )
  });

  // Task 3: Market Swing Monitor
  tasks.push({
    name: 'Market Swing Monitor',
    success: runTask(
      'Market Swing Monitor',
      'node scripts/market-swing-monitor.js'
    )
  });

  // Task 4: SPX 0DTE Analyzer
  tasks.push({
    name: 'SPX 0DTE Options Analyzer',
    success: runTask(
      'SPX 0DTE Options Analyzer',
      'node scripts/spx-0dte-analyzer.js'
    )
  });

  // Task 5: 0DTE Signal Monitor
  tasks.push({
    name: '0DTE Signal Monitor',
    success: runTask(
      '0DTE Signal Monitor',
      'node scripts/0dte-signal-monitor.js'
    )
  });

  // Save report
  const report = saveReport(tasks);

  // Summary
  console.error('\n' + '='.repeat(50));
  console.error('📊 WORKFLOW SUMMARY');
  console.error('='.repeat(50));
  console.error(`Time: ${timestamp}`);
  console.error(`Passed: ${report.summary.passed}/${report.summary.total}`);
  console.error(`Failed: ${report.summary.failed}/${report.summary.total}`);

  tasks.forEach(task => {
    const status = task.success ? '✅' : '❌';
    console.error(`${status} ${task.name}`);
  });

  if (report.summary.failed === 0) {
    console.error('\n🎉 All tasks completed successfully!');
  } else {
    console.error('\n⚠️  Some tasks failed - review output above');
  }

  process.exit(report.summary.failed === 0 ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTask, saveReport };
