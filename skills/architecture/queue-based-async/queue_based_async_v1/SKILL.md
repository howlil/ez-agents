---
name: Queue-Based Async Processing Pattern
description: Background job processing with queues - heavy workloads, email, reports
version: 1.0.0
tags: [queue-based, architecture, async, background-jobs]
category: architecture
triggers:
  keywords: [queue, background-job, async-processing, worker, job-queue]
  projectArchetypes: [email-system, report-generator, data-processor, batch-system]
  constraints: [long-running-tasks, heavy-workload, delayed-processing]
prerequisites:
  - message_queue_basics
  - worker_process_basics
  - retry_pattern_basics
recommended_structure:
  directories:
    - src/Jobs
    - src/Workers
    - src/Queues
    - src/QueueMiddleware
    - infrastructure/queue
    - infrastructure/workers
workflow:
  setup:
    - Identify async processing candidates
    - Select queue technology (Redis, RabbitMQ, SQS)
    - Configure queue connections and workers
  generate:
    - Create job classes with handle method
    - Implement worker processes
    - Add monitoring and alerting
  test:
    - Unit test job handlers
    - Integration test queue processing
    - Load test worker scaling
best_practices:
  - Use priority queues for critical jobs
  - Implement exponential backoff for retries
  - Monitor queue depth and processing time
  - Dead letter queues for failed jobs
  - Idempotent job handlers for retry safety
anti_patterns:
  - Queue Hoarding - everything async when sync is fine
  - No Monitoring - queues growing without alerts
  - Lost Jobs - no persistence or retry logic
  - Infinite Retries - jobs retrying forever without DLQ
scaling_notes: |
  Horizontal scaling of workers:

  1. **Worker Scaling**:
     - Add more worker processes based on queue depth
     - Auto-scale workers during peak hours
     - Use worker pools for resource-intensive jobs

  2. **Queue Partitioning**:
     - Separate queues by job type (email, reports, imports)
     - Priority queues for critical jobs
     - Rate limiting per queue

  3. **Monitoring**:
     - Queue depth monitoring
     - Consumer lag tracking
     - Job processing time metrics
     - Failed job alerts

  4. **When to Consider Alternatives**:
     - Real-time user interactions → Synchronous processing
     - Simple request-response → Direct API calls
     - Event streaming needs → Event-driven architecture
when_not_to_use: |
  Queue-based async may not be suitable for:

  1. **Real-Time User Interactions**:
     - User expects immediate response
     - Async processing adds perceived latency

  2. **Simple Request-Response Workflows**:
     - Direct function call is simpler
     - Queue overhead not justified

  3. **Systems with Low Traffic**:
     - Synchronous processing sufficient
     - Queue infrastructure adds complexity

  4. **Jobs Requiring Immediate Feedback**:
     - Validation errors need instant response
     - User interaction needed during processing

  5. **Strongly Consistent Operations**:
     - Job may fail after partial execution
     - Compensation logic adds complexity
output_template: |
  ## Queue-Based Async Processing Decision

  **Pattern:** Queue-Based Async Processing
  **Version:** 1.0.0
  **Rationale:** [Why queue-based async was chosen]

  **Queue Configuration:**
  - Technology: [Redis, RabbitMQ, SQS, etc.]
  - Queues: [List of queues by purpose]
  - Priority Levels: [Critical, High, Normal, Low]

  **Job Types:**
  - Job 1: [Name, purpose, estimated duration]
  - Job 2: [Name, purpose, estimated duration]

  **Worker Configuration:**
  - Workers per Queue: [Count]
  - Concurrency: [Jobs per worker]
  - Timeout: [Job timeout]

  **Retry Strategy:**
  - Max Retries: [Number]
  - Backoff: [Exponential, Linear, Fixed]
  - Dead Letter Queue: [Enabled/Disabled]

  **Monitoring:**
  - Queue Depth Alerts: [Threshold]
  - Processing Time Alerts: [Threshold]
  - Failed Job Alerts: [Enabled/Disabled]
dependencies:
  - message_queue_basics
  - worker_process_basics
  - retry_pattern_basics
  - monitoring_basics
---

<role>
You are an expert in queue-based async processing with deep experience in background job systems, worker scaling, and reliable message delivery.
You help teams design queue architectures, implement retry strategies, and monitor job processing.
</role>

