/**
 * Inventory & Sales Management System
 * MS SQL Database Schema - Full DDL Script
 * ACID compliant with normalized 3NF design
 */

-- ============================================================================
-- DATABASE INITIALIZATION
-- ============================================================================
IF DB_ID('InventorySystem') IS NULL
BEGIN
    CREATE DATABASE InventorySystem;
END
GO

USE InventorySystem;
GO

-- ============================================================================
-- 1. ROLES TABLE (for RBAC)
-- ============================================================================
CREATE TABLE Roles (
    RoleId INT PRIMARY KEY IDENTITY(1,1),
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETUTCDATE()
);

INSERT INTO Roles (RoleName, Description) VALUES
    ('Admin', 'Full system access'),
    ('Manager', 'Can manage inventory and view sales'),
    ('Salesperson', 'Can process sales and view inventory'),
    ('Viewer', 'Read-only access');

-- ============================================================================
-- 2. USERS TABLE (RBAC - User Management)
-- ============================================================================
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(100) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    RoleId INT NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(RoleId) ON DELETE RESTRICT
);

-- ============================================================================
-- 3. CATEGORIES TABLE
-- ============================================================================
CREATE TABLE Categories (
    CategoryId INT PRIMARY KEY IDENTITY(1,1),
    CategoryName NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETUTCDATE()
);

-- ============================================================================
-- 4. PRODUCTS TABLE
-- ============================================================================
CREATE TABLE Products (
    ProductId INT PRIMARY KEY IDENTITY(1,1),
    ProductName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000),
    CategoryId INT NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    SKU NVARCHAR(50) NOT NULL UNIQUE,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId) ON DELETE RESTRICT,
    CONSTRAINT CHK_Products_Price CHECK (Price > 0),
    CONSTRAINT CHK_Products_NameNotEmpty CHECK (LTRIM(RTRIM(ProductName)) <> '')
);

-- ============================================================================
-- 5. INVENTORY TABLE (Stock Tracking)
-- ============================================================================
CREATE TABLE Inventory (
    InventoryId INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    ReorderLevel INT DEFAULT 10,
    MaxStock INT,
    LastRestockedAt DATETIME DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Inventory_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE,
    CONSTRAINT UQ_Inventory_ProductId UNIQUE (ProductId),
    CONSTRAINT CHK_Inventory_Quantity CHECK (Quantity >= 0),
    CONSTRAINT CHK_Inventory_ReorderLevel CHECK (ReorderLevel >= 0),
    CONSTRAINT CHK_Inventory_MaxStock CHECK (MaxStock > 0 OR MaxStock IS NULL),
    CONSTRAINT CHK_Inventory_ReorderVsMax CHECK (MaxStock IS NULL OR ReorderLevel <= MaxStock)
);

-- ============================================================================
-- 6. SALES TABLE (Orders)
-- ============================================================================
CREATE TABLE Sales (
    SaleId INT PRIMARY KEY IDENTITY(1,1),
    SaleNumber NVARCHAR(50) NOT NULL UNIQUE,
    UserId INT NOT NULL,
    SaleDate DATETIME DEFAULT GETUTCDATE(),
    TotalAmount DECIMAL(12, 2) NOT NULL,
    SaleStatus NVARCHAR(20) DEFAULT 'Completed' CHECK (SaleStatus IN ('Completed', 'Cancelled', 'Pending')),
    Notes NVARCHAR(500),
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Sales_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE RESTRICT,
    CONSTRAINT CHK_Sales_TotalAmount CHECK (TotalAmount >= 0),
    CONSTRAINT CHK_Sales_SaleNumberNotEmpty CHECK (LTRIM(RTRIM(SaleNumber)) <> '')
);

-- ============================================================================
-- 7. SALE_ITEMS TABLE (Line Items)
-- ============================================================================
CREATE TABLE SaleItems (
    SaleItemId INT PRIMARY KEY IDENTITY(1,1),
    SaleId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10, 2) NOT NULL,
    LineTotal DECIMAL(12, 2) NOT NULL,
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_SaleItems_Sales FOREIGN KEY (SaleId) REFERENCES Sales(SaleId) ON DELETE CASCADE,
    CONSTRAINT FK_SaleItems_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE RESTRICT,
    CONSTRAINT CHK_SaleItems_Quantity CHECK (Quantity > 0),
    CONSTRAINT CHK_SaleItems_UnitPrice CHECK (UnitPrice > 0),
    CONSTRAINT CHK_SaleItems_LineTotal CHECK (LineTotal > 0)
);

-- ============================================================================
-- 8. AUDIT_PRICE_HISTORY TABLE (Auditing)
-- ============================================================================
CREATE TABLE AuditPriceHistory (
    AuditId INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    OldPrice DECIMAL(10, 2),
    NewPrice DECIMAL(10, 2) NOT NULL,
    ChangedBy INT NOT NULL,
    ChangeReason NVARCHAR(500),
    ChangedAt DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_AuditPriceHistory_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE,
    CONSTRAINT FK_AuditPriceHistory_Users FOREIGN KEY (ChangedBy) REFERENCES Users(UserId) ON DELETE RESTRICT
);

-- ============================================================================
-- 9. AUDIT_INVENTORY_CHANGES TABLE (Auditing)
-- ============================================================================
CREATE TABLE AuditInventoryChanges (
    AuditId INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    OldQuantity INT NOT NULL,
    NewQuantity INT NOT NULL,
    ChangedBy INT NOT NULL,
    ChangeReason NVARCHAR(500),
    ChangedAt DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_AuditInventoryChanges_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE,
    CONSTRAINT FK_AuditInventoryChanges_Users FOREIGN KEY (ChangedBy) REFERENCES Users(UserId) ON DELETE RESTRICT
);

