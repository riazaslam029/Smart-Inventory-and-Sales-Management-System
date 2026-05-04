// Backend/src/demo-api.ts
import { Body, Controller, Delete, Get, Injectable, Param, ParseIntPipe, Post, Put, Query, HttpException, HttpStatus } from '@nestjs/common';

export interface Category {
  CategoryId: number;
  CategoryName: string;
  Description: string;
  IsActive: boolean;
  CreatedAt: Date;
}

export interface Inventory {
  InventoryId: number;
  ProductId: number;
  Quantity: number;
  ReorderLevel: number;
  MaxStock: number;
  LastRestockedAt: Date;
  UpdatedAt: Date;
  product?: Product;
}

export interface Product {
  ProductId: number;
  ProductName: string;
  Description: string;
  CategoryId: number;
  Price: number;
  SKU: string;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
  category?: Category;
  inventory?: Inventory;
}

export interface SaleItem {
  SaleItemId: number;
  SaleId: number;
  ProductId: number;
  Quantity: number;
  UnitPrice: number;
  LineTotal: number;
  CreatedAt: Date;
  product?: Product;
}

export interface User {
  UserId: number;
  Username: string;
  Email: string;
  RoleId: number;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface Sale {
  SaleId: number;
  SaleNumber: string;
  UserId: number;
  SaleDate: Date;
  TotalAmount: number;
  SaleStatus: 'Completed' | 'Cancelled' | 'Pending';
  Notes: string;
  CreatedAt: Date;
  UpdatedAt: Date;
  user?: User;
  saleItems?: SaleItem[];
}

export interface PriceHistory {
  AuditId: number;
  ProductId: number;
  OldPrice: number | null;
  NewPrice: number;
  ChangedBy: number;
  ChangeReason: string;
  ChangedAt: Date;
}

const categories: Category[] = [
  { CategoryId: 1, CategoryName: 'Electronics', Description: 'Electronic devices', IsActive: true, CreatedAt: new Date() },
  { CategoryId: 2, CategoryName: 'Accessories', Description: 'Computer accessories', IsActive: true, CreatedAt: new Date() },
  { CategoryId: 3, CategoryName: 'Peripherals', Description: 'Computer peripherals', IsActive: true, CreatedAt: new Date() },
];

const users: User[] = [
  { UserId: 1, Username: 'admin', Email: 'admin@example.com', RoleId: 1, IsActive: true, CreatedAt: new Date(), UpdatedAt: new Date() },
  { UserId: 2, Username: 'salesperson', Email: 'sales@example.com', RoleId: 2, IsActive: true, CreatedAt: new Date(), UpdatedAt: new Date() },
  { UserId: 3, Username: 'manager', Email: 'manager@example.com', RoleId: 2, IsActive: true, CreatedAt: new Date(), UpdatedAt: new Date() },
];

const products: Product[] = [
  { ProductId: 1, ProductName: 'Laptop Pro', Description: 'Professional laptop', CategoryId: 1, Price: 1299.99, SKU: 'LP-001', IsActive: true, CreatedAt: new Date(), UpdatedAt: new Date() },
  { ProductId: 2, ProductName: 'Wireless Mouse', Description: 'Ergonomic wireless mouse', CategoryId: 2, Price: 29.99, SKU: 'WM-001', IsActive: true, CreatedAt: new Date(), UpdatedAt: new Date() },
  { ProductId: 3, ProductName: 'USB-C Cable', Description: 'Fast charging cable', CategoryId: 2, Price: 12.99, SKU: 'UC-001', IsActive: true, CreatedAt: new Date(), UpdatedAt: new Date() },
  { ProductId: 4, ProductName: 'Monitor 27"', Description: '4K display monitor', CategoryId: 3, Price: 299.99, SKU: 'MN-001', IsActive: true, CreatedAt: new Date(), UpdatedAt: new Date() },
  { ProductId: 5, ProductName: 'Keyboard Mechanical', Description: 'RGB mechanical keyboard', CategoryId: 2, Price: 149.99, SKU: 'KB-001', IsActive: true, CreatedAt: new Date(), UpdatedAt: new Date() },
];

const inventory: Inventory[] = [
  { InventoryId: 1, ProductId: 1, Quantity: 15, ReorderLevel: 5, MaxStock: 50, LastRestockedAt: new Date(), UpdatedAt: new Date() },
  { InventoryId: 2, ProductId: 2, Quantity: 100, ReorderLevel: 20, MaxStock: 200, LastRestockedAt: new Date(), UpdatedAt: new Date() },
  { InventoryId: 3, ProductId: 3, Quantity: 250, ReorderLevel: 50, MaxStock: 400, LastRestockedAt: new Date(), UpdatedAt: new Date() },
  { InventoryId: 4, ProductId: 4, Quantity: 8, ReorderLevel: 3, MaxStock: 30, LastRestockedAt: new Date(), UpdatedAt: new Date() },
  { InventoryId: 5, ProductId: 5, Quantity: 35, ReorderLevel: 10, MaxStock: 80, LastRestockedAt: new Date(), UpdatedAt: new Date() },
];

let sales: Sale[] = [
  {
    SaleId: 1,
    SaleNumber: 'SALE-001',
    UserId: 2,
    SaleDate: new Date(Date.now() - 86400000),
    TotalAmount: 1329.98,
    SaleStatus: 'Completed',
    Notes: 'Initial sample sale',
    CreatedAt: new Date(),
    UpdatedAt: new Date(),
    user: users[1],
    saleItems: [
      { SaleItemId: 1, SaleId: 1, ProductId: 1, Quantity: 1, UnitPrice: 1299.99, LineTotal: 1299.99, CreatedAt: new Date(), product: products[0] },
      { SaleItemId: 2, SaleId: 1, ProductId: 2, Quantity: 1, UnitPrice: 29.99, LineTotal: 29.99, CreatedAt: new Date(), product: products[1] },
    ],
  },
  {
    SaleId: 2,
    SaleNumber: 'SALE-002',
    UserId: 3,
    SaleDate: new Date(Date.now() - 3600000),
    TotalAmount: 599.96,
    SaleStatus: 'Completed',
    Notes: 'Initial sample sale',
    CreatedAt: new Date(),
    UpdatedAt: new Date(),
    user: users[2],
    saleItems: [
      { SaleItemId: 3, SaleId: 2, ProductId: 5, Quantity: 4, UnitPrice: 149.99, LineTotal: 599.96, CreatedAt: new Date(), product: products[4] },
    ],
  },
];

const audit: PriceHistory[] = [
  { AuditId: 1, ProductId: 1, OldPrice: 1399.99, NewPrice: 1299.99, ChangedBy: 1, ChangeReason: 'Initial price adjustment', ChangedAt: new Date(Date.now() - 172800000) },
];

let nextProductId = 6;
let nextSaleId = 3;
let nextSaleItemId = 4;
let nextAuditId = 2;

function attachRelations(product: Product): Product {
  return {
    ...product,
    category: categories.find((c) => c.CategoryId === product.CategoryId),
    inventory: inventory.find((i) => i.ProductId === product.ProductId),
  };
}

function attachSaleRelations(sale: Sale): Sale {
  return {
    ...sale,
    user: users.find((u) => u.UserId === sale.UserId),
    saleItems: sale.saleItems?.map((item) => ({
      ...item,
      product: products.find((p) => p.ProductId === item.ProductId),
    })),
  };
}

@Injectable()
export class ProductService {
  getAllProducts() { return products.map(attachRelations); }
  getProductById(id: number) {
    const product = products.find((item) => item.ProductId === id);
    if (!product) throw new Error('Product not found');
    return attachRelations(product);
  }
  getProductsByCategory(categoryId: number) { return products.filter((item) => item.CategoryId === categoryId).map(attachRelations); }
  createProduct(productData: Partial<Product> & { Quantity?: number; MaxStock?: number; ReorderLevel?: number }) {
    const newProduct: Product = {
      ProductId: nextProductId++,
      ProductName: productData.ProductName || 'New Product',
      Description: productData.Description || '',
      CategoryId: productData.CategoryId || 1,
      Price: Number(productData.Price || 0),
      SKU: productData.SKU || `SKU-${nextProductId}`,
      IsActive: true,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    };
    products.push(newProduct);
    inventory.push({
      InventoryId: inventory.length + 1,
      ProductId: newProduct.ProductId,
      Quantity: Number(productData.Quantity || 0),
      ReorderLevel: Number(productData.ReorderLevel || 5),
      MaxStock: Number(productData.MaxStock || 50),
      LastRestockedAt: new Date(),
      UpdatedAt: new Date(),
    });
    return attachRelations(newProduct);
  }
  updateProductPrice(id: number, newPrice: number, reason = '') {
    const product = products.find((item) => item.ProductId === id);
    if (!product) throw new Error('Product not found');
    const oldPrice = product.Price;
    product.Price = Number(newPrice);
    product.UpdatedAt = new Date();
    audit.unshift({ AuditId: nextAuditId++, ProductId: id, OldPrice: oldPrice, NewPrice: Number(newPrice), ChangedBy: 1, ChangeReason: reason || 'Manual update', ChangedAt: new Date() });
    return attachRelations(product);
  }
  deleteProduct(id: number) {
    const index = products.findIndex((item) => item.ProductId === id);
    if (index === -1) throw new Error('Product not found');
    products[index].IsActive = false;
    const product = products[index];
    return attachRelations(product);
  }
  getPriceHistory(productId: number) { return audit.filter((item) => item.ProductId === productId); }
}

@Injectable()
export class InventoryService {
  getInventoryByProductId(productId: number) {
    const item = inventory.find((entry) => entry.ProductId === productId);
    if (!item) throw new Error('Inventory not found');
    return { ...item, product: products.find((p) => p.ProductId === productId) };
  }
  getAllInventory() { return inventory.map((item) => ({ ...item, product: products.find((p) => p.ProductId === item.ProductId) })); }
  checkStockAvailability(productId: number, requiredQty: number) { const item = inventory.find((entry) => entry.ProductId === productId); return !!item && item.Quantity >= requiredQty; }
  getLowStockItems() { return inventory.filter((item) => item.Quantity <= item.ReorderLevel).map((item) => ({ ...item, product: products.find((p) => p.ProductId === item.ProductId) })); }
  updateReorderLevel(productId: number, newLevel: number) { const item = inventory.find((entry) => entry.ProductId === productId); if (!item) throw new Error('Inventory not found'); item.ReorderLevel = newLevel; item.UpdatedAt = new Date(); return { ...item, product: products.find((p) => p.ProductId === item.ProductId) }; }
  updateQuantity(productId: number, quantity: number) {
    const item = inventory.find((entry) => entry.ProductId === productId);
    if (!item) throw new Error('Inventory not found');
    item.Quantity = quantity;
    item.UpdatedAt = new Date();
    return { ...item, product: products.find((p) => p.ProductId === item.ProductId) };
  }
  decrementStock(productId: number, qty: number) { const item = inventory.find((entry) => entry.ProductId === productId); if (!item || item.Quantity < qty) return false; item.Quantity -= qty; item.UpdatedAt = new Date(); return true; }
}

@Injectable()
export class SalesService {
  processSale(
    userId: number,
    saleNumber: string,
    items: Array<{ ProductId?: number; ProductName?: string; Quantity: number; UnitPrice?: number }>,
    notes?: string,
  ) {
    if (!items.length) {
      throw new Error('Sale must contain at least one item');
    }
    const resolvedItems = items.map((item) => {
      if (item.ProductId) {
        return item;
      }
      const product = products.find((entry) => entry.ProductName === item.ProductName);
      if (!product) {
        throw new Error(`Unknown product: ${item.ProductName}`);
      }
      return { ...item, ProductId: product.ProductId, UnitPrice: item.UnitPrice ?? product.Price };
    });

    for (const item of resolvedItems) {
      const inventoryItem = inventory.find((entry) => entry.ProductId === item.ProductId);
      if (!inventoryItem) {
        throw new Error(`Inventory not found for product ${item.ProductId}`);
      }
      if (inventoryItem.Quantity < item.Quantity) {
        throw new Error(`Insufficient stock for product ${item.ProductId}`);
      }
    }

    for (const item of resolvedItems) {
      const ok = new InventoryService().decrementStock(item.ProductId as number, item.Quantity);
      if (!ok) {
        throw new Error(`Insufficient stock for product ${item.ProductId}`);
      }
    }
    const saleItems = resolvedItems.map((item) => ({
      SaleItemId: nextSaleItemId++,
      SaleId: nextSaleId,
      ProductId: item.ProductId as number,
      Quantity: item.Quantity,
      UnitPrice: item.UnitPrice as number,
      LineTotal: item.Quantity * (item.UnitPrice as number),
      CreatedAt: new Date(),
      product: products.find((product) => product.ProductId === item.ProductId),
    }));
    const sale: Sale = {
      SaleId: nextSaleId++,
      SaleNumber: saleNumber || `SALE-${String(nextSaleId).padStart(3, '0')}`,
      UserId: userId,
      SaleDate: new Date(),
      TotalAmount: saleItems.reduce((sum, item) => sum + item.LineTotal, 0),
      SaleStatus: 'Completed',
      Notes: notes || '',
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
      user: users.find((user) => user.UserId === userId),
      saleItems,
    };
    sales.unshift(sale);
    return { SaleId: sale.SaleId, Success: true, Message: `Sale ${sale.SaleNumber} processed successfully` };
  }
  getAllSales(status?: 'Completed' | 'Cancelled' | 'Pending', limit = 50, offset = 0) {
    const items = status ? sales.filter((sale) => sale.SaleStatus === status) : sales;
    return items.slice(offset, offset + limit).map(attachSaleRelations);
  }
  getSaleById(saleId: number) {
    const sale = sales.find((item) => item.SaleId === saleId);
    if (!sale) throw new Error('Sale not found');
    return attachSaleRelations(sale);
  }
  getSalesByUser(userId: number) { return sales.filter((sale) => sale.UserId === userId).map(attachSaleRelations); }
  cancelSale(saleId: number) { const sale = this.getSaleById(saleId); sale.SaleStatus = 'Cancelled'; return sale; }
  getDailySalesReport(days = 30) {
    return sales.slice(0, 10).map((sale) => ({ SaleDate: sale.SaleDate.toISOString().slice(0, 10), TotalSales: 1, DailyTotal: sale.TotalAmount, AverageOrder: sale.TotalAmount, days }));
  }
}

@Injectable()
export class CategoryService {
  getAllCategories() { return categories; }
  createCategory(categoryData: Partial<Category>) {
    const newCategory: Category = { CategoryId: categories.length + 1, CategoryName: categoryData.CategoryName || 'New Category', Description: categoryData.Description || '', IsActive: true, CreatedAt: new Date() };
    categories.push(newCategory);
    return newCategory;
  }
}

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}
  @Get() getAll() { return this.productService.getAllProducts(); }
  @Get(':id') getById(@Param('id', ParseIntPipe) id: number) { return this.productService.getProductById(id); }
  @Get('category/:categoryId') getByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) { return this.productService.getProductsByCategory(categoryId); }
  @Post() create(@Body() body: Partial<Product>) { return this.productService.createProduct(body); }
  @Put(':id/price') updatePrice(@Param('id', ParseIntPipe) id: number, @Body() body: { NewPrice: number; Reason?: string }) { return this.productService.updateProductPrice(id, body.NewPrice, body.Reason); }
  @Get(':id/price-history') getPriceHistory(@Param('id', ParseIntPipe) id: number) { return this.productService.getPriceHistory(id); }
  @Delete(':id') delete(@Param('id', ParseIntPipe) id: number) { return this.productService.deleteProduct(id); }
}

