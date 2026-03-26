#!/bin/sh
# Qwen Code CLI Simple Test
# Quick validation test using shared helper functions

set -e

# Load shared helpers
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/qwen-code-helpers.sh"

echo "🎯 Qwen Code CLI Simple Test"
echo "============================"

# Setup
ensure_results_dir

# Validate token
if ! check_token; then
    exit 1
fi

# Configure Qwen Code
configure_qwen_settings

echo ""
echo "📊 Testing Qwen Code CLI..."
echo "Prompt: What is 2+2?"
echo ""

# Run test
result=$(run_qwen_test "What is 2+2?" 60)
duration=$(parse_duration "$result")
exit_code=$(parse_exit_code "$result")

echo "$result" | grep -q '"output":"2 + 2 = 4' && echo "   ✓ Answer correct" || echo "   ⚠ Answer may be incorrect"
echo ""
echo "⏱ Response time: ${duration}ms"
echo ""

# Determine status
if [ "$exit_code" -eq 0 ]; then
    echo "✅ Qwen Code CLI test PASSED"
    STATUS="PASSED"
else
    echo "❌ Qwen Code CLI test FAILED (exit code: $exit_code)"
    STATUS="FAILED"
fi

# Save result
cat > "$QWEN_RESULTS_DIR/qwen-code-simple-result.json" << EOF
{
  "timestamp": "$(get_timestamp)",
  "test": "Qwen Code CLI Simple Test",
  "prompt": "What is 2+2?",
  "responseTimeMs": ${duration},
  "exitCode": $exit_code,
  "status": "${STATUS}"
}
EOF

echo ""
echo "📄 Result saved to: $QWEN_RESULTS_DIR/qwen-code-simple-result.json"

exit $exit_code
