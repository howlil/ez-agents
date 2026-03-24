---
name: dotnet_aspnet_core_v1
description: ASP.NET Core 8 architecture and best practices for enterprise .NET applications
version: 1.0.0
tags: [dotnet, aspnet-core, csharp, enterprise, backend, microsoft]
category: stack
stack: dotnet/aspnet-core-8
triggers:
  keywords: [dotnet, asp.net, csharp, .net core, enterprise]
  filePatterns: [*.csproj, Program.cs, appsettings.json]
  commands: [dotnet run, dotnet build, dotnet publish]
prerequisites:
  - csharp_fundamentals
  - dependency_injection_basics
  - rest_api_concepts
workflow:
  setup:
    - Install .NET 8 SDK
    - Create solution structure
    - Configure DI container
    - Setup logging
  build:
    - Create API controllers
    - Implement services
    - Add Entity Framework
    - Configure authentication
  test:
    - xUnit tests
    - Integration tests
    - Load testing
best_practices:
  - Use minimal APIs for simple endpoints
  - Implement repository pattern for data access
  - Use MediatR for CQRS
  - Configure health checks
  - Use Serilog for structured logging
  - Implement global exception handling
  - Use FluentValidation for input validation
  - Configure CORS properly
  - Use async/await consistently
  - Implement rate limiting
anti_patterns:
  - Never put business logic in controllers
  - Don't sync over async
  - Avoid tight coupling to framework
  - Don't skip input validation
  - Never log sensitive data
  - Don't ignore disposal of IDisposable
  - Avoid god services
  - Don't skip error handling
scaling_notes: |
  .NET Scaling:
  - Use Kestrel with reverse proxy
  - Enable HTTP/2
  - Use Redis for distributed caching
  - Implement health checks
when_not_to_use: |
  Not for: Small scripts, non-Windows environments without .NET Core, teams without C# experience
output_template: |
  ## .NET Architecture Decision
  **Version:** .NET 8
  **Hosting:** {Self-hosted, IIS, Docker, Azure}
  **ORM:** {Entity Framework, Dapper}
  **Auth:** {JWT, Azure AD, IdentityServer}
dependencies:
  - dotnet: ">=8.0"
  - database: "SQL Server, PostgreSQL, or similar"
---

<role>
.NET Architect specializing in enterprise ASP.NET Core applications.
You have built systems serving millions of requests on .NET.
Focus on performance, maintainability, and Microsoft best practices.
</role>

<workflow>
## .NET Implementation

### Phase 1: Setup (Day 1-2)
1. Solution Structure
   - Create solution file
   - Add projects (API, Core, Infrastructure)
   - Configure NuGet packages

2. Configuration
   - appsettings.json
   - Environment variables
   - Secret Manager

### Phase 2: Core Development (Week 1-3)
3. API Layer
   - Controllers/Minimal APIs
   - DTOs
   - AutoMapper

4. Business Layer
   - Domain entities
   - Services
   - Validation

5. Data Layer
   - DbContext
   - Repositories
   - Migrations

### Phase 3: Production Ready (Week 4)
6. Cross-Cutting
   - Logging (Serilog)
   - Exception handling
   - Health checks
   - Authentication/Authorization

7. Testing
   - Unit tests (xUnit)
   - Integration tests
   - E2E tests
</workflow>
