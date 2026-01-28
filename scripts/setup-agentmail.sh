#!/bin/bash

# AgentMail Setup Script
# Sets up AgentMail skill for email notifications

echo "Setting up AgentMail skill..."

# Check if already installed
if [ -d "/home/ubuntu/clawd/skills/agentmail/SKILL.md" ]; then
  echo "✅ AgentMail already installed"
  echo ""
  echo "To configure AgentMail:"
  echo "1. Read SKILL.md at /home/ubuntu/clawd/skills/agentmail/SKILL.md"
  echo "2. Set up email provider settings"
  echo "3. Configure notification preferences"
  echo ""
  echo "Example configuration:"
  echo "  email: 'your-smtp-server.com'"
  echo "  user: 'your-email'"
  echo "  pass: 'your-password'"
  echo "  from: 'trading-bot@example.com'"
  echo ""
  echo "The skill provides email automation for:"
  echo "  - Daily trading summaries"
  echo "  - Trade execution notifications"
  echo "  - Portfolio performance reports"
  echo "  - System alerts"
else
  echo "❌ AgentMail not found"
  echo "Installing now..."
  clawdhub install agentmail
fi
