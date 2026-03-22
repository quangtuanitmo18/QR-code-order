# 🍽️ QR Code Order — Smart Restaurant Management System

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5-black?logo=fastify)](https://fastify.io/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blue?logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

A full-stack, AI-powered restaurant management platform. Customers scan a QR code at their table to browse visually rich menus, chat with an AI assistant for recommendations, place orders, and pay — entirely from their smartphones. Staff manage operations, orders, and capacity in real-time through a comprehensive admin dashboard.

---

## 📑 Table of Contents

- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [🧪 Testing](#-testing)

---

## ✨ Key Features

### 🤖 AI Agentic Assistant (Powered by GPT & DAG Executor)
- **Multi-intent DAG Executor**: Radically optimized AI reasoning. Parses complex orders/queries into parallel task graphs instead of slow sequential loops.
- **Human-in-the-Loop (HITL)**: Safe pausing for sensitive actions (e.g., canceling orders, altering data).
- **Conversational Ordering**: Customers can ask for recommendations, check allergens, and place direct orders via chat.
- **RAG-powered Knowledge**: Integrates ChromaDB vector embeddings for semantic menu searching.

### 📱 QR Code Ordering & Guest Experience
- **Frictionless**: Unique QR codes per table load the digital menu instantly.
- **Rich Menu**: Visual items with tags, robust descriptions, and allergen warnings.
- **Cart & Checkout**: Real-time cart management, order tracking, and seamless checkout.

### 🏪 Comprehensive Admin Dashboard
- **Menu & Table Mapping**: Full CRUD capabilities for dishes, categories, and table capacities.
- **Live Order Board**: Real-time Kanban-style tracking (Pending → Processing → Delivered → Paid).
- **Employee Roles**: Role-based access control (RBAC) for Owners, Managers, and Staff.
- **Marketing Tools**: Built-in Coupon system (percentage/fixed) and internal Blog.

### 💬 Real-Time & Collaboration
- **WebSockets**: Instantaneous order dispatching to the kitchen screen.
- **Push Notifications**: Firebase Cloud Messaging (FCM) integration for mobile alerts.
- **Staff Chat**: Internal messaging with attachments, read receipts, and reactions.

### 🌍 Internationalization & Payments
- **Multi-language**: Supports English, Vietnamese, and Russian via `next-intl`.
- **Flexible Payments**: Cash or online integration (YooKassa).

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 18, TypeScript, TailwindCSS, Shadcn/UI |
| **Backend** | Node.js, Fastify, TypeScript |
| **Database** | SQLite + Prisma ORM |
| **AI Processing**| Vercel AI SDK v6, OpenAI GPT-4o, ChromaDB (Vector Search) |
| **State & Fetch**| Zustand, TanStack Query (React Query) |
| **Real-time** | Socket.IO, Firebase Cloud Messaging (FCM) |
| **Testing** | Vitest, React Testing Library, Playwright (E2E) |
| **Infra/Deploy** | PM2, Nginx, GitHub Actions (CI/CD) |

---

## 📁 Project Structure

```text
QR-code-order/
├── client/                  # Next.js frontend application
│   ├── src/                 # Source code (app, components, lib, queries)
│   ├── messages/            # i18n locale dictionaries
│   └── public/              # Static assets
├── server/                  # Fastify backend API
│   ├── src/                 # Source code (controllers, routes, services)
│   └── prisma/              # Database schema and seeders
├── docs/                    # Architecture & Deployment Documentation
├── nginx.conf               # Sample Nginx reverse proxy configuration
└── ecosystem.config.js      # PM2 cluster configuration
```

---

## 🚀 Getting Started

### Prerequisites

Please ensure you have the following installed:
- **Node.js** (v20 or higher recommended)
- **Git**
- **OpenAI API Key** (for AI Assistant features)
- **ChromaDB** running locally for vector similarity search.

### 1. Clone the Repository
```bash
git clone https://github.com/quangtuanitmo18/QR-code-order.git
cd QR-code-order
```

### 2. Backend Setup (`/server`)
```bash
cd server
cp .env.example .env
npm install
```
**Configure your `.env`:**
```env
DATABASE_URL="file:./dev.db"
ACCESS_TOKEN_SECRET="your_jwt_access_secret"
REFRESH_TOKEN_SECRET="your_jwt_refresh_secret"
OPENAI_API_KEY="sk-..."
CHROMA_URL="http://localhost:8000"
```
**Initialize Database & AI Vectors:**
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
npx tsx src/scripts/seed-chroma.ts
```

### 3. Frontend Setup (`/client`)
```bash
cd ../client
cp .env.example .env
npm install
```
**Configure your `.env`:**
```env
NEXT_PUBLIC_API_ENDPOINT="http://localhost:4000"
NEXT_PUBLIC_URL="http://localhost:3000"
```

### 4. Run Development Servers
Start both servers in separate terminal instances:
```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm run dev
```

### 5. Access the Application
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **Admin Dashboard**: [http://localhost:3000/manage/dashboard](http://localhost:3000/manage/dashboard)

**Default Demo Credentials:**
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password123` |
| **Employee**| `alice@example.com` | `password123` |

---

## 🧪 Testing

The project maintains high reliability through automated testing.

```bash
# Server Unit & Integration tests
cd server && npm test

# Client Unit tests
cd client && npm test

# Client End-to-End (E2E) tests
cd client && npm run test:e2e
```


---

## 👤 Author
**Quang Tuan** — [@quangtuanitmo18](https://github.com/quangtuanitmo18)
