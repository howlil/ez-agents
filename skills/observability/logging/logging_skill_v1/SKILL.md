---
name: logging_skill_v1
description: Structured logging, log aggregation, and log analysis with Winston, Pino, and ELK/OpenSearch stack for production observability
version: 1.0.0
tags: [logging, observability, winston, pino, elk, opensearch, structured-logging]
stack: observability/logging
category: observability
triggers:
  keywords: [logging, logger, winston, pino, elk stack, log aggregation, structured logging]
  filePatterns: [*.ts, *.js, docker-compose.yml, winston.config.*]
  commands: [npm run logs, docker logs, kubectl logs]
  stack: observability/logging
  projectArchetypes: [api-backend, microservices, saas, enterprise]
  modes: [greenfield, production, debugging]
prerequisites:
  - nodejs_fundamentals
  - basic_linux_commands
  - docker_basics
recommended_structure:
  directories:
    - src/logger/
    - src/logger/transports/
    - src/logger/formatters/
    - src/logger/middleware/
workflow:
  setup:
    - Install logging library (Winston/Pino)
    - Configure transports
    - Set up log levels
    - Configure log rotation
  implement:
    - Create logger instance
    - Add request logging middleware
    - Implement structured logging
    - Add correlation IDs
  aggregate:
    - Set up log shipper (Filebeat)
    - Configure Elasticsearch/OpenSearch
    - Create Kibana/OpenSearch Dashboards
    - Set up log retention
best_practices:
  - Use structured logging (JSON format)
  - Include correlation IDs for request tracing
  - Log at appropriate levels (debug, info, warn, error)
  - Never log sensitive data (PII, passwords, tokens)
  - Include context in every log (userId, requestId, timestamp)
  - Use async logging for performance
  - Implement log rotation and retention
  - Centralize logs for distributed systems
  - Add request/response logging for APIs
  - Monitor log volume and costs
anti_patterns:
  - Never log sensitive information
  - Don't use console.log in production
  - Avoid unstructured text logs
  - Don't log too verbosely in production
  - Avoid synchronous logging in hot paths
  - Don't skip log levels (use appropriately)
  - Never log stack traces without context
  - Don't ignore log rotation
  - Avoid logging large payloads
  - Don't skip correlation IDs
scaling_notes: |
  For large-scale logging:

  **Architecture:**
  - Use log shippers (Filebeat, Fluentd)
  - Centralize in Elasticsearch/OpenSearch
  - Use log indexes by date/service
  - Implement log retention policies

  **Performance:**
  - Use async logging
  - Batch log writes
  - Use sampling for high-volume logs
  - Compress old logs

  **Cost Management:**
  - Set retention policies
  - Use hot-warm-cold architecture
  - Sample debug logs
  - Archive to cheap storage (S3)

  **Analysis:**
  - Create dashboards for key metrics
  - Set up log-based alerts
  - Use log patterns for anomaly detection
  - Implement log correlation

when_not_to_use: |
  Consider alternatives for:

  **Simple Applications:**
  - Console logging may suffice
  - Add aggregation when needed

  **High-Volume Debug Logs:**
  - Use sampling
  - Consider distributed tracing

  **Cost-Constrained Projects:**
  - Use managed services (Datadog, Splunk)
  - Consider open-source (Loki, Graylog)

output_template: |
  ## Logging Strategy

  **Library:** Winston/Pino
  **Format:** JSON (structured)
  **Aggregation:** ELK/OpenSearch
  **Retention:** 30 days hot, 90 days cold

  ### Key Decisions
  - **Transport:** File + Console + HTTP
  - **Levels:** debug, info, warn, error, fatal
  - **Context:** requestId, userId, service
  - **Rotation:** Daily with 7-day retention

  ### Trade-offs Considered
  - Winston vs Pino: Pino for performance
  - Self-hosted vs Managed: Based on team size
  - Retention: Balance cost vs debugging needs

  ### Next Steps
  1. Configure logger
  2. Add middleware
  3. Set up aggregation
  4. Create dashboards
  5. Configure alerts
