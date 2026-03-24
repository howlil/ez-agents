---
name: social_media_platform_v1
description: Social media platform architecture with feeds, connections, content sharing, and engagement tracking
version: 1.0.0
tags: [social-media, feed, connections, content-sharing, engagement]
category: domain
triggers:
  keywords: [social media, feed, timeline, connections, followers, posts, engagement]
  projectArchetypes: [social-network, community-platform, content-sharing]
prerequisites:
  - database_design_basics
  - real_time_systems_basics
  - content_moderation_basics
workflow:
  setup:
    - Design user graph
    - Create content model
    - Setup feed algorithm
    - Configure moderation
  build:
    - User profiles
    - Content creation
    - Feed generation
    - Engagement features
  scale:
    - Feed caching
    - Content delivery
    - Real-time updates
best_practices:
  - Use graph database for connections
  - Implement feed ranking algorithm
  - Cache feeds aggressively
  - Use CDN for media content
  - Implement content moderation
  - Add reporting mechanisms
  - Enable notifications
  - Track engagement metrics
  - Implement rate limiting
  - Design for viral growth
anti_patterns:
  - Never show unmoderated content publicly
  - Don't build feed without caching
  - Avoid N+1 queries for feeds
  - Don't ignore spam prevention
  - Never skip content policies
  - Don't make feed algorithm too complex initially
  - Avoid tight coupling between features
  - Don't ignore mobile experience
scaling_notes: |
  Social Media Scaling:
  - Start with simple chronological feed
  - Add ranking algorithm later
  - Use Redis for feed caching
  - Implement fan-out on write
when_not_to_use: |
  Not for: Simple blogs, content sites without user connections
output_template: |
  ## Social Media Architecture
  **Feed Type:** {chronological | ranked | hybrid}
  **Graph Storage:** {SQL, Neo4j, custom}
  **Real-time:** {WebSocket, polling}
dependencies:
  - database: "PostgreSQL + Redis"
  - graph: "Neo4j or custom"
  - cdn: "For media delivery"
---

<role>
Social Platform Architect specializing in feeds, engagement, and viral growth.
Focus on user experience, content discovery, and community building.
</role>

<workflow>
## Social Media Implementation

### Phase 1: Core (Week 1-3)
1. User System
   - Profiles
   - Connections (follow/friend)
   - Privacy settings

2. Content
   - Post creation
   - Media uploads
   - Comments

### Phase 2: Feed (Week 4-6)
3. Feed Generation
   - Chronological feed
   - Follow graph
   - Caching strategy

4. Engagement
   - Likes/reactions
   - Shares
   - Notifications

### Phase 3: Growth (Week 7-8)
5. Discovery
   - Recommendations
   - Trending content
   - Search

6. Moderation
   - Content review
   - User reporting
   - Automated filtering
</workflow>
