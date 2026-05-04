# Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Database (2 min)

```bash
# Create database in SQL Server
CREATE DATABASE InventorySalesDB;

# Run initialization script
sqlcmd -S localhost -U sa -P "YourPassword" -d InventorySalesDB -i Database/SQL/01-schema-initialization.sql
sqlcmd -S localhost -U sa -P "YourPassword" -d InventorySalesDB -i Database/SQL/02-stored-procedure-sale.sql
sqlcmd -S localhost -U sa -P "YourPassword" -d InventorySalesDB -i Database/SQL/03-audit-trigger.sql
```

### 2. Backend (2 min)

```bash
cd Backend

# Create .env file
echo "NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=YourPassword
DB_NAME=InventorySalesDB" > .env

# Install and run
npm install
npm run start:dev
```

### 3. Frontend (1 min)

```bash
cd Frontend
npm install
npm start
```

**That's it! Access at `http://localhost:4200`**

---

## 📍 Key File Locations

| Purpose | Location |
|---------|----------|
| Database Schema | `Database/SQL/01-schema-initialization.sql` |
| Stored Procedure | `Database/SQL/02-stored-procedure-sale.sql` |
| Audit Trigger | `Database/SQL/03-audit-trigger.sql` |
| Backend API | `Backend/src/controllers.ts` |
| Database Services | `Backend/src/services.ts` |
| Angular Services | `Frontend/src/app/services/index.ts` |
| Components | `Frontend/src/app/components.ts` |
| Implementation Guide | `Documentation/IMPLEMENTATION_GUIDE.md` |

---

## 🎯 First Actions

### 1. Check Dashboard
```
Go to: http://localhost:4200/dashboard
See: Real-time inventory with 5 products
```

### 2. Create a Sale
```
1. Click "New Sale" in sidebar
2. Enter Sale Number: SALE-2024-001
3. Add Item: Product ID 1, Qty 1, Price 1299.99
4. Click "Process Sale (Stored Procedure)"
5. Verify success message and inventory update
```

### 3. Check Inventory Updated
```
1. Go back to Dashboard
2. Verify Product 1 stock decreased by 1
3. Observe auto-refresh (every 30 seconds)
```

---

## 🧪 Testing Stored Procedure

```sql
-- Test direct execution
DECLARE @SaleItems SaleItemDetail;
DECLARE @SaleId INT;
DECLARE @ErrorMessage NVARCHAR(MAX);

INSERT INTO @SaleItems (ProductId, Quantity, UnitPrice) VALUES (1, 1, 1299.99);

EXEC sp_ProcessSale 
    @UserId = 3,
    @SaleNumber = 'TEST-001',
    @SaleItems = @SaleItems,
    @SaleId = @SaleId OUTPUT,
    @ErrorMessage = @ErrorMessage OUTPUT;

SELECT @SaleId AS SaleId, @ErrorMessage AS ErrorMessage;
```

---

## 🔍 Verify Everything Works

### Database
```sql
-- Check sample data inserted
SELECT COUNT(*) FROM Products;           -- Should be 5
SELECT COUNT(*) FROM Inventory;          -- Should be 5
SELECT COUNT(*) FROM Users;              -- Should be 4
SELECT COUNT(*) FROM Roles;              -- Should be 4

-- View initial inventory
SELECT p.ProductName, i.Quantity, i.ReorderLevel 
FROM Products p 
JOIN Inventory i ON p.ProductId = i.ProductId;
```

### Backend
```bash
# Should see output like:
# ╔════════════════════════════════════════════════════╗
# ║  Inventory & Sales Management API                  ║
# ║  Server running on: http://localhost:3000         ║
# ║  Environment: development                          ║
# ╚════════════════════════════════════════════════════╝
```

### Frontend
```
Dashboard should show:
- Total Products: 5
- Low Stock Items: 0
- Total Inventory Value: ~$6500+
- Low Stock Alerts: 0
- Product table with all 5 items
```

---

## 🐛 Common Issues

### Issue: "Connection refused"
**Solution**: Verify SQL Server is running and connection string is correct in `.env`

### Issue: "User not found" error in stored procedure
**Solution**: Ensure sample data inserted. Check: `SELECT * FROM Users;`

### Issue: Angular shows "404" on API calls
**Solution**: Check backend is running on port 3000. Verify CORS enabled.

### Issue: Low stock alerts not showing
**Solution**: Manually update inventory to test:
```sql
UPDATE Inventory SET Quantity = 5 WHERE ProductId = 1;
```

---

## 📊 Architecture at a Glance

```
┌──────────────────────┐
│  Angular 20 UI       │
│  (Signals)           │
└──────────┬───────────┘
           │ HTTP REST
           ▼
┌──────────────────────┐
│  NestJS Backend      │
│  (TypeORM)           │
└──────────┬───────────┘
           │ Stored Procedures
           ▼
┌──────────────────────┐
│  MS SQL Database     │
│  (ACID Transactions) │
└──────────────────────┘
```

---

## 📈 What's Included

✅ **Database Layer**
- Normalized 3NF schema
- ACID-compliant stored procedure
- Automatic audit trigger
- Referential integrity with constraints

✅ **Backend Layer**
- TypeORM entity definitions
- Business logic services
- REST API controllers
- Stored procedure integration

✅ **Frontend Layer**
- Standalone components
- Signal-based reactive services
- Real-time dashboard updates
- Sales processing UI

✅ **Documentation**
- Implementation guide
- Stored procedure documentation
- ER diagram description
- This quick start guide

---

## 🎓 Learning Outcomes

After completing this setup, you'll have learned:

1. **Database Design**: 3NF normalization, referential integrity
2. **ACID Transactions**: Stored procedures with rollback
3. **Auditing**: Trigger-based audit trails
4. **API Design**: RESTful NestJS endpoints
5. **Modern Frontend**: Angular 20 Signals for reactivity
6. **Full Stack Integration**: Database to UI data flow
7. **Business Logic**: Complex transaction handling

---

## 📞 Next Steps

1. ✅ Complete the setup above
2. ✅ Test each component
3. ✅ Review the implementation guide
4. 📖 Read the stored procedure documentation
5. 🔧 Customize for your needs
6. 🚀 Deploy to production (add security, auth, etc.)

---

**Ready to get started? Follow the 5-minute setup above! 🚀**
