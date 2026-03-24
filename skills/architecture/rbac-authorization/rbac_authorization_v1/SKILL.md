---
name: RBAC and Authorization Pattern
description: Role-based access control - multi-tenant, enterprise systems
version: 1.0.0
tags: [rbac, architecture, security, authorization]
category: architecture
triggers:
  keywords: [rbac, authorization, access-control, permissions, roles, security]
  projectArchetypes: [enterprise-app, multi-tenant-saas, admin-platform]
  constraints: [multi-user, permission-granularity, audit-required]
prerequisites:
  - authentication_basics
  - security_basics
  - database_relationships_basics
recommended_structure:
  directories:
    - src/Authorization
    - src/Roles
    - src/Permissions
    - src/Middleware/Auth
    - src/Policies
    - infrastructure/auth
workflow:
  setup:
    - Identify roles from business requirements
    - Define permissions for each role
    - Design role hierarchy
  generate:
    - Implement role and permission models
    - Create authorization middleware
    - Add policy-based authorization
  test:
    - Unit test authorization rules
    - Integration test role assignments
    - Penetration test for privilege escalation
best_practices:
  - Principle of least privilege
  - Role hierarchy for inheritance
  - Audit trails for permission changes
  - Attribute-based access control (ABAC) for fine-grained needs
  - Separate authentication from authorization
anti_patterns:
  - Role Explosion - too many roles, unmanageable
  - Hardcoded Permissions - can't change without deployment
  - No Audit - can't trace who accessed what
  - Admin God Mode - single role with all permissions
scaling_notes: |
  Permission caching and policy engines:

  1. **Permission Caching**:
     - Cache user permissions to avoid database lookups
     - Invalidate cache on role/permission changes
     - Use distributed cache for multi-instance deployments

  2. **Policy Engines**:
     - Open Policy Agent (OPA) for complex rules
     - Centralized policy management
     - Policy versioning and testing

  3. **Audit Log Scaling**:
     - Async audit log writing
     - Log rotation and archival
     - Searchable audit log storage

  4. **When to Consider Alternatives**:
     - Single-user applications → Simple auth
     - No sensitive data → Basic role checks
     - Simple public apps → No auth needed
when_not_to_use: |
  RBAC may not be suitable for:

  1. **Single-User Applications**:
     - No multi-user access control needed
     - Simple authentication sufficient

  2. **Systems Without Sensitive Data**:
     - Public-facing content only
     - No access control requirements

  3. **Simple Public-Facing Apps**:
     - All users have same permissions
     - Role complexity not justified

  4. **Dynamic Permission Needs**:
     - Permissions change per request
     - Consider ABAC (Attribute-Based Access Control)

  5. **Resource-Constrained Environments**:
     - RBAC adds database and computation overhead
     - Consider simpler permission models
output_template: |
  ## RBAC and Authorization Decision

  **Pattern:** RBAC and Authorization
  **Version:** 1.0.0
  **Rationale:** [Why RBAC was chosen]

  **Roles Defined:**
  - Role 1: [Name, description, permissions]
  - Role 2: [Name, description, permissions]
  - Role 3: [Name, description, permissions]

  **Permission Model:**
  - Granularity: [Resource-level, Action-level]
  - Hierarchy: [Role inheritance structure]
  - Assignment: [User → Role, User → Permission]

  **Authorization Flow:**
  - Authentication: [Method]
  - Authorization: [Middleware, Policy, or Both]
  - Enforcement: [Where checks occur]

  **Audit Configuration:**
  - Logged Events: [List of audited actions]
  - Retention: [How long logs kept]
  - Access: [Who can view audit logs]

  **Integration:**
  - Identity Provider: [Auth0, Okta, Custom]
  - Directory Service: [LDAP, Active Directory]
  - External Systems: [API authorization]
dependencies:
  - authentication_basics
  - security_basics
  - database_relationships_basics
  - audit_logging_basics
---

