Software Requirements Specification (SRS)

Project: Wedding Hall Calendar & Calculator

Version: 2.3
Status: Draft

1. Introduction

1.1 Purpose
To develop a high-fidelity, tablet-first web application for a wedding hall company. The system acts as a Sales Enablement & Display Tool, allowing potential clients to visualize availability and estimate costs in a self-service manner.

1.2 Scope

System Type: Web Application (PWA-ready for Tablets).

Billing: Excluded. This system does not process payments, generate invoices, or track accounts receivable. It is a "Display Layer" only.

Key Feature: "Liquid Glass" UI, privacy-first calendar, ephemeral price calculation.

2. User Roles & Hierarchy

Role

Access Level

Responsibilities

Super Admin (CEO)

Global

Create Halls, Assign Managers, Create Global Service Catalog, View All Calendars.

Hall Admin

Local (Single Hall)

Manage Calendar (Book dates), Manage Local Service Pricing, Configure Default Day Pricing.

Client (Public/Tablet)

Read-Only*

View Calendar, Click Days, Select Services to Calculate Total. (*Read + Local Calculator Interaction).

3. Functional Requirements

3.1 Business Rules & Definitions (CRITICAL)

3.1.1 The Booking Unit (Time):

Unit of Measure: The smallest and only unit of booking is One Full Day (24 Hours).

Exclusivity: A day can have only one status (Available, Booked, Maintenance). The system DOES NOT support hourly slots, partial days, or multiple events on the same day.

Multi-Day Events: A multi-day event (e.g., Setup on Friday, Wedding on Saturday) is treated as two distinct, consecutive "Booked" records. There is no logical linking of days in the database.

3.1.2 The Role of Price:

Nature of Price: All prices displayed on the Tablet (Base Rental + Services) are Non-Binding Estimates.

Source of Truth: The external billing system (managed offline by Admins) is the financial Source of Truth.

Discrepancy Handling: If the Tablet Calculator shows $5,000 but the External System requires $5,500 (due to complex taxes or unlisted fees), the External System prevails. The Tablet UI serves only to capture lead interest.

3.1.3 Currency & Localization:

Single Currency: The system operates in a Single Local Currency defined at deployment (e.g., SAR, USD, or EUR). It does NOT support multi-currency switching or dynamic exchange rates.

Formatting: Monetary values must be formatted according to the local standard (e.g., "5,000 SAR" or "$5,000.00") with appropriate thousands separators.

Language: The interface (Tablet View) supports a Single Language (defaulting to English or Arabic based on initial setup). Dynamic language toggling is out of scope for Version 1.0.

3.1.4 Booking Window & Visibility:

Client/Public Limit: The Tablet interface restricts navigation to a Rolling 12-Month Window starting from the current date. Clients cannot view availability or pricing for dates beyond Current Date + 365 Days.

Admin Visibility: Admins are exempt from this limit and may view or book dates indefinitely into the future for long-term planning.

3.2 Authentication & Security

Login: Required for Super Admin and Hall Admin.

Public Access: Each Hall has a unique public URL (e.g., /hall/ballroom-a) accessible without login.

Privacy Firewall: The Public View MUST NOT receive any data regarding "Client Names," "Notes," or "Contract Details" from the server.

Implementation Note: The API must return a stripped object for booked days: { date: "2023-10-01", status: "booked" } with no other fields.

3.3 Multi-Hall Management (Super Admin)

Hall Creation: Ability to add new Halls (Name, Location).

Service Catalog (Global):

Super Admin creates a service definition (e.g., "DJ", "Valet", "Flowers").

Super Admin sets availability scope: "All Halls" OR "Specific Halls".

3.4 Service & Pricing Engine (Hybrid Logic)

3.4.1 Service Pricing (Location-Based):

Services are defined globally but priced locally.

Example: "Valet" is a Service. Hall A sets price = $200. Hall B sets price = $300.