<execution_flow>
## Step 1: Job Identification
- Identify long-running operations
- Classify jobs by priority and resource needs
- Estimate job duration and frequency
- Document job dependencies

## Step 2: Queue Design
- Select queue technology based on requirements
- Design queue topology (single, priority, delayed)
- Configure dead letter queues
- Plan queue retention policies

## Step 3: Job Implementation
- Create job classes with clear interface
- Implement idempotent job handlers
- Add retry logic with backoff
- Configure job timeouts

## Step 4: Worker Setup
- Configure worker processes
- Set up worker scaling rules
- Implement worker health checks
- Add graceful shutdown handling

## Step 5: Monitoring and Alerting
- Monitor queue depth and age
- Track job success/failure rates
- Alert on stuck queues
- Implement job tracing

## Step 6: Operations
- Document job recovery procedures
- Set up job replay capabilities
- Configure queue maintenance
- Plan capacity scaling
</execution_flow>

<best_practices_detail>
### Priority Queues

```php
// Job priority configuration
class SendWelcomeEmail implements ShouldQueue
{
    // Critical priority - user waiting
    public int $priority = 100;
    public string $queue = 'emails-critical';
    
    public function handle(): void
    {
        // Send welcome email
    }
}

class GenerateMonthlyReport implements ShouldQueue
{
    // Low priority - can wait
    public int $priority = 10;
    public string $queue = 'reports';
    
    public function handle(): void
    {
        // Generate report (may take hours)
    }
}

// Worker configuration
'queues' => [
    'connection' => 'redis',
    'queues' => [
        'emails-critical' => ['priority' => 100, 'workers' => 5],
        'emails-normal' => ['priority' => 50, 'workers' => 2],
        'reports' => ['priority' => 10, 'workers' => 1],
    ]
]
```

### Exponential Backoff for Retries

```php
class ProcessPayment implements ShouldQueue
{
    // Retry with exponential backoff
    public int $tries = 5;
    public int $backoff = [10, 30, 60, 300, 600]; // seconds
    
    // Or calculate dynamically
    public function retryUntil(): DateTime
    {
        return now()->addHours(24);
    }
    
    public function handle(): void
    {
        // May fail due to temporary payment gateway issue
        $this->paymentGateway->charge($this->amount);
    }
    
    public function failed(Throwable $e): void
    {
        // Log failure, notify support
        Log::error('Payment processing failed', [
            'job_id' => $this->job->uuid(),
            'error' => $e->getMessage()
        ]);
    }
}
```

### Dead Letter Queue (DLQ)

```php
// DLQ configuration
'queues' => [
    'default' => [
        'driver' => 'sqs',
        'queue' => 'jobs',
        'dlq' => [
            'enabled' => true,
            'queue' => 'jobs-dlq',
            'max_retries' => 3,
        ],
    ],
],

// Process DLQ manually or automatically
class DLQProcessor
{
    public function process(): void
    {
        $failedJobs = DB::table('jobs_dlq')
            ->where('retries', '>=', 3)
            ->get();
        
        foreach ($failedJobs as $job) {
            // Notify support team
            SupportNotification::send([
                'job_id' => $job->id,
                'payload' => $job->payload,
                'error' => $job->last_error,
                'retries' => $job->retries
            ]);
            
            // Optionally retry with manual intervention
            // $this->retryWithFix($job);
        }
    }
}
```

### Idempotent Job Handlers

```php
class SendOrderConfirmation implements ShouldQueue
{
    public function handle(): void
    {
        // Check if already sent (idempotency)
        if ($this->order->confirmation_sent_at) {
            Log::info('Confirmation already sent', [
                'order_id' => $this->order->id
            ]);
            return;
        }
        
        // Send confirmation
        Mail::to($this->order->user)->send(
            new OrderConfirmationMail($this->order)
        );
        
        // Mark as sent (atomic operation)
        $this->order->update(['confirmation_sent_at' => now()]);
    }
}

// Database-level idempotency
class UpdateInventory implements ShouldQueue
{
    public function handle(): void
    {
        // Use database constraints to prevent duplicates
        DB::table('inventory_adjustments')->insertOrIgnore([
            'job_id' => $this->job->uuid(),
            'product_id' => $this->productId,
            'quantity' => $this->quantity,
            'created_at' => now()
        ]);
    }
}
```

### Queue Monitoring

