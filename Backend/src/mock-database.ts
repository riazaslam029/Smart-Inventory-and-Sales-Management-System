// Backend/src/mock-database.ts
// Mock database service for demonstration without SQL Server

export const mockDatabase = {
  products: [
    { id: 1, name: 'Laptop Pro', categoryId: 1, price: 1299.99, description: 'Professional laptop' },
    { id: 2, name: 'Wireless Mouse', categoryId: 2, price: 29.99, description: 'Ergonomic wireless mouse' },
    { id: 3, name: 'USB-C Cable', categoryId: 2, price: 12.99, description: 'Fast USB-C charging cable' },
    { id: 4, name: 'Monitor 27"', categoryId: 3, price: 299.99, description: '4K display monitor' },
    { id: 5, name: 'Keyboard Mechanical', categoryId: 2, price: 149.99, description: 'RGB mechanical keyboard' },
  ],
  
  inventory: [
    { id: 1, productId: 1, quantityInStock: 15, reorderLevel: 5, lastRestocked: new Date() },
    { id: 2, productId: 2, quantityInStock: 100, reorderLevel: 20, lastRestocked: new Date() },
    { id: 3, productId: 3, quantityInStock: 250, reorderLevel: 50, lastRestocked: new Date() },
    { id: 4, productId: 4, quantityInStock: 8, reorderLevel: 3, lastRestocked: new Date() },
    { id: 5, productId: 5, quantityInStock: 35, reorderLevel: 10, lastRestocked: new Date() },
  ],
  
  categories: [
    { id: 1, name: 'Electronics', description: 'Electronic devices' },
    { id: 2, name: 'Accessories', description: 'Computer accessories' },
    { id: 3, name: 'Peripherals', description: 'Computer peripherals' },
  ],
  
  users: [
    { id: 1, username: 'admin', email: 'admin@example.com', roleId: 1 },
    { id: 2, username: 'salesperson', email: 'sales@example.com', roleId: 2 },
    { id: 3, username: 'manager', email: 'manager@example.com', roleId: 2 },
  ],
  
  sales: [] as any[],
  saleItems: [] as any[],
  auditLog: [] as any[],
  
  // Initialize with some sample sales
  initializeSampleSales() {
    this.sales = [
      { id: 1, saleNumber: 'SALE-001', userId: 2, saleDate: new Date(Date.now() - 86400000), total: 1329.98, status: 'completed' },
      { id: 2, saleNumber: 'SALE-002', userId: 3, saleDate: new Date(Date.now() - 3600000), total: 2629.97, status: 'completed' },
    ];
    this.saleItems = [
      { id: 1, saleId: 1, productId: 1, quantity: 1, unitPrice: 1299.99, lineTotal: 1299.99 },
      { id: 2, saleId: 1, productId: 2, quantity: 1, unitPrice: 29.99, lineTotal: 29.99 },
      { id: 3, saleId: 2, productId: 5, quantity: 2, unitPrice: 149.99, lineTotal: 299.98 },
      { id: 4, saleId: 2, productId: 4, quantity: 1, unitPrice: 299.99, lineTotal: 299.99 },
    ];
  }
};

mockDatabase.initializeSampleSales();
