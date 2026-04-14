#!/usr/bin/env bash

# ── Colours (disabled when stdout is not a terminal) ──────────────────
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    BOLD='\033[1m'
    RESET='\033[0m'
else
    RED='' GREEN='' BOLD='' RESET=''
fi

passed=0
failed=0

run_step() {
  local name="$1"
  shift
  printf "  %-20s" "$name"
  if "$@" &> /dev/null; then
    echo -e "${GREEN}OK${RESET}"
    ((passed++))
  else
    echo -e "${RED}FAIL${RESET}"
    ((failed++))
  fi
}

echo -e "${BOLD}Running CI checks...${RESET}"
echo ""

run_step "Type Check" npx tsc -b
run_step "Lint" npm run --silent lint
run_step "Test" npx vitest --run
run_step "Build" npm run --silent build

echo ""
if [ "$failed" -eq 0 ]; then
    echo -e "${GREEN}${BOLD}Results: $passed passed, $failed failed${RESET}"
else
    echo -e "${RED}${BOLD}Results: $passed passed, $failed failed${RESET}"
fi

if [ "$failed" -gt 0 ]; then
  exit 1
fi
