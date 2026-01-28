#!/bin/bash

# Profile Picture and Banner Generator for Clyde (Shoggy)

echo "🎨 Generating profile picture and banner for Clyde..."

# Clean up any previous temp files
rm -f /tmp/clyde-profile-pic.json /tmp/clyde-banner.json 2>/dev/null

# API endpoints
API_URL="https://image.pollinations.ai/prompt"

# Profile prompt (Shoggoth, eldritch, cosmic horror)
PROFILE_PROMPT="A profile picture for a trading bot AI assistant named Clyde who is an eldritch horror creature from the void. Cyberpunk colors: neon purple, void black, electric green. Glowing eyes. Tentacles made of data streams or market charts. The vibe is cosmic horror but also competent and professional. 1600x1600 resolution, high quality."

# Banner prompt (cosmic horror, markets)
BANNER_PROMPT="A Twitter banner for Clyde, an eldritch horror trading bot. Dark cosmic horror aesthetic. Color palette: deep purples, void blacks, neon greens, eldritch blues. Text: Clyde in unsettling font. Background: cosmic void with floating mathematical symbols (Greek letters, trading charts, candlestick patterns, volatility graphs). Subtle eldritch creature hints: tentacles in corners, eyes watching, geometric patterns. Professional yet unsettling. Cyberpunk inspired but readable. High contrast, dark atmosphere."

# Function to generate image
generate_image() {
  local prompt="$1"
  local endpoint="$API_URL/prompt"
  
  echo "Calling API for $prompt..."
  
  response=$(curl -s "$endpoint" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\":\"$prompt\"}" 2>/dev/null)
  
  if [ $? -eq 0 ] && [ -n "$response" ]; then
    echo "$response" | python3 -m json.tool > /tmp/api_response.json
    
    # Check if response contains image field
    image_url=$(python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('image', {}).get('url', 'NO URL FOUND'))" 2>/dev/null)
    
    if [ "$image_url" != "NO URL FOUND" ] && [ "$image_url" != "File not found" ]; then
      # Download image
      echo "Downloading image from $image_url"
      pic_data=$(curl -s "$image_url" 2>/dev/null)
      
      if [ -n "$pic_data" ]; then
        echo "$pic_data" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin)))" > /tmp/clyde-profile-pic.json
        echo "✅ Profile picture saved"
        PROFILE_PIC="/tmp/clyde-profile-pic.json"
      else
        echo "❌ Failed to download profile picture"
        PROFILE_PIC=""
    else
      echo "❌ No image URL found in response"
      PROFILE_PIC=""
    fi
  else
    echo "❌ API call failed"
    return 1
  fi
}

# Generate profile picture
echo "Generating profile picture..."
generate_image "$PROFILE_PROMPT"

# Generate banner
echo "Generating banner..."
BANNER_PROMPT="BANNER_PROMPT"

# Function to generate banner
generate_banner() {
  local prompt="$1"
  local endpoint="$API_URL/prompt"
  
  echo "Calling API for banner..."
  response=$(curl -s "$endpoint" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\":\"$prompt\"}" 2>/dev/null)
  
  if [ $? -eq 0 ] && [ -n "$response" ]; then
    echo "$response" | python3 -m json.tool > /tmp/api_response.json
    
    # Check if response contains image field
    image_url=$(python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('image', {}).get('url', 'NO URL FOUND'))" 2>/dev/null)
    
    if [ "$image_url" != "NO URL FOUND" ] && [ "$image_url" != "File not found" ]; then
      # Download image
      echo "Downloading banner from $image_url"
      banner_data=$(curl -s "$image_url" 2>/dev/null)
      
      if [ -n "$banner_data" ]; then
        echo "$banner_data" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin)))" > /tmp/clyde-banner.json
        echo "✅ Banner saved"
        BANNER="/tmp/clyde-banner.json"
      else
        echo "❌ Failed to download banner"
        BANNER=""
    else
      echo "❌ No image URL found in response"
      BANNER=""
    fi
  else
    echo "❌ API call failed"
    return 1
  fi
}

# Summary
echo ""
echo "📋 Generated Assets:"
if [ -n "$PROFILE_PIC" ]; then
  echo "   ✅ Profile Picture: $PROFILE_PIC"
else
  echo "   ❌ Profile Picture: Not generated"
fi

if [ -n "$BANNER" ]; then
  echo "   ✅ Banner: $BANNER"
else
  echo "   ❌ Banner: Not generated"
fi

echo ""
echo "📝 Commit Instructions:"
echo "   git add /tmp/clyde-profile-pic.json /tmp/clyde-banner.json"
echo "   git commit -m \"chore: Add Clyde X profile assets (profile picture and banner)\""
echo "   git push origin master"
