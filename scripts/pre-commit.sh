#!/usr/bin/env bash

passed=0
failed=0

run_step() {
  local name="$1"
  shift
  printf "  %-20s" "$name"
  if "$@" &> /dev/null; then
    echo "OK"
    ((passed++))
  else
    echo "FAIL"
    ((failed++))
  fi
}

echo "Running CI checks..."
echo ""

run_step "Type Check" npx tsc -b
run_step "Lint" npm run --silent lint
run_step "Test" npx vitest --run
run_step "Build" npm run --silent build

echo ""
echo "Results: $passed passed, $failed failed"

if [ "$failed" -gt 0 ]; then
  exit 1
fi
