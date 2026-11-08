<div align="center">
  <img src="https://img.icons8.com/fluency/96/warehouse.png" alt="Inventory management" width="88" />
  <h1>Smart Inventory &amp; Sales Management System</h1>
  <p>A full-stack platform for inventory visibility, product management, and transactional sales processing.</p>

  <p>
    <a href="https://github.com/riazaslam029/Smart-Inventory-and-Sales-Management-System"><img src="https://img.shields.io/github/stars/riazaslam029/Smart-Inventory-and-Sales-Management-System?style=for-the-badge&logo=github&label=Stars" alt="GitHub stars" /></a>
    <a href="https://github.com/riazaslam029/Smart-Inventory-and-Sales-Management-System/issues"><img src="https://img.shields.io/github/issues/riazaslam029/Smart-Inventory-and-Sales-Management-System?style=for-the-badge&logo=github" alt="Open issues" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-2ea44f?style=for-the-badge" alt="MIT license" /></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Angular-20-DD0031?style=flat-square&logo=angular&logoColor=white" alt="Angular 20" />
    <img src="https://img.shields.io/badge/NestJS-10-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS 10" />
    <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/SQL%20Server-Database-A91D22?style=flat-square&logo=microsoftsqlserver&logoColor=white" alt="Microsoft SQL Server" />
    <img src="https://img.shields.io/badge/Status-Active-2ea44f?style=flat-square" alt="Active project" />
  </p>

  <p>
    <code>inventory</code> <code>sales-management</code> <code>angular</code> <code>nestjs</code> <code>typescript</code> <code>sql-server</code> <code>typeorm</code> <code>material-design</code>
  </p>
</div>

## 📌 Overview

**Smart Inventory & Sales Management System** is a production-oriented full-stack application for managing products, categories, stock levels, users, and sales transactions. It combines an Angular 20 frontend, a NestJS REST API, TypeORM, and Microsoft SQL Server to provide a clear separation between the user interface, business logic, and data layer.

The system uses a database stored procedure to process sales atomically: it validates available stock, creates the sale, inserts sale items, and decrements inventory in one ACID transaction. Product price changes are captured automatically through a SQL Server audit trigger.

## ✨ Key Capabilities

- 📊 **Inventory dashboard** with product counts, stock levels, low-stock alerts, and inventory value
- 🛒 **Transactional sales processing** with stock validation and automatic inventory updates
- 📦 **Product and category management** through a structured REST API
- 👥 **User and role data model** ready for controlled business operations
- 🔐 **Database-level integrity** with foreign keys, constraints, indexes, and normalized tables
- 🧾 **Automatic price auditing** through a SQL Server trigger
- ⚡ **Angular Signals and auto-refresh** for responsive inventory views
- 🎨 **Material Design and Tailwind CSS** for a clean, responsive interface
- 🧪 **Development tooling** for builds, tests, linting, and production builds

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────┐
│              Angular 20 Frontend             │
│ Standalone components · Signals · Material   │
└──────────────────────┬──────────────────────┘
                       │ HTTP / REST
                       ▼
┌─────────────────────────────────────────────┐
│              NestJS 10 Backend                │
│ Controllers · Services · TypeORM · Validation│
└──────────────────────┬──────────────────────┘
                       │ mssql driver
                       ▼
┌─────────────────────────────────────────────┐
│             Microsoft SQL Server             │
│ 3NF schema · ACID procedure · audit trigger  │
└─────────────────────────────────────────────┘
```

## 🧰 Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | Angular 20, TypeScript, Angular Material, Tailwind CSS, RxJS |
| Backend | NestJS 10, TypeScript, TypeORM, class-validator |
| Database | Microsoft SQL Server, T-SQL, stored procedures, triggers |
| Runtime | Node.js 24.x, npm |
| Testing and quality | Jest, Karma, ESLint, TypeScript compiler |

## 🚀 Quick Start

### Prerequisites

- Node.js 24.x and npm
- Microsoft SQL Server with `sqlcmd` available, or SQL Server Management Studio
- Git

### 1. Clone the repository

```bash
git clone https://github.com/riazaslam029/Smart-Inventory-and-Sales-Management-System.git
cd Smart-Inventory-and-Sales-Management-System
```

### 2. Create and initialize the database

Create a database named `InventorySalesDB`, then run the SQL scripts in order:

```bash
sqlcmd -S localhost -U sa -P "YourPassword" -d InventorySalesDB -i Database/SQL/01-schema-initialization.sql
sqlcmd -S localhost -U sa -P "YourPassword" -d InventorySalesDB -i Database/SQL/02-stored-procedure-sale.sql
sqlcmd -S localhost -U sa -P "YourPassword" -d InventorySalesDB -i Database/SQL/03-audit-trigger.sql
```

For the complete security and role setup, review the additional scripts in `Database/SQL/` and the database documentation in `Documentation/`.

### 3. Configure and run the backend

Create `Backend/.env` with your SQL Server connection details:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=YourPassword
DB_NAME=InventorySalesDB
```

