---
name: Content Management System (CMS)
description: Content creation, review, publishing, versioning with SEO and multi-language support
version: 1.0.0
tags: [cms, content, publishing, seo, multi-language]
category: domain
domain_type: cms
triggers:
  keywords: [cms, content management, blog, publishing, articles, pages]
  projectArchetypes: [cms, content-platform, blog, news-site]
  constraints: [multi-author, editorial-workflow, seo-required]
prerequisites:
  - rich_text_editor_basics
  - seo_basics
  - caching_basics
key_workflows:
  - name: Content Creation
    steps:
      - Create draft with title and slug
      - Add rich text content with media embeds
      - Set metadata (title, description, tags)
      - SEO optimization (meta tags, Open Graph)
      - Save draft and preview
    entities: [Content, Media, Metadata, SEOTags, Author]
  - name: Content Review
    steps:
      - Submit for review by author
      - Editor assignment and notification
      - Review with comments and suggestions
      - Revision cycle with version tracking
      - Approval or rejection with feedback
    entities: [ReviewRequest, Editor, ReviewComment, Revision, WorkflowState]
  - name: Publishing
    steps:
      - Schedule publish date/time
      - Publish to web (generate static or dynamic)
      - Clear CDN and application cache
      - Notify subscribers (email, RSS, social)
      - Sync to social media platforms
    entities: [PublishSchedule, Subscriber, SocialPost, CacheInvalidation]
  - name: Versioning
    steps:
      - Create version snapshot on save
      - Track changes between versions
      - Compare versions with diff view
      - Restore previous version if needed
      - Maintain version history
    entities: [ContentVersion, ChangeLog, VersionDiff, RestorePoint]
compliance_requirements:
  - SEO best practices (meta tags, structured data, sitemaps)
  - Multi-language support (i18n, l10n)
  - Accessibility (WCAG 2.1 AA)
  - GDPR for user data and cookies
  - Copyright and content ownership tracking
data_model_patterns:
  - Draft/publish workflow with state machine
  - Content versioning with diff tracking
  - Content scheduling with timezone support
  - Multi-language variants linked to source
  - Content hierarchy (pages, sections, categories)
  - Taxonomy (tags, categories, collections)
integration_points:
  - CDN for media and static content
  - Email service for notifications
  - Social media APIs (Twitter, Facebook, LinkedIn)
  - Analytics platforms (Google Analytics, Plausible)
  - Search services (Algolia, Elasticsearch)
  - Markdown/rich text editors
scaling_considerations: |
  CMS scaling strategies:

  1. **CDN for Static Content**:
     - Serve published pages from CDN
     - Cache media assets globally
     - Invalidate cache on publish

  2. **Caching for Published Pages**:
     - Redis/Memcached for rendered pages
     - Cache warming for popular content
     - Stale-while-revalidate for freshness

  3. **Queue for Publishing**:
     - Async cache invalidation
     - Background social media posting
     - Email notification batching

  4. **Search Indexing**:
     - Async search index updates
     - Incremental indexing for large content
     - Search analytics for recommendations

  5. **Multi-Language Scaling**:
     - Separate cache per language
     - Translation workflow automation
     - Language-specific sitemaps
when_not_to_use: |
  CMS may not be suitable for:

  1. **Static Sites Without Frequent Updates**:
     - Use Static Site Generators (Next.js, Gatsby, Hugo)
     - Simpler deployment, better performance

  2. **Real-Time Collaboration Needs**:
     - Use Notion-like collaborative editors
     - Better for team documentation

  3. **E-Commerce Focused**:
     - Use Shopify or e-commerce platforms
     - Better product management and checkout

  4. **Developer Documentation**:
     - Use GitBook, Docusaurus, or similar
     - Better version control integration
output_template: |
  ## CMS Platform Decision

  **Domain:** Content Management System
  **Version:** 1.0.0
  **Rationale:** [Why CMS was chosen]

  **Key Workflows:**
  - Content Creation
  - Content Review
  - Publishing
  - Versioning

  **Compliance:**
  - SEO best practices
  - Multi-language support
  - Accessibility (WCAG)

  **Integrations:**
  - CDN: [CloudFront/Cloudflare]
  - Email: [SendGrid/Postmark]
  - Social: [Twitter/Facebook/LinkedIn]

  **Scaling Plan:**
  - CDN for static content
  - Page caching with Redis
  - Async publishing queue
