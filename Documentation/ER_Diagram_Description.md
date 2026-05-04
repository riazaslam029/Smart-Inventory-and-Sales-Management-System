# Entity Relationship Diagram (ERD) - Inventory & Sales Management System

## Entities and Relationships

### 1. **Roles Entity**
   - **Attributes**: RoleId (PK), RoleName, Description, CreatedAt
   - **Purpose**: Defines user roles for RBAC (Admin, Manager, Salesperson, Viewer)

### 2. **Users Entity**
   - **Attributes**: UserId (PK), Username, Email, PasswordHash, RoleId (FK), IsActive, CreatedAt, UpdatedAt
   - **Relationships**:
     - **1:N** with Roles (Each user has one role, one role has many users)
     - **1:N** with Sales (Each user processes multiple sales)
     - **1:N** with AuditPriceHistory (Each user makes price changes)

### 3. **Categories Entity**
   - **Attributes**: CategoryId (PK), CategoryName, Description, IsActive, CreatedAt
   - **Purpose**: Classifies products into logical groups
   - **Relationships**:
     - **1:N** with Products (One category has many products)

### 4. **Products Entity**
   - **Attributes**: ProductId (PK), ProductName, Description, CategoryId (FK), Price, SKU, IsActive, CreatedAt, UpdatedAt
   - **Constraints**: Price > 0 (CHECK), SKU unique
   - **Relationships**:
     - **N:1** with Categories (Many products in one category)
     - **1:1** with Inventory (One product has one inventory record)
     - **1:N** with SaleItems (One product appears in multiple sale items)
     - **1:N** with AuditPriceHistory (One product has many price audit records)

### 5. **Inventory Entity**
   - **Attributes**: InventoryId (PK), ProductId (FK/UQ), Quantity, ReorderLevel, MaxStock, LastRestockedAt, UpdatedAt
   - **Constraints**: 
     - Quantity >= 0
     - ReorderLevel >= 0
     - MaxStock > 0 or NULL
   - **Purpose**: Tracks stock levels for each product
   - **Relationships**:
     - **1:1** with Products (One-to-one relationship: each product has exactly one inventory record)

### 6. **Sales Entity**
   - **Attributes**: SaleId (PK), SaleNumber (UQ), UserId (FK), SaleDate, TotalAmount, SaleStatus, Notes, CreatedAt, UpdatedAt
   - **Constraints**: 
     - TotalAmount >= 0
     - SaleStatus IN ('Completed', 'Cancelled', 'Pending')
   - **Purpose**: Records completed sales transactions
   - **Relationships**:
     - **N:1** with Users (Many sales by one user)
     - **1:N** with SaleItems (One sale has many line items)

### 7. **SaleItems Entity**
   - **Attributes**: SaleItemId (PK), SaleId (FK), ProductId (FK), Quantity, UnitPrice, LineTotal, CreatedAt
   - **Constraints**:
     - Quantity > 0
     - UnitPrice > 0
     - LineTotal > 0
   - **Purpose**: Line items within each sale transaction
   - **Relationships**:
     - **N:1** with Sales (Many items in one sale)
     - **N:1** with Products (Many sale items for one product)

### 8. **AuditPriceHistory Entity**
   - **Attributes**: AuditId (PK), ProductId (FK), OldPrice, NewPrice, ChangedBy (FK), ChangeReason, ChangedAt
   - **Purpose**: Audit trail for all product price changes (triggered automatically)
   - **Relationships**:
     - **N:1** with Products (Many audit records for one product)
     - **N:1** with Users (Changes made by various users)

---

## Relationship Summary

```
Roles (1) ──── (N) Users ──── (N) Sales ──── (N) SaleItems
                    │                              │
                    │                              └── (N) Products (1) ──── (1) Inventory
                    │                                        │
                    └────── (N) AuditPriceHistory ◄──────────┘
                                
Categories (1) ──── (N) Products (1) ──── (1) Inventory
```

---

## Normalization (3NF Compliance)

### First Normal Form (1NF)
- All attributes are atomic (no multi-valued attributes)
- Each cell contains only a single value

### Second Normal Form (2NF)
- All non-key attributes are fully dependent on the primary key
- No partial dependencies

### Third Normal Form (3NF)
- No transitive dependencies
- All non-key attributes depend only on the primary key
- Examples:
  - Categories are separate from Products (not repeating)
  - Inventory is separate from Products (tracking data vs. master data)
  - AuditPriceHistory is separate from Products (historical data)

---

## Key Constraints & Referential Integrity

| Constraint | Details |
|-----------|---------|
| **ON DELETE CASCADE** | SaleItems ← Sales, AuditPriceHistory ← Products, Inventory ← Products |
| **ON DELETE RESTRICT** | Products ← Categories, Sales ← Users, SaleItems ← Products |
| **CHECK Constraints** | Price > 0, Stock >= 0, Quantities > 0, TotalAmount >= 0 |
| **UNIQUE Constraints** | SKU (Products), SaleNumber (Sales), Inventory.ProductId |

---

## Data Flow Diagram

```
User Login
    ↓
[Roles & Users] ← RBAC Check
    ↓
View Products/Inventory
    ↓
[Categories ← Products ← Inventory]
    ↓
Create Sale
    ↓
[sp_ProcessSale Validation]
    → Check Stock (Inventory)
    → Validate User
    → Insert Sales Record
    → Insert SaleItems Records
    → Update Inventory (Decrement)
    ↓
[Sales ← SaleItems → Products]
    ↓
Price Update
    ↓
[trg_AuditProductPriceChange] (Automatic)
    ↓
[AuditPriceHistory]
```

---

## Database Design Patterns Used

1. **Surrogate Keys**: All entities use IDENTITY-based integer primary keys for performance
2. **Auditing**: Automatic trigger-based price history tracking
3. **ACID Transactions**: Stored procedure with rollback capability for complex operations
4. **Referential Integrity**: Foreign keys with appropriate delete strategies
5. **Data Validation**: CHECK constraints at database level
6. **Indexing Strategy**: Indexes on frequently queried columns (FK, Status, Date)
