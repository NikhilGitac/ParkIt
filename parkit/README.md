<div align="center">

# 🚗 ParKit
### Smart Urban Parking & Private Driveway Monetization Platform
*Zero circling. Guaranteed bays. Instant UPI payments. Contactless QR & OTP gate access.*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Realtime-emerald?logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-AI%20Concierge-blue?logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

[**Live Demo**](http://localhost:3000) • [**Driver Map**](http://localhost:3000/driver) • [**AI Concierge**](http://localhost:3000/driver/assistant) • [**Host Dashboard**](http://localhost:3000/owner/dashboard)

</div>

---

## 🌟 Overview

**ParKit** is an end-to-end urban mobility platform that solves urban parking congestion in cities like Greater Noida & Delhi NCR. Drivers reserve guaranteed private parking spaces in seconds, while property owners monetize idle driveways, carports, and commercial bays.

---

## 🚀 Key Hackathon Highlights

### 1. 🗺️ Uber-Inspired Mobile Driver Map (`/driver`)
- Full-screen **OpenStreetMap Leaflet** integration with custom dynamic pins and live pricing.
- Browser geolocation with automatic fallback to city center (*Pari Chowk, Greater Noida*).
- Draggable Airbnb-style bottom sheet with distance, verified host badges, operating hours, and photo galleries.
- Instant filters: Max Price, Distance Radius, Available Now, and Minimum Rating.

### 2. 🤖 Gemini AI Parking Concierge (`/driver/assistant`)
- Natural-language conversational search powered by **Google Gemini AI**.
- Handles queries such as: *"Find parking under ₹50 near MG Road for 2 hours"*.
- Strictly grounded in real Supabase parking context — **never hallucinates fake spaces**.
- Directly embeds interactive, bookable parking space cards beneath assistant answers.
- Graceful deterministic fallback if Gemini API is offline or rate-limited.

### 3. 🎯 AI Transparent Scoring & Recommendations (`/api/recommend`)
- Multi-factor algorithmic ranking:
  $$\text{Score} = \text{Distance (0--40)} + \text{Price (0--35)} + \text{Availability (0--25)} + \text{Rating Bonus (0--5)}$$
- Automatically labels top choice with yellow **“Best match”** badge.
- Generates factual natural-language summary: *“Best match: 350m away, ₹40/hr, available for your full time slot.”*

### 4. 🛡️ Overlap Prevention & Atomic Booking Locks (`/api/create_booking`)
- Database-level time-window conflict validation.
- Prevents double-booking across concurrent drivers on pending, confirmed, or checked-in sessions.

### 5. 💳 Demo-Safe Mock UPI Sandbox (`/driver/checkout/[bookingId]`)
- Realistic, clearly labeled **Hackathon Sandbox Mode**.
- Simulated apps: **Google Pay**, **PhonePe**, **Paytm UPI**, **BHIM VPA**, and dynamic **UPI QR**.
- Absolutely zero real financial credentials requested or stored.

### 6. 📱 Encrypted QR Pass & 6-Digit Gate OTP
- Instantly generates base64 QR code via the `qrcode` library.
- QR links directly to the owner verification portal: `/verify/[bookingId]`.
- Prominent 6-digit monospace OTP with 1-click copy for manual gate entry.

### 7. 🚪 Space Owner Gate Verification Portal (`/verify/[bookingId]`)
- Purpose-built for security guards and parking space hosts.
- Displays full booking overview, vehicle timing, and driver info.
- 5 visible lifecycle states: `pending_payment` ➔ `confirmed` ➔ `checked_in` ➔ `completed` ➔ `cancelled`.
- Interactive OTP keypad with **“Auto-Fill OTP”** button for rapid judge evaluation.

### 8. 🏡 Airbnb-Inspired Host Dashboard (`/owner/dashboard`)
- Welcome header with verified host profile.
- 4 real-time summary cards: **Total Earnings**, **Upcoming Bookings**, **Active Listings**, and **Pending Check-ins**.
- Interactive **Active / Paused toggle** on every listing with instant database updates.
- **Edit Space Modal** to adjust titles, hourly rates, and descriptions on the fly.
- **Supabase Realtime WebSockets** (`postgres_changes` on `bookings` table): new bookings stream in live without page reloads.
- Built-in **“Simulate Realtime Booking”** button for live demo presentations.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.4.3 (App Router, Turbopack, Partial Prerendering) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Styling** | Tailwind CSS v4, Lucide React Icons |
| **Database & Auth** | Supabase (PostgreSQL 15, Row Level Security, Realtime Channels) |
| **AI / LLM** | Google Gemini API (`gemini-2.5-flash`, `gemma-4-26b-a4b-it`) |
| **Maps** | Leaflet 1.9 & React-Leaflet with OpenStreetMap Tiles |
| **QR Code** | `qrcode` (Base64 PNG Data URL generator) |

---

## ⚡ Quick Start & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/NikhilGitac/ParkIt.git
cd ParkIt
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` in the `parkit/` folder to `.env.local`:
```bash
cp parkit/.env.example parkit/.env.local
```

Edit `parkit/.env.local`:
```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key

# Google Gemini API Key (Optional, for AI Assistant & Explanations)
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Supabase Database Setup & Reseeding

### Automatic Reset and Reseed
To populate 18 realistic parking spaces, 5 demo owners, 6 demo drivers, verified reviews, and bookings around Greater Noida:

1. Open your **Supabase Dashboard** ➔ **SQL Editor**.
2. Copy and execute [`supabase/reset_and_reseed.sql`](supabase/reset_and_reseed.sql).
3. The script is deterministic and safe:
   - Uses UUID prefixes:
     - Owners: `a0000000-*`
     - Drivers: `d0000000-*`
     - Spaces: `b0000000-*`
     - Slots: `c0000000-*`
     - Bookings: `e0000000-*`
     - Reviews: `f0000000-*`
   - Does **not** affect any real user accounts or external tables.

---

## 👥 Demo Accounts

Password for all demo accounts: `DemoPassword123!`

| Role | Name | Email | Sample Space Owned |
|---|---|---|---|
| **Owner** | Rajesh Sharma | `demo.owner.rajesh@parkit.internal` | Pari Chowk Metro Plaza Bay (₹45/hr) |
| **Owner** | Sunita Verma | `demo.owner.sunita@parkit.internal` | India Expo Mart Visitor Bay (₹60/hr) |
| **Owner** | Amit Goel | `demo.owner.amit@parkit.internal` | Knowledge Park III Driveway (₹30/hr) |
| **Owner** | Priya Bhasin | `demo.owner.priya@parkit.internal` | Alpha 1 Commercial Bay (₹35/hr) |
| **Owner** | Pradeep Chaudhary | `demo.owner.pradeep@parkit.internal` | Beta 1 Jagat Farm Market Corner (₹40/hr) |
| **Driver** | Rohan Malhotra | `demo.driver.rohan@parkit.internal` | Driver Account |
| **Driver** | Neha Gupta | `demo.driver.neha@parkit.internal` | Driver Account |

> **Note for Judges**: You can explore the full driver and owner experience immediately in Preview Mode without logging in.

---

## 🎬 2-Minute Live Pitch / Hackathon Demo Script

Follow this script to demonstrate the complete two-sided marketplace in under 120 seconds:

```
00:00 - 00:20 | LANDING PAGE & PROBLEM
1. Open http://localhost:3000/
2. Highlight problem: 30% of urban traffic is drivers searching for parking.
3. Scroll to "How ParKit Works" showing parallel Driver & Host workflows.

00:20 - 00:45 | DRIVER SEARCH & AI CONCIERGE
1. Click "Find parking" -> Lands on /driver.
2. Show Leaflet map pins, filters, and yellow "Best match" recommendation banner.
3. Click "AI Concierge" -> Ask: "Find parking under ₹50 for 2 hours".
4. Show Gemini response and the suggested bookable cards beneath it.

00:45 - 01:15 | BOOKING & MOCK UPI SANDBOX
1. Click "Book Now" on Pari Chowk Metro Plaza Covered Bay.
2. Review time slot selector, live pricing (₹45/hr), and click "Reserve Spot & Continue".
3. Show overlap lock validation.
4. Click "Pay with UPI" -> Opens clearly labeled Hackathon Demo Sandbox.
5. Click "Simulate Success" -> Instantly generates scannable QR Code and 6-Digit Gate OTP (e.g. 276989).

01:15 - 01:40 | HOST GATE VERIFICATION
1. Click "Open Owner Verify Portal (/verify/[bookingId])".
2. Show the space owner's gate screen.
3. Click "Auto-Fill OTP" -> Click "Verify OTP & Authorize Gate".
4. Status transitions live from "Confirmed" to "Checked In (Gate Barrier Opened)".

01:40 - 02:00 | REALTIME HOST DASHBOARD
1. Open http://localhost:3000/owner/dashboard.
2. Show summary cards (Earnings ₹14,250, Active Listings, Pending Check-ins).
3. Toggle a space switch to "Paused" and back to "Active".
4. Click "Simulate Realtime Booking" -> Watch earnings increase and a new booking appear live via Supabase Realtime!
```

---

## 🚀 Vercel Deployment Guide

### Deploying to Vercel

1. Import your GitHub repository into [Vercel](https://vercel.com/new).
2. Set the **Root Directory** to `parkit` (or keep root if utilizing root npm workspace scripts).
3. Configure the following **Environment Variables** in Vercel:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Your Supabase project URL (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anonymous public API key |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Yes** | Alias for Supabase anon key |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for AI Concierge |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Optional | Razorpay test key (defaults to demo UPI sandbox) |

4. Click **Deploy**. Next.js 16 build will complete in ~30 seconds.

---

## 🔒 Security Audit & Responsible Disclosure

- **Zero Hardcoded Secrets**: All API keys, database tokens, and credentials are read strictly through `process.env`.
- **Public vs Private Keys**: Only `NEXT_PUBLIC_*` variables are bundled to the browser; `GEMINI_API_KEY` and database roles remain on the server.
- **Hackathon Safe Payments**: The mock payment sandbox does not collect card numbers, CVVs, or real UPI credentials.
- **Deterministic Demo Data**: Reseeding scripts are strictly bounded to demo IDs and will never drop production data.

---

<div align="center">
Built with ❤️ for the Hackathon by NikhilGitac • Greater Noida, Uttar Pradesh, India
</div>