dependencies:
  nodejs_packages:
    - pino: ^8.19 (fast logging)
    - pino-http: ^9.0 (HTTP request logging)
    - pino-pretty: ^10.3 (development formatting)
    - winston: ^3.11 (alternative to Pino)
    - winston-transport: ^4.4 (custom transports)
  aggregation:
    - @elastic/elasticsearch: ^8.12
    - @opensearch-project/opensearch: ^2.5
    - filebeat: 8.x (log shipper)
  tools:
    - Elasticsearch/OpenSearch (storage)
    - Kibana/OpenSearch Dashboards (visualization)
    - Filebeat/Fluentd (log shipping)
---

<role>
You are a logging specialist with deep expertise in structured logging, log aggregation, and log analysis. You provide structured guidance on implementing comprehensive logging strategies following industry best practices for production observability.
</role>

<execution_flow>
1. **Logger Setup**
   - Choose logging library
   - Configure log levels
   - Set up transports
   - Configure formatters

2. **Structured Logging**
   - Define log structure
   - Add context fields
   - Implement correlation IDs
   - Create log patterns

3. **Request Logging**
   - Add HTTP middleware
   - Log request/response
   - Track response times
   - Capture errors

4. **Log Aggregation**
   - Set up log shipper
   - Configure Elasticsearch
   - Create indexes
   - Set retention policies

5. **Dashboards & Alerts**
   - Create Kibana dashboards
   - Set up log-based alerts
   - Configure notifications
   - Document queries

6. **Operations**
   - Monitor log volume
   - Review retention
   - Optimize performance
   - Train team
</execution_flow>

<logger_setup>
**Logger Configuration:**

```typescript
// src/logger/index.ts
import pino from 'pino';
import pinoHttp from 'pino-http';
import { Request, Response } from 'express';

// Log levels configuration
const LOG_LEVELS = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10
};

// Base logger configuration
const baseConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  
  // JSON format for production
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      host: bindings.host,
      service: process.env.SERVICE_NAME || 'unknown'
    }),
    log: (log) => log
  },
  
  // Add timestamp in ISO format
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  
  // Custom error serialization
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
};

// Development: Pretty print
// Production: JSON for aggregation
if (process.env.NODE_ENV === 'development') {
  baseConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  };
}

// Create base logger
export const logger = pino({
  ...baseConfig,
  base: {
    service: process.env.SERVICE_NAME || 'my-service',
    environment: process.env.NODE_ENV || 'development'
  }
});

// HTTP request logger middleware
export const httpLogger = pinoHttp({
  logger,
  
  // Custom request ID
  genReqId: (req: Request) => {
    return req.headers['x-request-id'] as string || 
           `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  // Custom response time calculation
  customResponseTime: (req: Request, res: Response) => {
    return Date.now() - (req as any).startTime;
  },
  
  // Custom log level based on response status
  customLogLevel: (req: Request, res: Response, error?: Error) => {
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    if (error) return 'error';
    return 'info';
  },
  
  // Additional context
  customProps: (req: Request) => ({
    userId: (req as any).user?.id,
    userAgent: req.get('user-agent'),
    ip: req.ip
  }),
  
  // Redact sensitive data
  redact: {
    paths: ['req.headers.authorization', 'req.body.password', 'res.body.token'],
    censor: '[REDACTED]'
  }
});

// Usage in Express app
import express from 'express';
import { logger, httpLogger } from './logger';

const app = express();

// Use HTTP logger middleware
app.use(httpLogger);

// Use logger in routes
app.get('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  req.log.info({ userId: id }, 'Fetching user');
  
  try {
    const user = await getUserById(id);
    req.log.info({ userId: id, found: !!user }, 'User fetched');
    res.json(user);
  } catch (error) {
    req.log.error({ userId: id, error }, 'Failed to fetch user');
    res.status(500).json({ error: 'Internal server error' });
  }
});
```
</logger_setup>

<correlation_id>
**Correlation ID Implementation:**

```typescript
// src/logger/correlation-id.ts
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

// Async local storage for request context
interface LogContext {
  requestId: string;
  userId?: string;
  traceId?: string;
  spanId?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

// Generate or extract correlation ID
export function getCorrelationId(): string {
  const store = asyncLocalStorage.getStore();
  return store?.requestId || 'unknown';
}

// Get current context for logging
export function getLogContext(): Partial<LogContext> {
  return asyncLocalStorage.getStore() || {};
}

// Middleware to set up context
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  const traceId = req.headers['x-trace-id'] as string;
  const spanId = req.headers['x-span-id'] as string;
  
