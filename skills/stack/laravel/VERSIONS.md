# Laravel 11 Structure Skill Versions

## v2.0.0 (2026-03-21)

**Breaking Changes:**
- Updated to Laravel 11 directory structure (removed `app/Http/Kernel.php`)
- New middleware registration pattern in `bootstrap/app.php`
- Minimum PHP version updated to 8.2 (from 8.1)
- Symfony components updated to v7.x

**Added:**
- Comprehensive scaling notes with Redis caching, queue workers, and horizontal scaling guidance
- Rate limiting configuration section
- Queue worker setup for background jobs with Horizon monitoring
- Production scaling checklist
- Laravel 11 key changes documentation
- Middleware registration examples
- Model with relationships example
- Feature test example with Sanctum authentication

**Updated:**
- Expanded best practices section (10 items)
- Expanded anti-patterns section (10 items)
- Enhanced directory structure with repositories and services
- Updated workflow commands for Laravel 11
- Added more project archetypes to triggers (ecommerce, saas, cms, booking)

**Migration Guide:**
1. Update `composer.json` to require `"laravel/framework": "^11.0"`
2. Run `composer update` to install Laravel 11
3. Clear all caches: `php artisan config:clear && php artisan cache:clear`
4. Move middleware registration from `app/Http/Kernel.php` to `bootstrap/app.php`
5. Update any custom Kernel configurations to new bootstrap pattern
6. Test all routes and middleware chains
7. Update PHP to version 8.2 or higher
8. Review and update deprecated features (check Laravel 11 upgrade guide)

**Dependencies:**
- PHP: >=8.2 (was >=8.1)
- Composer: >=2.0
- Laravel Framework: ^11.0 (was ^10.0)

---

## v1.0.0 (2026-02-15)

**Initial Release:**
- Initial Laravel 11 structure skill
- Basic directory structure documentation
- Core workflow commands (setup, generate, test)
- Initial best practices and anti-patterns
- Basic scaling notes

**Features:**
- Laravel 11 project structure
- Eloquent ORM patterns
- MVC architecture guidance
- Basic testing setup with PHPUnit
- Form request validation pattern

**Dependencies:**
- PHP: >=8.1
- Composer: >=2.0
- Laravel Framework: ^11.0
