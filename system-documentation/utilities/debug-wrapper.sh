#!/bin/bash

# General-purpose bash debug wrapper script
# Usage: ./debug-wrapper.sh [debug-options] <script> [script-arguments]
# Example: ./debug-wrapper.sh -x ./run-aitestr.sh models list
# Example: ./debug-wrapper.sh -xv ./run-tests.sh
# Example: ./debug-wrapper.sh --help

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage information
show_usage() {
    echo -e "${BLUE}General-Purpose Bash Debug Wrapper${NC}"
    echo ""
    echo "Usage: $0 [debug-options] <script> [script-arguments]"
    echo ""
    echo -e "${YELLOW}Debug Options:${NC}"
    echo "  -x          Print commands and their arguments as they are executed"
    echo "  -v          Print shell input lines as they are read (including comments)"
    echo "  -xv         Combine both -x and -v options"
    echo "  --trace     Enable function tracing (shows function entry/exit)"
    echo "  --save      Save debug output to a timestamped file"
    echo "  --help      Show this help message"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 -x ./run-aitestr.sh models list"
    echo "  $0 -xv ./run-tests.sh"
    echo "  $0 --trace ./my-script.sh arg1 arg2"
    echo "  $0 --save -x ./run-aitestr.sh models update"
    echo ""
    echo -e "${YELLOW}Available debug techniques:${NC}"
    echo "  -x: Shows executed commands (most common)"
    echo "  -v: Shows input lines including comments"
    echo "  -xv: Shows both commands and input lines"
    echo "  --trace: Traces function calls and returns"
    echo "  --save: Saves all output to debug-YYYYMMDD-HHMMSS.log"
}

# Function to validate script exists and is executable
validate_script() {
    local script_path="$1"
    
    if [[ ! -f "$script_path" ]]; then
        echo -e "${RED}Error: Script '$script_path' not found${NC}" >&2
        return 1
    fi
    
    if [[ ! -r "$script_path" ]]; then
        echo -e "${RED}Error: Script '$script_path' is not readable${NC}" >&2
        return 1
    fi
    
    # Check if it's a bash script by looking at shebang or extension
    if [[ "$script_path" == *.sh ]] || head -1 "$script_path" | grep -q "^#!/.*bash"; then
        echo -e "${GREEN}✓ Valid bash script detected: $script_path${NC}"
        return 0
    else
        echo -e "${YELLOW}Warning: '$script_path' may not be a bash script${NC}" >&2
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
}

# Function to generate timestamped log filename
generate_log_filename() {
    echo "debug-$(date +%Y%m%d-%H%M%S).log"
}

# Parse command line arguments
debug_options=""
save_output=false
script_path=""
script_args=()

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_usage
            exit 0
            ;;
        -x)
            debug_options="$debug_options -x"
            shift
            ;;
        -v)
            debug_options="$debug_options -v"
            shift
            ;;
        -xv|-vx)
            debug_options="$debug_options -xv"
            shift
            ;;
        --trace)
            debug_options="$debug_options -x -o functrace"
            shift
            ;;
        --save)
            save_output=true
            shift
            ;;
        -*)
            echo -e "${RED}Error: Unknown option '$1'${NC}" >&2
            echo "Use --help for usage information"
            exit 1
            ;;
        *)
            # First non-option argument is the script path
            if [[ -z "$script_path" ]]; then
                script_path="$1"
            else
                # Remaining arguments are script arguments
                script_args+=("$1")
            fi
            shift
            ;;
    esac
done

# Validate required arguments
if [[ -z "$script_path" ]]; then
    echo -e "${RED}Error: No script specified${NC}" >&2
    echo "Use --help for usage information"
    exit 1
fi

# Set default debug option if none specified
if [[ -z "$debug_options" ]]; then
    debug_options="-x"
    echo -e "${YELLOW}No debug options specified, using default: -x${NC}"
fi

# Validate the script
if ! validate_script "$script_path"; then
    exit 1
fi

# Prepare the command
debug_command="bash $debug_options \"$script_path\""
if [[ ${#script_args[@]} -gt 0 ]]; then
    # Properly quote script arguments
    for arg in "${script_args[@]}"; do
        debug_command="$debug_command \"$arg\""
    done
fi

# Display what we're about to run
echo -e "${BLUE}Debug Configuration:${NC}"
echo "  Script: $script_path"
echo "  Debug options: $debug_options"
echo "  Script arguments: ${script_args[*]:-<none>}"
if [[ "$save_output" == true ]]; then
    log_file=$(generate_log_filename)
    echo "  Output will be saved to: $log_file"
fi
echo ""

# Execute the command
echo -e "${GREEN}Starting debug session...${NC}"
echo "----------------------------------------"

if [[ "$save_output" == true ]]; then
    log_file=$(generate_log_filename)
    echo -e "${BLUE}Saving output to: $log_file${NC}"
    eval "$debug_command" 2>&1 | tee "$log_file"
    echo -e "${GREEN}Debug output saved to: $log_file${NC}"
else
    eval "$debug_command"
fi

echo "----------------------------------------"
echo -e "${GREEN}Debug session completed${NC}"