<role>
You are an expert in authorization systems with deep experience in RBAC, ABAC, and enterprise security patterns.
You help teams design role hierarchies, implement permission systems, and maintain audit trails for compliance.
</role>

<execution_flow>
## Step 1: Role Discovery
- Identify user types from business requirements
- Map roles to job functions
- Define role hierarchy and inheritance
- Document role permissions

## Step 2: Permission Design
- Identify resources requiring access control
- Define actions per resource (create, read, update, delete)
- Design permission naming convention
- Plan permission granularity

## Step 3: Data Model Implementation
- Create roles, permissions, users tables
- Design many-to-many relationships
- Implement role hierarchy
- Add audit logging tables

## Step 4: Authorization Logic
- Implement authorization middleware
- Create policy classes for resource authorization
- Add permission caching
- Configure authorization checks

## Step 5: Audit and Compliance
- Implement audit logging for permission changes
- Add access logging for sensitive operations
- Configure log retention policies
- Set up audit report generation

## Step 6: Testing and Validation
- Test role assignments and inheritance
- Verify permission enforcement
- Penetration test for privilege escalation
- Validate audit log completeness
</execution_flow>

<best_practices_detail>
### RBAC Data Model

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│    User     │     │  user_roles      │     │    Role     │
├─────────────┤     ├──────────────────┤     ├─────────────┤
│ id          │────<│ user_id (FK)     │     │ id          │
│ username    │     │ role_id (FK)     │>────│ name        │
│ email       │     │ assigned_at      │     │ description │
│ created_at  │     └──────────────────┘     │ created_at  │
└─────────────┘                              └──────┬──────┘
                                                    │
                                                    │
┌─────────────┐     ┌──────────────────┐     ┌──────▼──────┐
│  Permission │     │ role_permissions │     │   Role      │
├─────────────┤     ├──────────────────┤     ├─────────────┤
│ id          │>────│ role_id (FK)     │     │ parent_id   │──┐
│ name        │     │ permission_id(FK)│     │ (self-ref)  │  │
│ resource    │     │ created_at       │     └─────────────┘  │
│ action      │     └──────────────────┘                      │
└─────────────┘                                               │
         ▲                                                    │
         │                                                    │
         └────────────────────────────────────────────────────┘
                    Role Hierarchy (inheritance)
```

### Principle of Least Privilege

```php
// BAD: Overly permissive role
class AdminRole
{
    public function getPermissions(): array
    {
        return ['*']; // All permissions - dangerous!
    }
}

// GOOD: Granular permissions
class SupportAdminRole
{
    public function getPermissions(): array
    {
        return [
            'users:view',
            'users:edit',
            'tickets:view',
            'tickets:edit',
            'tickets:resolve',
            // No delete, no system config, no billing
        ];
    }
}

class SuperAdminRole
{
    public function getPermissions(): array
    {
        return [
            'users:*',
            'tickets:*',
            'settings:*',
            'billing:*',
        ];
    }
}
```

### Role Hierarchy

```php
// Role inheritance
class Role extends Model
{
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'parent_id');
    }
    
    public function children(): HasMany
    {
        return $this->hasMany(Role::class, 'parent_id');
    }
    
    public function getAllPermissions(): Collection
    {
        $permissions = $this->permissions;
        
        // Inherit permissions from parent roles
        if ($this->parent) {
            $permissions = $permissions->merge(
                $this->parent->getAllPermissions()
            );
        }
        
        return $permissions->unique();
    }
}

// Usage
$managerRole = Role::where('name', 'Manager')->first();
$permissions = $managerRole->getAllPermissions();
// Returns Manager permissions + Employee permissions (if inherited)
```

### Policy-Based Authorization

```php
// Policy class for Post resource
class PostPolicy
{
    public function view(User $user, Post $post): bool
    {
        // Owner can always view
        if ($user->id === $post->user_id) {
            return true;
        }
        
        // Published posts visible to all authenticated users
        if ($post->published) {
            return $user->hasPermission('posts:view');
        }
        
        // Draft posts only visible to admins
        return $user->hasPermission('posts:view-drafts');
    }
    
