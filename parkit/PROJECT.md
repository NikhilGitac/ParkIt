# ParKit — Product & Design Specification

## Overview
ParKit is a next-generation urban parking reservation and peer-to-peer driveway sharing platform. It eliminates circling for spots, saves time for drivers, and empowers property owners to monetize unused parking spaces.

---

## Brand & Design System

### Color Palette
- **Primary Navy**: `#0B1F3A` — Core brand color for text, headers, primary buttons, and dark accents.
- **Secondary / Action Green**: `#2FD08A` — High-visibility CTA, success states, and driver actions ("Find parking").
- **Accent / Warm Amber**: `#FFC93C` — Host accents, monetization highlights, and space owner actions ("List your space").
- **Background**: `#FFFFFF` / `#F8FAFC` (Subtle off-white background).
- **Muted / Slate**: `#64748B` / `#F0F4F8` for borders and secondary elements.

### Typography
- **Font Family**: `DM Sans` (Google Font), loaded with `next/font/google`.
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold), 800 (Extra-bold).

### Geometry & Cards
- **Card Radius**: `16px` (`rounded-[16px]` or `rounded-2xl`).
- **Card Shadow**: Soft, multi-layered shadows (`shadow-soft`: `0 4px 20px -2px rgba(11, 31, 58, 0.06), 0 2px 6px -1px rgba(11, 31, 58, 0.04)`).

---

## Route Architecture
1. `/` — Landing page with ParKit branding, dual primary CTAs ("Find parking", "List your space"), features, metrics, and responsive navigation.
2. `/driver` — Driver portal placeholder for discovering and filtering parking spots.
3. `/owner` — Space owner portal placeholder with earnings estimator and listing wizard preview.
4. `/login` — Account sign in placeholder.
5. `/signup` — Account registration placeholder with Driver vs Space Owner role selector.

---

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 & custom CSS tokens
- **UI System**: shadcn/ui + Base UI primitives
- **Backend & Database**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Mapping (Upcoming)**: Leaflet & React-Leaflet
- **QR Codes**: `qrcode`
