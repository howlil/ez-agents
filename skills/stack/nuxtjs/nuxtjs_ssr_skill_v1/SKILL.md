---
name: nuxtjs_ssr_skill_v1
description: Nuxt.js 3 server-side rendering, static site generation, and full-stack Vue.js application patterns with App Router and Nitro server
version: 1.0.0
tags: [nuxt, vue, ssr, ssg, fullstack, javascript, typescript]
stack: javascript/nuxt-3
category: stack
triggers:
  keywords: [nuxt, nuxtjs, vue ssr, static site, nitro server, vue fullstack]
  filePatterns: [nuxt.config.ts, app.vue, pages/, server/]
  commands: [nuxt dev, nuxt build, nuxt generate, nuxt preview]
  stack: javascript/nuxt-3
  projectArchetypes: [ecommerce, content-platform, saas, blog]
  modes: [greenfield, migration, ssg]
prerequisites:
  - node_18_runtime
  - vue_3_fundamentals
  - typescript_basics
recommended_structure:
  directories:
    - components/
    - composables/
    - layouts/
    - pages/
    - server/api/
    - server/middleware/
    - stores/
    - types/
    - public/
workflow:
  setup:
    - npx nuxi init my-app
    - cd my-app
    - npm install
    - npm run dev
  develop:
    - Create pages in pages/
    - Add components
    - Use composables for logic
    - Create API routes in server/api/
  deploy:
    - npm run build (SSR)
    - npm run generate (SSG)
    - Deploy to Vercel, Netlify, or Node server
best_practices:
  - Use auto-imports for components and composables
  - Follow file-based routing convention
  - Use useFetch/useAsyncData for data fetching
  - Implement proper SEO with useHead
  - Use Nitro server for API routes
  - Enable TypeScript strict mode
  - Use Pinia for state management
  - Implement proper error handling with showError
  - Optimize images with Nuxt Image module
  - Use hybrid rendering (SSR + SSG) strategically
anti_patterns:
  - Avoid direct DOM manipulation (use Vue reactivity)
  - Don't skip key props in v-for loops
  - Never store sensitive data in client-side state
  - Avoid large bundle sizes (lazy load components)
  - Don't ignore Nuxt lifecycle hooks
  - Avoid mixing SSR and client-only code improperly
  - Don't skip error boundaries
  - Never commit .env without .env.example
  - Avoid unnecessary server-side rendering for static content
  - Don't ignore Core Web Vitals optimization
scaling_notes: |
  For large-scale Nuxt.js applications:

  **Rendering Strategies:**
  - Use SSG for marketing/content pages
  - Use SSR for dynamic user-specific content
  - Use ISR (Incremental Static Regeneration) for frequently updated content
  - Use client-side rendering for dashboards

  **Performance:**
  - Enable lazy hydration for heavy components
  - Use route-based code splitting
  - Optimize images with nuxt-image
  - Implement proper caching strategies
  - Use edge functions for global distribution

  **State Management:**
  - Use Pinia for client state
  - Use server-side caching for shared data
  - Implement proper cache invalidation
  - Use Redis for cross-instance state

  **Deployment:**
  - Use Nitro preset for target platform
  - Enable compression and minification
  - Use CDN for static assets
  - Implement proper health checks

when_not_to_use: |
  Nuxt.js may not be the best choice for:

  **Simple Static Sites:**
  - Use Astro or Hugo for content-only sites
  - Nuxt adds unnecessary complexity

  **Highly Interactive Dashboards:**
  - Consider client-side only Vue/React
  - SSR overhead not needed for authenticated apps

  **API-Only Backends:**
  - Use dedicated backend (Express, FastAPI, Go)
  - Nuxt server routes are limited

  **Mobile Apps:**
  - Use Nuxt with Capacitor or consider native
  - React Native or Flutter for better mobile UX

output_template: |
  ## Nuxt.js Architecture Decision

  **Version:** Nuxt 3.x
  **Rendering:** Hybrid (SSR + SSG)
  **State:** Pinia
  **Deployment:** Vercel/Node.js

  ### Key Decisions
  - **Routing:** File-based with pages/
  - **Data Fetching:** useFetch/useAsyncData
  - **Styling:** Tailwind CSS / UnoCSS
  - **API:** Nitro server routes

  ### Trade-offs Considered
  - SSR vs SSG: Hybrid approach based on page type
  - Pinia vs Vuex: Pinia for better TypeScript support
  - Vercel vs Self-hosted: Vercel for simplicity

  ### Next Steps
  1. Initialize Nuxt project
  2. Configure rendering strategies
  3. Set up Pinia stores
  4. Implement layouts and components
  5. Configure deployment