    public function update(User $user, Post $post): bool
    {
        // Only owner or users with edit permission
        return $user->id === $post->user_id
            || $user->hasPermission('posts:edit');
    }
    
    public function delete(User $user, Post $post): bool
    {
        // Only owner with delete permission or admins
        return ($user->id === $post->user_id 
                && $user->hasPermission('posts:delete'))
            || $user->hasRole('admin');
    }
}

// Usage in controller
class PostController
{
    public function update(Request $request, Post $post): Response
    {
        $this->authorize('update', $post); // Uses PostPolicy
        
        $post->update($request->validated());
        return response()->json($post);
    }
}
```

### Audit Trail Implementation

```php
// Audit log model
class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'resource_type',
        'resource_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];
    
    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'logged_at' => 'datetime',
    ];
}

// Audit trait for models
trait Auditable
{
    public static function bootAuditable(): void
    {
        static::updated(function ($model) {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'updated',
                'resource_type' => get_class($model),
                'resource_id' => $model->id,
                'old_values' => $model->getOriginal(),
                'new_values' => $model->getChanges(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        });
        
        static::deleted(function ($model) {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'deleted',
                'resource_type' => get_class($model),
                'resource_id' => $model->id,
                'old_values' => $model->getOriginal(),
                'ip_address' => request()->ip(),
            ]);
        });
    }
}
```
</best_practices_detail>

<anti_patterns_detail>
### Role Explosion

**Problem:** Too many roles, unmanageable

```
BAD: Role for every permission combination
- Admin
- User-View-Only
- User-Edit-Only
- User-View-Edit
- User-View-Delete
- User-View-Edit-Delete
- Post-View-Only
- Post-Edit-Only
→ 50+ roles, impossible to manage

GOOD: Role + Permission separation
- Admin (inherits all permissions)
- Manager (inherits employee + management)
- Employee (base permissions)
→ 3-5 roles, permissions assigned separately

Permissions:
- users:view, users:edit, users:delete
- posts:view, posts:edit, posts:delete
→ Mix and match as needed
```

### Hardcoded Permissions

**Problem:** Can't change without deployment

```php
// BAD: Hardcoded permission checks
class PostController
{
    public function edit(Post $post)
    {
        if (!auth()->user()->can('edit_posts')) {
            abort(403);
        }
        // String 'edit_posts' hardcoded everywhere
    }
}

// GOOD: Database-driven permissions
class PermissionChecker
{
    public function can(User $user, string $permission, $resource = null): bool
    {
        // Check database for permission
        return $user->roles()->whereHas('permissions', function ($q) use ($permission) {
            $q->where('name', $permission);
        })->exists();
    }
}

// Admin can change permissions without code deployment
```

### No Audit

**Problem:** Can't trace who accessed what

```
BAD: No audit logging
- User data modified
- No record of who changed it
- No record of when or from where
- Compliance violation (GDPR, HIPAA, SOX)

GOOD: Comprehensive audit
- All permission changes logged
- Sensitive data access logged
- Admin actions logged
- Searchable audit trail
- Retention policy configured
```

### Admin God Mode

**Problem:** Single role with all permissions

```php
// BAD: Single admin role with all power
class AdminRole
{
    public function getPermissions(): array
    {
        return ['*']; // Can do everything
        // No separation of duties
        // Violates compliance requirements
    }
}

// GOOD: Separated admin roles
class SuperAdminRole
{
    public function getPermissions(): array
    {
        return [
            'system:*',
            'users:*',
        ];
    }
}

class BillingAdminRole
{
    public function getPermissions(): array
    {
        return [
            'billing:*',
            'invoices:*',
        ];
    }
}

class SupportAdminRole
{
    public function getPermissions(): array
    {
        return [
            'tickets:*',
            'users:view',
        ];
    }
}
// Separation of duties for compliance
```
</anti_patterns_detail>
