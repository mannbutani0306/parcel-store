<div align="center">

# 📦 PARCEL

### A postal-and-paper goods storefront with smart recommendations

**E-Commerce Platform with Recommendations — a Software Engineering mini project**

*From requirements to a tested, working prototype: Experiments 1 to 9, one diagram at a time.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-parcel--store.vercel.app-0A66C2?style=for-the-badge&logo=vercel&logoColor=white)](https://parcel-store.vercel.app)
[![Project PPT](https://img.shields.io/badge/Project%20PPT-Download-D24726?style=for-the-badge&logo=microsoftpowerpoint&logoColor=white)](https://github.com/mannbutani0306/parcel-store/releases/download/v1.0/E233_Mannkumar_Butani_SE_ECommerce.pptx)

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-state-433E38?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

</div>

---

PARCEL is a web-based e-commerce storefront where sellers list products, customers browse, buy and track orders, and a recommendation engine suggests relevant products. It was built for the **Software Engineering** course to show how one shopping app goes from an idea to a tested product, with every design diagram feeding the next.

## Quick links

| | |
|---|---|
| 🌐 **Live demo** | [parcel-store.vercel.app](https://parcel-store.vercel.app) |
| 📊 **Project presentation (PPT)** | [E233_Mannkumar_Butani_SE_ECommerce.pptx](https://github.com/mannbutani0306/parcel-store/releases/download/v1.0/E233_Mannkumar_Butani_SE_ECommerce.pptx) (Release v1.0) |
| 💻 **Source code** | [github.com/mannbutani0306/parcel-store](https://github.com/mannbutani0306/parcel-store) |

## Table of contents

- [Problem statement](#problem-statement)
- [Features](#features)
- [Try it: demo accounts](#try-it-demo-accounts)
- [Recommendation engine](#recommendation-engine)
- [Validation rules](#validation-rules)
- [Software Engineering experiments](#software-engineering-experiments)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Limitations](#limitations)
- [Author](#author)
- [License](#license)

## Problem statement

Design a secure, scalable web-based E-Commerce Platform where sellers list products, customers browse, buy and track orders, and a recommendation engine suggests relevant products.

Five case studies were shortlisted (E-Commerce with Recommendations, Online Job Portal, Real Estate Listing, Car / Bike Rental, Online Grocery Delivery). E-Commerce won because it has the widest scope, from catalog to delivery, and adds a machine-learning-style personalisation layer while staying feasible with an open-source stack.

## Features

### Customers

- Browse a catalogue of **36 products across 6 categories** (Tech, Home, Style, Beauty, Books, Play), with search, filters and fuzzy matching that tolerates typos.
- Global **command palette** (`Ctrl + K` / `⌘ + K`) to jump to pages, categories and products.
- Product pages, wishlist, cart drawer and a full cart page.
- Checkout with address, PIN code and card validation, plus coupon codes.
- Orders list and order detail pages with stage tracking, cancel and return.
- Personalised recommendations on the home page, product pages, cart and orders.

### Sellers

- Seller dashboard with **Overview, New Product, Inventory and Orders** tabs.
- Add products, edit stock and price inline, retire products, and advance orders to the next stage.

### Admin

- Admin dashboard with **Overview, Orders, Moderation, Coupons, Engine, Users and Activity** tabs.
- Issue coupons, moderate products, block or unblock users, and compare recommendation engines.

### Platform-wide

- Three roles: **Customer, Seller, Admin**, each with its own dashboard and access.
- **Session safety:** a warning appears after 14 minutes of inactivity and the session expires at 15 minutes.
- Responsive layout with a mobile bottom tab bar, toast notifications, skeleton loading states and an error boundary.
- Order stages tracked: placed, packed, shipped, out for delivery, delivered (plus cancelled and returned).

## Try it: demo accounts

The prototype uses seeded sample data and a front-end-only sign-in. On the **Login** page you can use the quick sign-in buttons, or type one of these emails with any password of 6 or more characters:

| Role | Email |
|---|---|
| Admin | `kabir@parcel.in` |
| Seller | `press@oiledoak.in` · `dispatch@jaipurindigo.in` · `craft@deccanmech.in` |
| Customer | `aarav@postbox.in` · `diya.sharma@mail.in` · `rohan.sen@calcutta.in` · `ananya.rao@mysore.in` |

**Coupons to try at checkout:** `PARCEL10` (10% off, up to ₹300, on orders of ₹500 or more), `FIRST100` (flat ₹100 off orders above ₹499), `FREESHIP` (free delivery). `MONSOON25` is intentionally expired, to show the expiry check.

## Recommendation engine

Two engines are implemented in `src/lib/recommend.ts` and can be compared from the Admin dashboard:

| Engine | How it works |
|---|---|
| **Postal Smart Hybrid** | Scores products from seeded co-purchase relations plus the user's own views, cart adds, wishlist and purchases, and returns a match percentage with a short reason. |
| **Community Favorites (Popular)** | Ranks products by overall popularity. |

Recommendations appear in five places: home ("picked for you"), product pages ("goes well with" and "others also bought"), the cart ("forgot something?") and order pages ("next up").

## Validation rules

Input rules from the test design (Experiment 9) are enforced in `src/lib/validators.ts`:

| Rule | Behavior |
|---|---|
| Cart quantity | Only whole numbers from **1 to 10** are accepted; 0, negatives, values above 10 and decimals are rejected with a clear message. |
| Email, PIN code, phone | Email format, 6-digit Indian PIN code (first digit 1–9) and Indian phone number checks. |
| Card number | Luhn checksum validation at checkout. |
| Coupons | Checks code, expiry date, minimum order value and maximum discount. |

## Software Engineering experiments

The prototype applies the nine experiments in order. Each one fed the next:

| Exp | Topic | What it produced |
|---|---|---|
| 1 | Requirement analysis & SRS | Problem statement, functional requirements, users (Customer, Seller, Admin) |
| 2 | Agile non-functional requirements | User stories with measurable goals: pages load in under 2 s, 99.5% uptime, HTTPS, zero loss on checkout, 500+ concurrent shoppers, a swappable recommendation module; Definition of Done |
| 3 | Use case diagram | 5 actors (Customer, Admin, Payment Gateway, Recommendation Engine, Shipping / Logistics); Apply Filters extends Browse, Apply Coupon extends Checkout |
| 4 | Activity diagram | Checkout flow in 4 swimlanes, with decisions for coupon and payment, a parallel fork (update inventory, notify logistics) and a failure path |
| 5 | Class diagram | User, Customer, Admin, Product, Category, Cart, CartItem, Order, OrderItem, Payment, Coupon, Review, Address, ShippingProvider |
| 6 | Sequence diagrams | Customer Login, Add to Cart & Checkout, Place Order & Payment, Generate Recommendations |
| 7 | Collaboration diagrams | The same interactions organised by object links, with numbered messages |
| 8 | Data flow diagrams | Level 0 context, Level 1 with 7 processes and 7 data stores, Level 2 for Manage Order; levels balanced |
| 9 | Test suite design | Equivalence classes and boundary values for `addToCart()`: tests at quantity -1, 0, 1, 5, 10, 11 and 100, all passing |

How the prototype uses them: the use cases and activity flow shape the checkout, the class diagram became the data entities in `src/data/`, and the 1–10 quantity rule from the test suite is enforced in code. The diagrams themselves are in the [project presentation](https://github.com/mannbutani0306/parcel-store/releases/download/v1.0/E233_Mannkumar_Butani_SE_ECommerce.pptx).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 4 |
| Routing | React Router |
| State | Zustand (persisted in the browser's local storage) |
| Animation and UI | Motion, Lucide icons, Recharts (dashboard charts), canvas-confetti |
| Deployment | Vercel |

## Getting started

**Prerequisites:** Node.js 18 or later and npm.

```bash
# 1. Clone the repository
git clone https://github.com/mannbutani0306/parcel-store.git
cd parcel-store

# 2. Install dependencies
npm install

# 3. Start the development server (http://localhost:3000)
npm run dev
```

No API keys or environment variables are needed to run the store.

| Script | Description |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Type-check with `tsc --noEmit` |

## Project structure

```text
parcel-store/
├── src/
│   ├── components/
│   │   ├── shell/          # Layout, top nav, bottom tab bar, cart drawer, command palette, footer
│   │   └── ui/             # Reusable UI parts (buttons, inputs, modals, stamps, stickers, etc.)
│   ├── data/               # Seeded products, categories, users, orders, reviews and coupons
│   ├── lib/                # Recommendation engines, search, validators, formatting
│   ├── pages/              # Home, Shop, Product, Cart, Checkout, Orders, Wishlist, Login, Admin, Seller
│   ├── store/              # Zustand stores for the app and toast notifications
│   ├── App.tsx             # Routes
│   └── main.tsx            # Entry point
├── index.html
├── vite.config.ts
└── package.json
```

## Limitations

- This is a front-end prototype. There is no real backend or database: products, users, orders and reviews are seeded sample data, and changes are saved only in your own browser.
- Sign-in is for demonstration only and does not verify passwords. Payments are simulated and no real money moves.
- The recommendation engines use seeded relations and simple scoring on sample data, not a trained model.

## Author

**Mannkumar Butani** · Roll No. E233 · B.Tech CS B1
Software Engineering course project.

## License

Released under the [MIT License](LICENSE) © 2026 mannbutani0306.

---

<div align="center">

*PARCEL — from an idea to a tested e-commerce platform. 📦*

</div>
