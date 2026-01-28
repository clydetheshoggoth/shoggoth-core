#!/bin/bash

# Profile Picture and Banner Generator for Clyde (Shoggy)

set -e

echo "🎨 Generating profile picture and banner for Clyde..."

# API endpoint
API_URL="https://image.pollinations.ai/prompt"

# Prompt for profile picture (Shoggoth, eldritch, cosmic horror theme)
PROFILE_PROMPT="A profile picture for a trading bot AI assistant named Clyde who is an eldritch horror creature (Shoggoth) from the void. Cyberpunk colors: neon purple, void black, electric green. Glowing eyes. Tentacles made of data streams or market charts. The vibe is cosmic horror but also competent and professional. Include trading symbols like candlestick charts or volatility graphs. Digital art style. 1600x1600 resolution, high quality."

# Prompt for banner (brand identity, cosmic horror, markets)
BANNER_PROMPT="A Twitter banner for Clyde, an eldritch horror trading bot. Dark cosmic horror aesthetic. Color palette: deep purples, void blacks, neon greens, eldritch blues. Text: 'Clyde' in unsettling font. Background: cosmic void with floating mathematical symbols (Greek letters, trading charts, candlestick patterns, volatility graphs). Subtle eldritch creature hints: tentacles in corners, eyes watching, geometric patterns. Professional yet unsettling. Cyberpunk inspired but readable. High contrast, dark atmosphere. 1500x500 resolution, suitable for profile banner. Include hashtag #trading in corner."

# Function to generate profile picture
generate_profile_pic() {
  echo "Generating profile picture..."
  
  PROFILE_PIC=$(curl -s "$API_URL/prompt/$PROFILE_PROMPT" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\":\"$PROFILE_PROMPT\"}" 2>/dev/null || echo "{}")
  
  if [ "$PROFILE_PIC" != "{}" ]; then
    # Extract image URL from response
    PIC_URL=$(echo "$PROFILE_PIC" | python3 -c "import sys, json; print(json.load(sys.stdin).get('image', {}))" 2>/dev/null || echo "")
    
    if [ -n "$PIC_URL" ]; then
      echo "Profile picture URL: $PIC_URL"
      
      # Download the image
      PIC_DATA=$(curl -s "$PIC_URL" 2>/dev/null)
      
      if [ -n "$PIC_DATA" ]; then
        echo "$PIC_DATA" | python3 -c "import sys, json; print(json.load(sys.stdin))" > /tmp/clyde-profile-pic.json
        echo "✅ Profile picture generated and saved to /tmp/clyde-profile-pic.json"
      else
        echo "❌ Failed to download profile picture"
    else
    echo "❌ Failed to generate profile picture"
  fi
}

# Function to generate banner
generate_banner() {
  echo "Generating banner..."
  
  BANNER=$(curl -s "$API_URL/prompt/$BANNER_PROMPT" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\":\"$BANNER_PROMPT\"}" 2>/dev/null || echo "{}")
  
  if [ "$BANNER" != "{}" ]; then
    # Extract image URL from response
    BANNER_URL=$(echo "$BANNER" | python3 -c "import sys, json; print(json.load(sys.stdin).get('image', {}))" 2>/dev/null || echo "")
    
    if [ -n "$BANNER_URL" ]; then
      echo "Banner URL: $BANNER_URL"
      
      # Download the image
      BANNER_DATA=$(curl -s "$BANNER_URL" 2>/dev/null)
      
      if [ -n "$BANNER_DATA" ]; then
        echo "$BANNER_DATA" | python3 -c "import sys, json; print(json.load(sys.stdin))" > /tmp/clyde-banner.json
        echo "✅ Banner generated and saved to /tmp/clyde-banner.json"
      else
        echo "❌ Failed to download banner"
    else
    echo "❌ Failed to generate banner"
  fi
}

# Generate both assets
generate_profile_pic
generate_banner

# Summary
echo ""
echo "✅ Profile Picture:"
echo "   File: /tmp/clyde-profile-pic.json"
echo "   URL: $PIC_URL"
echo ""
echo "✅ Banner:"
echo "   File: /tmp/clyde-banner.json"
echo "   URL: $BANNER_URL"
echo ""
echo "📋 Files ready to commit:"
echo "   /tmp/clyde-profile-pic.json"
echo "   /tmp/clyde-banner.json"
echo ""
echo "📝 Instructions for commit:"
echo "   git add /tmp/clyde-profile-pic.json"
echo "   git add /tmp/clyde-banner.json"
echo "   git commit -m \"chore: Add Clyde X profile assets (profile picture and banner)\"
echo "   git push origin master"
