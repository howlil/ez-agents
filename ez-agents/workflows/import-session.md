# Workflow: import-session

**Purpose:** Import session data from exported file

**Related Commands:** `/ez:import-session`

---

## Workflow Steps

### 1. Parameters

```
file_path: string (required)
source_model: string (optional) - For model-specific adapters
```

### 2. Validate Input

```
// Check file exists
if (!fs.existsSync(file_path)) {
  throw error(`File not found: ${file_path}`);
}

// Check file is .json
if (!file_path.endsWith('.json')) {
  throw error("Import file must be .json format");
}

// Try to parse JSON
try {
  content = fs.readFileSync(file_path, 'utf-8');
  importedData = JSON.parse(content);
} catch (err) {
  throw error(`Invalid JSON: ${err.message}`);
}
```

### 3. Import Session

```
SessionManager mgr = new SessionManager();
SessionImport importer = new SessionImport(mgr);

const options = {};
if (source_model) {
  options.sourceModel = source_model;
}

try {
  result = importer.import(file_path, options);
} catch (SessionImportError err) {
  logger.error('Import failed', { file: file_path, error: err.message });
  
  // Display user-friendly error
  output(`Import failed: ${err.message}`);
  
  if (err.validationErrors && err.validationErrors.length > 0) {
    output("\nValidation errors:");
    for (error of err.validationErrors) {
      output(`  - ${error}`);
    }
  }
  
  output("\nSuggested fix:");
  output("  Ensure the file is a valid session export from /ez:export-session");
  
  throw error;
}
```

### 4. Validate Imported Session

```
// Check required fields
session = importedData.session || importedData;

requiredFields = ['metadata', 'context'];
missingFields = [];

for (field of requiredFields) {
  if (!session[field]) {
    missingFields.push(field);
  }
}

if (missingFields.length > 0) {
  warnings.push(`Missing optional fields: ${missingFields.join(', ')}`);
}

// Check session_chain integrity
if (session.metadata?.session_chain) {
  for (chainId of session.metadata.session_chain) {
    linkedSession = mgr.loadSession(chainId);
    if (!linkedSession) {
      warnings.push(`Missing linked session: ${chainId}`);
    }
  }
}
```

### 5. Create or Update Session

```
// Check if session_id already exists
existingSession = mgr.loadSession(result.sessionId);

if (existingSession) {
  // Generate new session_id with timestamp suffix
  timestamp = Date.now();
  newSessionId = `${result.sessionId}-imported-${timestamp}`;
  
  // Create new session with modified ID
  mgr.createSession({
    model: session.metadata?.model,
    phase: session.metadata?.phase,
    plan: session.metadata?.plan
  });
  
  // Update with imported data
  mgr.updateSession(newSessionId, {
    context: session.context,
    state: session.state,
    metadata: {
      ...session.metadata,
      session_id: newSessionId,
      session_chain: [...(session.metadata?.session_chain || []), result.sessionId]
    }
  });
  
  result.sessionId = newSessionId;
  logger.info('Session imported with new ID', { 
    original: result.sessionId, 
    new: newSessionId 
  });
} else {
  // Update existing session created by importer
  mgr.updateSession(result.sessionId, {
    context: session.context,
    state: session.state
  });
}
```

### 6. Log Success

```
logger.info('Session imported', { 
  new_session_id: result.sessionId, 
  source_file: file_path 
});
```

### 7. Return Result

```
return {
  success: true,
  session_id: result.sessionId,
  warnings: warnings || []
};
```

---

## Import Confirmation Display

```
Session imported successfully!

Session ID: {sessionId}
Source: {file_path}
Original model: {model}
Original phase: {phase}
Original plan: {plan}

{warnings.length > 0 ? `Warnings:\n  - ${warnings.join('\n  - ')}` : ''}
```

---

## Session Summary Display

```
Session Summary:

Tasks Completed: {completedTasks.length}
Tasks Incomplete: {incompleteTasks.length}
Key Decisions: {decisions.length}
File Changes: {fileChanges.length}

Incomplete Tasks:
{incompleteTasks.map(t => `  - ${t}`).join('\n')}

Recommended Next Action:
  {nextAction}
```

---

## Follow-up Actions

```
What would you like to do?

1. Resume this session
2. View session chain
3. Return to current session
4. Export this session
```

---

## Error Handling

### File Not Found
```
if (!fs.existsSync(file_path)) {
  throw error(`File not found: ${file_path}`);
}
```

### Invalid JSON
```
try {
  importedData = JSON.parse(content);
} catch (err) {
  throw error(`Invalid JSON format: ${err.message}`);
}
```

### Missing Required Fields
```
if (!session.metadata || !session.context) {
  throw error("Invalid session format: Missing metadata or context");
}
```

### Circular Chain Reference
```
if (session.metadata?.session_chain?.includes(session.metadata.session_id)) {
  throw error("Invalid session chain: Circular reference detected");
}
```

---

## Model-Specific Adapters

### Claude Format
```javascript
_adaptClaudeFormat(data) {
  // Claude may export with different structure
  // Adapt to standard session format
  return {
    metadata: {
      session_id: data.id || data.session_id,
      model: 'claude',
      ...data.metadata
    },
    context: data.context || data.conversation,
    state: data.state || {}
  };
}
```

### Qwen Format
```javascript
_adaptQwenFormat(data) {
  // Qwen standard format (already compatible)
  return data;
}
```

### OpenAI Format
```javascript
_adaptOpenAIFormat(data) {
  // OpenAI may use different field names
  return {
    metadata: data.metadata || data.session_metadata,
    context: data.context || data.messages,
    state: data.state || {}
  };
}
```

### Kimi Format
```javascript
_adaptKimiFormat(data) {
  // Kimi standard format (already compatible)
  return data;
}
```

---

## Related Files

- `ez-agents/bin/lib/session-manager.cjs` - Session creation
- `ez-agents/bin/lib/session-import.cjs` - Import logic
- `ez-agents/bin/lib/session-errors.cjs` - Error classes
- `.planning/sessions/` - Session storage directory
