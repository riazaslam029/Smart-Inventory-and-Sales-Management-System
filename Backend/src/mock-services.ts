// Backend/src/mock-services.ts
// Mock services for demo mode without SQL Server

import { Injectable } from '@nestjs/common';

export interface Product {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  description: string;
}

export interface InventoryItem {
  id: number;
  productId: number;
  quantityInStock: number;
  reorderLevel: number;
}

export interface Sale {
  id: number;
  saleNumber: string;
  userId: number;
  saleDate: Date;
  total: number;
  status: string;
  items: SaleItem[];
}

export interface SaleItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

@Injectable()
export class MockProductService {
  private products: Product[] = [
    { id: 1, name: 'Laptop Pro', categoryId: 1, price: 1299.99, description: 'Professional laptop' },
    { id: 2, name: 'Wireless Mouse', categoryId: 2, price: 29.99, description: 'Ergonomic wireless mouse' },
    { id: 3, name: 'USB-C Cable', categoryId: 2, price: 12.99, description: 'Fast USB-C charging cable' },
    { id: 4, name: 'Monitor 27"', categoryId: 3, price: 299.99, description: '4K display monitor' },
    { id: 5, name: 'Keyboard Mechanical', categoryId: 2, price: 149.99, description: 'RGB mechanical keyboard' },
  ];

  getAllProducts = async () => this.products;
  getProductById = async (id: number) => this.products.find(p => p.id === id);
  getProductsByCategory = async (categoryId: number) => this.products.filter(p => p.categoryId === categoryId);

  createProduct = async (product: Omit<Product, 'id'>) => {
    const newProduct = { id: this.products.length + 1, ...product };
    this.products.push(newProduct);
    return newProduct;
  };

  updateProductPrice = async (id: number, price: number) => {
    const product = this.products.find(p => p.id === id);
    if (product) {
      product.price = price;
    }
    return product;
  };

  getPriceHistory = async (productId: number) => [
    { productId, price: 1299.99, changedDate: new Date(Date.now() - 86400000), changedBy: 'admin' },
  ];
}

@Injectable()
export class MockInventoryService {
  private inventory: InventoryItem[] = [
    { id: 1, productId: 1, quantityInStock: 15, reorderLevel: 5 },
    { id: 2, productId: 2, quantityInStock: 100, reorderLevel: 20 },
    { id: 3, productId: 3, quantityInStock: 250, reorderLevel: 50 },
    { id: 4, productId: 4, quantityInStock: 8, reorderLevel: 3 },
    { id: 5, productId: 5, quantityInStock: 35, reorderLevel: 10 },
  ];

  getInventoryByProductId = async (productId: number) => this.inventory.find(i => i.productId === productId);
  getAllInventory = async () => this.inventory;
  checkStockAvailability = async (productId: number, quantity: number) => {
    const item = this.inventory.find(i => i.productId === productId);
    return item && item.quantityInStock >= quantity;
  };

  getLowStockItems = async () => this.inventory.filter(i => i.quantityInStock <= i.reorderLevel);

  updateReorderLevel = async (productId: number, level: number) => {
    const item = this.inventory.find(i => i.productId === productId);
    if (item) item.reorderLevel = level;
    return item;
  };

  decrementStock = (productId: number, quantity: number) => {
    const item = this.inventory.find(i => i.productId === productId);
    if (item && item.quantityInStock >= quantity) {
      item.quantityInStock -= quantity;
      return true;
    }
    return false;
  };
}

@Injectable()
export class MockSalesService {
  private salesCounter = 2;
  private sales: Sale[] = [
    {
      id: 1,
      saleNumber: 'SALE-001',
      userId: 2,
      saleDate: new Date(Date.now() - 86400000),
      total: 1329.98,
      status: 'completed',
      items: [
        { productId: 1, quantity: 1, unitPrice: 1299.99 },
        { productId: 2, quantity: 1, unitPrice: 29.99 },
      ],
    },
    {
      id: 2,
      saleNumber: 'SALE-002',
      userId: 2,
      saleDate: new Date(Date.now() - 3600000),
      total: 599.97,
      status: 'completed',
      items: [
        { productId: 5, quantity: 4, unitPrice: 149.99 },
      ],
    },
  ];

  processSale = async (saleData: any) => {
    const newSale: Sale = {
      id: this.sales.length + 1,
      saleNumber: `SALE-${String(++this.salesCounter).padStart(3, '0')}`,
      userId: saleData.userId,
      saleDate: new Date(),
      total: saleData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0),
      status: 'completed',
      items: saleData.items,
    };
    this.sales.push(newSale);
    return newSale;
  };

  getAllSales = async () => this.sales;
  getSaleById = async (id: number) => this.sales.find(s => s.id === id);
  getSalesByUser = async (userId: number) => this.sales.filter(s => s.userId === userId);

  cancelSale = async (id: number) => {
    const sale = this.sales.find(s => s.id === id);
    if (sale) sale.status = 'cancelled';
    return sale;
  };

  getDailySalesReport = async () => ({
    date: new Date(),
    totalSales: this.sales.length,
    totalRevenue: this.sales.reduce((sum, s) => sum + s.total, 0),
    salesCount: this.sales.length,
  });
}

@Injectable()
export class MockCategoryService {
  private categories: Category[] = [
    { id: 1, name: 'Electronics', description: 'Electronic devices' },
    { id: 2, name: 'Accessories', description: 'Computer accessories' },
    { id: 3, name: 'Peripherals', description: 'Computer peripherals' },
  ];

  getAllCategories = async () => this.categories;
  createCategory = async (category: Omit<Category, 'id'>) => {
    const newCategory = { id: this.categories.length + 1, ...category };
    this.categories.push(newCategory);
    return newCategory;
  };
}
