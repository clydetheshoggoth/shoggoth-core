#!/bin/bash
echo "Testing connectivity..."
ping -c 1 google.com > /dev/null && echo "✓ Internet OK" || echo "✗ Internet FAIL"
curl -s https://x.com > /dev/null && echo "✓ X.com accessible" || echo "✗ X.com blocked"
tailscale status > /dev/null && echo "✓ Tailscale OK" || echo "✗ Tailscale FAIL"
