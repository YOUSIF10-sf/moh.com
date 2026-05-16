# 🔬 وضح يااا المخزن الصح - Smart Warehouse (M-Store)
### The Scientific & Intelligent ERP Management System

![Version](https://img.shields.io/badge/version-3.0.0-purple)
![Security](https://img.shields.io/badge/Security-RBAC--Hardened-green)
![Cloud](https://img.shields.io/badge/Cloud-Turso--Powered-blue)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20Web-black)

**M-Store** is a high-performance, scientific-themed warehouse management system designed with a "Wow" factor. It utilizes a unified cloud database (Turso) to sync states between Web and Mobile in real-time, providing an elite experience for Admins, Supervisors, and Employees.

---

## 🌟 Elite Features

- **🪄 Magic Glow Branding**: A "Scientific Dashboard" experience with custom "وضح يااا المخزن الصح" multi-color branding and lighting effects.
- **🛡️ Multi-Step Account Recovery**: Advanced security flow allowing users to recover passwords via personalized security questions.
- **📊 Scientific Analytics**: Real-time intelligence hubs with dynamic metrics, health indicators, and warehouse health scores.
- **🔑 Professional RBAC**: Deeply integrated Role-Based Access Control:
  - **Admin**: Full control over users, inventory, and strategic analytics.
  - **Supervisor**: Management of products and operational approvals.
  - **Employee**: Streamlined "Field Operation" view for withdrawals and stock checks.
- **📱 Floating Island Navigation**: A modern, micro-minimalist floating tab bar optimized for one-handed mobile use.
- **☁️ Turso Cloud Sync**: Global database synchronization ensuring the Web and Mobile apps are always in perfect harmony.

## 🛠️ High-Performance Stack

- **Core**: React Native / Expo Router (v54+)
- **Database**: Turso (LibSQL) for ultra-low latency edge data.
- **Icons**: Lucide-React-Native (Micro-sized for premium feel).
- **Styling**: Modern Neumorphism / Glassmorphism with Vanilla CSS.
- **Deployment**: Vercel-optimized for Web, EAS-ready for Mobile.

## 🚀 Entrepreneur's Quick Start

### 1. Configure Environment
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_DATABASE_URL="libsql://your-db-url.turso.io"
EXPO_PUBLIC_DATABASE_TOKEN="your-secure-token"
```

### 2. Launch Development
```bash
npm install
npm start
# Press 'w' for Web, or scan QR for Mobile
```

### 3. Vercel Deployment (Web)
This project is pre-configured with `vercel.json` for seamless SPA routing. Simply connect your GitHub repo to Vercel and set the environment variables in the Vercel dashboard.

## 🔐 Security Standards
- **Zero-Trust UI**: Components automatically hide/show based on encrypted role payloads.
- **SHA-256 Hashing**: All passwords are encrypted locally before transmission.
- **Protected Redirection**: Real-time route gating to prevent unauthorized access.

---
*Designed & Developed with Scientific Precision by Antigravity AI.*
