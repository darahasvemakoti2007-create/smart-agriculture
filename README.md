# 🌾 AgriSync — AI-Powered Smart Agriculture & Farm Advisory Platform

> **Hackathon Submission** — Problem Statement #3: *Smart Agriculture: Crop Disease and Farm Advisory System*

![AgriSync Banner](https://img.shields.io/badge/AgriSync-Smart%20Agriculture-22c55e?style=for-the-badge&logo=leaflet&logoColor=white)
![Next.js 16](https://img.shields.io/badge/Next.js-16.3.3-black?style=for-the-badge&logo=next.js)
![Google Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%203.6-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

---

## 📌 Overview

**AgriSync** is an end-to-end, AI-powered Smart Agriculture platform designed to empower farmers with real-time agronomic intelligence, AI crop disease diagnosis, dynamic irrigation guidance, soil health telemetry, microclimate alerts, and localized voice-assisted guidance in **5 Indian regional languages**.

By combining **Google Gemini 3.6 AI**, real-time soil & weather telemetry, and PostgreSQL data persistence, AgriSync bridges the gap between complex agricultural science and everyday farming decisions.

---

## ✨ Key Features & Capability Matrix

### 1. 🔬 AI Crop Disease Diagnosis (`/dashboard/disease`)
- **Leaf Photo Scan:** Upload or capture leaf images for instant AI vision analysis.
- **Detailed Diagnosis:** Detects disease name, confidence score (0–100%), severity rating, affected foliage area, and underlying causes.
- **Treatment Plans:** Provides organic bio-control steps (e.g. Neem oil ratios) as well as safe chemical treatment guidelines.
- **Historical Disease Log:** Retains past scan records per crop to monitor treatment effectiveness.

### 2. 🌿 Crop Health & Lifecycle Progress (`/dashboard/crops`)
- **Crop Management:** Register crops with variety, planting date, and expected harvest timeline.
- **Visual Progress Tracking:** Real-time growth cycle percentage bars.
- **Crop Image History:** Store timestamped progress photos per registered crop.

### 3. 🌦 Weather-Based Microclimate Advisories (`/dashboard/weather`)
- **Real-Time Forecasts:** Temperature, humidity, rain probability, and wind speed monitoring.
- **Proactive Advisories:** Rain risk alerts, frost warnings, and heat stress protection tips.

### 4. 💧 Smart Water-Saving Irrigation Advisory (`/dashboard/irrigation`)
- **Dynamic Calculation:** Calculates exact watering requirements based on soil moisture %, ambient temperature, crop age, and rain forecasts.
- **Watering Schedules:** Recommends optimal watering window (e.g., Early Morning 6:00 AM - 8:00 AM) and duration in minutes.
- **Conservation Tips:** Prevents over-watering and root decay.

### 5. 🪨 Soil Health & Fertilizer Prescriptions (`/dashboard/soil`)
- **Soil Telemetry Logging:** Record pH, Nitrogen (N), Phosphorus (P), Potassium (K), moisture %, and organic carbon.
- **NPK Deficiency Analysis:** Identifies specific nutrient gaps and prescribes dosage.
- **pH Conditioning:** Recommends agricultural lime for acidic soils or gypsum for alkaline soils.

### 6. 🚨 Proactive Pest & Threat Alerts (`/dashboard/alerts`)
- **Graded Severity:** Critical 🔴, Medium 🟡, and Low 🟢 risk alerts.
- **Categorized Notices:** Pest infestations, weather anomalies, soil nutrient depletion, and irrigation urgency.
- **Interactive Management:** Mark alerts as read or filter by severity.

### 7. 🌐 5-Language Regional Multilingual Interface
- **Supported Languages:**
  - 🇬🇧 **English (EN)**
  - 🇮🇳 **Hindi (हिन्दी - HI)**
  - 🇧🇩 **Bengali (বাংলা - BN)**
  - 🔵 **Telugu (తెలుగు - TE)**
  - 🟠 **Tamil (தமிழ் - TA)**
- **Global Context Sync:** Language choice instantly translates all sidebar navigation options, dashboard headers, metric summary cards, quick tools, and farmer help guides.

### 8. 🎙️ Multilingual Voice AI Assistant — AgriBot (`components/dashboard/FarmAIChat.tsx`)
- **Voice Recognition (STT):** Tap the microphone 🎙️ button to speak directly in Hindi, Telugu, Tamil, Bengali, or English.
- **Text-To-Speech (TTS):** Script-aware speech synthesizer reads responses aloud using native regional voices.
- **Context-Aware:** AgriBot syncs with the user's real-time farm soil metrics, active crops, weather, and alerts to answer farm questions accurately.

### 9. 📊 Historical Analytics Dashboard (`/dashboard/history`)
- **Soil NPK Trends:** Interactive Recharts area chart tracking N, P, and K levels over 30 readings.
- **Moisture & pH Dual Line Chart:** Real-time dual-axis chart visualizing soil moisture % alongside pH.
- **Monthly Alert Breakdown:** Bar chart illustrating alert volume by severity.
- **Disease & Crop Timelines:** Comprehensive historical logs for analytical review.

### 10. 🗓 ✨ Unique Innovation — AI Smart Planting Calendar (`/dashboard/planting-calendar`)
- **6-Month Personalized Plan:** Reads actual farm soil type, GPS location, weather, and irrigation structure to generate a personalized 6-month day-by-day crop calendar.
- **Top 3 Crop Recommendations:** Suggests crop varieties suited to soil + season with expected yield and difficulty rating.
- **Day-Level Task Schedule:** Actionable tasks categorized by activity (🌱 Plant · 💧 Water · 🧪 Fertilize · 🌾 Harvest · 🔬 Inspect · 🌿 Spray).

### 11. 🏡 Farm Management (`/dashboard/farm`)
- **Property Registry:** Add, view, edit (`✏️ Edit Farm`), or delete registered agricultural land.
- **GPS Capture:** Live location capture for precision localized weather integration.

---

## 🛠 Tech Stack

| Component | Technology | Description |
|---|---|---|
| **Framework** | **Next.js 16.3.3 (Turbopack)** | React 19 App Router with SSR & Server Actions |
| **Styling** | **Tailwind CSS v4** | Custom dark space theme `#050a14`, glassmorphism, neon accents |
| **AI Models** | **Google Gemini 3.6 Flash & 3.5 Flash Lite** | Multi-modal vision analysis, structured JSON outputs, regional NLPs |
| **Database & Auth** | **Supabase (PostgreSQL)** | RLS security, real-time database queries, Supabase SSR Auth |
| **Charts** | **Recharts** | Responsive SVG charts (Area, Line, Bar) |
| **Voice Engine** | **Web Speech API** | Browser `SpeechRecognition` & `SpeechSynthesisUtterance` |
| **Language System** | **TypeScript 5.0** | Strict type safety across full-stack codebase |

---

## 📁 Directory Structure

```
smart-agriculture/
├── app/
│   ├── auth/                      # Authentication server actions
│   ├── dashboard/                 # Protected farmer dashboard routes
│   │   ├── alerts/                # Threat alerts page
│   │   ├── chat/                  # AgriBot AI chat actions
│   │   ├── crops/                 # Crop management & photo progress
│   │   ├── disease/               # AI leaf disease diagnosis hub
│   │   ├── farm/                  # Farm management (create, edit, delete)
│   │   ├── farm-score/            # AI Farm Health Score calculator
│   │   ├── history/               # Analytical charts & historical logs
│   │   ├── irrigation/            # Smart watering calculator
│   │   ├── planting-calendar/     # 6-month AI Planting Calendar
│   │   ├── recommendations/       # AI farm recommendations
│   │   ├── soil/                  # Soil telemetry & fertilizer advisor
│   │   ├── weather/               # Microclimate weather dashboard
│   │   ├── globals.css            # 3D keyframe animations, dark space theme
│   │   ├── layout.tsx             # Root layout with global LanguageProvider
│   │   └── page.tsx               # Main Dashboard page
│   ├── login/                     # Login page
│   ├── register/                  # Registration page
│   └── page.tsx                   # 3D animated landing page
├── components/
│   ├── dashboard/                 # Sidebar, Header, FarmCard, EditFarmModal,
│   │                              # FarmAIChat, HistoryCharts, PlantingCalendarClient, etc.
│   ├── LanguageContext.tsx        # Multilingual context (EN, HI, TE, TA, BN)
│   ├── Navbar.tsx                 # Top navigation bar
│   ├── Hero.tsx                   # 3D interactive hero scene
│   ├── Features.tsx               # 3D interactive feature cards
│   └── Footer.tsx                 # Application footer
├── src/
│   └── lib/
│       ├── ai/                    # AI analysis modules (disease, soil, irrigation, etc.)
│       ├── gemini.ts              # Google GenAI client configuration
│       └── supabase/              # Supabase server & browser clients
├── public/                        # Static assets & 3D illustrations
└── package.json
```

---

## ⚡ Local Setup & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **Supabase Account** (for database & authentication)
- **Google Gemini API Key** (from Google AI Studio)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/smart-agriculture.git
cd smart-agriculture
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini AI Configuration
GEMINI_API_KEY=your-google-gemini-api-key
```

### Step 4: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup (Supabase SQL Schema)

Run the following SQL statements in your Supabase SQL Editor to initialize the database tables:

```sql
-- 1. Farms Table
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_name TEXT NOT NULL,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  area NUMERIC,
  area_unit TEXT DEFAULT 'acres',
  soil_type TEXT,
  irrigation_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Crops Table
CREATE TABLE public.crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  variety TEXT,
  planting_date DATE,
  expected_harvest_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Soil Readings Table
CREATE TABLE public.soil_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  ph NUMERIC,
  nitrogen NUMERIC,
  phosphorus NUMERIC,
  potassium NUMERIC,
  moisture NUMERIC,
  temperature NUMERIC,
  organic_carbon NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Weather Records Table
CREATE TABLE public.weather_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  temperature NUMERIC,
  humidity NUMERIC,
  rain_probability NUMERIC,
  wind_speed NUMERIC,
  weather_condition TEXT,
  forecast_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Alerts Table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Disease Analyses Table
CREATE TABLE public.disease_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID REFERENCES public.crops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  disease_name TEXT NOT NULL,
  confidence INTEGER,
  severity TEXT,
  symptoms JSONB,
  possible_causes JSONB,
  recommended_actions JSONB,
  prevention_tips JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Recommendations Table
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  confidence INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🛡️ Robust Fallback & Error Prevention Architecture

AgriSync implements **rule-based agronomic fallbacks** for all AI functions. If the Gemini API is temporarily unavailable or experiences rate limits, AgriSync automatically executes deterministic agricultural rules (pH calculations, NPK deficiencies, drip irrigation timings, and seasonal crop cycles) so that **the platform remains 100% operational with zero user disruption**.

---

## 🚀 Deployment Guide (Vercel)

1. Push your code to a GitHub / GitLab repository.
2. Import the project into your [Vercel Dashboard](https://vercel.com).
3. Add the Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`).
4. Click **Deploy**. Vercel will automatically build the Next.js 16 App Router project.

---

## 🏆 Hackathon Submission Details

- **Problem Statement:** #3 — Smart Agriculture: Crop Disease and Farm Advisory System
- **Project Name:** AgriSync
- **Target Audience:** Smallholder & progressive farmers across India
- **Core Value:** Free, instant, multilingual agricultural advice powered by AI.

---

*Built with ❤️ for Indian Farmers*
