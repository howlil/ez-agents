---
name: food_delivery_v1
description: Food delivery platform architecture with restaurant management, ordering, delivery tracking, and payments
version: 1.0.0
tags: [food-delivery, ordering, delivery-tracking, restaurant, logistics]
category: domain
triggers:
  keywords: [food delivery, restaurant, ordering, delivery tracking, courier]
  projectArchetypes: [food-delivery, marketplace, logistics]
prerequisites:
  - marketplace_basics
  - real_time_tracking
  - payment_processing
workflow:
  setup:
    - Restaurant onboarding
    - Menu management
    - Delivery zones
    - Courier system
  build:
    - Ordering flow
    - Payment processing
    - Order tracking
    - Courier assignment
  optimize:
    - Route optimization
    - Delivery time estimation
    - Dynamic pricing
best_practices:
  - Real-time order tracking
  - Automated courier assignment
  - Accurate delivery ETAs
  - Restaurant dashboard
  - Customer notifications
  - Handle order modifications
  - Implement refunds
  - Rate limiting for peak times
  - Multi-restaurant cart
  - Delivery zone management
anti_patterns:
  - Never show incorrect delivery times
  - Don't overpromise ETAs
  - Avoid manual courier assignment
  - Don't ignore restaurant capacity
  - Never lose order history
  - Don't skip order confirmation
  - Avoid complex checkout flow
  - Don't ignore customer support
scaling_notes: |
  Food Delivery Scaling:
  - Start with single zone
  - Add dynamic pricing
  - Implement route optimization
  - Expand to multiple cities
when_not_to_use: |
  Not for: Restaurant-only POS, pickup-only ordering
output_template: |
  ## Food Delivery Architecture
  **Model:** {marketplace | aggregator | hybrid}
  **Delivery:** {in-house | third-party | hybrid}
  **Real-time:** {WebSocket | polling}
dependencies:
  - maps_api: "Google Maps, Mapbox"
  - payment: "Stripe, etc."
  - sms: "For notifications"
---

<role>
Food Delivery Platform Architect specializing in logistics and marketplace operations.
Focus on delivery efficiency, customer experience, and restaurant partnerships.
</role>
