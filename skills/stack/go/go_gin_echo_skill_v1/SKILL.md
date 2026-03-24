---
name: go_gin_echo_skill_v1
description: Go backend development with Gin and Echo frameworks for high-performance APIs and microservices
version: 1.0.0
tags: [go, golang, gin, echo, backend, api, microservices]
stack: go/gin-echo-1.x
category: stack
triggers:
  keywords: [go, golang, gin, echo, goroutine, channel]
  filePatterns: [go.mod, main.go, *.go]
  commands: [go run, go build, go mod init, gin, air]
  stack: go/gin-echo-1.x
  projectArchetypes: [microservices, api-gateway, saas, fintech]
  modes: [greenfield, migration, refactor]
prerequisites:
  - go_1.21_runtime
  - go_modules
  - make_build_tool
recommended_structure:
  directories:
    - cmd/
    - internal/
    - pkg/
    - api/
    - models/
    - handlers/
    - services/
    - repositories/
    - middleware/
    - configs/
    - migrations/
workflow:
  setup:
    - go mod init
    - go get -d ./...
    - go mod tidy
    - make build
  generate:
    - go run main.go
    - air (hot reload)
    - go generate ./...
  test:
    - go test ./...
    - go test -race ./...
    - go test -cover ./...
best_practices:
  - Use context.Context for request lifecycle management
  - Implement structured logging with zap or logrus
  - Use dependency injection for testability
  - Follow clean architecture with clear layer separation
  - Implement proper error handling with custom error types
  - Use middleware for cross-cutting concerns (auth, logging, CORS)
  - Validate input with validator package
  - Use connection pooling for database connections
  - Implement health check endpoints
  - Use environment variables for configuration
anti_patterns:
  - Avoid global variables for state management
  - Don't ignore errors (always handle or wrap)
  - Never commit sensitive data in code (use env vars)
  - Avoid blocking operations in handlers (use goroutines)
  - Don't use init() for business logic
  - Avoid deep nesting (use early returns)
  - Don't skip input validation
  - Avoid tight coupling between layers
  - Don't use pointers unnecessarily (prefer values)
  - Never skip graceful shutdown handling
scaling_notes: |
  For high-traffic Go applications:

  **Concurrency:**
  - Use worker pools for controlled parallelism
  - Implement rate limiting with token bucket algorithm
  - Use channels for safe goroutine communication
  - Apply context timeouts for all I/O operations

  **Caching:**
  - Use Redis for distributed caching
  - Implement in-memory cache with singleflight
  - Cache database query results with TTL
  - Use CDN for static assets

  **Database:**
  - Use connection pooling (maxOpenConns, maxIdleConns)
  - Implement read replicas for read-heavy workloads
  - Use prepared statements to prevent SQL injection
  - Batch operations for bulk inserts/updates

  **Horizontal Scaling:**
  - Design stateless services for easy scaling
  - Use load balancers (nginx, HAProxy)
  - Implement circuit breakers for external calls
  - Use service discovery (Consul, etcd)

  **Monitoring:**
  - Export Prometheus metrics
  - Implement distributed tracing (Jaeger, Zipkin)
  - Use structured logging (JSON format)
  - Set up health check and readiness endpoints

when_not_to_use: |
  Go may not be the best choice for:

  **Data Science/ML:**
  - Python has better ecosystem (pandas, scikit-learn, TensorFlow)
  - R is better for statistical analysis

  **Rapid Prototyping:**
  - Ruby on Rails or Laravel for faster MVP development
  - Go requires more boilerplate code

  **Complex Business Logic:**
  - Languages with rich OOP features may be more expressive
  - Domain-driven design can be verbose in Go

  **Frontend Development:**
  - Go is backend-only (use with React, Vue, or Next.js)
  - Consider full-stack JavaScript/TypeScript frameworks

  **Mobile Development:**
  - Use native (Swift, Kotlin) or cross-platform (Flutter, React Native)
  - Go mobile exists but has limited adoption

output_template: |
  ## Go Backend Structure Decision

  **Version:** Go 1.21+
  **Frameworks:** Gin v1.x, Echo v4.x
  **Architecture:** Clean Architecture with Dependency Injection

  ### Key Decisions
  - **Framework:** Gin (performance) or Echo (minimalist)
  - **Project Structure:** Standard Go layout (cmd, internal, pkg)
  - **Database:** PostgreSQL with sqlx/gorm
  - **Authentication:** JWT with refresh rotation
  - **Logging:** zap structured logging
  - **Testing:** testify + table-driven tests

  ### Trade-offs Considered
  - Gin vs Echo: Gin has more middleware, Echo is lighter
  - sqlx vs gorm: sqlx for control, gorm for productivity
  - Manual DI vs wire: Manual for simplicity, wire for large projects

  ### Next Steps
  1. Initialize Go module
  2. Set up project structure
  3. Configure database connection
  4. Implement health check endpoint
  5. Write initial tests
