-- ============================================================================
-- InventorySystem - SQL Server Logins, Users, and Role Mapping
-- ============================================================================
USE master;
GO

-- Create SQL logins (skip if they already exist)
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'InventoryAdminLogin')
    CREATE LOGIN InventoryAdminLogin WITH PASSWORD = 'Password123!';
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'InventoryManagerLogin')
    CREATE LOGIN InventoryManagerLogin WITH PASSWORD = 'Password123!';
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'InventorySalesLogin')
    CREATE LOGIN InventorySalesLogin WITH PASSWORD = 'Password123!';
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'InventoryViewerLogin')
    CREATE LOGIN InventoryViewerLogin WITH PASSWORD = 'Password123!';
GO

USE InventorySystem;
GO

-- Create database users for each login
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'InventoryAdminUser')
    CREATE USER InventoryAdminUser FOR LOGIN InventoryAdminLogin;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'InventoryManagerUser')
    CREATE USER InventoryManagerUser FOR LOGIN InventoryManagerLogin;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'InventorySalesUser')
    CREATE USER InventorySalesUser FOR LOGIN InventorySalesLogin;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'InventoryViewerUser')
    CREATE USER InventoryViewerUser FOR LOGIN InventoryViewerLogin;
GO

-- Map users to database roles
ALTER ROLE InventoryAdmin ADD MEMBER InventoryAdminUser;
ALTER ROLE InventoryManager ADD MEMBER InventoryManagerUser;
ALTER ROLE InventorySales ADD MEMBER InventorySalesUser;
ALTER ROLE InventoryViewer ADD MEMBER InventoryViewerUser;
GO