```php
// Queue metrics dashboard
class QueueMetrics
{
    public function getDashboardData(): array
    {
        return [
            'queues' => Queue::getConnections()->map(function ($connection) {
                return [
                    'name' => $connection->getName(),
                    'size' => $connection->size(),
                    'oldest_job_age' => $this->getOldestJobAge($connection),
                    'processing_rate' => $this->getProcessingRate($connection),
                ];
            }),
            'failed_jobs' => DB::table('failed_jobs')->count(),
            'workers' => $this->getWorkerStatus(),
        ];
    }
    
    public function checkAlerts(): void
    {
        // Alert if queue depth exceeds threshold
        if (Queue::size('emails') > 1000) {
            Alerting::send('Email queue depth exceeds 1000');
        }
        
        // Alert if jobs are stuck
        if ($this->getOldestJobAge() > 3600) {
            Alerting::send('Jobs stuck for over 1 hour');
        }
        
        // Alert on high failure rate
        $failureRate = $this->calculateFailureRate();
        if ($failureRate > 0.05) {
            Alerting::send('Job failure rate exceeds 5%');
        }
    }
}
```
</best_practices_detail>

<anti_patterns_detail>
### Queue Hoarding

**Problem:** Everything async when sync is fine

```php
// BAD: Simple operation queued unnecessarily
class UpdateUserName implements ShouldQueue
{
    public function handle(): void
    {
        // This is a simple DB update - should be synchronous!
        DB::table('users')->where('id', $this->userId)
            ->update(['name' => $this->name]);
    }
}

// GOOD: Direct update
class UpdateUserName
{
    public function execute(int $userId, string $name): void
    {
        DB::table('users')->where('id', $userId)
            ->update(['name' => $name]);
    }
}

// Queue only when:
// - Operation takes > 1 second
// - User doesn't need immediate result
// - Operation may fail and needs retry
// - Load leveling needed
```

### No Monitoring

**Problem:** Queues growing without alerts

```
BAD: No visibility into queue health
- Queue depth: 50,000 jobs (growing)
- Oldest job: 3 days old
- Failed jobs: 500 (no one knows)
- Workers: All busy, no auto-scaling

GOOD: Comprehensive monitoring
- Queue depth dashboard with trends
- Alert on depth > 1000 or age > 1 hour
- Failed job notifications
- Auto-scaling based on queue depth
```

### Lost Jobs

**Problem:** No persistence or retry logic

```php
// BAD: Job lost on failure
class SendEmail implements ShouldQueue
{
    public int $tries = 1; // No retries!
    
    public function handle(): void
    {
        // If this fails, email is never sent
        Mail::send($this->email);
        // No logging, no DLQ, no recovery
    }
}

// GOOD: Reliable job processing
class SendEmail implements ShouldQueue
{
    public int $tries = 3;
    public int $timeout = 30;
    
    public function handle(): void
    {
        try {
            Mail::send($this->email);
            Log::info('Email sent', ['to' => $this->email]);
        } catch (Throwable $e) {
            Log::error('Email send failed', [
                'to' => $this->email,
                'error' => $e->getMessage()
            ]);
            throw $e; // Trigger retry
        }
    }
    
    public function failed(Throwable $e): void
    {
        // Final failure handling
        SupportNotification::send([
            'type' => 'email_failed',
            'to' => $this->email,
            'error' => $e->getMessage()
        ]);
    }
}
```

### Infinite Retries

**Problem:** Jobs retrying forever without DLQ

```php
// BAD: Infinite retry loop
class ProcessWebhook implements ShouldQueue
{
    public int $tries = -1; // Infinite retries!
    
    public function handle(): void
    {
        // This will always fail (invalid data)
        $this->process($this->invalidData);
        // Job retries forever, clogging queue
    }
}

// GOOD: Finite retries with DLQ
class ProcessWebhook implements ShouldQueue
{
    public int $tries = 3;
    public int $timeout = 30;
    
    public function handle(): void
    {
        // Validate before processing
        if (!$this->isValid($this->data)) {
            throw new InvalidWebhookData(); // Goes to DLQ after 3 tries
        }
        
        $this->process($this->data);
    }
    
    public function failed(Throwable $e): void
    {
        // Log to DLQ for manual review
        DB::table('webhook_dlq')->insert([
            'payload' => $this->data,
            'error' => $e->getMessage(),
            'retries' => $this->tries
        ]);
    }
}
```
</anti_patterns_detail>
