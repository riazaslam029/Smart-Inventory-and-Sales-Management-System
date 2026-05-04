/**
 * Audit Trigger: trg_AuditProductPriceChange
 * Purpose: Automatically log all price changes in Products table to AuditPriceHistory
 * Captures: Old price, new price, user who made change, timestamp
 */

CREATE TRIGGER trg_AuditProductPriceChange
ON Products
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Only process if the Price column was actually updated
    IF UPDATE(Price)
    BEGIN
        -- Note: Use session context for user and reason when available
        DECLARE @ChangedBy INT = TRY_CAST(SESSION_CONTEXT(N'UserId') AS INT);
        DECLARE @Reason NVARCHAR(500) = TRY_CAST(SESSION_CONTEXT(N'ChangeReason') AS NVARCHAR(500));

        IF @ChangedBy IS NULL
            SET @ChangedBy = 1;
        
        INSERT INTO AuditPriceHistory (ProductId, OldPrice, NewPrice, ChangedBy, ChangeReason)
        SELECT 
            inserted.ProductId,
            deleted.Price AS OldPrice,
            inserted.Price AS NewPrice,
            @ChangedBy,
            ISNULL(@Reason, 'Price updated')
        FROM inserted
        INNER JOIN deleted ON inserted.ProductId = deleted.ProductId
        WHERE inserted.Price <> deleted.Price;
        
        PRINT CAST(@@ROWCOUNT AS NVARCHAR(10)) + ' product price(s) audited.';
    END
END;
GO

-- ============================================================================
-- Example Usage / Test Trigger
-- ============================================================================
/*
-- Before: View current product prices
SELECT ProductId, ProductName, Price FROM Products;

-- Update a product price (this will trigger the audit)
UPDATE Products
SET Price = 1399.99
WHERE ProductId = 1;

-- After: View audit history
SELECT * FROM AuditPriceHistory ORDER BY AuditId DESC;

-- Expected result: New entry in AuditPriceHistory showing:
-- ProductId: 1
-- OldPrice: 1299.99
-- NewPrice: 1399.99
-- ChangedAt: Current timestamp
*/
