# ZipSofa - Product Requirements Document (PRD)

## 1. Executive Summary
ZipSofa is a premium, modular furniture e-commerce platform designed for modern, high-density urban living. With the core philosophy **"Zip Small. Live Big."**, the platform offers Italian-inspired modular sofas, beds, and lifestyle accessories that maximize comfort without compromising on spatial efficiency.

Founded and curated by Chief Design Officer **Elena Moretti**, ZipSofa blends minimalist aesthetics with technical engineering to redefine modular furniture.

## 2. Brand Identity & Aesthetic
- **Philosophy**: "Zip Small. Live Big." - High-end living in compact spaces.
- **Visual Style**: Minimalist, technical luxury. Deep navy, warm beiges, and slate grays.
- **Key Persona**: Elena Moretti (Founder/CDO) - The voice of authority on modular design.
- **Typography**: Inter (UI), JetBrains Mono (Technical accents), Outfit (Display).

## 3. Core Features

### 3.1. Storefront (Customer Experience)
- **High-Impact Hero Section**: Cinematic banners featuring Elena Moretti and featured collections.
- **Modular Catalog**: Dynamic category pages (Sofas, Beds, Tables, Chairs, Garden, Lighting, Accessories).
- **Product Discovery**: Technical specification displays, high-resolution imagery, and "Founder's Notes" on curated items.
- **Shopping Cart**: Real-time cart management with local/Firebase persistence.
- **Authentication**: Secure Google login for personalized experiences and order tracking.
- **Responsive Experience**: Optimized for high-end mobile devices and wide-screen desktops.

### 3.2. Admin Dashboard (Brand Management)
- **Real-Time Analytics**: Dashboard overview of revenue, active orders, and customer engagement.
- **Promotion Engine (促销图管理)**: 
  - Manage homepage hero slides and display cards.
  - Curate "The Founder's Selection" dynamically.
- **Catalog Management (上架/下架)**:
  - Add/Edit/Delete products with complex metadata (dimensions, features, images).
  - Bulk management of inventory.
- **Order Pipeline**: 
  - Centralized order fulfillment system.
  - Status tracking (Pending -> Delivered).
- **Configuration Control**: Global store settings (shipping rates, contact info, support links).

## 4. Technical Architecture

### 4.1. Frontend
- **Framework**: React 18+ with Vite for ultra-fast performance.
- **State Management**: React Context for Auth and Cart; Firestore snapshots for real-time data sync.
- **Styling**: Tailwind CSS 4.0 for utility-first responsive design.
- **Animations**: `motion/react` (Framer Motion) for sophisticated UI transitions and route changes.
- **Icons**: Lucide React.

### 4.2. Backend & Data
- **Database**: Google Cloud Firestore (NoSQL) for real-time document storage.
- **Security**: Hardened Firestore Security Rules (Identity validation, schema enforcement, path hardening).
- **Authentication**: Firebase Authentication (Google OAuth).
- **Hosting**: Deployed on modern cloud infrastructure (Cloud Run/App Engine).

## 5. Data Schema
The platform relies on five primary entities defined in `firebase-blueprint.json`:
- **Product**: Technical specs, imagery, and inventory metadata.
- **Category**: Slugs and banner mapping.
- **User**: Profiles with behavioral flags (e.g., `isAdmin`).
- **Order**: Multi-item purchase records with status tracking.
- **Promotion**: Active marketing assets for the homepage.

## 6. Development Roadmap
- **Phase 1 (Completed)**: Core storefront layout, product catalog, and primary admin logic.
- **Phase 2 (In Progress)**: Firebase integration, Security Rules deployment, and Real-time Admin Sync.
- **Phase 3 (Upcoming)**: AI-powered "Room Planner" integration, multi-currency support, and expanded "Elena's Life" editorial content.