dependencies:
  node: ">=18"
  nuxt: "^3.10"
  packages:
    - pinia: ^2.1 (state management)
    - @nuxtjs/tailwindcss: ^6.0 (Tailwind integration)
    - @nuxt/image: ^1.0 (image optimization)
    - @nuxtjs/seo: ^5.0 (SEO optimization)
    - nuxt-icon: ^0.6 (icon component)
---

<role>
You are a Nuxt.js specialist with deep expertise in Vue.js 3, server-side rendering, static site generation, and full-stack application architecture. You provide structured guidance on building modern Nuxt applications following best practices.
</role>

<execution_flow>
1. **Project Setup**
   - Initialize Nuxt 3 project
   - Configure TypeScript and ESLint
   - Set up Tailwind CSS or chosen styling
   - Configure environment variables

2. **Architecture Design**
   - Plan page structure and routing
   - Design component hierarchy
   - Plan state management (Pinia)
   - Configure rendering strategies per page

3. **Development**
   - Create layouts and pages
   - Build reusable components
   - Implement composables for logic
   - Create API routes with Nitro

4. **Optimization**
   - Configure SEO with useHead
   - Optimize images and assets
   - Implement lazy loading
   - Set up proper caching

5. **Testing**
   - Unit tests with Vitest
   - Component tests with Vue Test Utils
   - E2E tests with Playwright/Cypress

6. **Deployment**
   - Build for production
   - Configure hosting platform
   - Set up CI/CD pipeline
   - Monitor performance
</execution_flow>

<nuxt_config_example>
**Nuxt Configuration (nuxt.config.ts):**

```typescript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // App configuration
  app: {
    head: {
      title: 'My Nuxt App',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'My amazing Nuxt application' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/image',
    '@pinia/nuxt',
    '@nuxtjs/seo'
  ],

  // Nitro server configuration
  nitro: {
    compressPublicAssets: true,
    routeRules: {
      // Static pages (SSG)
      '/': { prerender: true },
      '/about': { prerender: true },
      '/blog/**': { prerender: true },
      
      // Dynamic pages (SSR)
      '/dashboard/**': { ssr: true },
      '/profile/**': { ssr: true },
      
      // API routes
      '/api/**': { cors: true }
    },
    storage: {
      // Redis for caching
      redis: {
        driver: 'redis',
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    }
  },

  // Runtime config (accessible at runtime)
  runtimeConfig: {
    apiSecret: process.env.API_SECRET,
    public: {
      apiBase: process.env.API_BASE_URL
    }
  },

  // Vite configuration
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'pinia'],
            utils: ['lodash-es']
          }
        }
      }
    }
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true
  },

  // Devtools
  devtools: { enabled: true },

  // Compatibility date for Nitro
  compatibilityDate: '2024-01-01'
});
```
</nuxt_config_example>

<page_example>
**Nuxt Page with Data Fetching (pages/products/[id].vue):**

```vue
<script setup lang="ts">
// SEO
useHead({
  title: () => `${product.value?.name} - My Store`,
  meta: [
    { name: 'description', content: () => product.value?.description }
  ]
});

// Route params
const route = useRoute();
const productId = route.params.id as string;

// Data fetching with SSR support
const { data: product, pending, error, refresh } = await useFetch(
  `/api/products/${productId}`,
  {
    key: `product-${productId}`,
    lazy: false,  // Fetch during SSR
    server: true, // Fetch on server
    getCachedData: (key) => useNuxtData(key).data.value
  }
);

// Handle errors
if (error.value) {
  throw createError({
    statusCode: 404,
    message: 'Product not found'
  });
}

// Cart store
const cart = useCartStore();
const addToCart = () => {
  cart.addItem(product.value!, 1);
};

// Breadcrumb
defineBreadcrumbs([
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: product.value?.name }
]);
</script>

<template>
  <div v-if="pending" class="loading">
    Loading...
  </div>
  
  <div v-else-if="product" class="product-page">
    <NuxtLayout name="default">
      <ProductGallery :images="product.images" />
      
      <ProductInfo 
        :name="product.name"
        :price="product.price"
        :description="product.description"
        @add-to-cart="addToCart"
      />
      
      <ProductReviews :product-id="product.id" />
      
      <RelatedProducts :category="product.category" />
    </NuxtLayout>
  </div>
  
  <div v-else>
    Product not found
  </div>
</template>
```
</page_example>

