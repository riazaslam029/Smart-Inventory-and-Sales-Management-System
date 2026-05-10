-- ============================================================================
-- InventorySystem - Objects, Views, Functions, Procedures, Synonyms, Security
-- ============================================================================
USE InventorySystem;
GO

-- ============================================================================
-- VIEWS
-- ============================================================================
CREATE OR ALTER VIEW vw_ProductInventory
AS
SELECT
    p.ProductId,
    p.ProductName,
    p.SKU,
    c.CategoryName,
    p.Price,
    i.Quantity,
    i.ReorderLevel,
    i.MaxStock,
    p.IsActive
FROM Products p
INNER JOIN Categories c ON c.CategoryId = p.CategoryId
INNER JOIN Inventory i ON i.ProductId = p.ProductId;
GO

CREATE OR ALTER VIEW vw_SalesSummary
AS
SELECT
    s.SaleId,
    s.SaleNumber,
    s.SaleDate,
    s.TotalAmount,
    s.SaleStatus,
    u.Username AS SoldBy,
    COUNT(si.SaleItemId) AS ItemCount
FROM Sales s
INNER JOIN Users u ON u.UserId = s.UserId
LEFT JOIN SaleItems si ON si.SaleId = s.SaleId
GROUP BY
    s.SaleId,
    s.SaleNumber,
    s.SaleDate,
    s.TotalAmount,
    s.SaleStatus,
    u.Username;
GO

CREATE OR ALTER VIEW vw_LowStockProducts
AS
SELECT
    p.ProductId,
    p.ProductName,
    i.Quantity,
    i.ReorderLevel,
    p.IsActive
FROM Inventory i
INNER JOIN Products p ON p.ProductId = i.ProductId
WHERE i.Quantity <= i.ReorderLevel;
GO

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
CREATE OR ALTER FUNCTION fn_CalcLineTotal
(
    @Quantity INT,
    @UnitPrice DECIMAL(10, 2)
)
RETURNS DECIMAL(12, 2)
AS
BEGIN
    RETURN CAST(@Quantity AS DECIMAL(12, 2)) * @UnitPrice;
END;
GO

CREATE OR ALTER FUNCTION fn_SalesByDateRange
(
    @StartDate DATE,
    @EndDate DATE
)
RETURNS TABLE
AS
RETURN
(
    SELECT
        s.SaleId,
        s.SaleNumber,
        s.SaleDate,
        s.TotalAmount,
        u.Username AS SoldBy
    FROM Sales s
    INNER JOIN Users u ON u.UserId = s.UserId
    WHERE s.SaleDate >= @StartDate
      AND s.SaleDate < DATEADD(DAY, 1, @EndDate)
);
GO

-- ============================================================================
-- PROCEDURES
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_RestockProduct
    @ProductId INT,
    @Quantity INT,
    @ChangedBy INT,
    @Reason NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Quantity <= 0
    BEGIN
        THROW 51001, 'Quantity must be greater than zero.', 1;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM Inventory WHERE ProductId = @ProductId)
        BEGIN
            UPDATE Inventory
            SET Quantity = Quantity + @Quantity,
                UpdatedAt = GETUTCDATE()
            WHERE ProductId = @ProductId;
        END
        ELSE
        BEGIN
            INSERT INTO Inventory (ProductId, Quantity, ReorderLevel, MaxStock)
            VALUES (@ProductId, @Quantity, 10, NULL);
        END

        EXEC sys.sp_set_session_context @key = N'UserId', @value = @ChangedBy;
        EXEC sys.sp_set_session_context @key = N'ChangeReason', @value = ISNULL(@Reason, 'Restock');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_AdjustInventory
    @ProductId INT,
    @NewQuantity INT,
    @ChangedBy INT,
    @Reason NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @NewQuantity < 0
    BEGIN
        THROW 51002, 'New quantity cannot be negative.', 1;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE Inventory
        SET Quantity = @NewQuantity,
            UpdatedAt = GETUTCDATE()
        WHERE ProductId = @ProductId;

        IF @@ROWCOUNT = 0
        BEGIN
            THROW 51003, 'Product inventory record not found.', 1;
        END

        EXEC sys.sp_set_session_context @key = N'UserId', @value = @ChangedBy;
        EXEC sys.sp_set_session_context @key = N'ChangeReason', @value = ISNULL(@Reason, 'Inventory adjustment');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE OR ALTER TRIGGER trg_AuditInventoryChange
