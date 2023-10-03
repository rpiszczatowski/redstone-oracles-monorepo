#!/bin/bash

LOG_FILE="$1"

declare -a POSITIVE_PATTERNS=(
    'Fetching failed for source:'
    'Request failed:'
    'Value is too deviated'
    'Running new iteration:'
)
JOINED_POSITIVE_PATTERN=$(IFS='@'; echo "${POSITIVE_PATTERNS[*]}")
FINAL_POSITIVE_PATTERN="${JOINED_POSITIVE_PATTERN//@/\\|}"

declare -a NEGATIVE_PATTERNS=(
    'Missing price for'
)
JOINED_NEGATIVE_PATTERN=$(IFS='@'; echo "${NEGATIVE_PATTERNS[*]}")
FINAL_NEGATIVE_PATTERN="${JOINED_NEGATIVE_PATTERN//@/\\|}"

grep "$FINAL_POSITIVE_PATTERN" "$LOG_FILE" | grep -v "$FINAL_NEGATIVE_PATTERN"
