# Validation Examples

**Phase:** 11.4 — Encapsulation (CORE-15)
**Date:** 2026-03-26

Examples of using `@ValidateInput` decorator with helper validators.

---

## Basic Usage

### Method Decorator

```typescript
import { ValidateInput } from './decorators/ValidateInput.js';
import { notEmpty, isPositive } from './decorators/validators.js';

export class UserService {
  /**
   * Create a new user
   * @param username - User's username
   * @param age - User's age
   */
  @ValidateInput((username: string, age: number) => {
    notEmpty(username, 'username');
    isPositive(age, 'age');
  })
  createUser(username: string, age: number): User {
    // Implementation - parameters are already validated
    return new User(username, age);
  }
}
```

### Setter Decorator (Using Helper Validators)

```typescript
import { ValidateInput } from './decorators/ValidateInput.js';
import { notEmpty, isPositive, isEmail, hasMinLength } from './decorators/validators.js';

export class User {
  private _username: string;
  private _email: string;
  private _age: number;

  @ValidateInput((value: string) => {
    notEmpty(value, 'username');
    hasMinLength(value, 3, 'username');
  })
  public set username(value: string) {
    this._username = value;
  }

  public get username(): string {
    return this._username;
  }

  @ValidateInput((value: string) => {
    notEmpty(value, 'email');
    isEmail(value, 'email');
  })
  public set email(value: string) {
    this._email = value;
  }

  public get email(): string {
    return this._email;
  }

  @ValidateInput((value: number) => {
    isPositive(value, 'age');
  })
  public set age(value: number) {
    this._age = value;
  }

  public get age(): number {
    return this._age;
  }
}
```

---

## Validator Functions

### String Validators

```typescript
import {
  notEmpty,
  hasMinLength,
  hasMaxLength,
  matchesPattern,
  isEmail,
  isUrl
} from './decorators/validators.js';

export class Config {
  private _apiKey: string;
  private _baseUrl: string;
  private _description: string;

  @ValidateInput((value: string) => {
    notEmpty(value, 'apiKey');
    hasMinLength(value, 10, 'apiKey');
  })
  public set apiKey(value: string) {
    this._apiKey = value;
  }

  @ValidateInput((value: string) => {
    notEmpty(value, 'baseUrl');
    isUrl(value, 'baseUrl');
  })
  public set baseUrl(value: string) {
    this._baseUrl = value;
  }

  @ValidateInput((value: string) => {
    hasMaxLength(value, 500, 'description');
  })
  public set description(value: string) {
    this._description = value;
  }
}
```

### Number Validators

```typescript
import {
  isPositive,
  isNonNegative,
  isInRange
} from './decorators/validators.js';

export class Pagination {
  private _page: number;
  private _limit: number;
  private _offset: number;

  @ValidateInput((value: number) => {
    isPositive(value, 'page');
  })
  public set page(value: number) {
    this._page = value;
  }

  @ValidateInput((value: number) => {
    isPositive(value, 'limit');
    isInRange(value, 1, 100, 'limit');
  })
  public set limit(value: number) {
    this._limit = value;
  }

  @ValidateInput((value: number) => {
    isNonNegative(value, 'offset');
  })
  public set offset(value: number) {
    this._offset = value;
  }
}
```

### Array Validators

```typescript
import { isNotEmptyArray } from './decorators/validators.js';

export class BatchProcessor {
  private _items: string[];

  @ValidateInput((value: string[]) => {
    isNotEmptyArray(value, 'items');
  })
  public set items(value: string[]) {
    this._items = value;
  }

  public get items(): string[] {
    return [...this._items]; // Return copy
  }
}
```

### Enum Validators

```typescript
import { isValidEnum } from './decorators/validators.js';

enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export class Logger {
  private _level: LogLevel;

  @ValidateInput((value: LogLevel) => {
    isValidEnum(value, LogLevel, 'level');
  })
  public set level(value: LogLevel) {
    this._level = value;
  }
}
```

### Type Validators

```typescript
import {
  isString,
  isNumber,
  isBoolean,
  isDefined
} from './decorators/validators.js';

export class Settings {
  private _name: string;
  private _version: number;
  private _enabled: boolean;
  private _config: Record<string, unknown>;

  @ValidateInput((value: string) => {
    isString(value, 'name');
    notEmpty(value, 'name');
  })
  public set name(value: string) {
    this._name = value;
  }

  @ValidateInput((value: number) => {
    isNumber(value, 'version');
    isPositive(value, 'version');
  })
  public set version(value: number) {
    this._version = value;
  }

  @ValidateInput((value: boolean) => {
    isBoolean(value, 'enabled');
  })
  public set enabled(value: boolean) {
    this._enabled = value;
  }

  @ValidateInput((value: Record<string, unknown>) => {
    isDefined(value, 'config');
  })
  public set config(value: Record<string, unknown>) {
    this._config = value;
  }
}
```

### Object Validators

```typescript
import { hasRequiredKeys } from './decorators/validators.js';

export class DatabaseConfig {
  private _connection: {
    host: string;
    port: number;
    database: string;
    username?: string;
    password?: string;
  };

  @ValidateInput((value: any) => {
    hasRequiredKeys(value, ['host', 'port', 'database'], 'connection');
  })
  public set connection(value: { host: string; port: number; database: string }) {
    this._connection = value;
  }
}
```

