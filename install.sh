#!/usr/bin/env bash
# ==============================================================================
# open-claude-office installer
# Modular installation of the Claude Code agent ecosystem framework
# ==============================================================================
set -euo pipefail

# ------------------------------------------------------------------------------
# Constants & Globals
# ------------------------------------------------------------------------------
readonly VERSION="1.0.0"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly ALL_MODULES=(core craft lifecycle git quality analytics multi-cli meta)
readonly REQUIRED_MODULES=(core)
readonly INSTALL_RECEIPT=".claude/.open-claude-office-receipt.json"

# Colors (auto-disabled if not a terminal)
if [[ -t 1 ]]; then
    readonly RED='\033[0;31m'
    readonly GREEN='\033[0;32m'
    readonly YELLOW='\033[1;33m'
    readonly BLUE='\033[0;34m'
    readonly CYAN='\033[0;36m'
    readonly BOLD='\033[1m'
    readonly DIM='\033[2m'
    readonly RESET='\033[0m'
else
    readonly RED='' GREEN='' YELLOW='' BLUE='' CYAN='' BOLD='' DIM='' RESET=''
fi

# Counters
AGENTS_INSTALLED=0
SKILLS_INSTALLED=0
COMMANDS_INSTALLED=0
HOOKS_INSTALLED=0
FILES_SKIPPED=0
FILES_OVERWRITTEN=0

# Options
TARGET_DIR="$(pwd)"
SELECTED_MODULES=()
FORCE=false
UNINSTALL=false
ALL=false
QUIET=false
DRY_RUN=false

# ------------------------------------------------------------------------------
# Output helpers
# ------------------------------------------------------------------------------
banner() {
    echo -e "${CYAN}${BOLD}"
    cat <<'BANNER'

   ___  ___  ___ _ __         ___ _                 _
  / _ \/ _ \/ _ \ '_ \ ___  / __| | __ _ _  _  __| | ___
 | (_) |  _/  __/ | | |___|| (__| |/ _` | || |/ _` |/ -_)
  \___/|_|  \___|_| |_|     \___|_|\__,_|\_,_|\__,_|\___|
          ___ / _|/ _(_) ___ ___
         / _ \  _|  _| |/ __/ -_)
        \___/_| |_| |_|\___\___|

BANNER
    echo -e "  ${DIM}v${VERSION} — Claude Code Agent Ecosystem Framework${RESET}"
    echo ""
}

info()    { echo -e "  ${BLUE}[INFO]${RESET}    $*"; }
success() { echo -e "  ${GREEN}[OK]${RESET}      $*"; }
warn()    { echo -e "  ${YELLOW}[WARN]${RESET}    $*"; }
error()   { echo -e "  ${RED}[ERROR]${RESET}   $*"; }
header()  { echo -e "\n  ${CYAN}${BOLD}==> $*${RESET}"; }
detail()  { echo -e "  ${DIM}          $*${RESET}"; }

die() {
    error "$@"
    exit 1
}

# ------------------------------------------------------------------------------
# Usage
# ------------------------------------------------------------------------------
usage() {
    cat <<EOF
${BOLD}open-claude-office installer v${VERSION}${RESET}

${CYAN}USAGE${RESET}
  ./install.sh [OPTIONS]

${CYAN}OPTIONS${RESET}
  --target=PATH       Target project directory (default: current directory)
  --modules=LIST      Comma-separated module list (e.g., core,lifecycle,git)
  --all               Install all modules (this is already the default)
  --force             Overwrite existing files
  --uninstall         Remove installed components
  --dry-run           Show what would be installed without making changes
  --quiet             Suppress non-essential output
  -h, --help          Show this help message

${CYAN}AVAILABLE MODULES${RESET}
  ${GREEN}core${RESET}         ${DIM}(required)${RESET}  Essential safety, routing, and project initialization
  craft        Portfolio site generation pipeline
  lifecycle    MVP/PoC/Production lifecycle management
  git          GitHub Flow, Conventional Commits, PR management
  quality      Code review, testing, refactoring, documentation
  analytics    Usage statistics, token tracking, cost reporting
  multi-cli    Claude + Codex + Gemini CLI orchestration
  meta         Create new agents, skills, hooks, commands

${CYAN}EXAMPLES${RESET}
  ./install.sh                          # Install all modules (default)
  ./install.sh --target=~/myproj        # Install into a specific project
  ./install.sh --modules=core,git       # Install specific modules only
  ./install.sh --uninstall              # Remove installed components
  ./install.sh --dry-run                # Preview without making changes

EOF
    exit 0
}

