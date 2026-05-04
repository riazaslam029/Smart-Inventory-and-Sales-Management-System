# Database Project Proposal

## Keywords
Relational database, normalization, 3NF, ACID transactions, stored procedures, triggers, auditing, indexing, SQL reporting.
## Methodology
1. Requirements analysis for inventory, sales, and auditing.
2. Conceptual modeling using ER methodology (entities, relationships, cardinalities).
3. Logical design mapped to relational tables in 3NF.
4. Integrity enforcement via PK, FK, and CHECK constraints.
5. Transaction design using stored procedures (ACID compliance).
6. Auditing design using triggers and history tables.
7. Indexing strategy based on expected query patterns.
8. Validation with sample data and report queries.
## Assumptions
- One inventory record per product (1:1 relationship).
- Sales are immutable after completion; cancellation updates status only.
- Historical prices must be stored at the time of sale (UnitPrice in SaleItems).
- Audit log is append-only and does not modify base product prices.

## Limitations
- Authentication is basic for demonstration; production security is out of scope.
- Inventory adjustments are limited to sales transactions and manual updates.
- Concurrency is handled at the database transaction level only.
## ER Methodology (Conceptual Model)
Entities and relationships:
- Roles (1) to Users (many)
- Users (1) to Sales (many)
- Categories (1) to Products (many)
- Products (1) to Inventory (1)
- Sales (1) to SaleItems (many)
- Products (1) to SaleItems (many)
- Products (1) to AuditPriceHistory (many)
- Users (1) to AuditPriceHistory (many)

Cardinality rules:
- A product must belong to exactly one category.
- A sale must be created by exactly one user.
- A sale item must reference exactly one product and one sale.

ER diagram notes for SSMS Database Diagram:
- Use PK/FK keys defined in the schema.
- Inventory uses a unique ProductId to enforce 1:1.
## UML (Class View for Database Entities)
The UML class view mirrors the ER model in table form:
- Role {RoleId, RoleName, Description}
- User {UserId, Username, Email, RoleId, IsActive}
- Category {CategoryId, CategoryName, IsActive}
- Product {ProductId, ProductName, CategoryId, Price, SKU, IsActive}
- Inventory {InventoryId, ProductId, Quantity, ReorderLevel}
- Sale {SaleId, SaleNumber, UserId, TotalAmount, SaleStatus}
- SaleItem {SaleItemId, SaleId, ProductId, Quantity, UnitPrice, LineTotal}
- AuditPriceHistory {AuditId, ProductId, OldPrice, NewPrice, ChangedBy}

Associations:
- Role 1..* Users
- User 1..* Sales
- Category 1..* Products
- Product 1..1 Inventory
- Sale 1..* SaleItems
- Product 1..* SaleItems
- Product 1..* AuditPriceHistory
- User 1..* AuditPriceHistory
## Validation and Testing
- Insert sample data and verify FK integrity.
- Run sp_ProcessSale with valid and invalid stock quantities.
- Verify trigger inserts in AuditPriceHistory on price updates.
- Execute reporting queries and validate totals.

## Security and Data Governance
- Passwords stored as hash (PasswordHash).
- User activity controlled via IsActive.
- Audit table stores immutable change history.

## References
- Microsoft SQL Server documentation
- Date and time functions: GETUTCDATE()
- ACID transaction principles
## Deliverables
- Optional UI/API for demonstration
# Database Project Proposal

## Title
Inventory & Sales Management System (Database-Centric Implementation)

## Abstract
This project designs and implements a relational database for managing inventory, sales, and pricing changes. The core focus is a normalized schema in 3NF with enforced integrity constraints, transactional sales processing, and auditing. The database supports academic-level reporting through indexed query paths and aggregated insights. A minimal backend and UI are included only to demonstrate practical usage of the database and are not the primary evaluation focus.

## Problem Statement
Small and medium businesses often manage inventory and sales with inconsistent or manual processes, leading to stock inaccuracies, missing audit trails, and unreliable reporting. This project addresses those issues by enforcing structured data relationships, validating business rules at the database level, and providing repeatable transaction logic with auditing.

## Objectives (Database-Focused)
- Design a 3NF relational schema with clear entity boundaries.
- Enforce data integrity using PRIMARY KEY, FOREIGN KEY, and CHECK constraints.
- Implement ACID-compliant sales processing via a stored procedure.
- Capture pricing changes using a database trigger for audit history.
- Improve query performance using targeted indexes.
- Provide academic reporting queries with joins and aggregations.

## Scope
### Included (Core Database Scope)
- Tables: Roles, Users, Categories, Products, Inventory, Sales, SaleItems, AuditPriceHistory
- Stored Procedure: sp_ProcessSale
- Trigger: trg_AuditProductPriceChange
- Constraints: PK, FK, CHECK, UNIQUE
- Indexing strategy for high-frequency queries
- Sample data and analytical SQL reports

### Optional (Demonstration Only)
- Backend API layer to invoke stored procedures
- UI layer to visualize inventory and sales workflows

## Database Design Summary (3NF)
- Each table represents a single entity (1NF).
- Non-key attributes depend only on their table primary key (2NF).
- No transitive dependencies; related data is separated into related tables (3NF).

Examples:
- Product category details are stored only in Categoraies, referenced by Products.
- User information is stored only in Users, referenced by Sales and AuditPriceHistory.
- SaleItems stores line items linked to Sales and Products.

## Integrity and Constraints
- PRIMARY KEY on all tables for entity integrity.
- FOREIGN KEY constraints with ON DELETE behavior for referential integrity.
- CHECK constraints for domain validity (price > 0, quantity >= 0, valid status).
- UNIQUE constraints for SKU, SaleNumber, Username, Email.

## Transactions and Auditing
- sp_ProcessSale handles validation, inserts, and inventory updates in one transaction.
- Transactions are ACID-compliant with rollback on any failure.
- trg_AuditProductPriceChange logs every product price change to AuditPriceHistory.

## Indexing Strategy
Indexes are added to support the most frequent query patterns:
- Products(IsActive, CategoryId) for catalog filtering.
- Sales(SaleStatus, SaleDate) for reporting.
- SaleItems(SaleId, ProductId) for invoice and sales detail lookups.
- Inventory(ReorderLevel, Quantity) for low-stock alerts.

## Academic Reporting Queries (Examples)
1. Top selling products by quantity.
2. Daily revenue summary with counts and totals.
3. Low-stock inventory list for reordering.
4. Sales performance by user.
5. Category revenue contribution.

## Optional Technology Stack (Demonstration Layer)
- UI: Angular (standalone components, signals)
- Styling: Tailwind CSS utility classes
- Backend API: NestJS (TypeScript)
- ORM (for entity mapping): TypeORM
- Database engine: Microsoft SQL Server
- Local tooling: SSMS for ER diagrams and query visualization

## Deliverables
- SQL DDL scripts for schema creation
- Stored procedure and trigger scripts
- Index definitions
- Sample data
- Report queries
- Optional UI/API for demonstration

## Conclusion
This project is suitable for a database-focused academic evaluation because it prioritizes normalization, integrity, and transaction control. The optional UI and backend demonstrate applied usage but do not replace the core database objectives.
