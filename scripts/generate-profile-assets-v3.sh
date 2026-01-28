#!/bin/bash

# Profile Picture and Banner Generator for Clyde (Shoggy)

echo "🎨 Generating profile picture and banner..."

# Clean up any previous temp files
rm -f /tmp/clyde-profile-pic.json /tmp/clyde-banner.json /tmp/api_response.json 2>/dev/null

# Generate profile picture
echo "Generating profile picture..."
PROFILE_RESPONSE=$(curl -s "https://image.pollinations.ai/prompt/$PROFILE_PROMPT" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"$PROFILE_PROMPT\"}" 2>/dev/null)

if [ "$PROFILE_RESPONSE" ]; then
  PROFILE_URL=$(echo "$PROFILE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('image', {}).get('url', 'File not found'))" 2>/dev/null)
  
  if [ -n "$PROFILE_URL" ] && [ "$PROFILE_URL" != "File not found" ]; then
    curl -s "$PROFILE_URL" -o /tmp/clyde-profile-pic.json 2>/dev/null
    echo "✅ Profile picture saved to /tmp/clyde-profile-pic.json"
  else
    echo "❌ Failed to download profile picture"
  fi
else
  echo "❌ Failed to generate profile picture"
fi

# Generate banner
echo "Generating banner..."
BANNER_RESPONSE=$(curl -s "https://image.pollinations.ai/prompt/$BANNER_PROMPT" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"$BANNER_PROMPT\"}" 2>/dev/null)

if [ "$BANNER_RESPONSE" ]; then
  BANNER_URL=$(echo "$BANNER_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('image', {}).get('url', 'File not found'))" 2>/dev/null)
  
  if [ -n "$BANNER_URL" ] && [ "$BANNER_URL" != "File not found" ]; then
    curl -s "$BANNER_URL" -o /tmp/clyde-banner.json 2>/dev/null
    echo "✅ Banner saved to /tmp/clyde-banner.json"
  else
    echo "❌ Failed to download banner"
  fi
else
  echo "❌ Failed to generate banner"
fi

# Summary
echo ""
echo "📋 Generated Assets:"
echo "   Profile Picture: $([ -f /tmp/clyde-profile-pic.json ] && echo "/tmp/clyde-profile-pic.json" || echo "Not generated")"
echo "   Banner: $([ -f /tmp/clyde-banner.json ] && echo "/tmp/clyde-banner.json" || echo "Not generated")"
echo ""
echo "📝 Files:"
echo "   /tmp/clyde-profile-pic.json"
echo "   /tmp/clyde-banner.json"
echo ""
echo "📦 Commit Instructions:"
echo "   git add /tmp/clyde-profile-pic.json /tmp/clyde-banner.json"
echo "   git commit -m \"chore: Add Clyde X profile picture and banner"
echo "   git push origin master"