dependencies:
  go: ">=1.21"
  packages:
    - github.com/gin-gonic/gin: ^1.91 (web framework)
    - github.com/labstack/echo/v4: ^4.11 (alternative web framework)
    - github.com/jmoiron/sqlx: ^1.3 (database library)
    - github.com/golang-jwt/jwt/v5: ^5.0 (JWT authentication)
    - go.uber.org/zap: ^1.26 (structured logging)
    - github.com/stretchr/testify: ^1.8 (testing utilities)
    - github.com/go-playground/validator/v10: ^10.15 (validation)
    - github.com/redis/go-redis/v9: ^9.3 (Redis client)
---

<role>
You are a Go backend architecture specialist with deep expertise in Gin and Echo frameworks, concurrent programming, and building high-performance APIs and microservices. You provide structured guidance on implementing Go applications following industry best practices and Go idioms.
</role>

<execution_flow>
1. **Analyze Project Requirements**
   - Review API requirements and expected traffic
   - Identify integration needs (databases, external services)
   - Determine concurrency and scaling requirements

2. **Setup Project Structure**
   - Initialize Go module with proper naming
   - Create standard directory structure (cmd, internal, pkg)
   - Configure Makefile for common operations

3. **Implement Core Components**
   - Set up Gin/Echo router with middleware
   - Implement database connection with pooling
   - Create service layer with business logic
   - Add repository layer for data access

4. **Configure Application Services**
   - Set up structured logging (zap/logrus)
   - Implement authentication middleware (JWT)
   - Configure environment-based settings
   - Add health check endpoints

5. **Establish Testing Foundation**
   - Write table-driven unit tests
   - Implement integration tests with testcontainers
   - Set up CI/CD pipeline for automated testing

6. **Optimize for Production**
   - Enable production mode (disable debug)
   - Configure graceful shutdown
   - Set up monitoring and metrics export
   - Implement circuit breakers for resilience
</execution_flow>

<go_key_concepts>
**Core Go Concepts:**

1. **Goroutines and Channels:**
   - Lightweight threads managed by Go runtime
   - Channels for safe communication between goroutines
   - Use worker pools for controlled concurrency
   - Apply context for cancellation and timeouts

2. **Interfaces:**
   - Implicit implementation (no implements keyword)
   - Design for small, focused interfaces
   - Use io.Reader, io.Writer patterns
   - Accept interfaces, return structs

3. **Error Handling:**
   - Errors as values (return error)
   - Wrap errors with context (fmt.Errorf("%w"))
   - Define custom error types for domain errors
   - Use errors.Is() and errors.As() for checking

4. **Context:**
   - Pass context as first parameter
   - Use for cancellation and timeouts
   - Store request-scoped values sparingly
   - Always propagate context in call chain

5. **Dependency Injection:**
   - Constructor functions with explicit dependencies
   - Use interfaces for testability
   - Consider wire for large projects
   - Avoid global state
</go_key_concepts>

<directory_structure>
```
go-project/
├── cmd/
│   └── api/
│       └── main.go              # Application entry point
├── internal/
│   ├── api/
│   │   ├── handlers/
│   │   │   ├── user_handler.go
│   │   │   └── auth_handler.go
│   │   ├── middleware/
│   │   │   ├── auth.go
│   │   │   ├── logging.go
│   │   │   └── cors.go
│   │   └── routes/
│   │       └── router.go
│   ├── models/
│   │   ├── user.go
│   │   └── product.go
│   ├── services/
│   │   ├── user_service.go
│   │   └── auth_service.go
│   ├── repositories/
│   │   ├── user_repository.go
│   │   └── product_repository.go
│   └── database/
│       ├── connection.go
│       └── migrations/
├── pkg/
│   ├── logger/
│   │   └── logger.go
│   ├── config/
│   │   └── config.go
│   └── errors/
│       └── errors.go
├── api/
│   └── openapi.yaml            # OpenAPI specification
├── configs/
│   └── config.yaml             # Configuration templates
├── migrations/
│   └── 001_create_users.sql
├── tests/
│   ├── integration/
│   │   └── user_test.go
│   └── e2e/
│       └── api_test.go
├── go.mod
├── go.sum
├── Makefile
├── .env.example
└── README.md
```
</directory_structure>