# ------------------------------------------------------------------------------
# Argument parsing
# ------------------------------------------------------------------------------
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --target=*)
                TARGET_DIR="${1#*=}"
                ;;
            --modules=*)
                IFS=',' read -ra SELECTED_MODULES <<< "${1#*=}"
                ;;
            --all)
                ALL=true
                ;;
            --force)
                FORCE=true
                ;;
            --uninstall)
                UNINSTALL=true
                ;;
            --dry-run)
                DRY_RUN=true
                ;;
            --quiet)
                QUIET=true
                ;;
            -h|--help)
                usage
                ;;
            *)
                die "Unknown option: $1 (use --help for usage)"
                ;;
        esac
        shift
    done

    # Resolve target directory to absolute path
    TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd)" || die "Target directory does not exist: $TARGET_DIR"
}

# ------------------------------------------------------------------------------
# Dependency checks
# ------------------------------------------------------------------------------
check_dependencies() {
    header "Checking dependencies"

    local missing_required=()
    local missing_optional=()

    # Required: claude CLI
    if command -v claude &>/dev/null; then
        success "claude (Claude Code CLI) found: $(command -v claude)"
    else
        missing_required+=("claude")
        error "claude (Claude Code CLI) not found"
    fi

    # Required: jq
    if command -v jq &>/dev/null; then
        success "jq found: $(jq --version 2>/dev/null || echo 'unknown version')"
    else
        missing_required+=("jq")
        error "jq not found (required for settings merge)"
    fi

    # Optional: codex
    if command -v codex &>/dev/null; then
        success "codex (Codex CLI) found"
    else
        missing_optional+=("codex")
        warn "codex (Codex CLI) not found (optional, used by multi-cli module)"
    fi

    # Optional: gemini
    if command -v gemini &>/dev/null; then
        success "gemini (Gemini CLI) found"
    else
        missing_optional+=("gemini")
        warn "gemini (Gemini CLI) not found (optional, used by multi-cli module)"
    fi

    # Optional: gh
    if command -v gh &>/dev/null; then
        success "gh (GitHub CLI) found"
    else
        missing_optional+=("gh")
        warn "gh (GitHub CLI) not found (optional, used by git module)"
    fi

    if [[ ${#missing_required[@]} -gt 0 ]]; then
        echo ""
        die "Missing required dependencies: ${missing_required[*]}. Please install them first."
    fi

    if [[ ${#missing_optional[@]} -gt 0 ]]; then
        echo ""
        info "Optional dependencies missing: ${missing_optional[*]}"
        info "Modules requiring these will still install but some features may be limited."
    fi
}

# ------------------------------------------------------------------------------
# Module validation
# ------------------------------------------------------------------------------
validate_module() {
    local mod="$1"
    local manifest="${SCRIPT_DIR}/modules/${mod}/manifest.json"

    if [[ ! -f "$manifest" ]]; then
        return 1
    fi
    return 0
}

resolve_dependencies() {
    local -a resolved=()
    local -A seen=()

    resolve_module() {
        local mod="$1"
        if [[ -n "${seen[$mod]+x}" ]]; then
            return 0
        fi
        seen[$mod]=1

        local manifest="${SCRIPT_DIR}/modules/${mod}/manifest.json"
        if [[ ! -f "$manifest" ]]; then
            warn "Module '$mod' has no manifest.json, skipping"
            return 1
        fi

        # Resolve dependencies first
        local deps
        deps=$(jq -r '.depends_on[]? // empty' "$manifest" 2>/dev/null)
        while IFS= read -r dep; do
            [[ -z "$dep" ]] && continue
            if ! resolve_module "$dep"; then
                error "Cannot resolve dependency '$dep' for module '$mod'"
                return 1
            fi
        done <<< "$deps"

        resolved+=("$mod")
    }

    for mod in "${SELECTED_MODULES[@]}"; do
        if ! resolve_module "$mod"; then
            die "Failed to resolve module: $mod"
        fi
    done

    SELECTED_MODULES=("${resolved[@]}")
}

# ------------------------------------------------------------------------------
# Interactive wizard
# ------------------------------------------------------------------------------
interactive_wizard() {
    header "Module Selection"
    echo ""
    info "Select which modules to install. ${BOLD}core${RESET} is always included."
    echo ""

    local -a optional_modules=()
    for mod in "${ALL_MODULES[@]}"; do
        if [[ "$mod" != "core" ]]; then
            optional_modules+=("$mod")
        fi
    done

    # Display module descriptions
    for mod in "${optional_modules[@]}"; do
        local manifest="${SCRIPT_DIR}/modules/${mod}/manifest.json"
        local desc="(no description)"
        if [[ -f "$manifest" ]]; then
            desc=$(jq -r '.description // "(no description)"' "$manifest" 2>/dev/null)
        fi
        local deps=""
        if [[ -f "$manifest" ]]; then
            deps=$(jq -r '.depends_on | if length > 0 then " [requires: " + join(", ") + "]" else "" end' "$manifest" 2>/dev/null)
        fi
        printf "    ${BOLD}%-12s${RESET} %s${DIM}%s${RESET}\n" "$mod" "$desc" "$deps"
    done

    echo ""

    # Prompt: install all?
    local answer
    read -rp "  Install all modules? [y/N] " answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
        SELECTED_MODULES=("${ALL_MODULES[@]}")
        return
    fi

    # Otherwise, ask for each module
    SELECTED_MODULES=(core)
    for mod in "${optional_modules[@]}"; do
        read -rp "  Install ${BOLD}${mod}${RESET}? [y/N] " answer
        if [[ "$answer" =~ ^[Yy]$ ]]; then
            SELECTED_MODULES+=("$mod")
        fi
    done
}

# ------------------------------------------------------------------------------
# File copy (with force/skip logic)
# ------------------------------------------------------------------------------
copy_file() {
    local src="$1"
    local dst="$2"

    if [[ ! -e "$src" ]]; then
        warn "Source not found: ${src#"$SCRIPT_DIR"/}"
        return 0
    fi

    if [[ "$DRY_RUN" == true ]]; then
        if [[ -e "$dst" && "$FORCE" != true ]]; then
            detail "[dry-run] SKIP (exists): ${dst#"$TARGET_DIR"/}"
        else
            detail "[dry-run] COPY: ${dst#"$TARGET_DIR"/}"
        fi
        return 0
    fi

    if [[ -e "$dst" && "$FORCE" != true ]]; then
        ((FILES_SKIPPED++)) || true
        if [[ "$QUIET" != true ]]; then
            detail "skip (exists): ${dst#"$TARGET_DIR"/}"
        fi
        return 0
    fi

    if [[ -e "$dst" ]]; then
        ((FILES_OVERWRITTEN++)) || true
    fi

    mkdir -p "$(dirname "$dst")"
    cp -a "$src" "$dst"

    if [[ "$QUIET" != true ]]; then
        detail "installed: ${dst#"$TARGET_DIR"/}"
    fi
}

copy_dir() {
    local src="$1"
    local dst="$2"

    if [[ ! -d "$src" ]]; then
        warn "Source directory not found: ${src#"$SCRIPT_DIR"/}"
        return 0
    fi

    if [[ "$DRY_RUN" == true ]]; then
        if [[ -d "$dst" && "$FORCE" != true ]]; then
            detail "[dry-run] SKIP DIR (exists): ${dst#"$TARGET_DIR"/}"
        else
            detail "[dry-run] COPY DIR: ${dst#"$TARGET_DIR"/}"
        fi
        return 0
    fi

    if [[ -d "$dst" && "$FORCE" != true ]]; then
        # Copy only missing files within the directory
        local src_file
        find "$src" -type f | while IFS= read -r src_file; do
            local rel="${src_file#"$src"/}"
            copy_file "$src_file" "${dst}/${rel}"
        done
        return 0
    fi

    mkdir -p "$(dirname "$dst")"
    cp -a "$src" "$dst"

    if [[ "$QUIET" != true ]]; then
        detail "installed: ${dst#"$TARGET_DIR"/}/"
    fi
}

# ------------------------------------------------------------------------------
# Install a single module
# ------------------------------------------------------------------------------
install_module() {
    local mod="$1"
    local manifest="${SCRIPT_DIR}/modules/${mod}/manifest.json"
    local source_claude="${SCRIPT_DIR}/.claude"
    local target_claude="${TARGET_DIR}/.claude"

    local desc
    desc=$(jq -r '.description // ""' "$manifest" 2>/dev/null)

    header "Installing module: ${BOLD}${mod}${RESET} ${DIM}${desc}${RESET}"

    # --- Agents ---
    local agents
    agents=$(jq -r '.components.agents[]? // empty' "$manifest" 2>/dev/null)
    if [[ -n "$agents" ]]; then
        info "Agents:"
        while IFS= read -r agent; do
            [[ -z "$agent" ]] && continue
            # Handle agent names that may contain spaces (e.g., "MANIFEST.md routing")
            # Use the first word as the filename base
            local filename="${agent%% *}"
            # Add .md extension if not already present
            if [[ "$filename" != *.md ]]; then
                filename="${filename}.md"
            fi
            copy_file "${source_claude}/agents/${filename}" "${target_claude}/agents/${filename}"
            ((AGENTS_INSTALLED++)) || true
        done <<< "$agents"
    fi

    # --- Skills ---
    local skills
    skills=$(jq -r '.components.skills[]? // empty' "$manifest" 2>/dev/null)
    if [[ -n "$skills" ]]; then
        info "Skills:"
        while IFS= read -r skill; do
            [[ -z "$skill" ]] && continue
            copy_dir "${source_claude}/skills/${skill}" "${target_claude}/skills/${skill}"
            ((SKILLS_INSTALLED++)) || true
        done <<< "$skills"
    fi

    # --- Commands ---
    local commands
    commands=$(jq -r '.components.commands[]? // empty' "$manifest" 2>/dev/null)
    if [[ -n "$commands" ]]; then
        info "Commands:"
        while IFS= read -r cmd; do
            [[ -z "$cmd" ]] && continue
            # Copy the command markdown file
            copy_file "${source_claude}/commands/${cmd}.md" "${target_claude}/commands/${cmd}.md"
            # Also copy any associated command directory (for multi-file commands)
            if [[ -d "${source_claude}/commands/${cmd}" ]]; then
                copy_dir "${source_claude}/commands/${cmd}" "${target_claude}/commands/${cmd}"
            fi
            ((COMMANDS_INSTALLED++)) || true
        done <<< "$commands"
    fi

    # --- Hooks ---
    local hooks
    hooks=$(jq -r '.components.hooks[]? // empty' "$manifest" 2>/dev/null)
    if [[ -n "$hooks" ]]; then
        info "Hooks:"
        while IFS= read -r hook; do
            [[ -z "$hook" ]] && continue
            copy_file "${source_claude}/hooks/${hook}" "${target_claude}/hooks/${hook}"
            ((HOOKS_INSTALLED++)) || true
        done <<< "$hooks"
    fi

    success "Module '${mod}' installed"
}

# ------------------------------------------------------------------------------
# Deep merge settings.json (preserve existing, add missing)
# ------------------------------------------------------------------------------
merge_settings() {
    local source_settings="${SCRIPT_DIR}/.claude/settings.json"
    local target_settings="${TARGET_DIR}/.claude/settings.json"

    header "Merging settings.json"

    if [[ ! -f "$source_settings" ]]; then
        warn "No source settings.json found at ${source_settings}, skipping merge"
        return 0
    fi

    if [[ "$DRY_RUN" == true ]]; then
        detail "[dry-run] Would merge settings.json"
        return 0
    fi

    mkdir -p "${TARGET_DIR}/.claude"

    if [[ ! -f "$target_settings" ]]; then
        # No existing settings, just copy
        cp "$source_settings" "$target_settings"
        success "Created settings.json (no existing file to merge)"
        return 0
    fi

    # Deep merge: source * target -- target values take precedence
    # jq's * operator does recursive object merge; the right operand wins
    # on scalar conflicts, which preserves existing user settings.
    # .[0] = source (framework defaults), .[1] = target (user settings)
    local merged
    if ! merged=$(jq -s '.[0] * .[1]' "$source_settings" "$target_settings" 2>/dev/null); then
        warn "Settings merge failed, preserving existing settings.json"
        return 0
    fi

    # Validate the merged JSON
    if ! echo "$merged" | jq . &>/dev/null; then
        warn "Merged settings.json is invalid JSON, preserving existing"
        return 0
    fi

    # Write merged settings with backup
    cp "$target_settings" "${target_settings}.bak"
    echo "$merged" > "$target_settings"
    success "Merged settings.json (backup at settings.json.bak)"
    detail "Existing user settings preserved; new framework keys added"
}

# ------------------------------------------------------------------------------
# Post-install: make hooks executable, etc.
# ------------------------------------------------------------------------------
post_install() {
    header "Post-installation"

    local target_hooks="${TARGET_DIR}/.claude/hooks"

    if [[ -d "$target_hooks" ]]; then
        local count=0
        while IFS= read -r hook_file; do
            if [[ "$DRY_RUN" == true ]]; then
                detail "[dry-run] Would chmod +x: ${hook_file#"$TARGET_DIR"/}"
            else
                chmod +x "$hook_file"
            fi
            ((count++)) || true
        done < <(find "$target_hooks" -type f \( -name "*.sh" -o -name "*.bash" \) 2>/dev/null)

        if [[ $count -gt 0 ]]; then
            success "Made ${count} hook script(s) executable"
        fi
    fi

    # Write installation receipt
    if [[ "$DRY_RUN" != true ]]; then
        write_receipt
        success "Installation receipt written to ${INSTALL_RECEIPT}"
    fi
}

# ------------------------------------------------------------------------------
# Installation receipt (for idempotency and uninstall)
# ------------------------------------------------------------------------------
write_receipt() {
    local receipt_file="${TARGET_DIR}/${INSTALL_RECEIPT}"
    mkdir -p "$(dirname "$receipt_file")"

    local modules_json
    modules_json=$(printf '%s\n' "${SELECTED_MODULES[@]}" | jq -R . | jq -s .)

    # Collect all installed file paths relative to target
    local installed_files=()
    local mod
    for mod in "${SELECTED_MODULES[@]}"; do
        local manifest="${SCRIPT_DIR}/modules/${mod}/manifest.json"
        [[ ! -f "$manifest" ]] && continue

        # Agents
        local agents
        agents=$(jq -r '.components.agents[]? // empty' "$manifest" 2>/dev/null)
        while IFS= read -r agent; do
            [[ -z "$agent" ]] && continue
            local filename="${agent%% *}"
            [[ "$filename" != *.md ]] && filename="${filename}.md"
            if [[ -f "${TARGET_DIR}/.claude/agents/${filename}" ]]; then
                installed_files+=(".claude/agents/${filename}")
            fi
        done <<< "$agents"

        # Skills
        local skills
        skills=$(jq -r '.components.skills[]? // empty' "$manifest" 2>/dev/null)
        while IFS= read -r skill; do
            [[ -z "$skill" ]] && continue
            if [[ -d "${TARGET_DIR}/.claude/skills/${skill}" ]]; then
                installed_files+=(".claude/skills/${skill}/")
            fi
        done <<< "$skills"

        # Commands
        local commands
        commands=$(jq -r '.components.commands[]? // empty' "$manifest" 2>/dev/null)
        while IFS= read -r cmd; do
            [[ -z "$cmd" ]] && continue
            if [[ -f "${TARGET_DIR}/.claude/commands/${cmd}.md" ]]; then
                installed_files+=(".claude/commands/${cmd}.md")
            fi
            if [[ -d "${TARGET_DIR}/.claude/commands/${cmd}" ]]; then
                installed_files+=(".claude/commands/${cmd}/")
            fi
        done <<< "$commands"

        # Hooks
        local hooks
        hooks=$(jq -r '.components.hooks[]? // empty' "$manifest" 2>/dev/null)
        while IFS= read -r hook; do
            [[ -z "$hook" ]] && continue
            if [[ -f "${TARGET_DIR}/.claude/hooks/${hook}" ]]; then
                installed_files+=(".claude/hooks/${hook}")
            fi
        done <<< "$hooks"
    done

    local files_json
    files_json=$(printf '%s\n' "${installed_files[@]}" | jq -R . | jq -s .)

    jq -n \
        --arg version "$VERSION" \
        --arg date "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg source "$SCRIPT_DIR" \
        --argjson modules "$modules_json" \
        --argjson files "$files_json" \
        --argjson agents "$AGENTS_INSTALLED" \
        --argjson skills "$SKILLS_INSTALLED" \
        --argjson commands "$COMMANDS_INSTALLED" \
        --argjson hooks "$HOOKS_INSTALLED" \
        '{
            framework: "open-claude-office",
            version: $version,
            installed_at: $date,
            source_dir: $source,
            modules: $modules,
            files: $files,
            counts: {
                agents: $agents,
                skills: $skills,
                commands: $commands,
                hooks: $hooks
            }
        }' > "$receipt_file"
}

# ------------------------------------------------------------------------------
# Print summary
# ------------------------------------------------------------------------------
print_summary() {
    header "Installation Summary"

    echo ""
    info "Target:   ${BOLD}${TARGET_DIR}${RESET}"
    info "Source:   ${DIM}${SCRIPT_DIR}${RESET}"
    info "Modules:  ${BOLD}${SELECTED_MODULES[*]}${RESET}"
    echo ""

    printf "    ${GREEN}%-12s${RESET} %s\n" "Agents:" "${AGENTS_INSTALLED} installed"
    printf "    ${GREEN}%-12s${RESET} %s\n" "Skills:" "${SKILLS_INSTALLED} installed"
    printf "    ${GREEN}%-12s${RESET} %s\n" "Commands:" "${COMMANDS_INSTALLED} installed"
    printf "    ${GREEN}%-12s${RESET} %s\n" "Hooks:" "${HOOKS_INSTALLED} installed"

    if [[ $FILES_SKIPPED -gt 0 ]]; then
        printf "    ${YELLOW}%-12s${RESET} %s\n" "Skipped:" "${FILES_SKIPPED} files (already exist, use --force to overwrite)"
    fi
    if [[ $FILES_OVERWRITTEN -gt 0 ]]; then
        printf "    ${YELLOW}%-12s${RESET} %s\n" "Overwritten:" "${FILES_OVERWRITTEN} files"
    fi

    echo ""
}

# ------------------------------------------------------------------------------
# Quick-start guide
# ------------------------------------------------------------------------------
print_quickstart() {
    echo -e "  ${CYAN}${BOLD}==> Quick Start${RESET}"
    echo ""
    echo -e "    ${BOLD}1.${RESET} Navigate to your project:"
    echo -e "       ${DIM}cd ${TARGET_DIR}${RESET}"
    echo ""
    echo -e "    ${BOLD}2.${RESET} Start Claude Code:"
    echo -e "       ${DIM}claude${RESET}"
    echo ""
    echo -e "    ${BOLD}3.${RESET} Try these commands inside Claude:"

    # Context-aware command suggestions based on installed modules
    local has_lifecycle=false has_craft=false has_git=false has_meta=false
    for mod in "${SELECTED_MODULES[@]}"; do
        case "$mod" in
            lifecycle) has_lifecycle=true ;;
            craft) has_craft=true ;;
            git) has_git=true ;;
            meta) has_meta=true ;;
        esac
    done

    echo -e "       ${DIM}/init${RESET}                    Initialize your project"
    if [[ "$has_lifecycle" == true ]]; then
        echo -e "       ${DIM}/feature${RESET}                 Start a feature workflow"
        echo -e "       ${DIM}/phase${RESET}                   Check phase status"
    fi
    if [[ "$has_craft" == true ]]; then
        echo -e "       ${DIM}/craft${RESET}                   Run the portfolio pipeline"
    fi
    if [[ "$has_git" == true ]]; then
        echo -e "       ${DIM}/git-workflow${RESET}             Git workflow management"
    fi
    if [[ "$has_meta" == true ]]; then
        echo -e "       ${DIM}\"Create a new agent\"${RESET}     Use meta tools"
    fi

    echo ""
    echo -e "    ${BOLD}4.${RESET} View installed components:"
    echo -e "       ${DIM}ls ${TARGET_DIR}/.claude/agents/${RESET}"
    echo -e "       ${DIM}ls ${TARGET_DIR}/.claude/skills/${RESET}"
    echo -e "       ${DIM}ls ${TARGET_DIR}/.claude/commands/${RESET}"
    echo ""
    echo -e "    ${DIM}For more info: ${SCRIPT_DIR}/docs/${RESET}"
    echo ""
}

# ------------------------------------------------------------------------------
# Uninstall
# ------------------------------------------------------------------------------
do_uninstall() {
    banner

    local receipt_file="${TARGET_DIR}/${INSTALL_RECEIPT}"

    if [[ ! -f "$receipt_file" ]]; then
        die "No installation receipt found at ${receipt_file}. Cannot determine what to uninstall."
    fi

    header "Uninstalling open-claude-office"

    local installed_at
    installed_at=$(jq -r '.installed_at // "unknown"' "$receipt_file" 2>/dev/null)
    local modules
    modules=$(jq -r '.modules | join(", ")' "$receipt_file" 2>/dev/null)

    info "Installation from: ${installed_at}"
    info "Modules: ${modules}"
    echo ""

    # Confirm unless --force
    if [[ "$FORCE" != true ]]; then
        local answer
        read -rp "  Are you sure you want to uninstall? [y/N] " answer
        if [[ ! "$answer" =~ ^[Yy]$ ]]; then
            info "Uninstall cancelled."
            exit 0
        fi
    fi

    local removed=0
    local failed=0

    # Remove installed files from receipt
    local files
    files=$(jq -r '.files[]? // empty' "$receipt_file" 2>/dev/null)
    while IFS= read -r relpath; do
        [[ -z "$relpath" ]] && continue
        local fullpath="${TARGET_DIR}/${relpath}"

        if [[ "$DRY_RUN" == true ]]; then
            detail "[dry-run] Would remove: ${relpath}"
            ((removed++)) || true
            continue
        fi

        if [[ "$relpath" == */ ]]; then
            # Directory
            if [[ -d "$fullpath" ]]; then
                rm -rf "$fullpath"
                detail "removed: ${relpath}"
                ((removed++)) || true
            fi
        else
            # File
            if [[ -f "$fullpath" ]]; then
                rm -f "$fullpath"
                detail "removed: ${relpath}"
                ((removed++)) || true
            fi
        fi
    done <<< "$files"

    # Restore settings.json backup if exists
    local target_settings="${TARGET_DIR}/.claude/settings.json"
    local settings_backup="${target_settings}.bak"
    if [[ -f "$settings_backup" ]]; then
        if [[ "$DRY_RUN" == true ]]; then
            detail "[dry-run] Would restore settings.json from backup"
        else
            mv "$settings_backup" "$target_settings"
            success "Restored settings.json from backup"
        fi
    fi

    # Remove receipt
    if [[ "$DRY_RUN" != true ]]; then
        rm -f "$receipt_file"
    fi

    # Clean up empty directories
    if [[ "$DRY_RUN" != true ]]; then
        for dir in agents skills commands hooks; do
            local d="${TARGET_DIR}/.claude/${dir}"
            if [[ -d "$d" ]] && [[ -z "$(ls -A "$d" 2>/dev/null)" ]]; then
                rmdir "$d" 2>/dev/null && detail "removed empty directory: .claude/${dir}/"
            fi
        done
    fi

    echo ""
    success "Uninstalled ${removed} component(s)"
    if [[ $failed -gt 0 ]]; then
        warn "Failed to remove ${failed} component(s)"
    fi
    echo ""
}

# ------------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------------
main() {
    parse_args "$@"

    # Handle uninstall
    if [[ "$UNINSTALL" == true ]]; then
        do_uninstall
        exit 0
    fi

    banner

    # Dependency checks
    check_dependencies

    # Module selection — default is full install (all modules)
    if [[ "$ALL" == true ]] || [[ ${#SELECTED_MODULES[@]} -eq 0 ]]; then
        SELECTED_MODULES=("${ALL_MODULES[@]}")
        if [[ ${#SELECTED_MODULES[@]} -eq 8 ]] && [[ "$ALL" != true ]]; then
            info "No modules specified — installing all modules (default)"
        fi
    fi

    # Ensure core is always included
    local has_core=false
    for mod in "${SELECTED_MODULES[@]}"; do
        if [[ "$mod" == "core" ]]; then
            has_core=true
            break
        fi
    done
    if [[ "$has_core" == false ]]; then
        SELECTED_MODULES=("core" "${SELECTED_MODULES[@]}")
        info "Added required module: core"
    fi

    # Validate selected modules
    for mod in "${SELECTED_MODULES[@]}"; do
        if ! validate_module "$mod"; then
            die "Invalid module: '$mod'. Available modules: ${ALL_MODULES[*]}"
        fi
    done

    # Resolve dependencies (ordering + transitive deps)
    resolve_dependencies

    echo ""
    info "Target directory: ${BOLD}${TARGET_DIR}${RESET}"
    info "Source directory: ${DIM}${SCRIPT_DIR}${RESET}"
    info "Modules to install: ${BOLD}${SELECTED_MODULES[*]}${RESET}"
    if [[ "$FORCE" == true ]]; then
        warn "Force mode enabled: existing files will be overwritten"
    fi
    if [[ "$DRY_RUN" == true ]]; then
        warn "Dry-run mode: no files will be modified"
    fi

    # Ensure target .claude directory structure
    if [[ "$DRY_RUN" != true ]]; then
        mkdir -p "${TARGET_DIR}/.claude/agents"
        mkdir -p "${TARGET_DIR}/.claude/skills"
        mkdir -p "${TARGET_DIR}/.claude/commands"
        mkdir -p "${TARGET_DIR}/.claude/hooks"
    fi

    # Install each module
    for mod in "${SELECTED_MODULES[@]}"; do
        install_module "$mod"
    done

    # Merge settings.json
    merge_settings

    # Post-install tasks
    post_install

    # Summary
    print_summary

    # Quick-start guide
    print_quickstart

    success "Installation complete!"
    echo ""
}

main "$@"
