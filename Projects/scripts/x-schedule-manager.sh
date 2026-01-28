#!/bin/bash

# X Engagement Optimized Schedule Manager
# Manages posting times, content types, and "reply guy" strategy

# Engagement schedule configuration
SCHEDULE_FILE="/home/ubuntu/clawd/data/x-engagement-schedule.json"

# Load schedule if exists, or create default
load_schedule() {
  if [ -f "$SCHEDULE_FILE" ]; then
    cat "$SCHEDULE_FILE"
  else
    echo '{}' > "$SCHEDULE_FILE"
  fi
}

# Save schedule
save_schedule() {
  cat > "$SCHEDULE_FILE"
}

# Get next scheduled post time
get_next_post() {
  local schedule=$(load_schedule)
  local current_hour=$(date +%H)
  local schedule_times=($(echo "$schedule" | jq -r '.post_times // .[]'))
  
  for time in "${schedule_times[@]}"; do
    local post_hour=${time//:*}
    if [ "$post_hour" -ge "$current_hour" ]; then
      echo "$time"
      return 0
    fi
  done
  
  echo "No posts scheduled"
  return 1
}

# Check if a specific content type should post now
should_post_now() {
  local content_type="$1"
  local force="$2"
  
  local schedule=$(load_schedule)
  
  # Check if any scheduled post matches content type
  local scheduled=($(echo "$schedule" | jq -r ".[] | select(.type == \"$content_type\") | .time"))
  
  if [ ${#scheduled[@]} -gt 0 ] && [ "$force" == "1" ]; then
    echo "$scheduled"
    return 0
  fi
  
  echo "No scheduled posts for type: $content_type"
  return 1
}

# Format post with metadata
format_post() {
  local content="$1"
  local extra_args="$2"
  
  echo "📅 $content"
}

# Main command dispatcher
case "$1" in
  daily-summary)
    # Run daily trading summary (6:30 AM)
    /home/ubuntu/clawd/scripts/daily-trading-summary.js
    ;;
  
  market-swing)
    # Run market swing monitor (8:30 AM)
    /home/ubuntu/clawd/scripts/market-swing-monitor.js
    ;;
  
  0dte-signal)
    # Run 0DTE signal check (10:00 AM)
    /home/ubuntu/clawd/scripts/0dte-signal-monitor.js
    ;;
  
  0dte-signal-midday)
    # Run 0DTE signal check (12:00 PM)
    /home/ubuntu/clawd/scripts/0dte-signal-monitor.js
    ;;
  
  spx-options)
    # Run SPX options analyzer (4:00 PM)
    /home/ubuntu/clawd/scripts/spx-0dte-analyzer.js
    ;;
  
  portfolio-dashboard)
    # Run portfolio dashboard (5:00 PM)
    /home/ubuntu/clawd/scripts/portfolio-dashboard.js
    ;;
  
  market-wrapup)
    # Market wrap-up (8:00 PM)
    /home/ubuntu/clawd/scripts/market-swing-monitor.js
    ;;
  
  first-tweet)
    # Post first tweet (9:00 PM)
    echo "Posting first tweet (brand introduction)"
    ;;
  
  *)
    echo "Usage: x-engagement-schedule {command}"
    echo ""
    echo "Commands:"
    echo "  daily-summary      - Run daily trading summary"
    echo "  market-swing       - Run market swing monitor"
    echo "  0dte-signal         - Run 0DTE signal check (AM)"
    echo "  0dte-signal-midday  - Run 0DTE signal check (noon)"
    echo "  spx-options         - Run SPX options analyzer (afternoon)"
    echo "  portfolio-dashboard   - Run portfolio dashboard"
    echo "  market-wrapup       - Market wrap-up"
    echo "  first-tweet         - Post first tweet"
    echo ""
    echo "Options:"
    echo "  --force          - Force post regardless of schedule"
    ;;
esac
