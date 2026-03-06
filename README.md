# 🍽️ QR Code Order — Smart Restaurant Management System

A full-stack restaurant management platform where customers scan a QR code at their table to browse the menu, place orders, and pay — all from their phone. Staff manage everything in real-time through a powerful admin dashboard.

---

## ✨ Key Features

### 🤖 AI Assistant (Powered by GPT)

- **Conversational ordering** — customers chat with an AI to browse the menu, ask about allergens/ingredients, and place orders
- **12 specialized tools** — menu search, semantic FAQ lookup, order placement, coupon application, order tracking, and more
- **RAG-powered** — uses ChromaDB vector embeddings for intelligent menu and FAQ search
- **Multi-language** — responds in whatever language the customer writes in
- **Session memory** — maintains conversation context across multiple messages per visit

### 📱 QR Code Ordering

- Each table has a unique QR code that opens the ordering interface
- Guests browse a visual menu with images, descriptions, prices, allergens, and tags
- Add to cart → review → place order → track status — all on mobile

### 🏪 Admin Dashboard

- **Menu management** — CRUD dishes with categories, images, ingredients, allergens, and tags
- **Table management** — create tables, generate QR codes, manage capacity
- **Order management** — real-time order tracking with status updates (Pending → Processing → Delivered → Paid)
- **Employee management** — create/manage staff accounts with role-based access
- **Revenue analytics** — charts and statistics for sales, orders, and performance
- **Coupon system** — create fixed-amount or percentage discount coupons with usage limits
- **Blog** — publish restaurant news and updates
- **Reviews** — view and manage customer feedback

### 💬 Real-Time Communication

- **WebSocket-powered** — instant order notifications for kitchen and staff
- **Internal chat** — team messaging system with conversations, reactions, read receipts, and file attachments
- **Push notifications** — Firebase Cloud Messaging for mobile alerts

### 📅 Staff Tools

- **Calendar** — schedule shifts, events, and assignments with notifications
- **Task management** — create and track tasks with comments and attachments
- **Spin wheel** — employee reward/gamification system

### 🌐 Internationalization

- Full i18n support with **English**, **Vietnamese**, and **Russian** locales
- Powered by `next-intl` with locale-based routing

### 💳 Payments

- Cash and online payment support
- YooKassa integration for online payments
- Coupon/discount application at checkout

---

## 🛠️ Tech Stack

| Layer             | Technology                                                       |
| ----------------- | ---------------------------------------------------------------- |
| **Frontend**      | Next.js 15 (App Router, Turbopack), React 18, TypeScript         |
| **Styling**       | TailwindCSS, Shadcn/UI (Radix primitives), Lucide Icons          |
| **State**         | Zustand, TanStack Query (React Query), React Hook Form + Zod     |
| **Backend**       | Fastify, TypeScript, Node.js                                     |
| **Database**      | SQLite + Prisma ORM (36 models)                                  |
| **AI**            | Vercel AI SDK v6, OpenAI GPT, ChromaDB (vector embeddings)       |
| **Auth**          | JWT (Access + Refresh tokens), role-based (Owner/Employee/Guest) |
| **Real-time**     | Socket.IO (WebSockets)                                           |
| **Notifications** | Firebase Cloud Messaging (FCM)                                   |
| **Monitoring**    | Sentry (error tracking)                                          |
| **i18n**          | next-intl (EN, VI, RU)                                           |
| **Testing**       | Vitest, React Testing Library, Playwright (E2E)                  |
| **Deployment**    | PM2, Nginx reverse proxy                                         |

---

## 📁 Project Structure

```
QR-code-order/
├── client/                  # Next.js 15 frontend
│   ├── src/
│   │   ├── app/             # App Router pages & API routes
│   │   ├── components/      # UI components (Shadcn + custom)
│   │   ├── queries/         # TanStack Query hooks
│   │   ├── schemaValidations/ # Zod schemas
│   │   └── lib/             # Utilities
│   ├── messages/            # i18n locale files (en, vi, ru)
│   └── public/              # Static assets
├── server/                  # Fastify backend
│   ├── src/
│   │   ├── controllers/     # Route handlers (27 controllers)
│   │   ├── services/        # Business logic (AI, payments, etc.)
│   │   ├── routes/          # Fastify route definitions
│   │   ├── hooks/           # Auth & validation hooks
│   │   ├── middleware/       # Rate limiting, security
│   │   └── scripts/         # Seed scripts, evaluation
│   └── prisma/
│       ├── schema.prisma    # Database schema (36 models)
│       └── seed.ts          # Development seed data
├── docs/                    # Feature documentation
├── nginx.conf               # Production Nginx config
└── ecosystem.config.js      # PM2 deployment config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Git**
- **OpenAI API key** (for AI Assistant)
- **ChromaDB** running locally (for vector search)

### 1. Clone the Repository

```bash
git clone https://github.com/quangtuanitmo18/QR-code-order.git
cd QR-code-order
```

### 2. Setup the Server

```bash
cd server
cp .env.example .env   # Configure your environment variables
npm install
npx prisma generate     # Generate Prisma client
npx prisma db push      # Create database tables
npx prisma db seed      # Seed development data
npx tsx src/scripts/seed-chroma.ts  # Seed ChromaDB vectors
```

#### Key Environment Variables (`server/.env`)

```env
DATABASE_URL="file:./dev.db"
ACCESS_TOKEN_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_secret
OPENAI_API_KEY=sk-...
CHROMA_URL=http://localhost:8000
```

### 3. Setup the Client

```bash
cd client
cp .env.example .env   # Configure your environment variables
npm install
```

#### Key Environment Variables (`client/.env`)

```env
NEXT_PUBLIC_API_ENDPOINT=http://localhost:4000
NEXT_PUBLIC_URL=http://localhost:3000
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 4000)
cd server && npm run dev

# Terminal 2 — Frontend (port 3000)
cd client && npm run dev
```

### 5. Access the Application

| URL                                      | Description          |
| ---------------------------------------- | -------------------- |
| `http://localhost:3000`                  | Frontend application |
| `http://localhost:4000`                  | Backend API          |
| `http://localhost:3000/manage/dashboard` | Admin dashboard      |

#### Default Credentials

| Role     | Email               | Password      |
| -------- | ------------------- | ------------- |
| Admin    | `admin@example.com` | `password123` |
| Employee | `alice@example.com` | `password123` |

---

## 🧪 Testing

```bash
# Server unit tests
cd server && npm test

# Client unit tests
cd client && npm test

# Client E2E tests (Playwright)
cd client && npm run test:e2e
```

---

## 🚢 Production Deployment

The project includes PM2 and Nginx configurations for production:

```bash
# Build both apps
cd server && npm run build
cd client && npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

See `nginx.conf` for the reverse proxy configuration.

---

## 📝 License

ISC

---

## 👤 Author

**Quang Tuan** — [@quangtuanitmo18](https://github.com/quangtuanitmo18)
