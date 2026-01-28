#!/bin/bash
cd /home/ubuntu/clawd

# Set environment variables for real data (Yahoo Finance - no API key needed)
export DATA_SOURCE=yahoo

# Load Twitter auth
if [ -f .twitter-auth.env ]; then
  export $(grep -v '^export' .twitter-auth.env | cut -d' ' -f2)
fi

# Run monitor
exec node scripts/market-swing-monitor.js
