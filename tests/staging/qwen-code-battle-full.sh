#!/bin/sh
# Qwen Code CLI Battle Test: v4 vs Current
# Compares ez-agents performance between versions using REAL Qwen Code CLI

set -e

# Load shared helpers
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/qwen-code-helpers.sh"

echo "🎯 Qwen Code CLI Battle Test"
echo "============================"
echo "Comparing ez-agents v4.0.0 vs Current Version"
echo ""

# Setup
ensure_results_dir

# Validate token
if ! check_token; then
    exit 1
fi

# Configure Qwen Code
configure_qwen_settings
echo ""

# ============================================================================
# TEST EXECUTION
# ============================================================================

run_version_tests() {
    version="$1"
    
    echo "" >&2
    echo "==========================================" >&2
    echo "🚀 Testing ez-agents $version" >&2
    echo "==========================================" >&2
    
    # Install version
    install_ez_agents "$version"
    
    # Run 4 test scenarios
    durations=""
    pass_count=0
    fail_count=0
    
    # Test 1: Simple Query
    echo "📊 Test 1: Simple Query" >&2
    result=$(run_qwen_test "What is the capital of France?" 60)
    duration=$(parse_duration "$result")
    exit_code=$(parse_exit_code "$result")
    durations="$durations $duration"
    [ "$exit_code" -eq 0 ] && pass_count=$((pass_count + 1)) || fail_count=$((fail_count + 1))
    echo "   Duration: ${duration}ms, Exit: $exit_code" >&2
    
    # Test 2: Code Generation
    echo "📊 Test 2: Code Generation" >&2
    result=$(run_qwen_test "Write a TypeScript function to sort an array of objects by value" 60)
    duration=$(parse_duration "$result")
    exit_code=$(parse_exit_code "$result")
    durations="$durations $duration"
    [ "$exit_code" -eq 0 ] && pass_count=$((pass_count + 1)) || fail_count=$((fail_count + 1))
    echo "   Duration: ${duration}ms, Exit: $exit_code" >&2
    
    # Test 3: Complex Analysis
    echo "📊 Test 3: Complex Analysis" >&2
    result=$(run_qwen_test "Explain microservices e-commerce architecture" 60)
    duration=$(parse_duration "$result")
    exit_code=$(parse_exit_code "$result")
    durations="$durations $duration"
    [ "$exit_code" -eq 0 ] && pass_count=$((pass_count + 1)) || fail_count=$((fail_count + 1))
    echo "   Duration: ${duration}ms, Exit: $exit_code" >&2
    
    # Test 4: Context Task
    echo "📊 Test 4: Context Task" >&2
    result=$(run_qwen_test "How to refactor authentication in 100+ file codebase" 60)
    duration=$(parse_duration "$result")
    exit_code=$(parse_exit_code "$result")
    durations="$durations $duration"
    [ "$exit_code" -eq 0 ] && pass_count=$((pass_count + 1)) || fail_count=$((fail_count + 1))
    echo "   Duration: ${duration}ms, Exit: $exit_code" >&2
    
    # Calculate stats
    avg_duration=$(calculate_average $durations)
    success_rate=$((pass_count * 100 / 4))
    
    echo "" >&2
    echo "📈 $version Summary:" >&2
    echo "   - Passed: $pass_count/4" >&2
    echo "   - Failed: $fail_count/4" >&2
    echo "   - Avg Response: ${avg_duration}ms" >&2
    echo "   - Success Rate: ${success_rate}%" >&2
    
    # Return stats JSON
    echo "{\"version\":\"$version\",\"totalTests\":4,\"passed\":$pass_count,\"failed\":$fail_count,\"avgResponseMs\":$avg_duration,\"successRate\":$success_rate,\"timestamp\":\"$(get_timestamp)\"}"
}

# Run tests for v4
echo "=========================================="
echo "PART 1: Testing ez-agents v4.0.0"
echo "=========================================="
v4_stats=$(run_version_tests "4.0.0")

# Run tests for current
echo ""
echo "=========================================="
echo "PART 2: Testing ez-agents CURRENT"
echo "=========================================="
current_stats=$(run_version_tests "current")

# ============================================================================
# RESULTS & COMPARISON
# ============================================================================

# Extract stats
v4_avg=$(echo "$v4_stats" | grep -o '"avgResponseMs":[0-9]*' | grep -o '[0-9]*')
current_avg=$(echo "$current_stats" | grep -o '"avgResponseMs":[0-9]*' | grep -o '[0-9]*')
v4_success=$(echo "$v4_stats" | grep -o '"successRate":[0-9]*' | grep -o '[0-9]*')
current_success=$(echo "$current_stats" | grep -o '"successRate":[0-9]*' | grep -o '[0-9]*')

# Determine winner
winner="CURRENT"
reason="Better overall performance"

if [ "$v4_success" -gt "$current_success" ]; then
    winner="V4"
    reason="Higher success rate"
elif [ "$v4_avg" -lt "$current_avg" ] && [ "$v4_success" -ge "$current_success" ]; then
    winner="V4"
    reason="Faster response time"
fi

# Calculate improvement
if [ "$v4_avg" -gt 0 ]; then
    improvement=$(( (v4_avg - current_avg) * 100 / v4_avg ))
else
    improvement=0
fi

# Generate report
cat > "$QWEN_RESULTS_DIR/qwen-code-battle-report.json" << EOF
{
  "title": "Qwen Code CLI Battle Test Report",
  "generatedAt": "$(get_timestamp)",
  "testType": "REAL_QWEN_CODE_CLI",
  "versions": {
    "v4": $v4_stats,
    "current": $current_stats
  },
  "comparison": {
    "responseTimeImprovement": "${improvement}%",
    "successRateDifference": "$((current_success - v4_success))%"
  },
  "winner": {
    "category": "$winner",
    "reason": "$reason"
  }
}
EOF

# Print final summary
echo ""
echo "=========================================="
echo "🏆 BATTLE TEST RESULTS"
echo "=========================================="
echo ""
echo "┌─────────────────┬────────────┬─────────────┐"
echo "│ Metric          │ v4.0.0     │ Current     │"
echo "├─────────────────┼────────────┼─────────────┤"
printf "│ Avg Response    │ %8sms │ %9sms │\n" "$v4_avg" "$current_avg"
printf "│ Success Rate    │ %8s%% │ %8s%% │\n" "$v4_success" "$current_success"
echo "└─────────────────┴────────────┴─────────────┘"
echo ""
echo "🏆 Winner: $winner"
echo "   Reason: $reason"
echo ""
echo "📄 Full report: $QWEN_RESULTS_DIR/qwen-code-battle-report.json"
echo ""

exit $([ "$winner" = "CURRENT" ] && echo 0 || echo 1)
