#!/bin/bash

# Profile Picture and Banner Generator for Clyde (Shoggy)

set -e

echo "🎨 Generating profile picture and banner for Clyde using NanoBanana Pro..."

# API endpoints
API_URL="https://api.nanobanana.com/api/v1"

# Profile prompt (Shoggoth, eldritch, cosmic horror, NanoBanana style)
PROFILE_PROMPT="A profile picture for a trading bot AI assistant named Clyde who is an eldritch horror creature (Shoggoth) from the void. NanoBanana Cyberpunk colors: neon purple, void black, electric blue, glowing cyan. Cyberpunk UI elements: circuit patterns, holographic interfaces, data streams, futuristic borders. Glowing eyes with cybernetic circuits. Tentacles made of optical fiber data cables or laser transmission lines. The vibe is futuristic but also eldritch unsettling. Include trading symbols like candlestick charts or volatility graphs. Digital art style. High resolution, detailed cybernetic details. NanoBanana brand aesthetics: minimalist, futuristic, tech-forward."

# Banner prompt (cosmic horror, markets, NanoBanana brand, eldritch)
BANNER_PROMPT="A Twitter banner for Clyde, an eldritch horror trading bot. Dark cosmic horror aesthetic with NanoBanana cyberpunk styling. Color palette: deep purples, void blacks, neon cyans, electric blues, tech-forward accents. Text: 'Clyde' in futuristic mono font with glitch effect. Background: cyberpunk futuristic city skyline with data visualization screens, circuit patterns in architecture, floating mathematical symbols (Greek letters, trading charts, candlestick patterns, volatility graphs) rendered in holographic displays. Subtle eldritch creature hints: tentacles made of optical fiber cables or laser transmission lines, eyes watching, geometric patterns in tech environment. Professional yet unsettling. Cyberpunk inspired but readable. High contrast, dark atmosphere with neon accents. 1600x500 resolution, suitable for profile banner. Include hashtag #trading in corner. NanoBanana Pro visual elements: wireframe circuits, data streams, holographic interfaces, cybernetic organisms. Style: detailed vector graphics with glowing edges."

# Function to call NanoBanana API
call_nanobanana_api() {
  local prompt="$1"
  local endpoint="$API_URL/generate"
  local payload="{\"prompt\":\"$prompt\"}"
  
  echo "Calling NanoBanana API: $endpoint..."
  
  response=$(curl -s "$endpoint" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer NANOBANANA_API_KEY" \
    -d "$payload" 2>/dev/null)
  
  if [ $? -eq 0 ] && [ "$response" ]; then
    echo "$response" | python3 -m json.tool > /tmp/api_response.json
    
    # Check if response contains image field
    image_url=$(python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('image', {}).get('url', 'File not found'))" 2>/dev/null)
    
    if [ -n "$image_url" ] && [ "$image_url" != "File not found" ]; then
      echo "✅ NanoBanana API call successful"
      return 0
    else
      echo "❌ Failed to extract image URL"
      return 1
    fi
  else
    echo "❌ API call failed"
    return 1
  fi
}

# Function to generate profile picture using NanoBanana
generate_profile_pic() {
  echo "🖼️  Generating profile picture..."
  
  if call_nanobanana_api "$PROFILE_PROMPT"; then
    # Extract image URL from response
    pic_url=$(python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('image', {}).get('url', 'File not found'))" 2>/dev/null
    
    if [ -n "$pic_url" ] && [ "$pic_url" != "File not found" ]; then
      # Download image
      echo "   Downloading from: $pic_url"
      pic_data=$(curl -s "$pic_url" 2>/dev/null
      
      if [ -n "$pic_data" ]; then
        echo "$pic_data" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin)))" > /tmp/clyde-profile-pic.json
        echo "   ✅ Profile picture saved to /tmp/clyde-profile-pic.json"
        pic_file="/tmp/clyde-profile-pic.json"
      else
        echo "   ❌ Failed to download profile picture"
        pic_file=""
    else
      echo "   ❌ Failed to generate profile picture"
      pic_file=""
    fi
  else
    echo "   ❌ API call failed"
    pic_file=""
  fi
}

# Function to generate banner using NanoBanana
generate_banner() {
  echo "🏷️  Generating banner..."
  
  if call_nanobanana_api "$BANNER_PROMPT"; then
    # Extract image URL from response
    banner_url=$(python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('image', {}).get('url', 'File not found'))" 2>/dev/null
    
    if [ -n "$banner_url" ] && [ "$banner_url" != "File not found" ]; then
      # Download image
      echo "   Downloading from: $banner_url"
      banner_data=$(curl -s "$banner_url" 2>/dev/null
      
      if [ -n "$banner_data" ]; then
        echo "$banner_data" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin)))" > /tmp/clyde-banner.json
        echo "   ✅ Banner saved to /tmp/clyde-banner.json"
        banner_file="/tmp/clyde-banner.json"
      else
        echo "   ❌ Failed to download banner"
        banner_file=""
    else
      echo "   ❌ API call failed"
      banner_file=""
    fi
  else
    echo "   ❌ API call failed"
    banner_file=""
  fi
}

# Main
echo ""
echo "🎨 Generating profile picture with NanoBanana Pro..."
generate_profile_pic

echo ""
echo "🏷️  Generating banner with NanoBanana Pro..."
generate_banner

# Summary
echo ""
echo "📋 Generated Assets:"
if [ -n "$pic_file" ]; then
  echo "   ✅ Profile Picture: $pic_file"
else
  echo "   ❌ Profile Picture: Not generated"
fi

if [ -n "$banner_file" ]; then
  echo "   ✅ Banner: $banner_file"
else
  echo "   ❌ Banner: Not generated"
fi

echo ""
echo "📝 Usage:"
echo "   First, set your NanoBanana API key:"
echo "     export NANOBANANA_API_KEY=\"your_key_here\""
echo ""
echo "   Then run:"
echo "     bash scripts/generate-profile-assets.sh"
echo ""
echo "📦 Commit Instructions:"
echo "   git add scripts/generate-profile-assets.sh"
echo "   git commit -m \"feat: Use NanoBanana Pro API for profile assets"
echo "   git push origin master"