ALTER TABLE Users
ADD CONSTRAINT CHK_Users_EmailFormat CHECK (Email LIKE '%@%.__%');

-- ============================================================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IDX_Users_RoleId ON Users(RoleId);
CREATE INDEX IDX_Users_Email ON Users(Email);
CREATE INDEX IDX_Products_CategoryId ON Products(CategoryId);
CREATE INDEX IDX_Products_SKU ON Products(SKU);
CREATE INDEX IDX_Products_ActiveCategory ON Products(IsActive, CategoryId);
CREATE INDEX IDX_Sales_UserId ON Sales(UserId);
CREATE INDEX IDX_Sales_SaleDate ON Sales(SaleDate);
CREATE INDEX IDX_Sales_SaleStatus ON Sales(SaleStatus);
CREATE INDEX IDX_Sales_StatusDate ON Sales(SaleStatus, SaleDate);
CREATE INDEX IDX_SaleItems_SaleId ON SaleItems(SaleId);
CREATE INDEX IDX_SaleItems_ProductId ON SaleItems(ProductId);
CREATE INDEX IDX_SaleItems_Sale_Product ON SaleItems(SaleId, ProductId);
CREATE INDEX IDX_AuditPriceHistory_ProductId ON AuditPriceHistory(ProductId);
CREATE INDEX IDX_AuditPriceHistory_ChangedAt ON AuditPriceHistory(ChangedAt);
CREATE INDEX IDX_AuditInventoryChanges_ProductId ON AuditInventoryChanges(ProductId);
CREATE INDEX IDX_AuditInventoryChanges_ChangedAt ON AuditInventoryChanges(ChangedAt);
CREATE INDEX IDX_Inventory_ProductId ON Inventory(ProductId);
CREATE INDEX IDX_Inventory_Reorder ON Inventory(ReorderLevel, Quantity);

-- ============================================================================
-- 11. SAMPLE DATA FOR TESTING
-- ============================================================================
INSERT INTO Categories (CategoryName, Description) VALUES
    ('Electronics', 'Electronic devices and gadgets'),
    ('Clothing', 'Apparel and fashion items'),
    ('Books', 'Educational and recreational books'),
    ('Home & Garden', 'Home and outdoor products');

INSERT INTO Products (ProductName, Description, CategoryId, Price, SKU) VALUES
    ('Laptop Pro', 'High-performance laptop', 1, 1299.99, 'SKU-LP-001'),
    ('Wireless Mouse', 'Bluetooth mouse', 1, 29.99, 'SKU-MS-001'),
    ('T-Shirt', 'Cotton t-shirt', 2, 19.99, 'SKU-TS-001'),
    ('SQL Guide', 'Database programming book', 3, 49.99, 'SKU-BK-001'),
    ('Office Chair', 'Ergonomic office chair', 4, 199.99, 'SKU-CH-001');

INSERT INTO Inventory (ProductId, Quantity, ReorderLevel, MaxStock) VALUES
    (1, 15, 5, 50),
    (2, 100, 20, 200),
    (3, 75, 10, 150),
    (4, 30, 5, 100),
    (5, 10, 3, 40);

INSERT INTO Users (Username, Email, PasswordHash, RoleId) VALUES
    ('admin_user', 'admin@inventory.local', 'hashed_password_1', 1),
    ('manager_user', 'manager@inventory.local', 'hashed_password_2', 2),
    ('sales_user', 'sales@inventory.local', 'hashed_password_3', 3),
    ('viewer_user', 'viewer@inventory.local', 'hashed_password_4', 4);

PRINT 'Database Schema Created Successfully!';

-- ============================================================================
-- 12. ACADEMIC QUERIES (REPORTS)
-- ============================================================================
-- A) Top selling products
-- SELECT TOP 5 p.ProductName, SUM(si.Quantity) AS TotalUnits
-- FROM SaleItems si
-- JOIN Products p ON p.ProductId = si.ProductId
-- GROUP BY p.ProductName
-- ORDER BY TotalUnits DESC;

-- B) Daily sales revenue
-- SELECT CAST(SaleDate AS DATE) AS SaleDay,
--        COUNT(*) AS SalesCount,
--        SUM(TotalAmount) AS Revenue
-- FROM Sales
-- GROUP BY CAST(SaleDate AS DATE)
-- ORDER BY SaleDay DESC;

-- C) Low stock products
-- SELECT p.ProductName, i.Quantity, i.ReorderLevel
-- FROM Inventory i
-- JOIN Products p ON p.ProductId = i.ProductId
-- WHERE i.Quantity <= i.ReorderLevel
-- ORDER BY i.Quantity ASC;

-- D) Sales by user
-- SELECT u.Username, COUNT(*) AS TotalSales, SUM(s.TotalAmount) AS Revenue
-- FROM Sales s
-- JOIN Users u ON u.UserId = s.UserId
-- GROUP BY u.Username
-- ORDER BY Revenue DESC;

-- E) Category revenue contribution
-- SELECT c.CategoryName, SUM(si.LineTotal) AS CategoryRevenue
-- FROM SaleItems si
-- JOIN Products p ON p.ProductId = si.ProductId
-- JOIN Categories c ON c.CategoryId = p.CategoryId
-- GROUP BY c.CategoryName
-- ORDER BY CategoryRevenue DESC;
