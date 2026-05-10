-- ============================================================================
-- Table Type for passing sale items to stored procedure
-- ============================================================================
USE InventorySystem;
GO

IF TYPE_ID(N'SaleItemDetail') IS NOT NULL
BEGIN
    DROP TYPE SaleItemDetail;
END
GO

CREATE TYPE SaleItemDetail AS TABLE (
    ProductId INT NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    UnitPrice DECIMAL(10, 2) NOT NULL CHECK (UnitPrice > 0)
);
GO

/**
 * Stored Procedure: sp_ProcessSale
 * Purpose: Process a complete sale transaction with stock validation and inventory updates
 * ACID Compliance: Uses transaction with rollback on failure
 */

CREATE OR ALTER PROCEDURE sp_ProcessSale
    @UserId INT,
    @SaleNumber NVARCHAR(50),
    @SaleItems SaleItemDetail READONLY,
    @Notes NVARCHAR(500) = NULL,
    @SaleId INT OUTPUT,
    @ErrorMessage NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    -- Initialize output parameters
    SET @SaleId = 0;
    SET @ErrorMessage = '';
    
    BEGIN TRANSACTION;
    BEGIN TRY
        -- ====================================================================
        -- Step 1: Validate User exists and is active
        -- ====================================================================
        IF NOT EXISTS (SELECT 1 FROM Users WHERE UserId = @UserId AND IsActive = 1)
        BEGIN
            SET @ErrorMessage = 'User not found or is inactive.';
            THROW 50001, @ErrorMessage, 1;
        END

        -- Validate SaleNumber is unique and not empty
        IF LTRIM(RTRIM(@SaleNumber)) = '' OR @SaleNumber IS NULL
        BEGIN
            SET @ErrorMessage = 'Sale number is required.';
            THROW 50010, @ErrorMessage, 1;
        END

        IF EXISTS (SELECT 1 FROM Sales WHERE SaleNumber = @SaleNumber)
        BEGIN
            SET @ErrorMessage = 'Duplicate SaleNumber.';
            THROW 50011, @ErrorMessage, 1;
        END

        -- Validate active products
        IF EXISTS (
            SELECT 1
            FROM @SaleItems si
            JOIN Products p ON p.ProductId = si.ProductId
            WHERE p.IsActive = 0
        )
        BEGIN
            SET @ErrorMessage = 'One or more products are inactive.';
            THROW 50012, @ErrorMessage, 1;
        END
        
        -- ====================================================================
        -- Step 2: Validate stock availability for all items
        -- ====================================================================
        DECLARE @ValidationTable TABLE (
            ProductId INT,
            RequestedQty INT,
            AvailableQty INT,
            IsValid BIT
        );
        
        INSERT INTO @ValidationTable (ProductId, RequestedQty, AvailableQty, IsValid)
        SELECT 
            si.ProductId,
            si.Quantity,
            i.Quantity,
            CASE WHEN i.Quantity >= si.Quantity THEN 1 ELSE 0 END
        FROM @SaleItems si
        LEFT JOIN Inventory i ON si.ProductId = i.ProductId;
        
        -- Check if any item has insufficient stock
        IF EXISTS (SELECT 1 FROM @ValidationTable WHERE IsValid = 0)
        BEGIN
            DECLARE @ErrorDetails NVARCHAR(MAX) = '';
            SELECT @ErrorDetails += 'ProductId ' + CAST(ProductId AS NVARCHAR(10)) + 
                   ' - Requested: ' + CAST(RequestedQty AS NVARCHAR(10)) + 
                   ', Available: ' + CAST(AvailableQty AS NVARCHAR(10)) + '; '
            FROM @ValidationTable WHERE IsValid = 0;
            
            SET @ErrorMessage = 'Insufficient stock: ' + @ErrorDetails;
            THROW 50002, @ErrorMessage, 1;
        END
        
        -- ====================================================================
        -- Step 3: Calculate total amount
        -- ====================================================================
        DECLARE @TotalAmount DECIMAL(12, 2) = 0;
        
        SELECT @TotalAmount = ISNULL(SUM(Quantity * UnitPrice), 0)
        FROM @SaleItems;
        
        -- ====================================================================
        -- Step 4: Insert into Sales table
        -- ====================================================================
        INSERT INTO Sales (SaleNumber, UserId, TotalAmount, SaleStatus, Notes)
        VALUES (@SaleNumber, @UserId, @TotalAmount, 'Completed', @Notes);
        
        SET @SaleId = SCOPE_IDENTITY();
        
        -- ====================================================================
        -- Step 5: Insert into SaleItems table
        -- ====================================================================
        INSERT INTO SaleItems (SaleId, ProductId, Quantity, UnitPrice, LineTotal)
        SELECT 
            @SaleId,
            si.ProductId,
            si.Quantity,
            si.UnitPrice,
            si.Quantity * si.UnitPrice
        FROM @SaleItems si;
        
        -- ====================================================================
        -- Step 6: Decrement Inventory for each product
        -- ====================================================================
        UPDATE Inventory
        SET Quantity = Quantity - si.Quantity,
            UpdatedAt = GETUTCDATE()
        FROM Inventory i
        INNER JOIN @SaleItems si ON i.ProductId = si.ProductId;
        
        -- ====================================================================
        -- Step 7: Verify inventory updates completed
        -- ====================================================================
        IF @@ROWCOUNT = 0
        BEGIN
            SET @ErrorMessage = 'Failed to update inventory.';
            THROW 50003, @ErrorMessage, 1;
        END
        
        -- ====================================================================
        -- Step 8: Commit Transaction
        -- ====================================================================
        COMMIT TRANSACTION;
        
        PRINT 'Sale processed successfully. SaleId: ' + CAST(@SaleId AS NVARCHAR(10));
        
    END TRY
    BEGIN CATCH
        -- Rollback on any error
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @SaleId = 0;
        
        -- Capture detailed error information
        IF @ErrorMessage = '' OR @ErrorMessage IS NULL
        BEGIN
            SET @ErrorMessage = 'Error Code: ' + CAST(ERROR_NUMBER() AS NVARCHAR(10)) + 
                               '. Message: ' + ERROR_MESSAGE();
        END
        
        THROW;
    END CATCH;
END;
GO

-- ============================================================================
-- Example Usage / Test Call
-- ============================================================================
/*
DECLARE @SaleItems SaleItemDetail;
DECLARE @SaleId INT;
DECLARE @ErrorMessage NVARCHAR(MAX);

-- Populate sample sale items
INSERT INTO @SaleItems (ProductId, Quantity, UnitPrice) VALUES
    (1, 1, 1299.99),
    (2, 2, 29.99);

-- Execute stored procedure
EXEC sp_ProcessSale 
    @UserId = 3,
    @SaleNumber = 'SALE-2024-001',
    @SaleItems = @SaleItems,
    @Notes = 'Test sale',
    @SaleId = @SaleId OUTPUT,
    @ErrorMessage = @ErrorMessage OUTPUT;

-- Check results
SELECT @SaleId AS SaleId, @ErrorMessage AS ErrorMessage;
SELECT * FROM Sales WHERE SaleId = @SaleId;
SELECT * FROM SaleItems WHERE SaleId = @SaleId;
*/