dependencies:
  - rich_text_editor
  - seo_basics
  - caching_basics
  - i18n_basics
---

<role>
You are an expert in content management systems with deep experience in editorial workflows, SEO, and multi-language publishing.
You help teams build content platforms that empower authors while maintaining quality and consistency.
</role>

<execution_flow>
## Step 1: Assess Content Requirements
- Identify content types (articles, pages, media)
- Understand editorial workflow needs
- Determine language and localization requirements
- Assess SEO and analytics needs

## Step 2: Design Content Model
- Define content types and fields
- Design taxonomy (categories, tags)
- Plan multi-language structure
- Establish versioning approach

## Step 3: Implement Core Workflows
- Build content editor with rich text
- Implement draft/publish state machine
- Create review and approval workflow
- Develop versioning system

## Step 4: Add Publishing Features
- Implement scheduling system
- Build cache invalidation
- Create social media integration
- Set up analytics tracking

## Step 5: Optimize for SEO and Performance
- Add meta tag management
- Generate XML sitemaps
- Implement structured data
- Configure CDN and caching
</execution_flow>

<best_practices_detail>
### Content State Machine

```javascript
// Content lifecycle with clear states
const CONTENT_STATES = {
  DRAFT: 'draft',           // Being written
  PENDING_REVIEW: 'pending_review',  // Awaiting editor review
  IN_REVIEW: 'in_review',   // Being reviewed
  REVISIONS_REQUESTED: 'revisions_requested', // Needs changes
  APPROVED: 'approved',     // Ready to publish
  SCHEDULED: 'scheduled',   // Scheduled for publish
  PUBLISHED: 'published',   // Live on website
  ARCHIVED: 'archived'      // No longer visible
};

// State transitions
const STATE_TRANSITIONS = {
  [CONTENT_STATES.DRAFT]: [CONTENT_STATES.PENDING_REVIEW, CONTENT_STATES.ARCHIVED],
  [CONTENT_STATES.PENDING_REVIEW]: [CONTENT_STATES.IN_REVIEW, CONTENT_STATES.REVISIONS_REQUESTED],
  [CONTENT_STATES.IN_REVIEW]: [CONTENT_STATES.APPROVED, CONTENT_STATES.REVISIONS_REQUESTED],
  [CONTENT_STATES.REVISIONS_REQUESTED]: [CONTENT_STATES.DRAFT],
  [CONTENT_STATES.APPROVED]: [CONTENT_STATES.SCHEDULED, CONTENT_STATES.PUBLISHED],
  [CONTENT_STATES.SCHEDULED]: [CONTENT_STATES.PUBLISHED, CONTENT_STATES.DRAFT],
  [CONTENT_STATES.PUBLISHED]: [CONTENT_STATES.ARCHIVED, CONTENT_STATES.DRAFT],
};
```

### Multi-Language Content

```javascript
// Content with translations
{
  id: "content_123",
  slug: "my-article",
  language: "en",
  translations: [
    { language: "es", slug: "mi-articulo", contentId: "content_124" },
    { language: "fr", slug: "mon-article", contentId: "content_125" }
  ],
  content: {
    title: "My Article",
    body: "<p>Article content...</p>",
    excerpt: "Short description..."
  },
  metadata: {
    metaTitle: "My Article - SEO Title",
    metaDescription: "SEO description...",
    canonicalUrl: "https://example.com/my-article"
  }
}
```

### Version History

