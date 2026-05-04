# Inventory & Sales Management System - Complete Implementation Guide

## 📋 Project Overview

A production-ready Inventory & Sales Management System built with:
- **Database**: Microsoft SQL Server with normalized 3NF schema
- **Backend**: NestJS with TypeORM
- **Frontend**: Angular 20 with Signals
- **Architecture**: Modern microservices-ready design with ACID transactions

---

## 🏗️ System Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────┐
│        Angular 20 Frontend              │
│   (Standalone Components + Signals)     │
└─────────────────┬───────────────────────┘
                  │ REST API (HTTP)
                  ↓
┌─────────────────────────────────────────┐
│    NestJS Backend (Node.js)             │
│   TypeORM ← Database Layer              │
└─────────────────┬───────────────────────┘
                  │ Native Driver (mssql)
                  ↓
┌─────────────────────────────────────────┐
│    MS SQL Server Database               │
│   - Stored Procedures                   │
│   - Triggers for Auditing               │
│   - Transaction Management              │
└─────────────────────────────────────────┘
```

---

## 📊 Database Schema (3NF Normalized)

### Tables Overview

| Table | Purpose | Key Constraints |
|-------|---------|-----------------|
| **Roles** | Role-Based Access Control | PK: RoleId |
| **Users** | User Management with RBAC | PK: UserId, FK: RoleId |
| **Categories** | Product Classification | PK: CategoryId |
| **Products** | Master Product Data | PK: ProductId, FK: CategoryId, CHK: Price > 0 |
| **Inventory** | Real-time Stock Tracking | PK: InventoryId, FK: ProductId (1:1), CHK: Qty >= 0 |
| **Sales** | Sales Orders | PK: SaleId, FK: UserId, CHK: Status IN (...) |
| **SaleItems** | Line Items per Sale | PK: SaleItemId, FK: SaleId, FK: ProductId |
| **AuditPriceHistory** | Price Change Audit Trail | PK: AuditId, FK: ProductId, FK: UserId (ChangedBy) |

### Relationships Diagram

```
Roles (1) ──┬─── (N) Users ──┬─── (N) Sales ──┬─── (N) SaleItems ──┬─── (N) Products
            │                │                │                     │
            │                │                └─────────────────────┘
            │                │
            │                └─── (N) AuditPriceHistory
            │
            └─── (Audit Trigger) ──→ Product Price Changes
```

---

## 🔐 ACID Compliance & Transactions

### Stored Procedure: `sp_ProcessSale`

**Purpose**: Process complete sales with ACID guarantees

**Transaction Flow**:
```sql
BEGIN TRANSACTION
  1. Validate user exists and is active
  2. Validate stock availability for all items
  3. Calculate total amount
  4. Insert into Sales table
  5. Insert into SaleItems table
  6. Decrement Inventory quantities
  7. Verify all updates completed
COMMIT (or ROLLBACK on any error)
```

**Error Handling**: Automatic rollback if any step fails

**Example Call**:
```sql
DECLARE @SaleItems SaleItemDetail;
INSERT INTO @SaleItems (ProductId, Quantity, UnitPrice) VALUES
    (1, 1, 1299.99),
    (2, 2, 29.99);

EXEC sp_ProcessSale 
    @UserId = 3,
    @SaleNumber = 'SALE-2024-001',
    @SaleItems = @SaleItems,
    @SaleId = @SaleId OUTPUT,
    @ErrorMessage = @ErrorMessage OUTPUT;
```

### Audit Trigger: `trg_AuditProductPriceChange`

**Purpose**: Automatically log all price changes

**Features**:
- Captures old and new prices
- Records user who made change
- Timestamped automatically
- Triggered on every UPDATE to Products.Price

---

## 🖥️ Backend Architecture (NestJS)

### Project Structure

```
Backend/
├── package.json                 # Dependencies & scripts
└── src/
    ├── main.ts                  # Application bootstrap
    ├── app.module.ts            # Root module configuration
    ├── entities.ts              # TypeORM entity definitions
    ├── services.ts              # Business logic layer
    │   ├── ProductService
    │   ├── InventoryService
    │   ├── SalesService
    │   └── CategoryService
    └── controllers.ts           # REST API endpoints
        ├── ProductsController
        ├── InventoryController
        ├── SalesController
        └── CategoriesController