ON Inventory
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(Quantity)
    BEGIN
        DECLARE @ChangedBy INT = TRY_CAST(SESSION_CONTEXT(N'UserId') AS INT);
        DECLARE @Reason NVARCHAR(500) = TRY_CAST(SESSION_CONTEXT(N'ChangeReason') AS NVARCHAR(500));

        IF @ChangedBy IS NULL
            SET @ChangedBy = 1;

        INSERT INTO AuditInventoryChanges (ProductId, OldQuantity, NewQuantity, ChangedBy, ChangeReason)
        SELECT
            inserted.ProductId,
            deleted.Quantity AS OldQuantity,
            inserted.Quantity AS NewQuantity,
            @ChangedBy,
            ISNULL(@Reason, 'Inventory updated')
        FROM inserted
        INNER JOIN deleted ON inserted.ProductId = deleted.ProductId
        WHERE inserted.Quantity <> deleted.Quantity;
    END
END;
GO

-- ============================================================================
-- SYNONYMS
-- ============================================================================
IF OBJECT_ID('dbo.Syn_Products', 'SN') IS NOT NULL
    DROP SYNONYM dbo.Syn_Products;
GO
CREATE SYNONYM dbo.Syn_Products FOR dbo.Products;
GO

IF OBJECT_ID('dbo.Syn_Inventory', 'SN') IS NOT NULL
    DROP SYNONYM dbo.Syn_Inventory;
GO
CREATE SYNONYM dbo.Syn_Inventory FOR dbo.Inventory;
GO

IF OBJECT_ID('dbo.Syn_Sales', 'SN') IS NOT NULL
    DROP SYNONYM dbo.Syn_Sales;
GO
CREATE SYNONYM dbo.Syn_Sales FOR dbo.Sales;
GO

-- ============================================================================
-- ROLES AND PERMISSIONS
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'InventoryAdmin')
    CREATE ROLE InventoryAdmin;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'InventoryManager')
    CREATE ROLE InventoryManager;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'InventorySales')
    CREATE ROLE InventorySales;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'InventoryViewer')
    CREATE ROLE InventoryViewer;
GO

GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Roles TO InventoryAdmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Users TO InventoryAdmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Categories TO InventoryAdmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Products TO InventoryAdmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Inventory TO InventoryAdmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Sales TO InventoryAdmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.SaleItems TO InventoryAdmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.AuditPriceHistory TO InventoryAdmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.AuditInventoryChanges TO InventoryAdmin;
GRANT EXECUTE ON dbo.sp_ProcessSale TO InventoryAdmin;
GRANT EXECUTE ON dbo.sp_RestockProduct TO InventoryAdmin;
GRANT EXECUTE ON dbo.sp_AdjustInventory TO InventoryAdmin;

GRANT SELECT, INSERT, UPDATE ON dbo.Categories TO InventoryManager;
GRANT SELECT, INSERT, UPDATE ON dbo.Products TO InventoryManager;
GRANT SELECT, INSERT, UPDATE ON dbo.Inventory TO InventoryManager;
GRANT SELECT ON dbo.Sales TO InventoryManager;
GRANT SELECT ON dbo.SaleItems TO InventoryManager;
GRANT EXECUTE ON dbo.sp_ProcessSale TO InventoryManager;
GRANT EXECUTE ON dbo.sp_RestockProduct TO InventoryManager;
GRANT EXECUTE ON dbo.sp_AdjustInventory TO InventoryManager;
GRANT SELECT ON dbo.vw_ProductInventory TO InventoryManager;
GRANT SELECT ON dbo.vw_SalesSummary TO InventoryManager;
GRANT SELECT ON dbo.vw_LowStockProducts TO InventoryManager;

GRANT SELECT ON dbo.Categories TO InventorySales;
GRANT SELECT ON dbo.Products TO InventorySales;
GRANT SELECT ON dbo.Inventory TO InventorySales;
GRANT INSERT ON dbo.Sales TO InventorySales;
GRANT INSERT ON dbo.SaleItems TO InventorySales;
GRANT EXECUTE ON dbo.sp_ProcessSale TO InventorySales;
GRANT SELECT ON dbo.vw_ProductInventory TO InventorySales;

GRANT SELECT ON dbo.vw_ProductInventory TO InventoryViewer;
GRANT SELECT ON dbo.vw_SalesSummary TO InventoryViewer;
GRANT SELECT ON dbo.vw_LowStockProducts TO InventoryViewer;
GO