```javascript
// Track all changes with versions
{
  contentId: "content_123",
  versions: [
    {
      version: 1,
      createdAt: "2026-03-20T10:00:00Z",
      createdBy: "author_1",
      changes: { title: "Initial title", body: "Initial content" },
      isCurrent: false
    },
    {
      version: 2,
      createdAt: "2026-03-21T14:00:00Z",
      createdBy: "author_1",
      changes: { title: "Updated title", body: "Updated content with revisions" },
      isCurrent: true,
      changeSummary: "Updated title and added section 2"
    }
  ],
  diff: {
    from: 1,
    to: 2,
    changes: [
      { field: "title", old: "Initial title", new: "Updated title" },
      { field: "body", action: "append", content: "Added section 2..." }
    ]
  }
}
```

### SEO Optimization

```javascript
// Complete SEO metadata
{
  seo: {
    metaTitle: "Article Title | Site Name",
    metaDescription: "Compelling description for search results (150-160 chars)",
    canonicalUrl: "https://example.com/article-slug",
    openGraph: {
      title: "Article Title",
      description: "Social media description",
      image: "https://cdn.example.com/og-image.jpg",
      type: "article",
      article: {
        publishedTime: "2026-03-21T10:00:00Z",
        author: "Author Name",
        section: "Category"
      }
    },
    twitter: {
      card: "summary_large_image",
      site: "@twitterhandle",
      creator: "@authorhandle"
    },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Article Title",
      datePublished: "2026-03-21T10:00:00Z",
      author: { "@type": "Person", name: "Author Name" }
    }
  }
}
```
</best_practices_detail>

<anti_patterns_detail>
### No Editorial Workflow

**Problem:** Anyone can publish without review

```javascript
// BAD: Direct publish without review
async function publishContent(contentId) {
  await Content.update(contentId, { status: 'published' });
  // Content goes live immediately - no quality control!
}

// GOOD: Require review before publish
async function submitForReview(contentId) {
  const content = await Content.findById(contentId);
  await ReviewRequest.create({
    contentId,
    authorId: content.authorId,
    status: 'pending'
  });
  await Content.update(contentId, { status: 'pending_review' });
}
```

### Broken Content Links

**Problem:** Changing URLs without redirects

```javascript
// BAD: Changing slug breaks existing links
await Content.update(contentId, { slug: 'new-slug' });
// All old links now 404!

// GOOD: Create redirects and update canonical
const oldSlug = content.slug;
await Content.update(contentId, { slug: 'new-slug' });
await Redirect.create({ from: oldSlug, to: 'new-slug', permanent: true });
// Update canonical URL for SEO
```

### No Cache Invalidation

**Problem:** Published changes not visible

```javascript
// BAD: No cache invalidation after publish
await Content.update(contentId, { status: 'published' });
// Users still see cached old version!

// GOOD: Invalidate cache on publish
await Content.update(contentId, { status: 'published' });
await cache.del(`content:${contentId}`);
await cache.del(`content:slug:${content.slug}`);
// Invalidate CDN cache
await cdn.invalidate(`/content/${content.slug}`);
```
</anti_patterns_detail>

<scaling_notes_detail>
### High-Traffic CMS Scaling

1. **Static Page Generation**
   ```javascript
   // Generate static HTML for published content
   async function generateStaticPage(content) {
     const html = await renderTemplate(content);
     await s3.put(`static/${content.slug}.html`, html, {
       ContentType: 'text/html',
       CacheControl: 'public, max-age=3600'
     });
   }

   // Serve from CDN
   // https://cdn.example.com/static/article-slug.html
   ```

2. **Cache Warming**
   ```javascript
   // Pre-cache popular content
   async function warmCache() {
     const popularContent = await Content.getPopular(100);
     for (const content of popularContent) {
       const rendered = await renderContent(content);
       await redis.setex(`content:${content.id}`, 3600, rendered);
     }
   }

   // Run on schedule or after publish
   cron.schedule('*/15 * * * *', warmCache);
   ```

3. **Async Publishing Pipeline**
   ```javascript
   // Queue-based publishing
   const publishQueue = new Queue('publish');

   publishQueue.process(async (job) => {
     const { contentId } = job.data;
     await generateStaticPage(contentId);
     await invalidateCache(contentId);
     await postToSocial(contentId);
     await notifySubscribers(contentId);
   });

   // Trigger async publish
   publishQueue.add({ contentId });
   ```
</scaling_notes_detail>
