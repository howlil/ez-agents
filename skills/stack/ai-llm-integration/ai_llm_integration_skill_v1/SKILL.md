---
name: AI/LLM Integration Skill
version: 1.0.0
description: LLM API integration, RAG patterns, prompt engineering, embeddings, and vector search
keywords: [ai, llm, llm-integration, rag, embeddings, vector-search, openai, anthropic]
---

# AI/LLM Integration Skill

## Overview

This skill provides guidance on integrating Large Language Models (LLMs) into applications, including API integration, RAG (Retrieval-Augmented Generation) patterns, prompt engineering, embeddings, and vector search.

## When to Use

- Building AI-powered features (chatbots, assistants, content generation)
- Need semantic search capabilities
- Implementing RAG patterns for domain-specific knowledge
- Working with embeddings for similarity matching
- Integrating with LLM providers (OpenAI, Anthropic, etc.)

## When NOT to Use

- Simple CRUD applications with no AI needs
- Deterministic computations (use traditional code)
- When cost is prohibitive (LLM calls can be expensive)
- When latency requirements are <100ms (LLM calls are slower)

---

## Core Concepts

### 1. LLM API Integration

**Providers:**
- OpenAI (GPT-4, GPT-3.5-turbo)
- Anthropic (Claude 3, Claude 2)
- Google (Gemini Pro, Gemini Ultra)
- Meta (Llama 2, Llama 3 - self-hosted)
- Mistral AI (Mistral, Mixtral)

**Integration Pattern:**
```javascript
// ✅ Use environment variables for API keys
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ Implement retry logic with exponential backoff
async function callLLMWithRetry(prompt, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }]
      });
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}

// ✅ Stream responses for better UX
const stream = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [{ role: 'user', content: prompt }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### 2. Prompt Engineering

**Best Practices:**
```javascript
// ✅ Be specific and provide context
const prompt = `
You are a helpful customer support assistant for an e-commerce platform.
Help users with order tracking, returns, and product questions.
Be concise and friendly.

User question: ${userQuestion}
Order ID (if provided): ${orderId}
`;

// ✅ Use few-shot examples
const prompt = `
Convert these product descriptions to JSON:

Input: "Nike Air Max, $120, available in sizes 7-12"
Output: {"name": "Nike Air Max", "price": 120, "sizes": [7,8,9,10,11,12]}

Input: "${productDescription}"
Output:
`;

// ✅ Use system messages for behavior
const messages = [
  { role: 'system', content: 'You are a concise API that returns only JSON.' },
  { role: 'user', content: 'Extract entities from: ${text}' }
];