@Controller('api/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}
  @Get() getAll() { return this.inventoryService.getAllInventory(); }
  @Get(':productId') getByProductId(@Param('productId', ParseIntPipe) productId: number) { return this.inventoryService.getInventoryByProductId(productId); }
  @Get('low-stock/alert') getLowStock() { return this.inventoryService.getLowStockItems(); }
  @Post(':productId/check-availability') checkAvailability(@Param('productId', ParseIntPipe) productId: number, @Body() body: { requiredQty: number }) { const available = this.inventoryService.checkStockAvailability(productId, body.requiredQty); return { available, message: available ? 'Sufficient stock available' : 'Insufficient stock for this transaction' }; }
  @Put(':productId/reorder-level') updateReorderLevel(@Param('productId', ParseIntPipe) productId: number, @Body() body: { ReorderLevel: number }) { return this.inventoryService.updateReorderLevel(productId, body.ReorderLevel); }
  @Put(':productId/quantity') updateQuantity(@Param('productId', ParseIntPipe) productId: number, @Body() body: { Quantity: number }) { return this.inventoryService.updateQuantity(productId, body.Quantity); }
}

@Controller('api/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}
  @Get() getAll(@Query('status') status?: 'Completed' | 'Cancelled' | 'Pending', @Query('limit') limit = '50', @Query('offset') offset = '0') { return this.salesService.getAllSales(status, parseInt(limit, 10), parseInt(offset, 10)); }
  @Get(':id') getById(@Param('id', ParseIntPipe) id: number) { return this.salesService.getSaleById(id); }
  @Get('user/:userId') getByUser(@Param('userId', ParseIntPipe) userId: number) { return this.salesService.getSalesByUser(userId); }
  @Post()
  processSale(@Body() body: { UserId: number; SaleNumber: string; Items: Array<{ ProductId?: number; ProductName?: string; Quantity: number; UnitPrice?: number }>; Notes?: string }) {
    try {
      return this.salesService.processSale(body.UserId, body.SaleNumber, body.Items, body.Notes);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sale failed';
      throw new HttpException({ SaleId: 0, Success: false, Message: message }, HttpStatus.BAD_REQUEST);
    }
  }
  @Put(':id/cancel') cancelSale(@Param('id', ParseIntPipe) id: number) { return this.salesService.cancelSale(id); }
  @Get('reports/daily') getDailyReport(@Query('days') days = '30') { return this.salesService.getDailySalesReport(parseInt(days, 10)); }
}

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoryService) {}
  @Get() getAll() { return this.categoryService.getAllCategories(); }
  @Post() create(@Body() body: Partial<Category>) { return this.categoryService.createCategory(body); }
}

@Controller('api/health')
export class HealthController {
  @Get() health() { return { status: 'healthy', service: 'Inventory & Sales Management API', version: 'demo', timestamp: new Date().toISOString(), mode: 'DEMO' }; }
}
