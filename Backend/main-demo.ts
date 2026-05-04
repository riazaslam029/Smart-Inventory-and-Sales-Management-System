// Backend/src/main-demo.ts
// Demo mode main entry point

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

// Mock data
const products = [
  { id: 1, name: 'Laptop Pro', categoryId: 1, price: 1299.99, description: 'Professional laptop', category: { id: 1, name: 'Electronics' } },
  { id: 2, name: 'Wireless Mouse', categoryId: 2, price: 29.99, description: 'Ergonomic wireless mouse', category: { id: 2, name: 'Accessories' } },
  { id: 3, name: 'USB-C Cable', categoryId: 2, price: 12.99, description: 'Fast USB-C charging cable', category: { id: 2, name: 'Accessories' } },
  { id: 4, name: 'Monitor 27"', categoryId: 3, price: 299.99, description: '4K display monitor', category: { id: 3, name: 'Peripherals' } },
  { id: 5, name: 'Keyboard Mechanical', categoryId: 2, price: 149.99, description: 'RGB mechanical keyboard', category: { id: 2, name: 'Accessories' } },
];

const inventory = [
  { id: 1, productId: 1, quantityInStock: 15, reorderLevel: 5, lastRestocked: new Date() },
  { id: 2, productId: 2, quantityInStock: 100, reorderLevel: 20, lastRestocked: new Date() },
  { id: 3, productId: 3, quantityInStock: 250, reorderLevel: 50, lastRestocked: new Date() },
  { id: 4, productId: 4, quantityInStock: 8, reorderLevel: 3, lastRestocked: new Date() },
  { id: 5, productId: 5, quantityInStock: 35, reorderLevel: 10, lastRestocked: new Date() },
];

const categories = [
  { id: 1, name: 'Electronics', description: 'Electronic devices' },
  { id: 2, name: 'Accessories', description: 'Computer accessories' },
  { id: 3, name: 'Peripherals', description: 'Computer peripherals' },
];

let sales = [
  { id: 1, saleNumber: 'SALE-001', userId: 2, saleDate: new Date(Date.now() - 86400000), total: 1329.98, status: 'completed', user: { id: 2, username: 'salesperson' }, items: [{ productId: 1, quantity: 1, unitPrice: 1299.99 }, { productId: 2, quantity: 1, unitPrice: 29.99 }] },
  { id: 2, saleNumber: 'SALE-002', userId: 2, saleDate: new Date(Date.now() - 3600000), total: 599.96, status: 'completed', user: { id: 2, username: 'salesperson' }, items: [{ productId: 5, quantity: 4, unitPrice: 149.99 }] },
];

let saleCounter = 2;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'DEMO' });
});

// Products endpoints
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) res.json(product);
  else res.status(404).json({ error: 'Not found' });
});

app.get('/api/products/category/:categoryId', (req, res) => {
  const filtered = products.filter(p => p.categoryId === parseInt(req.params.categoryId));
  res.json(filtered);
});

app.post('/api/products', (req, res) => {
  const newProduct = { id: Math.max(...products.map(p => p.id)) + 1, ...req.body };
  products.push(newProduct);
  res.json(newProduct);
});

app.put('/api/products/:id/price', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) {
    product.price = req.body.NewPrice;
    res.json(product);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Inventory endpoints
app.get('/api/inventory', (req, res) => {
  res.json(inventory);
});

app.get('/api/inventory/:productId', (req, res) => {
  const item = inventory.find(i => i.productId === parseInt(req.params.productId));
  if (item) res.json(item);
  else res.status(404).json({ error: 'Not found' });
});

app.post('/api/inventory/:productId/check-availability', (req, res) => {
  const item = inventory.find(i => i.productId === parseInt(req.params.productId));
  if (item) {
    res.json({ available: item.quantityInStock >= req.body.quantity });
  } else {
    res.json({ available: false });
  }
});

app.get('/api/inventory/low-stock/alert', (req, res) => {
  const lowStock = inventory.filter(i => i.quantityInStock <= i.reorderLevel);
  res.json(lowStock);
});

// Sales endpoints
app.get('/api/sales', (req, res) => {
  res.json(sales);
});

app.get('/api/sales/reports/daily', (req, res) => {
  res.json({
    date: new Date(),
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
    avgValue: sales.length > 0 ? sales.reduce((sum, s) => sum + s.total, 0) / sales.length : 0,
  });
});

app.post('/api/sales', (req, res) => {
  const { items, userId } = req.body;
  
  // Calculate total
  const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  
  // Decrement inventory
  for (const item of items) {
    const invItem = inventory.find(i => i.productId === item.productId);
    if (invItem && invItem.quantityInStock >= item.quantity) {
      invItem.quantityInStock -= item.quantity;
    } else {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
  }
  
  // Create sale
  const newSale = {
    id: sales.length + 1,
    saleNumber: `SALE-${String(++saleCounter).padStart(3, '0')}`,
    userId: userId || 2,
    saleDate: new Date(),
    total,
    status: 'completed',
    user: { id: userId || 2, username: 'salesperson' },
    items,
  };
  
  sales.push(newSale);
  res.json(newSale);
});

// Categories endpoints
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const newCategory = { id: Math.max(...categories.map(c => c.id)) + 1, ...req.body };
  categories.push(newCategory);
  res.json(newCategory);
});

app.listen(PORT, () => {
  console.log(`
    ╔════════════════════════════════════════════════════╗
    ║  Inventory & Sales Management API                  ║
    ║  Server running on: http://localhost:${PORT}        ║
    ║  Environment: DEMO MODE (Mock Data)                ║
    ╚════════════════════════════════════════════════════╝
  `);
});
