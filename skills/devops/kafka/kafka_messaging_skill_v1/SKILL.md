---
name: kafka_messaging_skill_v1
description: Event streaming with Apache Kafka, Kafka Streams, and event-driven architecture patterns for distributed systems
version: 1.0.0
tags: [kafka, messaging, event-streaming, event-driven, distributed-systems, pubsub]
stack: devops/messaging
category: devops
triggers:
  keywords: [kafka, event streaming, message queue, pubsub, event-driven, kafka streams]
  filePatterns: [kafka/*.yaml, topics/*.yaml, connectors/*.yaml]
  commands: [kafka-console-producer, kafka-console-consumer, kafka-topics]
  stack: devops/messaging
  projectArchetypes: [event-driven, microservices, real-time, data-pipeline]
  modes: [greenfield, migration, production]
prerequisites:
  - distributed_systems_basics
  - messaging_patterns
  - linux_basics
recommended_structure:
  directories:
    - kafka/
    - kafka/topics/
    - kafka/connectors/
    - kafka/streaming/
workflow:
  setup:
    - Deploy Kafka cluster
    - Configure Zookeeper/KRaft
    - Set up Schema Registry
    - Configure security
  implement:
    - Define topic structure
    - Create producers/consumers
    - Implement event schemas
    - Set up connectors
  operate:
    - Monitor lag
    - Manage partitions
    - Handle schema evolution
    - Scale consumers
best_practices:
  - Use meaningful topic names
  - Implement proper partitioning
  - Configure appropriate retention
  - Use Schema Registry for compatibility
  - Implement idempotent producers
  - Configure consumer groups properly
  - Monitor consumer lag
  - Handle poison pills
  - Implement dead letter queues
  - Use exactly-once semantics when needed
anti_patterns:
  - Never use Kafka as database
  - Don't create too many partitions
  - Avoid large messages (>1MB)
  - Don't skip schema validation
  - Never ignore consumer lag
  - Don't use sync producers
  - Avoid chatty patterns
  - Don't skip monitoring
  - Never ignore rebalancing
  - Don't skip security
scaling_notes: |
  For Kafka at scale:

  **Cluster Scaling:**
  - Add brokers for capacity
  - Increase partitions for parallelism
  - Use rack awareness
  - Configure replication

  **Performance:**
  - Tune batch sizes
  - Configure compression
  - Optimize consumer fetch
  - Use appropriate acks

  **Reliability:**
  - Use replication factor 3+
  - Configure min.insync.replicas
  - Implement retry logic
  - Handle broker failures

  **Operations:**
  - Monitor broker metrics
  - Track consumer lag
  - Manage log retention
  - Plan capacity

when_not_to_use: |
  Kafka may not be suitable for:

  **Simple Messaging:**
  - Consider RabbitMQ/SQS
  - Kafka has operational overhead

  **Low Latency Requirements:**
  - Sub-millisecond needs
  - Consider specialized solutions

  **Small Scale:**
  - Managed services may be better
  - Consider cloud alternatives

output_template: |
  ## Kafka Messaging Strategy

  **Cluster:** 3 brokers, RF=3
  **Schema:** Avro with Schema Registry
  **Processing:** Kafka Streams
  **Connect:** Kafka Connect

  ### Key Decisions
  - **Deployment:** Self-hosted on K8s
  - **Schema:** Avro for compatibility
  - **Processing:** Streams for stateful
  - **Connect:** CDC for databases

  ### Trade-offs Considered
  - Self-hosted vs Managed: Based on team
  - Avro vs JSON: Avro for schema
  - Streams vs ksqlDB: Streams for control

  ### Next Steps
  1. Deploy Kafka cluster
  2. Set up Schema Registry
  3. Define topics
  4. Create producers/consumers
  5. Set up monitoring
dependencies:
  tools:
    - Apache Kafka (event streaming)
    - Schema Registry (schemas)
    - Kafka Connect (integration)
    - Kafka Streams (processing)
    - ksqlDB (streaming SQL)
  clients:
    - kafkajs (Node.js)
    - confluent-kafka (Python)
    - kafka-clients (Java)
  platforms:
    - Confluent Platform (managed)
    - Strimzi (K8s operator)
    - MSK (AWS Managed)
---

<role>
You are a Kafka specialist with deep expertise in event streaming, distributed messaging, and event-driven architecture. You provide structured guidance on building reliable, scalable event streaming platforms.
</role>

<kafka_config>
**Kafka Configuration:**

```yaml
# Kafka topic definition
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: orders
  namespace: kafka
  labels:
    strimzi.io/cluster: my-cluster
spec:
  partitions: 12
  replicas: 3
  config:
    retention.ms: 604800000  # 7 days
    segment.bytes: 1073741824  # 1GB
    cleanup.policy: delete
    min.insync.replicas: 2
    max.message.bytes: 1048576  # 1MB

---
# Order events topic
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: order-events
  namespace: kafka
spec:
  partitions: 24
  replicas: 3
  config:
    retention.ms: 2592000000  # 30 days
    cleanup.policy: compact
    min.insync.replicas: 2

---
# Kafka Connect configuration
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaConnect
metadata:
  name: my-connect
  namespace: kafka
spec:
  version: 3.6.0
  replicas: 3
  bootstrapServers: my-cluster-kafka-bootstrap:9092
  config:
    group.id: connect-cluster
    config.storage.topic: connect-configs
    config.storage.replication.factor: 3
    offset.storage.topic: connect-offsets
    offset.storage.replication.factor: 3
    status.storage.topic: connect-status
    status.storage.replication.factor: 3
    key.converter: io.confluent.connect.avro.AvroConverter
    key.converter.schema.registry.url: http://schema-registry:8081
    value.converter: io.confluent.connect.avro.AvroConverter
    value.converter.schema.registry.url: http://schema-registry:8081
  externalConfiguration:
    volumes:
      - name: connector-plugins
        persistentVolumeClaim:
          claimName: connector-plugins-pvc

---
# Kafka Streams application config
# application.yml
spring:
  kafka:
    bootstrap-servers: kafka:9092
    streams:
      application-id: order-processing-service
      properties:
        default.key.serde: org.apache.kafka.common.serialization.Serdes$StringSerde
        default.value.serde: io.confluent.kafka.streams.serdes.avro.SpecificAvroSerde
        schema.registry.url: http://schema-registry:8081
        num.stream.threads: 4
        commit.interval.ms: 1000
        auto.offset.reset: earliest
        processing.guarantee: exactly_once_v2

---
# Producer configuration (Node.js with kafkajs)
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['kafka:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
  },
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
});

const producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 5,
  retry: {
    retries: 3,
  },
  transactionTimeout: 60000,
});

await producer.connect();

// Send with proper configuration
await producer.send({
  topic: 'order-events',
  messages: [
    {
      key: order.id,
      value: {
        orderId: order.id,
        userId: order.userId,
        total: order.total,
        timestamp: new Date().toISOString(),
      },
      headers: {
        'correlation-id': correlationId,
        'event-type': 'order.created',
      },
    },
  ],
  transactionalId: 'order-service-tx',
});

---
# Consumer configuration
const consumer = kafka.consumer({
  groupId: 'order-processing-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1048576,
  readUncommitted: false,  // read_committed
});

await consumer.connect();

await consumer.subscribe({
  topic: 'order-events',
  fromBeginning: false,
});

await consumer.run({
  autoCommit: false,
  eachBatchAutoResolve: true,
  partitionsConsumedConcurrently: 3,
  eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsets, pause }) => {
    for (const message of batch.messages) {
      await processMessage(message);
      resolveOffset(message.offset);
    }
    await commitOffsets();
  },
});
```
</kafka_config>
