#!/bin/bash

# File Search Script for Workspace Memory
# Searches MEMORY.md, memory/*.md, and workspace files

WORKSPACE="/home/ubuntu/clawd"
QUERY="$1"
MAX_RESULTS="${2:-10}"

if [ -z "$QUERY" ]; then
    echo "Usage: $0 <query> [max_results]"
    echo "Example: $0 'database config' 5"
    exit 1
fi

echo "🔍 Searching for: $QUERY"
echo "---"

# Count for results tracking
count=0

# Search MEMORY.md first (highest priority)
if [ -f "$WORKSPACE/MEMORY.md" ]; then
    results=$(grep -i -C 2 "$QUERY" "$WORKSPACE/MEMORY.md" | head -20)
    if [ -n "$results" ]; then
        echo "📋 MEMORY.md:"
        echo "$results"
        echo ""
        count=$((count + 1))
    fi
fi

# Search daily memory logs
if [ -d "$WORKSPACE/memory" ]; then
    memory_results=$(grep -l -i "$QUERY" "$WORKSPACE/memory"/*.md 2>/dev/null | head -3)
    if [ -n "$memory_results" ]; then
        echo "📅 Memory Logs:"
        for file in $memory_results; do
            if [ $count -lt $MAX_RESULTS ]; then
                filename=$(basename "$file")
                matches=$(grep -i -n "$QUERY" "$file" | head -2)
                echo "  $filename:"
                echo "$matches" | sed 's/^/    /'
                echo ""
                count=$((count + 1))
            fi
        done
    fi
fi

# Search README files
readme_results=$(find "$WORKSPACE" -maxdepth 2 -name "README.md" -exec grep -l -i "$QUERY" {} \; 2>/dev/null | head -3)
if [ -n "$readme_results" ]; then
    echo "📖 README files:"
    for file in $readme_results; do
        if [ $count -lt $MAX_RESULTS ]; then
            rel_path=${file#$WORKSPACE/}
            matches=$(grep -i -n "$QUERY" "$file" | head -2)
            echo "  $rel_path:"
            echo "$matches" | sed 's/^/    /'
            echo ""
            count=$((count + 1))
        fi
    done
fi

# Search SKILL.md files if query matches skill names
if echo "$QUERY" | grep -qiE "skill|tool"; then
    skill_results=$(find "$WORKSPACE/skills" -maxdepth 2 -name "SKILL.md" -exec grep -l -i "$QUERY" {} \; 2>/dev/null | head -2)
    if [ -n "$skill_results" ]; then
        echo "🛠️  Skills:"
        for file in $skill_results; do
            if [ $count -lt $MAX_RESULTS ]; then
                rel_path=${file#$WORKSPACE/}
                skill_name=$(basename $(dirname "$file"))
                echo "  $skill_name:"
                grep -i -m 1 "description:" "$file" | sed 's/^/    /'
                echo ""
                count=$((count + 1))
            fi
        done
    fi
fi

echo "📊 Found results in $count locations"