```

### Services

#### ProductService
- `getAllProducts()` - Retrieve active products with inventory
- `getProductById(id)` - Get specific product details
- `createProduct(data)` - Create new product
- `updateProductPrice(id, newPrice)` - Update price (triggers audit)
- `getPriceHistory(productId)` - Get price audit trail

#### InventoryService
- `getInventoryByProductId(id)` - Get stock levels
- `checkStockAvailability(productId, qty)` - Validate stock
- `getLowStockItems()` - Get items below reorder level
- `updateReorderLevel(productId, level)` - Update reorder threshold

#### SalesService (Stored Procedure Integration)
- `processSale(data)` - **CORE**: Execute `sp_ProcessSale`
  - Calls stored procedure for ACID transaction
  - Validates stock availability
  - Decrements inventory
  - Returns SaleId on success or error details
- `getAllSales(status, limit, offset)` - List sales with filtering
- `getSaleById(id)` - Get sale details with line items
- `cancelSale(id)` - Cancel completed sale
- `getDailySalesReport(days)` - Aggregate sales metrics

### REST API Endpoints

```
GET    /api/products                    # List all products
GET    /api/products/:id                # Get product details
GET    /api/products/category/:id       # List by category
POST   /api/products                    # Create product
PUT    /api/products/:id/price          # Update price (audited)
GET    /api/products/:id/price-history  # Price audit trail

GET    /api/inventory                   # List all inventory
GET    /api/inventory/:productId        # Get stock levels
GET    /api/inventory/low-stock/alert   # Low stock alert
POST   /api/inventory/:productId/check  # Check availability

GET    /api/sales                       # List sales
GET    /api/sales/:id                   # Sale details
GET    /api/sales/user/:userId          # User's sales
POST   /api/sales                       # Create sale (SP)
PUT    /api/sales/:id/cancel            # Cancel sale
GET    /api/sales/reports/daily         # Daily report

GET    /api/categories                  # List categories
POST   /api/categories                  # Create category

GET    /api/health                      # Health check
```

---

## 🎨 Frontend Architecture (Angular 20)

### Project Structure

```
Frontend/
├── package.json                 # Dependencies & scripts
└── src/
    ├── main.ts                  # Bootstrap entry
    ├── index.html               # HTML host
    └── app/
        ├── app.config.ts        # Routing & providers
        ├── app.component.ts     # Root component (layout)
        ├── components.ts        # Standalone components
        │   ├── ProductListComponent
        │   ├── SalesProcessorComponent
        │   └── RecentSalesComponent
        └── services/
            └── index.ts         # Signal-based services
                ├── ProductService
                ├── InventoryService
                ├── SalesService
                └── CategoryService
```

### Angular Signals (Real-time Reactivity)

**What are Signals?**
- New reactive primitive in Angular 20
- Fine-grained change detection
- Better performance than traditional observables
- No need for async pipe overhead

**Example Signal Pattern**:
```typescript
// Define signal
products$ = signal<Product[]>([]);

// Computed derived state
activeProducts = computed(() => {
  return this.products$().filter(p => p.IsActive);
});

// Update signal
this.products$.set(newData);

// Use in template
{{ activeProducts().length }}
```

### Components

#### ProductListComponent
- **Displays**: Inventory dashboard with real-time updates
- **Features**:
  - Auto-refresh every 30 seconds
  - Stats cards (total products, low stock count, inventory value)
  - Product inventory table
  - Low stock alerts
- **Signals Used**:
  - `products$` - All products
  - `activeProducts` - Filtered active products
  - `lowStockProducts` - Below reorder level
  - `totalProductValue` - Calculated inventory value

#### SalesProcessorComponent
- **Purpose**: Create new sales transactions
- **Features**:
  - Dynamic item list (add/remove)
  - Real-time validation
  - Stored procedure execution
  - Success/error messaging
- **Integrates with**: `SalesService.processSale()`

#### RecentSalesComponent
- **Displays**: Last 10 completed sales
- **Features**:
  - Auto-refresh every 15 seconds
  - Status indicators
  - Quick sale details

### Service Implementation

**Auto-Refresh Pattern**:
```typescript
constructor(private http: HttpClient) {
  this.loadProducts();
  
  // Real-time updates: refresh every 30 seconds
  setInterval(() => {
    this.loadProducts();
  }, 30000);
}
```

**Computed Values**:
```typescript
// Derived state with computed signals
totalProductValue = computed(() => {
  return this.products$().reduce((total, p) => {
    const qty = p.inventory?.Quantity || 0;
    return total + p.Price * qty;
  }, 0);
});
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (for NestJS backend)
- **Angular CLI** 20+
- **MS SQL Server** 2019+ or Azure SQL
- **npm** or **yarn**

### Database Setup

1. **Create Database**:
```sql
CREATE DATABASE InventorySalesDB;
GO
```

2. **Execute DDL Script**:
```bash
# Run in SQL Server Management Studio or sqlcmd
sqlcmd -S localhost -U sa -P "Password123!" -d InventorySalesDB -i Database/SQL/01-schema-initialization.sql
sqlcmd -S localhost -U sa -P "Password123!" -d InventorySalesDB -i Database/SQL/02-stored-procedure-sale.sql
sqlcmd -S localhost -U sa -P "Password123!" -d InventorySalesDB -i Database/SQL/03-audit-trigger.sql
```