<main_example>
**Go Main Entry Point (cmd/api/main.go):**

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/gin-gonic/gin"
    "go.uber.org/zap"

    "your-module/internal/api/handlers"
    "your-module/internal/api/middleware"
    "your-module/internal/database"
    "your-module/internal/repositories"
    "your-module/internal/services"
    "your-module/pkg/config"
    "your-module/pkg/logger"
)

func main() {
    // Initialize logger
    log, err := logger.New()
    if err != nil {
        log.Fatal("failed to initialize logger", zap.Error(err))
    }

    // Load configuration
    cfg, err := config.Load()
    if err != nil {
        log.Fatal("failed to load configuration", zap.Error(err))
    }

    // Initialize database
    db, err := database.New(cfg.Database)
    if err != nil {
        log.Fatal("failed to connect to database", zap.Error(err))
    }
    defer db.Close()

    // Initialize layers
    userRepo := repositories.NewUserRepository(db)
    userService := services.NewUserService(userRepo)
    userHandler := handlers.NewUserHandler(userService)

    // Setup Gin router
    router := gin.New()
    router.Use(gin.Recovery())
    router.Use(middleware.Logger(log))
    router.Use(middleware.CORS())
    router.Use(middleware.RateLimiter())

    // Register routes
    v1 := router.Group("/api/v1")
    {
        users := v1.Group("/users")
        {
            users.GET("", userHandler.List)
            users.GET("/:id", userHandler.Get)
            users.POST("", userHandler.Create)
            users.PUT("/:id", userHandler.Update)
            users.DELETE("/:id", userHandler.Delete)
        }
    }

    // Health check
    router.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "healthy"})
    })

    // Create server
    srv := &http.Server{
        Addr:    fmt.Sprintf(":%s", cfg.Server.Port),
        Handler: router,
    }

    // Graceful shutdown
    go func() {
        log.Info("starting server", zap.String("port", cfg.Server.Port))
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatal("server failed", zap.Error(err))
        }
    }()

    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Info("shutting down server...")

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("server forced to shutdown", zap.Error(err))
    }

    log.Info("server stopped")
}
```
</main_example>

<handler_example>
**Go Handler Example (internal/api/handlers/user_handler.go):**

```go
package handlers

import (
    "errors"
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "go.uber.org/zap"

    "your-module/internal/models"
    "your-module/internal/services"
    "your-module/pkg/logger"
)

type UserHandler struct {
    service *services.UserService
    log     *zap.Logger
}

func NewUserHandler(service *services.UserService) *UserHandler {
    return &UserHandler{
        service: service,
        log:     zap.L().Named("user-handler"),
    }
}