### Custom Validators

```typescript
import { custom } from './decorators/validators.js';

export class Product {
  private _sku: string;
  private _price: number;

  @ValidateInput((value: string) => {
    custom(
      value,
      (sku) => /^[A-Z]{3}-\d{4}$/.test(sku),
      'SKU must be in format: ABC-1234'
    );
  })
  public set sku(value: string) {
    this._sku = value;
  }

  @ValidateInput((value: number) => {
    custom(
      value,
      (price) => price >= 0 && price <= 999999.99,
      'Price must be between 0 and 999,999.99'
    );
  })
  public set price(value: number) {
    this._price = value;
  }
}
```

---

## Combining Multiple Validators

```typescript
import { ValidateInput } from './decorators/ValidateInput.js';
import {
  notEmpty,
  hasMinLength,
  hasMaxLength,
  matchesPattern
} from './decorators/validators.js';

export class UserProfile {
  private _displayName: string;

  @ValidateInput((value: string) => {
    // Chain multiple validators
    notEmpty(value, 'displayName');
    hasMinLength(value, 2, 'displayName');
    hasMaxLength(value, 50, 'displayName');
    matchesPattern(
      value,
      /^[a-zA-Z0-9_\s-]+$/,
      'displayName'
    );
  })
  public set displayName(value: string) {
    this._displayName = value;
  }
}
```

---

## Complex Validation Example

```typescript
import { ValidateInput } from './decorators/ValidateInput.js';
import {
  notEmpty,
  isEmail,
  isPositive,
  isInRange,
  hasMinLength,
  custom
} from './decorators/validators.js';

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

export class UserRegistration {
  private _username: string;
  private _email: string;
  private _password: string;
  private _age: number;
  private _role: UserRole;

  @ValidateInput((value: string) => {
    notEmpty(value, 'username');
    hasMinLength(value, 3, 'username');
    custom(
      value,
      (u) => /^[a-zA-Z0-9_]+$/.test(u),
      'Username can only contain letters, numbers, and underscores'
    );
  })
  public set username(value: string) {
    this._username = value;
  }

  @ValidateInput((value: string) => {
    notEmpty(value, 'email');
    isEmail(value, 'email');
  })
  public set email(value: string) {
    this._email = value;
  }

  @ValidateInput((value: string) => {
    notEmpty(value, 'password');
    hasMinLength(value, 8, 'password');
    custom(
      value,
      (p) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p),
      'Password must contain uppercase, lowercase, and number'
    );
  })
  public set password(value: string) {
    this._password = value;
  }

  @ValidateInput((value: number) => {
    isPositive(value, 'age');
    isInRange(value, 13, 120, 'age');
  })
  public set age(value: number) {
    this._age = value;
  }

  @ValidateInput((value: UserRole) => {
    isValidEnum(value, UserRole, 'role');
  })
  public set role(value: UserRole) {
    this._role = value;
  }
}
```

---

## Best Practices

### 1. Use Specific Error Messages

```typescript
// ❌ Bad: Generic error
@ValidateInput((value: string) => {
  if (!value) throw new Error('Invalid value');
})

// ✅ Good: Specific error
@ValidateInput((value: string) => {
  notEmpty(value, 'username');
})
```

### 2. Chain Related Validators

```typescript
// ✅ Good: Chain validators for same field
@ValidateInput((value: string) => {
  notEmpty(value, 'password');
  hasMinLength(value, 8, 'password');
  hasMaxLength(value, 128, 'password');
})
```

### 3. Use Helper Validators

```typescript
// ❌ Bad: Inline validation logic
@ValidateInput((value: string) => {
  if (!value || value.trim().length === 0) {
    throw new Error('Field cannot be empty');
  }
})

// ✅ Good: Use helper
@ValidateInput((value: string) => {
  notEmpty(value, 'field');
})
```

### 4. Combine with Getters

```typescript
export class Config {
  private _timeout: number;

  @ValidateInput((value: number) => {
    isPositive(value, 'timeout');
    isInRange(value, 1000, 30000, 'timeout');
  })
  public set timeout(value: number) {
    this._timeout = value;
  }

  public get timeout(): number {
    return this._timeout;
  }
}
```

### 5. Document Validation Rules

```typescript
/**
 * User's email address
 * @throws Error if email is empty or invalid format
 */
@ValidateInput((value: string) => {
  notEmpty(value, 'email');
  isEmail(value, 'email');
})
public set email(value: string) {
  this._email = value;
}
```

---

## Migration Guide

### From Manual Validation to Decorator

**Before:**
```typescript
export class User {
  private _email: string;

  public set email(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error('Invalid email format');
    }
    this._email = value;
  }
}
```

**After:**
```typescript
import { ValidateInput } from './decorators/ValidateInput.js';
import { notEmpty, isEmail } from './decorators/validators.js';

export class User {
  private _email: string;

  @ValidateInput((value: string) => {
    notEmpty(value, 'email');
    isEmail(value, 'email');
  })
  public set email(value: string) {
    this._email = value;
  }
}
```

**Benefits:**
- Cleaner setter implementation
- Reusable validation logic
- Consistent error messages
- Easier to test validators independently

---

*Created: 2026-03-26*
*Phase 11.4 — Encapsulation (CORE-15)*