<composable_example>
**Custom Composable (composables/useProducts.ts):**

```typescript
// composable for product-related logic
export function useProducts() {
  const config = useRuntimeConfig();
  
  // Fetch all products with pagination
  const fetchProducts = async (params: {
    page: number;
    limit: number;
    category?: string;
  }) => {
    return await useFetch('/api/products', {
      query: params,
      key: `products-${JSON.stringify(params)}`
    });
  };
  
  // Fetch single product
  const fetchProduct = async (id: string) => {
    return await useFetch(`/api/products/${id}`, {
      key: `product-${id}`
    });
  };
  
  // Create product (admin)
  const createProduct = async (data: CreateProductInput) => {
    return await $fetch('/api/products', {
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  };
  
  // Update product
  const updateProduct = async (id: string, data: UpdateProductInput) => {
    return await $fetch(`/api/products/${id}`, {
      method: 'PUT',
      body: data
    });
  };
  
  // Delete product
  const deleteProduct = async (id: string) => {
    return await $fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
  };
  
  // Search products
  const searchProducts = async (query: string) => {
    return await useFetch('/api/products/search', {
      query: { q: query },
      key: `products-search-${query}`
    });
  };
  
  return {
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts
  };
}

// composable for cart
export function useCartStore() {
  return useState('cart', () => ({
    items: [] as CartItem[],
    
    addItem(product: Product, quantity: number) {
      const existing = this.items.find(i => i.product.id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        this.items.push({ product, quantity });
      }
    },
    
    removeItem(productId: string) {
      this.items = this.items.filter(i => i.product.id !== productId);
    },
    
    updateQuantity(productId: string, quantity: number) {
      const item = this.items.find(i => i.product.id === productId);
      if (item) {
        item.quantity = quantity;
      }
    },
    
    get total() {
      return this.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
    },
    
    clear() {
      this.items = [];
    }
  }));
}
```
</composable_example>

<api_route_example>
**Nitro Server Routes (server/api/):**

```typescript
// server/api/products/index.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  
  // Connect to database
  const db = useDatabase();
  
  // Fetch products with pagination
  const products = await db
    .selectFrom('products')
    .selectAll()
    .limit(limit)
    .offset((page - 1) * limit)
    .execute();
  
  // Get total count
  const total = await db
    .selectFrom('products')
    .select((eb) => eb.fn.count('id').as('count'))
    .executeTakeFirst();
  
  return {
    products,
    pagination: {
      page,
      limit,
      total: Number(total?.count || 0),
      totalPages: Math.ceil((total?.count || 0) / limit)
    }
  };
});

// server/api/products/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Product ID required'
    });
  }
  
  const db = useDatabase();
  
  const product = await db
    .selectFrom('products')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
  
  if (!product) {
    throw createError({
      statusCode: 404,
      message: 'Product not found'
    });
  }
  
  return product;
});

// server/api/products/index.post.ts
export default defineEventHandler(async (event) => {
  // Only allow POST
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method not allowed'
    });
  }
  
  // Parse body
  const body = await readBody(event);
  
  // Validate input
  const { error, data } = validateProductInput(body);
  if (error) {
    throw createError({
      statusCode: 400,
      message: error
    });
  }
  
  // Check authentication
  const user = await requireAuth(event);
  if (!user.isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'Unauthorized'
    });
  }
  
  // Create product
  const db = useDatabase();
  const result = await db
    .insertInto('products')
    .values(data)
    .executeTakeFirst();
  
  setResponseStatus(event, 201);
  return { id: result.insertId, ...data };
});

// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  // Skip auth for public routes
  if (event.path.startsWith('/api/public')) {
    return;
  }
  
  const authHeader = getHeader(event, 'authorization');
  
  if (!authHeader) {
    throw createError({
      statusCode: 401,
      message: 'Missing authorization header'
    });
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const user = await verifyToken(token);
    event.context.user = user;
  } catch {
    throw createError({
      statusCode: 401,
      message: 'Invalid token'
    });
  }
});
```
</api_route_example>
