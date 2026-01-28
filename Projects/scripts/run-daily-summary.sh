#!/bin/bash

# Wrapper script for daily trading summary
# Sets environment and runs the script

export DATA_SOURCE=yahoo
export WORKDIR=/home/ubuntu/clawd

cd $WORKDIR
node scripts/daily-trading-summary.js
