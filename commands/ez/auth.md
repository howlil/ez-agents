---
name: ez:auth
description: Manage API credentials securely (save, list, delete)
argument-hint: "<save|list|delete|test> [provider] [secret]"
agent: ez-helper
allowed-tools:
  - Read
  - Bash
---
<objective>
Manage API credentials securely using system keychain or fallback file storage

**Subcommands:**
- `ez:auth save <provider> <secret>` — Save credential for provider
- `ez:auth list` — List all stored providers
- `ez:auth delete <provider>` — Delete credential for provider
- `ez:auth test` — Test credential system and show keychain status

**Providers:** anthropic, moonshot, alibaba, qwen, openai
</objective>

<execution_context>
@~/.claude/ez-agents/workflows/ez-helper.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

# Credential storage module:
@ez-agents/bin/lib/auth.cjs

# EZ tools CLI:
@ez-agents/bin/ez-tools.cjs
</context>

<process>
## Subcommand Routing

1. **Parse arguments** — First arg is subcommand (save/list/delete/test), remaining are parameters
2. **Route to handler** — Call appropriate auth function from ez-tools.cjs
3. **Output result** — Show success/failure with user-friendly messages

## Handlers

### save <provider> <secret>
1. Validate provider name against known providers
2. Call saveCredential(provider, secret)
3. Output: "✓ Credential saved for {provider}" or error message

### list
1. Call listProviders()
2. Check isKeychainAvailable()
3. Output table:
   ```
   Provider       Storage
   ─────────────────────────
   anthropic      Keychain ✓
   qwen           File (fallback)
   ```
4. If using file storage, show warning: "⚠ Using file storage — consider installing keytar for better security"

### delete <provider>
1. Validate provider exists
2. Confirm deletion (ask user or require --force)
3. Call deleteCredential(provider)
4. Output: "✓ Credential deleted for {provider}"

### test
1. Check isKeychainAvailable()
2. Output:
   ```
   Credential System Test
   
   Keychain (keytar): {Available | Unavailable}
   Storage mode: {System keychain | Fallback file}
   
   Stored providers: {count}
   ```
3. If keytar unavailable, show install hint: "npm install keytar"

## Error Handling

- **Invalid provider:** "Unknown provider '{name}'. Valid: anthropic, moonshot, alibaba, qwen, openai"
- **Credential not found:** "No credential found for {provider}. Use 'save' to add one."
- **Keychain error:** "Failed to access keychain: {error}. Using fallback storage."
</process>