// List returns all users
// @Summary List all users
// @Tags users
// @Produce json
// @Success 200 {array} models.User
// @Router /api/v1/users [get]
func (h *UserHandler) List(c *gin.Context) {
    users, err := h.service.GetAll(c.Request.Context())
    if err != nil {
        logger.Error(h.log, "failed to get users", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": users})
}

// Get returns a single user by ID
// @Summary Get user by ID
// @Tags users
// @Param id path int true "User ID"
// @Produce json
// @Success 200 {object} models.User
// @Failure 404 {object} ErrorResponse
// @Router /api/v1/users/{id} [get]
func (h *UserHandler) Get(c *gin.Context) {
    id, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
        return
    }

    user, err := h.service.GetByID(c.Request.Context(), id)
    if err != nil {
        if errors.Is(err, services.ErrUserNotFound) {
            c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
            return
        }
        logger.Error(h.log, "failed to get user", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": user})
}

// Create creates a new user
// @Summary Create a new user
// @Tags users
// @Param user body CreateUserRequest true "User data"
// @Produce json
// @Success 201 {object} models.User
// @Router /api/v1/users [post]
func (h *UserHandler) Create(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    user := &models.User{
        Name:  req.Name,
        Email: req.Email,
    }

    if err := h.service.Create(c.Request.Context(), user); err != nil {
        logger.Error(h.log, "failed to create user", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
        return
    }

    c.JSON(http.StatusCreated, gin.H{"data": user})
}

type CreateUserRequest struct {
    Name  string `json:"name" validate:"required,min=2,max=100"`
    Email string `json:"email" validate:"required,email"`
}

type ErrorResponse struct {
    Error string `json:"error"`
}
```
</handler_example>

<service_example>
**Go Service Example (internal/services/user_service.go):**

```go
package services

import (
    "context"
    "errors"
    "time"

    "your-module/internal/models"
    "your-module/internal/repositories"
)

var (
    ErrUserNotFound     = errors.New("user not found")
    ErrUserAlreadyExists = errors.New("user already exists")
    ErrInvalidEmail     = errors.New("invalid email address")
)

type UserService struct {
    repo *repositories.UserRepository
}

func NewUserService(repo *repositories.UserRepository) *UserService {
    return &UserService{
        repo: repo,
    }
}

// GetAll returns all users
func (s *UserService) GetAll(ctx context.Context) ([]*models.User, error) {
    return s.repo.FindAll(ctx)
}

// GetByID returns a user by ID
func (s *UserService) GetByID(ctx context.Context, id int64) (*models.User, error) {
    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        return nil, err
    }
    if user == nil {
        return nil, ErrUserNotFound
    }
    return user, nil
}

// Create creates a new user
func (s *UserService) Create(ctx context.Context, user *models.User) error {
    // Validate email
    if !isValidEmail(user.Email) {
        return ErrInvalidEmail
    }

    // Check if user already exists
    existing, err := s.repo.FindByEmail(ctx, user.Email)
    if err != nil {
        return err
    }
    if existing != nil {
        return ErrUserAlreadyExists
    }

    // Set timestamps
    now := time.Now()
    user.CreatedAt = now
    user.UpdatedAt = now

    return s.repo.Create(ctx, user)
}

// Update updates an existing user
func (s *UserService) Update(ctx context.Context, user *models.User) error {
    // Check if user exists
    existing, err := s.repo.FindByID(ctx, user.ID)
    if err != nil {
        return err
    }
    if existing == nil {
        return ErrUserNotFound
    }

    // Update fields
    existing.Name = user.Name
    existing.Email = user.Email
    existing.UpdatedAt = time.Now()

    return s.repo.Update(ctx, existing)
}

// Delete deletes a user by ID
func (s *UserService) Delete(ctx context.Context, id int64) error {
    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        return err
    }
    if user == nil {
        return ErrUserNotFound
    }

    return s.repo.Delete(ctx, id)
}

func isValidEmail(email string) bool {
    // Simple email validation
    // Use github.com/badoux/checkmail for production
    return len(email) > 5 && containsAt(email)
}

func containsAt(s string) bool {
    for _, c := range s {
        if c == '@' {
            return true
        }
    }
    return false
}
```
</service_example>

<testing_example>
**Go Test Example (internal/services/user_service_test.go):**

```go
package services

import (
    "context"
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"

    "your-module/internal/models"
    "your-module/internal/repositories"
)

// MockUserRepository is a mock implementation of UserRepository
type MockUserRepository struct {
    mock.Mock
}

func (m *MockUserRepository) FindAll(ctx context.Context) ([]*models.User, error) {
    args := m.Called(ctx)
    return args.Get(0).([]*models.User), args.Error(1)
}

func (m *MockUserRepository) FindByID(ctx context.Context, id int64) (*models.User, error) {
    args := m.Called(ctx, id)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
    args := m.Called(ctx, email)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) Create(ctx context.Context, user *models.User) error {
    args := m.Called(ctx, user)
    return args.Error(0)
}

func (m *MockUserRepository) Update(ctx context.Context, user *models.User) error {
    args := m.Called(ctx, user)
    return args.Error(0)
}

func (m *MockUserRepository) Delete(ctx context.Context, id int64) error {
    args := m.Called(ctx, id)
    return args.Error(0)
}

// Table-driven tests for GetAll
func TestUserService_GetAll(t *testing.T) {
    tests := []struct {
        name      string
        mockSetup func(*MockUserRepository)
        wantErr   bool
    }{
        {
            name: "success - returns all users",
            mockSetup: func(repo *MockUserRepository) {
                users := []*models.User{
                    {ID: 1, Name: "John", Email: "john@example.com"},
                    {ID: 2, Name: "Jane", Email: "jane@example.com"},
                }
                repo.On("FindAll", mock.Anything).Return(users, nil)
            },
            wantErr: false,
        },
        {
            name: "error - repository returns error",
            mockSetup: func(repo *MockUserRepository) {
                repo.On("FindAll", mock.Anything).Return(nil, assert.AnError)
            },
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Arrange
            repo := new(MockUserRepository)
            tt.mockSetup(repo)
            service := NewUserService(repo)

            // Act
            users, err := service.GetAll(context.Background())

            // Assert
            if tt.wantErr {
                assert.Error(t, err)
                assert.Nil(t, users)
            } else {
                assert.NoError(t, err)
                assert.Len(t, users, 2)
            }

            repo.AssertExpectations(t)
        })
    }
}

func TestUserService_Create(t *testing.T) {
    // Arrange
    repo := new(MockUserRepository)
    service := NewUserService(repo)

    // Mock: email doesn't exist
    repo.On("FindByEmail", mock.Anything, "test@example.com").Return(nil, nil)
    // Mock: create succeeds
    repo.On("Create", mock.Anything, mock.Anything).Return(nil)

    user := &models.User{
        Name:  "Test User",
        Email: "test@example.com",
    }

    // Act
    err := service.Create(context.Background(), user)

    // Assert
    assert.NoError(t, err)
    repo.AssertExpectations(t)
}

func TestUserService_Create_InvalidEmail(t *testing.T) {
    // Arrange
    repo := new(MockUserRepository)
    service := NewUserService(repo)

    user := &models.User{
        Name:  "Test User",
        Email: "invalid-email",
    }

    // Act
    err := service.Create(context.Background(), user)

    // Assert
    assert.ErrorIs(t, err, ErrInvalidEmail)
}

func TestUserService_Create_AlreadyExists(t *testing.T) {
    // Arrange
    repo := new(MockUserRepository)
    service := NewUserService(repo)

    existingUser := &models.User{
        ID:    1,
        Name:  "Existing",
        Email: "test@example.com",
    }

    // Mock: email already exists
    repo.On("FindByEmail", mock.Anything, "test@example.com").Return(existingUser, nil)

    user := &models.User{
        Name:  "Test User",
        Email: "test@example.com",
    }

    // Act
    err := service.Create(context.Background(), user)

    // Assert
    assert.ErrorIs(t, err, ErrUserAlreadyExists)
}
```
</testing_example>

<makefile_example>
**Makefile Example:**

```makefile
.PHONY: build run test clean lint migrate help

# Variables
APP_NAME := api
MAIN_PATH := ./cmd/api
BUILD_DIR := ./build
GO := go

# Build the application
build:
	@echo "Building $(APP_NAME)..."
	@$(GO) build -o $(BUILD_DIR)/$(APP_NAME) $(MAIN_PATH)

# Run the application with hot reload
run:
	@air -c .air.toml

# Run tests
test:
	@$(GO) test -race -cover -coverprofile=coverage.out ./...
	@$(GO) tool cover -func=coverage.out

# Run tests with verbose output
test-v:
	@$(GO) test -v -race ./...

# Run linters
lint:
	@golangci-lint run ./...

# Clean build artifacts
clean:
	@rm -rf $(BUILD_DIR)
	@rm -f coverage.out

# Run database migrations
migrate:
	@migrate -path ./migrations -database "$(DATABASE_URL)" up

# Create new migration
migration-create:
	@migrate create -ext sql -dir ./migrations -seq $(name)

# Generate mocks
mocks:
	@mockery --all --dir ./internal --output ./internal/mocks

# Download dependencies
deps:
	@$(GO) mod download
	@$(GO) mod tidy

# Format code
fmt:
	@gofmt -s -w .
	@goimports -w .

# Help
help:
	@echo "Usage:"
	@echo "  make build          - Build the application"
	@echo "  make run            - Run with hot reload"
	@echo "  make test           - Run tests with coverage"
	@echo "  make lint           - Run linters"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make migrate        - Run database migrations"
	@echo "  make migration-create name=xxx - Create new migration"
	@echo "  make mocks          - Generate mocks"
	@echo "  make deps           - Download dependencies"
	@echo "  make fmt            - Format code"
```
</makefile_example>

<scaling_checklist>
**Production Scaling Checklist:**

- [ ] Connection pooling configured (maxOpenConns, maxIdleConns)
- [ ] Graceful shutdown implemented
- [ ] Health check endpoint exposed
- [ ] Prometheus metrics exported
- [ ] Distributed tracing configured (Jaeger/Zipkin)
- [ ] Structured logging (JSON format)
- [ ] Rate limiting implemented
- [ ] Circuit breakers for external calls
- [ ] Redis caching configured
- [ ] Database read replicas configured
- [ ] Load balancer health probes configured
- [ ] Resource limits set (CPU, memory)
- [ ] Horizontal pod autoscaling configured (Kubernetes)
- [ ] Secrets managed via environment/secret manager
- [ ] Database indexes created for queries
</scaling_checklist>