// ✅ Chain prompts for complex tasks
const step1 = await llm('Extract key topics from: ${document}');
const step2 = await llm(`Summarize these topics: ${step1}`);
```

### 3. RAG (Retrieval-Augmented Generation)

**Pattern:**
```
User Query → Embed Query → Search Vector DB → Retrieve Context → Augment Prompt → LLM → Response
```

**Implementation:**
```javascript
// ✅ RAG Pipeline
async function ragQuery(userQuery, vectorStore, llm) {
  // 1. Embed the query
  const queryEmbedding = await embedder.embed(userQuery);
  
  // 2. Search for similar documents
  const results = await vectorStore.similaritySearch(
    queryEmbedding,
    { topK: 5, filter: { domain: 'support' } }
  );
  
  // 3. Build context from retrieved documents
  const context = results
    .map(doc => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`)
    .join('\n\n');
  
  // 4. Augment prompt with context
  const prompt = `
Based on the following context, answer the user's question.
If the answer is not in the context, say "I don't have enough information."

Context:
${context}

User Question: ${userQuery}

Answer:
`;
  
  // 5. Call LLM with augmented prompt
  const response = await llm(prompt);
  
  // 6. Include citations
  return {
    answer: response,
    sources: results.map(r => r.metadata.source)
  };
}
```

### 4. Embeddings

**Use Cases:**
- Semantic search
- Document similarity
- Clustering
- Recommendation systems

**Implementation:**
```javascript
// ✅ Generate embeddings
const embedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Your text here'
});

// ✅ Store with metadata
await vectorStore.insert({
  id: 'doc-123',
  embedding: embedding.data[0].embedding,
  metadata: {
    source: 'user-manual.pdf',
    page: 5,
    domain: 'support'
  },
  content: 'Original text content'
});

// ✅ Batch embeddings for efficiency
const texts = ['text 1', 'text 2', 'text 3'];
const embeddings = await Promise.all(
  texts.map(text => embedder.embed(text))
);
```

### 5. Vector Search

**Patterns:**
```javascript
// ✅ Similarity search
const results = await vectorStore.similaritySearch(queryEmbedding, {
  topK: 10,
  filter: { domain: 'support', date: { gte: '2024-01-01' } }
});

// ✅ Hybrid search (keyword + vector)
const results = await vectorStore.hybridSearch({
  query: 'refund policy',
  queryEmbedding,
  topK: 10,
  weights: { keyword: 0.3, vector: 0.7 }
});

// ✅ MMR (Maximal Marginal Relevance) for diversity
const results = await vectorStore.mmrSearch(queryEmbedding, {
  topK: 5,
  lambda: 0.5 // Balance relevance vs diversity
});
```

---

## Architecture Patterns

### 1. Basic LLM Integration

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │ ──→ │   Your App  │ ──→ │   LLM API   │
│             │ ←── │             │ ←── │ (OpenAI,etc)│
└─────────────┘     └─────────────┘     └─────────────┘
```

### 2. RAG Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Query
       ▼
┌─────────────┐     ┌─────────────┐
│  Embedder   │ ──→ │ Vector DB   │
└─────────────┘     └──────┬──────┘
                           │ Context
                           ▼
                     ┌─────────────┐
                     │  Augmented  │
                     │   Prompt    │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   LLM API   │
                     └──────┬──────┘
                            │ Response
                            ▼
                     ┌─────────────┐
                     │   User      │
                     └─────────────┘
```

### 3. Caching Layer

```
┌─────────────┐
│   Query     │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ Cache Check │ ──→ │   LLM API   │
│ (Redis)     │ ←── │             │
└──────┬──────┘     └─────────────┘
       │ Hit
       ▼
┌─────────────┐
│  Response   │
└─────────────┘
```

---

## Best Practices

### 1. Cost Optimization

```javascript
// ✅ Cache LLM responses
const cacheKey = `llm:${hash(prompt)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const response = await llm(prompt);
await redis.setex(cacheKey, 3600, JSON.stringify(response)); // 1 hour TTL

// ✅ Use cheaper models when possible
const model = useCase === 'draft' ? 'gpt-3.5-turbo' : 'gpt-4-turbo';

// ✅ Token counting & budgeting
const tokens = countTokens(prompt);
if (tokens > budget.remaining) {
  throw new Error('Budget exceeded');
}
```

### 2. Latency Optimization

```javascript
// ✅ Stream responses
const stream = await llm.stream(prompt);
for await (const chunk of stream) {
  yield chunk; // Send to client immediately
}

// ✅ Parallel LLM calls
const [summary, entities, sentiment] = await Promise.all([
  llm('Summarize: ${text}'),
  llm('Extract entities: ${text}'),
  llm('Analyze sentiment: ${text}')
]);
```

### 3. Error Handling

```javascript
// ✅ Handle rate limits
try {
  return await llm(prompt);
} catch (error) {
  if (error.status === 429) {
    await sleep(60000); // Wait 1 minute
    return await llm(prompt); // Retry
  }
  throw error;
}

// ✅ Fallback to cheaper model
try {
  return await llm(prompt, { model: 'gpt-4' });
} catch (error) {
  console.warn('GPT-4 failed, falling back to GPT-3.5');
  return await llm(prompt, { model: 'gpt-3.5-turbo' });
}
```

### 4. Security

```javascript
// ✅ Sanitize user input
const sanitized = sanitizeInput(userInput); // Remove potential injections

// ✅ Validate LLM output
const parsed = JSON.parse(llmResponse);
if (!isValidSchema(parsed)) {
  throw new Error('Invalid LLM output');
}

// ✅ Don't expose API keys
const apiKey = process.env.OPENAI_API_KEY; // ✅
const apiKey = 'sk-...'; // ❌ Never hardcode

// ✅ Rate limiting per user
const userUsage = await redis.get(`rate:${userId}`);
if (userUsage > limit) {
  throw new Error('Rate limit exceeded');
}
```

---

## Anti-Patterns

### ❌ Don't Do This

```javascript
// ❌ No retry logic
const response = await llm(prompt); // Will fail on rate limits

// ❌ No input validation
const response = await llm(userInput); // Vulnerable to injections

// ❌ No output validation
const data = JSON.parse(llmResponse); // May not be valid JSON

// ❌ Hardcoded API keys
const apiKey = 'sk-abc123...';

// ❌ No caching (expensive!)
const response = await llm(samePromptRepeatedly);

// ❌ No token counting (budget surprises!)
const response = await llm(veryLongPrompt); // May exceed budget
```

### ✅ Do This Instead

```javascript
// ✅ Retry with backoff
const response = await callLLMWithRetry(prompt);

// ✅ Sanitize input
const sanitized = sanitizeInput(userInput);
const response = await llm(sanitized);

// ✅ Validate output
const parsed = JSON.parse(llmResponse);
assertValidSchema(parsed);

// ✅ Environment variables
const apiKey = process.env.OPENAI_API_KEY;

// ✅ Cache responses
const cached = await cache.get(prompt);
if (!cached) {
  const response = await llm(prompt);
  await cache.set(prompt, response);
}

// ✅ Count tokens
const tokens = countTokens(prompt);
checkBudget(tokens);
```

---

## Examples

### Example 1: Customer Support Chatbot

```javascript
const systemPrompt = `
You are a customer support assistant for TechCorp.
Help users with:
- Product questions
- Order tracking
- Returns and refunds
- Technical issues

Be friendly, concise, and helpful.
If you don't know, say "Let me connect you with a human agent."
`;

async function handleSupportMessage(userId, message) {
  // Get conversation history
  const history = await getConversationHistory(userId);
  
  // Build messages
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message }
  ];
  
  // Call LLM
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    max_tokens: 500
  });
  
  // Save to history
  await saveConversation(userId, [
    { role: 'user', content: message },
    { role: 'assistant', content: response.choices[0].message.content }
  ]);
  
  return response.choices[0].message.content;
}
```

### Example 2: Document Q&A with RAG

```javascript
async function answerQuestionFromDocs(question, userId) {
  // 1. Get user's document access
  const accessibleDocs = await getUserAccessibleDocs(userId);
  
  // 2. Embed the question
  const queryEmbedding = await embedder.embed(question);
  
  // 3. Search vector store
  const results = await vectorStore.similaritySearch(queryEmbedding, {
    topK: 5,
    filter: { docId: { in: accessibleDocs } }
  });
  
  // 4. Build context
  const context = results.map(r => 
    `From ${r.metadata.title}:\n${r.pageContent}`
  ).join('\n\n');
  
  // 5. Augment prompt
  const prompt = `
Based on these documents, answer the question.
Cite your sources. If the answer isn't in the documents, say so.

Documents:
${context}

Question: ${question}

Answer with citations:
`;
  
  // 6. Get answer
  const response = await llm(prompt);
  
  return {
    answer: response,
    sources: results.map(r => ({
      title: r.metadata.title,
      page: r.metadata.page
    }))
  };
}
```

### Example 3: Content Generation with Validation

```javascript
async function generateProductDescription(product) {
  const prompt = `
Generate a product description for:
- Name: ${product.name}
- Price: $${product.price}
- Features: ${product.features.join(', ')}
- Target audience: ${product.targetAudience}

Requirements:
- 100-150 words
- Friendly, enthusiastic tone
- Highlight key benefits
- Include call-to-action

Output JSON:
{
  "title": "...",
  "description": "...",
  "highlights": ["...", "..."],
  "cta": "..."
}
`;
  
  const response = await llm(prompt);
  const parsed = JSON.parse(response);
  
  // Validate output
  if (!parsed.title || !parsed.description) {
    throw new Error('Invalid LLM output');
  }
  
  // Check length
  if (parsed.description.split(' ').length > 150) {
    parsed.description = truncate(parsed.description, 150);
  }
  
  return parsed;
}
```

---

## Tools & Libraries

### LLM Providers
- **OpenAI** — GPT-4, GPT-3.5-turbo, embeddings
- **Anthropic** — Claude 3, Claude 2
- **Google** — Gemini Pro, Gemini Ultra
- **Mistral** — Mistral, Mixtral
- **Meta** — Llama 2, Llama 3 (self-hosted)

### Vector Databases
- **Pinecone** — Managed vector database
- **Weaviate** — Open-source with hybrid search
- **ChromaDB** — Simple, embedded
- **pgvector** — PostgreSQL extension
- **Qdrant** — High-performance, open-source

### Embedding Models
- **OpenAI** — text-embedding-3-small, text-embedding-3-large
- **Cohere** — embed-english-v3.0
- **Sentence Transformers** — All-MiniLM-L6-v2 (self-hosted)

### Frameworks
- **LangChain** — LLM orchestration framework
- **LlamaIndex** — RAG-specific framework
- **Vercel AI SDK** — React/Next.js integration

---

## Metrics to Track

| Metric | Target | Why |
|--------|--------|-----|
| Cost per query | < $0.01 | Budget control |
| Latency (p95) | < 3s | User experience |
| Cache hit rate | > 50% | Cost reduction |
| Token usage | Track per feature | Budget allocation |
| Error rate | < 1% | Reliability |
| User satisfaction | > 4.0/5.0 | Quality measure |

---

## Checklist

### Before Launch
- [ ] API keys stored in environment variables
- [ ] Rate limiting implemented
- [ ] Caching layer in place
- [ ] Error handling with retries
- [ ] Token counting & budget alerts
- [ ] Output validation
- [ ] Security review (input sanitization)
- [ ] Cost projection calculated

### Monitoring
- [ ] Token usage dashboard
- [ ] Cost tracking per feature
- [ ] Latency monitoring
- [ ] Error rate alerts
- [ ] User feedback collection

---

## Version History

- **v1.0.0** — Initial release with LLM integration, RAG, embeddings, vector search