### Backend Setup

1. **Install Dependencies**:
```bash
cd Backend
npm install
```

2. **Create .env file**:
```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=Password123!
DB_NAME=InventorySalesDB
```

3. **Start Backend**:
```bash
npm run start:dev
```

Backend will start on `http://localhost:3000`

### Frontend Setup

1. **Install Dependencies**:
```bash
cd Frontend
npm install
```

2. **Configure API URL** (update in services if needed):
```typescript
private apiUrl = '/api/products'; // Adjust if backend on different host
```

3. **Start Frontend**:
```bash
npm start
```

Frontend will start on `http://localhost:4200`

---

## 🧪 Testing the System

### 1. Test Inventory Dashboard
- Navigate to `http://localhost:4200/dashboard`
- Observe real-time inventory data
- Check auto-refresh every 30 seconds

### 2. Test Sales Processing
- Go to `/sales`
- Create a sale with:
  - User: Salesperson (ID 3)
  - Sale Number: SALE-2024-001
  - Items: Product 1 (Qty 1, Price 1299.99)
- Verify sale processes via stored procedure
- Check inventory decremented automatically

### 3. Test Price Auditing
- Update product price from backend:
```sql
UPDATE Products SET Price = 1399.99 WHERE ProductId = 1;
SELECT * FROM AuditPriceHistory ORDER BY AuditId DESC;
```
- Verify trigger logged the change

### 4. Test Stock Validation
- Try to create sale with quantity exceeding stock
- Verify error message returned by `sp_ProcessSale`

---

## 📈 Performance Optimizations

### Database
- **Indexes** on foreign keys and frequently searched columns
- **Check Constraints** for data validation at DB level
- **Stored Procedures** for complex business logic

### Backend
- **TypeORM Caching** for entity queries
- **Connection Pooling** for MS SQL driver
- **Lazy Loading** of related entities

### Frontend
- **Signals** instead of observables for fine-grained reactivity
- **Auto-refresh intervals** for periodic data sync
- **Computed Signals** avoid recalculation on dependent value changes

---

## 🔐 Security Considerations

### Implemented
- ✅ RBAC (Role-Based Access Control) in Users/Roles tables
- ✅ Input validation in stored procedures
- ✅ Audit trail for price changes (compliance)
- ✅ CORS enabled for frontend communication

### Recommendations for Production
- [ ] Implement JWT authentication
- [ ] Add API rate limiting
- [ ] Enable HTTPS/TLS
- [ ] Implement row-level security (RLS) in SQL
- [ ] Add audit logging for all user actions
- [ ] Encrypt sensitive data in transit and at rest

---

## 📝 API Response Examples

### Create Sale (Success)
```json
{
  "SaleId": 1,
  "Success": true,
  "Message": "Sale SALE-2024-001 processed successfully"
}
```

### Create Sale (Error - Insufficient Stock)
```json
{
  "SaleId": 0,
  "Success": false,
  "Message": "Insufficient stock: ProductId 1 - Requested: 100, Available: 15"
}
```

### Get Products
```json
[
  {
    "ProductId": 1,
    "ProductName": "Laptop Pro",
    "Price": 1299.99,
    "SKU": "SKU-LP-001",
    "inventory": {
      "Quantity": 15,
      "ReorderLevel": 5
    }
  }
]
```

---

## 🎯 Key Architectural Decisions

1. **Stored Procedures for Complex Logic**: `sp_ProcessSale` runs in database for ACID compliance
2. **Signals for UI Reactivity**: Angular 20 signals enable fine-grained updates without observable overhead
3. **TypeORM with Raw SQL**: Flexibility to execute stored procedures alongside ORM queries
4. **3NF Database Design**: Ensures data integrity and eliminates redundancy
5. **Trigger-based Auditing**: Automatic price history without application layer overhead

---

## 📚 References

- [NestJS Documentation](https://docs.nestjs.com)
- [Angular 20 Signals](https://angular.io/guide/signals)
- [TypeORM Documentation](https://typeorm.io)
- [MS SQL Server Stored Procedures](https://docs.microsoft.com/en-us/sql/t-sql/statements/create-procedure-transact-sql)
- [ACID Transactions](https://en.wikipedia.org/wiki/ACID)

---

## 📧 Support

For issues or questions:
1. Check the SQL error logs: `View → Error List` in SSMS
2. Check backend logs: Terminal output from `npm run start:dev`
3. Check browser console: F12 → Console tab
4. Review database schema: Run validation scripts in SQL

---

**System Version**: 1.0.0  
**Last Updated**: April 30, 2026  
**Database**: MS SQL Server  
**Backend**: NestJS 10.x  
**Frontend**: Angular 20  
