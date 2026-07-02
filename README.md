# BlueWings - Smart Booking Companion

BlueWings is an AI-powered flight booking and customer assistance web application. It features a modern, responsive flight search engine, custom reservation checkouts, interactive passenger and seat maps, real-time OTP logins, a WhatsApp chat simulator, and an operations administration panel.

---

## 👥 Team Information

* **Team Name:** Error 404
* **Team Members:**
  * **Suthar Prince D.**
  * **Patel Vandan S.**
* **College Name:** Sardar Patel College Of Engineering

---

## 🛠️ Technology Stack Used

### Frontend & Core Framework
* **Next.js 16 (App Router)** - Standardized for React Server Components (RSC) and server-side rendering.
* **React 19** - Utilizing modern React hooks and hydration patterns.
* **Tailwind CSS 4.0** - Utility-first styling with unified fluid layouts and glassmorphism.
* **Lucide React** - High-fidelity icon graphics.
* **SWR (useSWR)** - Real-time client data fetching and cache invalidation.

### Backend & Database
* **PostgreSQL** - Primary relational database.
* **Drizzle ORM** - High-performance TypeScript ORM for schema migration and database queries.
* **Jose (JWT)** - Cookie-based secure session management and authentication middleware.

### AI Integration
* **Vercel AI SDK** - Dynamic chat processing, structural tool calls, and model interface wrapper.
* **OpenAI API & OpenRouter** - Intelligent support, booking inquiries, relative date resolution, and automated escalations.

---

## 🚀 Build & Run Instructions

Follow the steps below to configure, build, and run the project locally.

### 📋 Prerequisites
* **Node.js** (v18.x or higher recommended)
* **npm** or **pnpm** package manager
* **PostgreSQL** server running locally or hosted

### 1. Clone & Install Dependencies
Navigate to the project directory and install the necessary npm packages:
```bash
# Using npm
npm install

# Or using pnpm
pnpm install
```

### 2. Configure Environment Variables
Copy the environment template file:
```bash
cp .env.example .env.local
```
Open `.env.local` and configure your credentials:
```env
DATABASE_URL="postgresql://postgres:12345678@localhost:5432/bluewings"
OPENAI_API_KEY="your-openai-or-openrouter-key-here"
```

### 3. Setup the Database
Verify your local PostgreSQL instance is running and your `DATABASE_URL` is correct. Then, push the schema migrations and run the flight seeder:
```bash
# Push database schemas (Drizzle)
npx drizzle-kit push

# (Optional) Run the database seeder if you want to initialize flight logs
# Note: Seed scripts are located under lib/db/seed.ts or run the built-in seeders
```

### 4. Run the Development Server
Launch the local Next.js dev server:
```bash
npm run dev
# or
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the application.

### 5. Build for Production
To build the optimized production assets:
```bash
npm run build
npm run start
# or
pnpm build
pnpm start
```