3.4.2 Date Pricing (Templates):

System supports "Default Pricing Rules" based on Day of Week (e.g., Fridays = $5,000, Saturdays = $7,000).

Overrides: Admins can manually set a fixed price for any specific date (e.g., New Year's Eve), which overrides the template.

3.4.3 Price & Status Resolution Logic (Precedence Rules):

To determine the display state for any given date D, the system follows this strict hierarchy (1 is highest priority):

Status Check (Highest Priority):

If calendar_days record exists AND status is booked or maintenance:

Display: Label as "BOOKED" / "MAINTENANCE".

Action: HIDE Price completely. Do not calculate or fetch price.

Interaction: Disable click (or show generic tooltip).

Manual Price Override:

If calendar_days record exists AND manual_price is NOT NULL:

Display: Use manual_price.

Status: Implied Available.

Default Template Price (Lowest Priority):

If no calendar_days record exists OR manual_price is NULL:

Display: Fetch price from pricing_templates matching the Day of Week (Mon-Sun).

Status: Implied Available.

3.5 Calendar Interface (The "Liquid Glass" UI)

Visual Style: Apple-inspired design. Translucent backgrounds, blur effects (backdrop-filter), subtle shadows, rounded corners.

Day States:

Available: Shows "Starting Price" (Rental Fee). Green/Glass styling. Clickable.

Booked: Shows "BOOKED" label. Red/Matte styling. Non-clickable (or generic "Sorry" tooltip). Price is HIDDEN.

Navigation: Month-by-Month view.

3.6 The Quote Calculator (Client Interaction)

Trigger: User clicks an Available day on the tablet.

Action: A modal/popup appears ("Glass" style).

Content:

Base Price: Displays the rental fee for that specific date.

Add-ons: Checklist of available services for that Hall.

Total: Real-time sum at the bottom (Base + Selected Services).

Disclaimer: "Estimate only. Final price subject to contract."

Data Persistence & Analytics:

Lead Data: Ephemeral. No Personal Identifiable Information (PII) like names or phone numbers is requested or stored. Clicking "Close" wipes the current calculation.

Anonymous Analytics (Allowed): The system MAY log anonymous interaction events (e.g., "User viewed date 2023-12-01", "User selected 'DJ Service'") to internal logs for business intelligence (e.g., determining popular dates or services).

Concurrency Handling (Snapshot Logic):

The calculator operates on a Client-Side Snapshot.

Scenario: If an Admin changes the price of "DJ Service" while a Client has the calculator open:

The Client's active session retains the old price to prevent confusion/glitches during the calculation.

The new price is fetched only if the Client closes and re-opens the modal.

3.7 Admin Dashboard Features

Booking Management:

Admin clicks a day -> Marks as "Booked".

Input Fields: Client Name (Private), Internal Notes (Private).

No Service Selection: The Admin does not select DJ/Flowers here. They only block the date and (optionally) record the final agreed contract price for reference.

Manual Overrides: Admin can change the Base Price of any specific future date.

4. Non-Functional Requirements

Design Language: Liquid Glass. High use of backdrop-filter: blur(), bg-opacity, and white/light-grey gradients.

Tech Stack: React.js, Tailwind CSS, Supabase (Auth & DB).

Responsiveness: Optimized for Tablets (iPad/Android) in Landscape mode.

Performance: Calculator logic must be instant (client-side math).

5. Database Schema (Conceptual)

profiles: (Admins) id, role, assigned_hall_id.

halls: id, name, slug, theme_color.

services_catalog: id, name, is_global (Created by Super Admin).

hall_services: hall_id, service_id, price (Local pricing).

pricing_templates: hall_id, day_of_week (0-6), price.

calendar_days:

hall_id, date

status (enum: available, booked, maintenance)

manual_price (nullable, overrides template)

client_name (Encrypted/RLS protected)

notes (Encrypted/RLS protected)