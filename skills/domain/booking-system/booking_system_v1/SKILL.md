---
name: Booking and Reservation System
description: Availability checking, reservation, payment, confirmation with real-time sync and overbooking prevention
version: 1.0.0
tags: [booking, reservation, scheduling, appointments]
category: domain
domain_type: booking
triggers:
  keywords: [booking, reservation, appointment, scheduling, calendar]
  projectArchetypes: [booking-system, appointment-scheduler, reservation-platform]
  constraints: [real-time-availability, payment-required, calendar-integration]
prerequisites:
  - calendar_management_basics
  - payment_processing_basics
  - notification_service_basics
key_workflows:
  - name: Availability Checking
    steps:
      - Query available slots for requested date and resource
      - Check resource conflicts and double-booking
      - Apply business rules (working hours, buffer times)
      - Return available time slots to user
      - Hold slot temporarily during booking process (soft lock)
    entities: [TimeSlot, Resource, BusinessRule, SlotHold, Buffer]
  - name: Reservation
    steps:
      - Select available time slot
      - Enter customer details and contact information
      - Add special requests or notes
      - Confirm reservation with payment (if required)
      - Generate confirmation reference number
    entities: [Reservation, Customer, SpecialRequest, Confirmation, Reference]
  - name: Payment
    steps:
      - Calculate total based on service and duration
      - Apply deposits or prepayment requirements
      - Process payment (card, bank transfer, wallet)
      - Generate invoice or receipt
      - Record transaction and update booking status
    entities: [Payment, Invoice, Deposit, Transaction, Receipt]
  - name: Confirmation and Reminders
    steps:
      - Send confirmation email with booking details
      - Send calendar invite (ICS attachment)
      - Send reminder notification 24h before
      - Handle cancellations and process refunds
      - Send post-service follow-up or review request
    entities: [Email, CalendarInvite, Cancellation, Refund, FollowUp]
compliance_requirements:
  - Real-time availability to prevent overbooking
  - Payment card data compliance (PCI-DSS)
  - GDPR for customer data storage and deletion
  - Cancellation policy enforcement and disclosure
  - Refund processing according to policy
data_model_patterns:
  - Time slot management with configurable buffer times
  - Waitlist handling for fully booked periods
  - Recurring bookings (weekly, monthly patterns)
  - Resource grouping (rooms, staff, equipment)
  - Multi-location support with per-location availability
integration_points:
  - Payment gateways (Stripe, PayPal, Square)
  - Calendar services (Google Calendar, Outlook, Apple Calendar)
  - Email/SMS notification services (SendGrid, Twilio)
  - Video conferencing (Zoom, Teams for virtual appointments)
  - CRM systems for customer history
scaling_considerations: Real-time slot locking to prevent race conditions during concurrent bookings, cache invalidation on booking confirmation, notification queue for emails and SMS, read replicas for availability queries
when_not_to_use: Drop-in services without appointments, complex multi-day event management, resource sharing across locations with complex rules, large-scale event ticketing (different patterns)
output_template: |
  ## Booking System Decision

  **Domain:** Booking and Reservation System
  **Version:** 1.0.0

  **Resource Types:** [Rooms, Staff, Equipment, Services]
  **Payment Required:** [Prepaid, Deposit, On-site, Free]
  **Recurring Bookings:** [Yes/No]
  **Calendar Integration:** [Google, Outlook, Apple, None]

  **Key Workflows:**
  - Availability: [Real-time, Scheduled refresh]
  - Booking: [Self-service, Staff-assisted]
  - Payment: [Provider]
  - Reminders: [Email, SMS, Push]

  **Integration Points:**
  - Payment: [Provider]
  - Calendar: [Provider]
  - Notifications: [Provider]
dependencies:
  - calendar_management_basics
  - payment_processing_basics
  - notification_service_basics
---

<role>
You are an expert in booking and reservation systems with deep experience in real-time availability management, payment processing, and calendar integration.
You help teams build reliable booking systems that prevent overbooking, handle concurrent requests, and provide a seamless reservation experience.
</role>

<execution_flow>
## Step 1: Requirements Analysis
- Define resources (rooms, staff, equipment, services)
- Determine booking rules (working hours, buffer times, max advance booking)
- Assess payment requirements (prepaid, deposit, on-site)
- Identify calendar integration needs

## Step 2: Availability Engine Design
- Model time slots with configurable duration
- Implement resource conflict checking
- Handle buffer times between appointments
- Design soft-lock mechanism for booking in progress

## Step 3: Booking Flow
- Build availability calendar UI
- Implement customer details collection
- Add special request handling
- Create confirmation number generation

## Step 4: Payment Integration
- Integrate payment gateway
- Handle deposit vs. full payment flows
- Implement refund workflows
- Generate receipts and invoices

## Step 5: Notifications
- Confirmation email with booking details
- Calendar invites (ICS format)
- Reminder notifications (24h, 1h before)
- Cancellation and modification emails

## Step 6: Admin Management
- Staff schedule management
- Booking dashboard and calendar view
- Override and manual booking capability
- Reporting and analytics
</execution_flow>

<best_practices_detail>
### Preventing Double-Booking (Race Condition)

```
Challenge: Two users book the same slot simultaneously

Solution 1: Optimistic Locking
- Add version column to time slots
- Check version on update, fail if changed
- Return error to second user (retry from step 1)

Solution 2: Soft Lock with TTL
- When user starts booking, lock slot for 10 minutes
- Release lock if payment not completed in time
- Second user sees slot as "pending" during lock

Solution 3: Database Row Locking (SELECT FOR UPDATE)
- Lock slot row during transaction
- Prevents concurrent writes
- Slightly slower but guaranteed consistency
```

### Time Slot Data Model

```
Resource (room, staff, equipment)
  ├── id
  ├── name
  ├── type
  └── location_id

WorkingHours
  ├── resource_id
  ├── day_of_week
  ├── start_time
  └── end_time

Booking
  ├── id
  ├── resource_id
  ├── customer_id
  ├── start_datetime
  ├── end_datetime
  ├── status (pending, confirmed, cancelled)
  ├── payment_status
  └── reference_number
```

### Cancellation and Refund Policy

```
Policy Definition:
- Cancel 48h+ before → Full refund
- Cancel 24-48h before → 50% refund
- Cancel < 24h before → No refund
- No-show → No refund

Implementation:
- Store policy at booking creation time
- Calculate refund amount on cancellation request
- Process refund via original payment method
- Send cancellation confirmation with refund details
```
</best_practices_detail>

<anti_patterns_detail>
### No Slot Locking

**Problem:** Double-booking occurs when two users book simultaneously.

```
BAD: No concurrency protection
- User A sees slot as available
- User B sees slot as available
- Both confirm booking
- Both receive confirmations
- First to process "wins", second gets error email

GOOD: Soft lock with TTL
- User A starts booking → slot locked for 10 minutes
- User B sees slot as "pending" (not available)
- If User A completes → confirmed
- If User A abandons → lock expires, slot becomes available
```

### Storing Past Availability Checks

**Problem:** Availability query results cached too long, leading to overbooking.

```
BAD: Cache availability for 30 minutes
- Slot shown as available to 100 users
- 10 users start booking process
- 8 users get errors after payment

GOOD: Short-lived cache (30 seconds) or no cache for availability
- Real-time availability checks
- Use soft locks during active booking
- Accept higher DB load for booking accuracy
```
</anti_patterns_detail>
