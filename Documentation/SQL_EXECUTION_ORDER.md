# InventorySystem SQL Execution Order

Use this order in SQL Server Management Studio (SSMS):

1) Database/SQL/01-schema-initialization.sql
2) Database/SQL/02-stored-procedure-sale.sql
3) Database/SQL/03-audit-trigger.sql
4) Database/SQL/04-objects-and-security.sql
5) Database/SQL/05-users-and-role-mapping.sql

Notes:
- Run each file in a new query window.
- The scripts are idempotent and safe to re-run.
- Update passwords in 05-users-and-role-mapping.sql before using in production.
