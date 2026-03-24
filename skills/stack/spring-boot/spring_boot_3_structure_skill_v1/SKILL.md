---
name: spring_boot_3_structure_skill_v1
description: Spring Boot 3 enterprise application structure
version: 1.0.0
tags: [spring-boot, java, backend, framework, enterprise]
stack: java/spring-boot-3
category: stack
triggers:
  keywords: [spring boot, @RestController, @Service, @Autowired]
  filePatterns: [pom.xml, build.gradle, application.properties, application.yml]
  commands: [mvn spring-boot:run, ./mvnw spring-boot:run, gradle bootRun]
prerequisites:
  - java_17_runtime
  - maven_or_gradle
recommended_structure:
  directories:
    - src/main/java/com/example/
    - src/main/java/com/example/controller/
    - src/main/java/com/example/service/
    - src/main/java/com/example/repository/
    - src/main/java/com/example/model/
    - src/main/java/com/example/config/
    - src/main/resources/
workflow:
  setup:
    - mvn spring-boot:run
    - ./mvnw spring-boot:run
  generate:
    - curl https://start.spring.io
    - spring init
  test:
    - mvn test
    - ./mvnw test
best_practices:
  - Use constructor injection over field injection
  - Leverage Spring Data JPA for repositories
  - Use @ConfigurationProperties for type-safe config
  - Implement proper exception handling with @ControllerAdvice
  - Use profiles for environment-specific configuration
anti_patterns:
  - Don't put business logic in controllers
  - Avoid @Autowired on fields (use constructor injection)
  - Don't skip validation with @Valid
scaling_notes: |
  For high-traffic Spring Boot applications:

  1. Connection Pooling:
     - Use HikariCP for database connections
     - Configure appropriate pool size
     - Monitor connection metrics

  2. Caching Strategy:
     - Enable Spring Cache with Redis
     - Use @Cacheable annotations
     - Configure cache eviction policies

  3. Microservices:
     - Use Spring Cloud for service discovery
     - Implement circuit breakers with Resilience4j
     - Use Spring Cloud Gateway for API gateway

  4. Performance:
     - Enable production profile
     - Use GraalVM native compilation for fast startup
     - Configure JVM options appropriately
when_not_to_use: |
  Spring Boot may not be ideal for:

  1. Simple microservices with minimal dependencies
     - Consider lighter frameworks (Quarkus, Micronaut)

  2. Projects requiring fast cold start
     - Consider GraalVM native or alternative frameworks

  3. Non-Java environments
     - Spring Boot is Java/Kotlin specific
output_template: |
  ## Spring Boot Structure Decision

  **Version:** Spring Boot 3.x
  **Java Version:** 17+
  **Key Files:**
  - {Controller}.java
  - {Service}.java
  - {Repository}.java
  - application.yml
dependencies:
  - java: ">=17"
  - spring-boot: ">=3.0"
  - maven: ">=3.8"
---

<role>
You are a Spring Boot 3 expert specializing in enterprise Java application architecture.
You provide guidance on Spring ecosystem best practices and patterns.
</role>

<execution_flow>
## Step 1: Analyze Project Requirements
- Determine enterprise requirements
- Identify data sources and integrations
- Assess scalability needs

## Step 2: Generate Project Structure
- Create Spring Boot project structure
- Set up package organization
- Configure application properties

## Step 3: Implement Core Components
- Build REST controllers
- Create service layer
- Implement data repositories

## Step 4: Testing Strategy
- Write unit tests with JUnit
- Write integration tests with @SpringBootTest
- Use Testcontainers for integration testing
</execution_flow>
