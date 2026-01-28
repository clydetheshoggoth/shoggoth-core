#!/bin/bash

# Nightly Build Script (Standalone Version)
# Builds small tools without requiring OpenCode initially

set -e

WORKDIR="/home/ubuntu/clawd"
LOGFILE="$WORKDIR/nightly-builds.md"
DATE=$(date -u +"%Y-%m-%d %H:%M UTC")

echo "Starting nightly build at $DATE" >> /tmp/nightly-build.log

# Small project ideas that can be built quickly
PROJECTS=(
  "Create a workspace-projects.md that lists all important directories"
  "Build a git-quick-status.sh that shows modified files"
  "Create a daily-summary.sh that generates day summary"
  "Build a backup-config.sh to backup .clawdbot configs"
  "Create a test-network.sh to test connectivity"
  "Build a simple todo.sh CLI for quick task tracking"
  "Create a find-file.sh to search workspace files"
  "Build a recent-changes.sh showing last 24h activity"
)

SELECTED_INDEX=$((RANDOM % ${#PROJECTS[@]}))
PROJECT="${PROJECTS[$SELECTED_INDEX]}"

echo "Selected project #$SELECTED_INDEX: $PROJECT" >> /tmp/nightly-build.log

# Build the selected project based on what it is
case "$SELECTED_INDEX" in
  0)
    # Create workspace projects file
    cat > "$WORKDIR/workspace-projects.md" << 'EOF'
# Workspace Projects

Generated on '$DATE'

## Important Directories
- clawd/ - Main workspace
- scripts/ - Utility scripts
- skills/ - Agent skills
- memory/ - Daily notes

## Active Work
- X account automation
- Market monitoring scripts
- Profile image generation
EOF
    echo "Created: workspace-projects.md"
    ;;
  1)
    # Git quick status
    cat > "$WORKDIR/scripts/git-quick-status.sh" << 'EOF'
#!/bin/bash
git -C "$HOME/clawd" status --short
git -C "$HOME/clawd" log -1 --oneline
EOF
    chmod +x "$WORKDIR/scripts/git-quick-status.sh"
    echo "Created: scripts/git-quick-status.sh"
    ;;
  2)
    # Daily summary generator
    cat > "$WORKDIR/scripts/daily-summary.sh" << 'EOF'
#!/bin/bash
TODAY=$(date +%Y-%m-%d)
MEMORY_FILE="$HOME/clawd/memory/$TODAY.md"
if [ -f "$MEMORY_FILE" ]; then
  echo "Daily summary for $TODAY:"
  cat "$MEMORY_FILE"
else
  echo "No memory file for $TODAY yet."
fi
EOF
    chmod +x "$WORKDIR/scripts/daily-summary.sh"
    echo "Created: scripts/daily-summary.sh"
    ;;
  3)
    # Backup config
    cat > "$WORKDIR/scripts/backup-config.sh" << 'EOF'
#!/bin/bash
BACKUP_DIR="$HOME/clawd/backups"
DATE=$(date +%Y%m%d)
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/config-$DATE.tar.gz" ~/.clawdbot/
echo "Backup saved to: $BACKUP_DIR/config-$DATE.tar.gz"
EOF
    chmod +x "$WORKDIR/scripts/backup-config.sh"
    echo "Created: scripts/backup-config.sh"
    ;;
  4)
    # Network test
    cat > "$WORKDIR/scripts/test-network.sh" << 'EOF'
#!/bin/bash
echo "Testing connectivity..."
ping -c 1 google.com > /dev/null && echo "✓ Internet OK" || echo "✗ Internet FAIL"
curl -s https://x.com > /dev/null && echo "✓ X.com accessible" || echo "✗ X.com blocked"
tailscale status > /dev/null && echo "✓ Tailscale OK" || echo "✗ Tailscale FAIL"
EOF
    chmod +x "$WORKDIR/scripts/test-network.sh"
    echo "Created: scripts/test-network.sh"
    ;;
  5)
    # Simple todo CLI
    cat > "$WORKDIR/scripts/todo.sh" << 'EOF'
#!/bin/bash
TODO_FILE="$HOME/clawd/.todo"
case "$1" in
  add) shift; echo "- [$(date +%H:%M)] $*" >> "$TODO_FILE" ;;
  list) cat "$TODO_FILE" ;;
  clear) > "$TODO_FILE" && echo "Todo list cleared" ;;
  *) echo "Usage: todo.sh {add|list|clear} [text]" ;;
esac
EOF
    chmod +x "$WORKDIR/scripts/todo.sh"
    echo "Created: scripts/todo.sh"
    ;;
  6)
    # File finder
    cat > "$WORKDIR/scripts/find-file.sh" << 'EOF'
#!/bin/bash
if [ -z "$1" ]; then
  echo "Usage: find-file.sh <pattern>"
  exit 1
fi
find "$HOME/clawd" -name "*$1*" 2>/dev/null
EOF
    chmod +x "$WORKDIR/scripts/find-file.sh"
    echo "Created: scripts/find-file.sh"
    ;;
  7)
    # Recent changes
    cat > "$WORKDIR/scripts/recent-changes.sh" << 'EOF'
#!/bin/bash
echo "Changes in last 24 hours:"
git -C "$HOME/clawd" log --since="24 hours ago" --oneline
EOF
    chmod +x "$WORKDIR/scripts/recent-changes.sh"
    echo "Created: scripts/recent-changes.sh"
    ;;
esac

# Update log
echo "" >> "$LOGFILE"
echo "- **$DATE** - $PROJECT" >> "$LOGFILE"

# Test what was built
case "$SELECTED_INDEX" in
  1|3|4|5|6|7)
    TOOL_NAME=$(echo "$PROJECT" | grep -oP '(?<=: ).*?(?= \()' | sed 's/^ *//g')
    echo "" >> "$LOGFILE"
    echo "  Status: ✅ Executable created" >> "$LOGFILE"
    echo "  Test: Run \`$WORKDIR/scripts/$TOOL_NAME\` to verify" >> "$LOGFILE"
    ;;
  0|2)
    FILE_NAME=$(echo "$PROJECT" | grep -oP '(?<=Create a ).*?(?= that)' | sed 's/ /-/g' | sed 's/ /_/g')
    echo "" >> "$LOGFILE"
    echo "  Status: ✅ File created" >> "$LOGFILE"
    echo "  Test: Check \`$WORKDIR/$FILE_NAME.md\`" >> "$LOGFILE"
    ;;
esac

echo "" >> "$LOGFILE"
echo "Build complete at $(date -u +"%Y-%m-%d %H:%M UTC")" >> "$LOGFILE"

echo "Nightly build complete!" >> /tmp/nightly-build.log
