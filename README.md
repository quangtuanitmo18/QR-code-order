# QR Code Order for Restaurants

A solution for ordering food using QR codes, inspired by Sapo FNB, that optimizes the ordering process and order management for restaurants and cafes.

## Concept

This project is inspired by Sapo FNB's QR Order system, where customers can simply scan a QR code at their table or designated area to access an online menu and place their orders. The goal is to create a modern and efficient system that enhances the customer experience while enabling restaurants to manage orders effectively.

## Technologies Used

- **Frontend:**

  - Next.js 14 App Router
  - TypeScript
  - TailwindCSS
  - ShadCn UI
  - Tanstack Query
  - WebSockets (Socket.io)

- **Backend (local hosting):**

  - Fastify
  - Prisma
  - TypeScript
  - JWT (for user authentication)
  - WebSockets (Socket.io)

- **Database:**
  - SQLite

## Core Features

### User Authentication & Authorization

- **Authentication:** Secure user sessions using JWT Access Tokens and Refresh Tokens.
- **Authorization:** Support for three primary roles:
  - **Admin**
  - **Employee**
  - **Customer**

### Admin Features

- Manage personal account
- Manage Employee accounts
- Manage menu items
- Manage tables
- Manage order invoices
- View revenue statistics

### Employee Features

- Manage personal account
- Manage order invoices
- View revenue statistics

### Customer Features

- **View Menu:** Access an online menu displaying the full list of dishes with images, descriptions, and prices.
- **Order via QR Code:** Each table or area is assigned a unique QR code that directs customers to the ordering interface.

## Installation and Setup

### Prerequisites

- **Node.js** (v14 or higher)
- **SQLite** (or any compatible database supported by Prisma)
- **Git**
