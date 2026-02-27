#!/bin/bash
#
# Notion Auto-Sync Hook
# Detects document changes and marks pending sync for Notion.
# Actual Notion API calls happen via Claude MCP, not this hook.
#
# Events: PostToolUse (Write, Edit)
# Trigger: docs/, PROGRESS.md, TASKS.md changes
#

set +e

TOOL_NAME="$1"

# Only process Write and Edit operations
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
    exit 0
fi

# Configuration
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.json"
CACHE_DIR="$PROJECT_ROOT/.claude/cache/notion"
LOG_DIR="$PROJECT_ROOT/.claude/logs"

# Check if Notion sync is enabled
if [[ ! -f "$SETTINGS_FILE" ]]; then
    exit 0
fi

# Parse notion.enabled (lightweight check without jq)
if ! grep -q '"notion"' "$SETTINGS_FILE" 2>/dev/null; then
    exit 0
fi

# Read tool input from stdin or environment
TOOL_INPUT="${TOOL_INPUT:-$2}"

# Check if the changed file is in docs/ or is a tracked document
is_sync_target() {
    case "$TOOL_INPUT" in
        *docs/*|*PROGRESS.md|*TASKS.md|*SPEC.md|*CHECKLIST.md|*PRD.md|*TECH-SPEC.md)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

if ! is_sync_target; then
    exit 0
fi

# Mark that a sync is needed
mkdir -p "$CACHE_DIR" 2>/dev/null
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")
cat > "$CACHE_DIR/pending-sync.json" 2>/dev/null <<EOF
{
  "pending_sync": true,
  "last_change": "$TIMESTAMP",
  "changed_file": "$TOOL_INPUT"
}
EOF

# Log the change
mkdir -p "$LOG_DIR" 2>/dev/null
echo "[$TIMESTAMP] notion-sync: docs change detected - $TOOL_INPUT" >> "$LOG_DIR/notion-sync.log" 2>/dev/null

exit 0