Then install dependencies and start the API:

```bash
cd Backend
npm install
npm run start:dev
```

The backend runs at `http://localhost:3000`.

### 4. Run the frontend

In a second terminal:

```bash
cd Frontend
npm install
npm start
```

Open `http://localhost:4200` in your browser.

## 🔌 API Endpoints

The API is organized around these resources:

| Resource | Example endpoint | Purpose |
| --- | --- | --- |
| Health | `GET /api/health` | Check API availability |
| Products | `GET /api/products` | List and manage products |
| Categories | `GET /api/categories` | List and manage categories |
| Inventory | `GET /api/inventory` | View stock and low-stock data |
| Sales | `GET /api/sales` | Review recorded sales |
| Sales | `POST /api/sales` | Process a sale transaction |

See `Backend/src/controllers.ts` and `Documentation/IMPLEMENTATION_GUIDE.md` for the complete endpoint and integration details.

## 🗂️ Project Structure

```text
├── Backend/
│   ├── src/
│   │   ├── controllers.ts       # REST controllers
│   │   ├── services.ts           # Business logic
│   │   ├── entities.ts           # TypeORM entities
│   │   ├── app.module.ts         # NestJS module configuration
│   │   └── main.ts               # API bootstrap
│   └── package.json
├── Database/
│   └── SQL/
│       ├── 01-schema-initialization.sql
│       ├── 02-stored-procedure-sale.sql
│       ├── 03-audit-trigger.sql
│       ├── 04-objects-and-security.sql
│       └── 05-users-and-role-mapping.sql
├── Documentation/
│   ├── IMPLEMENTATION_GUIDE.md
│   ├── STORED_PROCEDURE_GUIDE.md
│   └── ER_Diagram_Description.md
├── Frontend/
│   ├── src/app/                  # Angular application
│   └── package.json
├── QUICKSTART.md
└── README.md
```

## 🧪 Development Commands

### Backend

```bash
cd Backend
npm run build       # Compile the API
npm test            # Run Jest tests
npm run lint        # Lint TypeScript files
npm run start:prod  # Run compiled production build
```

### Frontend

```bash
cd Frontend
npm run build:prod  # Create a production build
npm test            # Run Angular tests
npm run lint        # Lint Angular files
```

## 📚 Documentation

- [`QUICKSTART.md`](QUICKSTART.md) — fastest local setup path
- [`Documentation/IMPLEMENTATION_GUIDE.md`](Documentation/IMPLEMENTATION_GUIDE.md) — architecture, setup, testing, and operations
- [`Documentation/STORED_PROCEDURE_GUIDE.md`](Documentation/STORED_PROCEDURE_GUIDE.md) — sale transaction procedure reference
- [`Documentation/ER_Diagram_Description.md`](Documentation/ER_Diagram_Description.md) — entities, relationships, and normalization
- [`PROJECT_DELIVERY.md`](PROJECT_DELIVERY.md) — delivery checklist and implementation summary

## 🤝 Contributing

Contributions are welcome. Open an issue to report a problem or suggest an improvement, then submit a focused pull request with a clear description and validation steps.

## 🔒 Security Notes

- Never commit `Backend/.env` or database credentials.
- Use strong, rotated credentials for SQL Server.
- Keep CORS, authentication, authorization, and HTTPS configuration aligned with the deployment environment.
- Review the security-focused SQL scripts before using the system outside a local development environment.

## 📄 License

This project is released under the [MIT License](LICENSE). You are free to use, modify, and distribute the software, subject to the license terms.

<div align="center">
  <br />
  <strong>Built with Angular, NestJS, TypeScript, and Microsoft SQL Server.</strong>
  <br />
  <a href="https://github.com/riazaslam029/Smart-Inventory-and-Sales-Management-System">⭐ Star the repository if you find it useful</a>
</div>
