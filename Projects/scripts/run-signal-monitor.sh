#!/bin/bash

# Wrapper script for 0DTE signal monitor
# Sets environment and runs the script

export DATA_SOURCE=yahoo
export WORKDIR=/home/ubuntu/clawd

cd $WORKDIR
node scripts/0dte-signal-monitor.js