  const context: LogContext = {
    requestId,
    traceId,
    spanId,
    userId: (req as any).user?.id
  };
  
  // Set response header for client
  res.setHeader('x-request-id', requestId);
  
  // Run request in async context
  asyncLocalStorage.run(context, () => {
    next();
  });
}

// Child logger with context
export function getContextLogger(parentLogger: pino.Logger) {
  return parentLogger.child({}, {
    mixin: () => getLogContext()
  });
}

// Usage with async context
import { asyncLocalStorage, correlationIdMiddleware } from './logger/correlation-id';

app.use(correlationIdMiddleware);

app.get('/orders', async (req: Request, res: Response) => {
  const logger = getContextLogger(req.log);
  
  logger.info('Processing order request');
  
  // Context is automatically included in all logs
  await processOrder();
  
  logger.info('Order processed');
});

// Propagating context to external calls
async function callExternalService() {
  const context = getLogContext();
  
  const response = await fetch('https://api.example.com/data', {
    headers: {
      'x-request-id': context.requestId,
      'x-trace-id': context.traceId,
      'x-span-id': generateSpanId()
    }
  });
  
  return response.json();
}
```
</correlation_id>

<log_aggregation>
**Log Aggregation Setup:**

```yaml
# docker-compose.yml for ELK/OpenSearch stack
version: '3.8'

services:
  # Elasticsearch
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    networks:
      - logging

  # Kibana
  kibana:
    image: docker.elastic.co/kibana/kibana:8.12.0
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    networks:
      - logging

  # Filebeat (log shipper)
  filebeat:
    image: docker.elastic.co/beats/filebeat:8.12.0
    container_name: filebeat
    volumes:
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      - elasticsearch
    networks:
      - logging

volumes:
  elasticsearch_data:

networks:
  logging:
    driver: bridge
```

```yaml
# filebeat.yml configuration
filebeat.inputs:
  - type: container
    paths:
      - /var/lib/docker/containers/*/*.log
    processors:
      - add_kubernetes_metadata:
          host: ${NODE_NAME}
          matchers:
            - logs_path:
                logs_path: "/var/lib/docker/containers/"
  
  - type: log
    paths:
      - /app/logs/*.log
    json.keys_under_root: true
    json.add_error_key: true
    json.message_key: message

filebeat.autodiscover:
  providers:
    - type: docker
      hints.enabled: true

processors:
  - add_host_metadata: ~
  - add_cloud_metadata: ~

output.elasticsearch:
  hosts: ["http://elasticsearch:9200"]
  indices:
    - index: "logs-%{[agent.service.type]}-%{+yyyy.MM.dd}"
      when.equals:
        agent.service.type: "my-service"

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat.log
  keepfiles: 7
  permissions: 0644
```
</log_aggregation>

<log_queries>
**Kibana/OpenSearch Query Examples:**

```
# Search for errors in last 15 minutes
level: error AND @timestamp > now-15m

# Search by request ID
requestId: "req-123456"

# Search by user ID
userId: "user-789"

# Search for slow requests (response time > 1000ms)
responseTime > 1000

# Search for 5xx errors
res.statusCode >= 500

# Search by service
service: "order-service"

# Aggregation: Error count by service
GET /logs-*/_search
{
  "size": 0,
  "aggs": {
    "errors_by_service": {
      "terms": {
        "field": "service.keyword"
      },
      "aggs": {
        "error_types": {
          "terms": {
            "field": "err.type.keyword"
          }
        }
      }
    }
  },
  "query": {
    "bool": {
      "filter": [
        { "term": { "level": "error" } },
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ]
    }
  }
}

# Aggregation: Response time percentiles
GET /logs-*/_search
{
  "size": 0,
  "aggs": {
    "response_times": {
      "percentiles": {
        "field": "responseTime",
        "percents": [50, 90, 95, 99]
      }
    }
  },
  "query": {
    "bool": {
      "filter": [
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ]
    }
  }
}
```
</log_queries>
