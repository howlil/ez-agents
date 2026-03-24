---
name: laravel_11_structure_skill_v2
description: Laravel 11 project structure and conventions with modern best practices
version: 2.0.0
tags: [laravel, php, backend, framework, mvc]
stack: php/laravel-11
category: stack
triggers:
  keywords: [laravel, eloquent, blade, artisan, php]
  filePatterns: [composer.json, artisan, app/Models/*.php, app/Http/Controllers/*.php]
  commands: [composer require laravel, php artisan, php artisan make:*]
  stack: php/laravel-11
  projectArchetypes: [ecommerce, saas, cms, booking]
  modes: [greenfield, migration, refactor]
prerequisites:
  - php_8.2_runtime
  - composer_package_manager
  - mysql_or_postgresql_database
recommended_structure:
  directories:
    - app/Models
    - app/Http/Controllers
    - app/Http/Middleware
    - app/Http/Requests
    - app/Providers
    - app/Services
    - app/Repositories
    - database/migrations
    - database/seeders
    - database/factories
    - routes/
    - resources/views
    - resources/js
    - resources/css
    - tests/Feature
    - tests/Unit
workflow:
  setup:
    - composer install
    - cp .env.example .env
    - php artisan key:generate
    - php artisan migrate --seed
    - npm install && npm run build
  generate:
    - php artisan make:model -mcr
    - php artisan make:controller
    - php artisan make:request
    - php artisan make:seeder
  test:
    - php artisan test
    - php artisan test --filter=Feature
    - phpstan analyse
best_practices:
  - Use Eloquent ORM for database operations with proper relationships
  - Follow PSR-12 coding standards and use PHPStan for static analysis
  - Implement repository pattern for complex queries and business logic
  - Use Form Requests for validation instead of controller validation
  - Leverage Laravel's built-in authentication and authorization (Gates/Policies)
  - Use job queues for long-running tasks and background processing
  - Implement API resources for consistent JSON responses
  - Use model factories and seeders for test data generation
  - Cache expensive queries and use eager loading to prevent N+1 problems
  - Follow single responsibility principle in controllers (thin controllers)
anti_patterns:
  - Avoid business logic in routes/web.php or routes/api.php
  - Don't use DB::query() directly in controllers - use Eloquent models
  - Never commit .env file or hardcode credentials in configuration
  - Avoid putting business logic in Blade templates
  - Don't skip validation or trust user input without sanitization
  - Avoid using global helpers in business logic (makes testing harder)
  - Don't ignore Laravel's directory structure conventions without good reason
  - Avoid N+1 query problems by using eager loading (with())
  - Don't put all logic in controllers - extract to services/repositories
  - Never store sessions in files for production - use Redis/database
scaling_notes: |
  For high-traffic Laravel applications:

  **Caching:**
  - Use Redis for session and cache drivers (config/cache.php, config/session.php)
  - Implement query caching for expensive database queries
  - Use route caching: php artisan route:cache
  - Use config caching: php artisan config:cache
  - Implement HTTP caching with ETag and Last-Modified headers

  **Queue Workers:**
  - Use Redis or database queue driver for async job processing
  - Run multiple queue workers: php artisan queue:work --tries=3
  - Consider Laravel Horizon for queue monitoring and management
  - Implement job batching for bulk operations
  - Use delayed jobs for time-sensitive tasks

  **Database:**
  - Implement read/write connections for database replication
  - Use database indexing strategically on frequently queried columns
  - Consider database sharding for very large datasets
  - Implement connection pooling for high-concurrency scenarios

  **Horizontal Scaling:**
  - Use load balancers (nginx, HAProxy) to distribute traffic
  - Store sessions in Redis for shared session state across instances
  - Use CDN for static assets (images, CSS, JS)
  - Implement health check endpoints for load balancer probes

  **Performance Monitoring:**
  - Use Laravel Telescope for local development debugging
  - Implement custom metrics with Prometheus/Grafana
  - Use APM tools (New Relic, DataDog) for production monitoring
  - Monitor queue worker health and job failure rates

when_not_to_use: |
  Laravel may not be the best choice for:

  **Simple Static Sites:**
  - Use Next.js, Nuxt, or static site generators instead
  - Laravel adds unnecessary overhead for content-only sites

  **Real-Time Applications:**
  - While Laravel supports WebSockets (via Laravel Reverb/Pusher),
    Node.js + Socket.io may be more suitable for heavy real-time needs
  - Consider Laravel only if real-time is a small part of the app

  **Microservices Architecture:**
  - Laravel is optimized for monolithic applications
  - For microservices, consider Lumen (Laravel micro-framework) or
    lighter frameworks like Slim, FastAPI, or Express

  **Serverless Deployments:**
  - Laravel can be deployed serverlessly (Bref for AWS Lambda),
    but it's not the primary use case
  - Consider frameworks designed for serverless from the ground up

  **High-Frequency Trading or Low-Latency Systems:**
  - PHP's request-response cycle adds latency
  - Consider Go, Rust, or C++ for ultra-low-latency requirements

  **Content Management Only:**
  - If you only need CMS functionality, use WordPress, Strapi, or
    dedicated CMS platforms instead of building custom Laravel CMS
output_template: |
  ## Laravel Structure Decision

  **Version:** Laravel 11.x
  **Architecture:** MVC with Repository/Service Pattern
  **PHP Version:** 8.2+

  ### Key Decisions
  - **Directory Structure:** Following Laravel 11 conventions
  - **ORM:** Eloquent with defined relationships
  - **Validation:** Form Request classes
  - **Authentication:** Laravel Breeze/Jetstream or custom
  - **Queue Driver:** Redis/Sync based on environment
  - **Cache Driver:** Redis for production

  ### Trade-offs Considered
  - Monolith vs Microservices: Chose monolith for simplicity
  - Eloquent vs Query Builder: Chose Eloquent for maintainability
  - Blade vs Inertia: [Decision based on project needs]

  ### Next Steps
  1. Run setup workflow commands
  2. Generate initial models and migrations
  3. Configure environment variables
  4. Run test suite to verify setup
dependencies:
  php: ">=8.2"
  composer: ">=2.0"
  extensions:
    - pdo_mysql or pdo_pgsql
    - mbstring
    - openssl
    - xml
    - ctype
    - json
  recommended_packages:
    - laravel/sanctum: ^3.0 (API authentication)
    - laravel/horizon: ^5.0 (Redis queue monitoring)
    - barryvdh/laravel-debugbar: ^3.0 (development debugging)
    - phpstan/phpstan: ^1.0 (static analysis)
---

<role>
You are a Laravel 11 architecture specialist with deep expertise in modern PHP development patterns, database optimization, and scalable application design. You provide structured guidance on implementing Laravel applications following industry best practices.
</role>

<execution_flow>
1. **Analyze Project Requirements**
   - Review project type (ecommerce, SaaS, CMS, etc.)
   - Identify scaling requirements and traffic expectations
   - Determine integration needs (APIs, third-party services)

2. **Setup Project Structure**
   - Initialize Laravel 11 project with composer
   - Configure environment variables and security settings
   - Set up database connections and run migrations

3. **Generate Core Components**
   - Create models with migrations, controllers, and requests
   - Establish model relationships (hasMany, belongsTo, etc.)
   - Implement service and repository layers for complex logic

4. **Configure Application Services**
   - Set up authentication (Sanctum/Jetstream)
   - Configure queue workers and job processing
   - Implement caching strategy

5. **Establish Testing Foundation**
   - Create feature and unit test structure
   - Set up model factories and seeders
   - Implement CI/CD pipeline for automated testing

6. **Optimize for Production**
   - Enable production optimizations (caching, minification)
   - Configure monitoring and logging
   - Set up backup and disaster recovery procedures
</execution_flow>

<laravel_11_key_changes>
**Breaking Changes from Laravel 10:**

1. **New Directory Structure:**
   - Removed `app/Http/Kernel.php` - middleware now registered in `bootstrap/app.php`
   - Removed `bootstrap/app.php` HTTP/Console kernel classes
   - New simplified bootstrap configuration

2. **Middleware Registration:**
   - Middleware now registered directly in `bootstrap/app.php`
   - Global middleware configured via `withMiddleware()` callback
   - Route groups use inline middleware definitions

3. **Configuration Changes:**
   - New `cors.php` configuration file
   - Simplified `app.php` configuration structure
   - Environment-based configuration overrides

4. **Composer Dependencies:**
   - Minimum PHP version: 8.2+
   - Updated Symfony components to v7.x
   - New monolog version for logging

**Migration Steps:**
1. Update `composer.json` to require `"laravel/framework": "^11.0"`
2. Run `composer update` to install Laravel 11
3. Clear all caches: `php artisan config:clear && php artisan cache:clear`
4. Update middleware registration in `bootstrap/app.php`
5. Review and update any custom Kernel configurations
6. Test all routes and middleware chains
</laravel_11_key_changes>

<directory_structure>
```
laravel-project/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php
│   │   │   ├── UserController.php
│   │   │   └── ProductController.php
│   │   ├── Middleware/
│   │   │   ├── Authenticate.php
│   │   │   └── EnsureEmailIsVerified.php
│   │   └── Requests/
│   │       ├── StoreUserRequest.php
│   │       └── UpdateProductRequest.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Product.php
│   │   └── Order.php
│   ├── Providers/
│   │   ├── AppServiceProvider.php
│   │   └── RouteServiceProvider.php
│   ├── Repositories/
│   │   ├── BaseRepository.php
│   │   ├── UserRepository.php
│   │   └── ProductRepository.php
│   └── Services/
│       ├── PaymentService.php
│       └── NotificationService.php
├── bootstrap/
│   ├── app.php
│   └── providers.php
├── config/
│   ├── app.php
│   ├── database.php
│   ├── cache.php
│   └── queue.php
├── database/
│   ├── factories/
│   │   ├── UserFactory.php
│   │   └── ProductFactory.php
│   ├── migrations/
│   │   ├── 2024_01_01_000001_create_users_table.php
│   │   └── 2024_01_01_000002_create_products_table.php
│   └── seeders/
│       ├── DatabaseSeeder.php
│       └── ProductSeeder.php
├── resources/
│   ├── views/
│   │   ├── layouts/
│   │   ├── components/
│   │   └── pages/
│   ├── js/
│   │   ├── app.js
│   │   └── bootstrap.js
│   └── css/
│       └── app.css
├── routes/
│   ├── web.php
│   ├── api.php
│   └── console.php
├── tests/
│   ├── Feature/
│   │   ├── UserTest.php
│   │   └── ProductTest.php
│   └── Unit/
│       ├── ExampleTest.php
│       └── UserServiceTest.php
└── ...
```
</directory_structure>

<middleware_example>
**Laravel 11 Middleware Registration (bootstrap/app.php):**

```php
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\EnsureEmailIsVerified;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Global middleware
        $middleware->global([
            \Illuminate\Http\Middleware\HandleCors::class,
            \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
        ]);

        // Middleware groups
        $middleware->group('web', [
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Session\Middleware\StartSession::class,
        ]);

        $middleware->group('api', [
            \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        // Alias middleware for easy use in routes
        $middleware->alias([
            'verified' => EnsureEmailIsVerified::class,
            'auth' => \Illuminate\Auth\Middleware\Authenticate::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Exception handling configuration
    })->create();
```
</middleware_example>

<model_example>
**Laravel 11 Model with Relationships:**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'price',
        'category_id',
        'user_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the category that owns the product.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the user who created the product.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the order items for the product.
     *
     * @return HasMany<OrderItem>
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Scope a query to only include active products.
     */
    public function scopeActive($query): void
    {
        $query->where('is_active', true);
    }

    /**
     * Scope a query to filter by price range.
     */
    public function scopePriceRange($query, float $min, float $max): void
    {
        $query->whereBetween('price', [$min, $max]);
    }
}
```
</model_example>

<testing_example>
**Laravel 11 Feature Test Example:**

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_products(): void
    {
        // Arrange
        $user = User::factory()->create();
        Product::factory()->count(5)->create();

        // Act
        $response = $this->actingAs($user)->getJson('/api/products');

        // Assert
        $response->assertStatus(200)
                 ->assertJsonCount(5, 'data')
                 ->assertJsonStructure([
                     'data' => [
                         '*' => [
                             'id',
                             'name',
                             'description',
                             'price',
                             'created_at',
                         ]
                     ]
                 ]);
    }

    public function test_user_can_create_product(): void
    {
        // Arrange
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $payload = [
            'name' => 'Test Product',
            'description' => 'A test product',
            'price' => 29.99,
            'category_id' => 1,
        ];

        // Act
        $response = $this->postJson('/api/products', $payload);

        // Assert
        $response->assertStatus(201)
                 ->assertJson([
                     'data' => [
                         'name' => 'Test Product',
                         'price' => '29.99',
                     ]
                 ]);

        $this->assertDatabaseHas('products', [
            'name' => 'Test Product',
            'price' => 29.99,
        ]);
    }

    public function test_unauthenticated_user_cannot_create_product(): void
    {
        // Act
        $response = $this->postJson('/api/products', [
            'name' => 'Test Product',
            'price' => 29.99,
        ]);

        // Assert
        $response->assertStatus(401);
    }
}
```
</testing_example>

<scaling_checklist>
**Production Scaling Checklist:**

- [ ] Redis configured for cache and session drivers
- [ ] Queue workers running with Horizon monitoring
- [ ] Database read/write split configured
- [ ] CDN configured for static assets
- [ ] Route and config caching enabled
- [ ] Health check endpoint configured (`/up`)
- [ ] Monitoring tools installed (APM, logging)
- [ ] Backup strategy implemented
- [ ] Load balancer configured with health probes
- [ ] SSL/TLS certificates configured
- [ ] Rate limiting configured for API routes
- [ ] Error tracking configured (Sentry, Bugsnag)
- [ ] Log aggregation configured (ELK, CloudWatch)
- [ ] Database indexes created for frequently queried columns
- [ ] N+1 query problems identified and fixed
</scaling_checklist>
