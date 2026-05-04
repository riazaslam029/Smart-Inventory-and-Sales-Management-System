/**
 * NestJS Controllers - REST API Endpoints
 * These controllers expose endpoints for the frontend
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ProductService,
  InventoryService,
  SalesService,
  CategoryService,
} from './services';
import { Product, Inventory, Sale, Category } from './entities';

// ============================================================================
// Data Transfer Objects (DTOs)
// ============================================================================
export class CreateProductDto {
  ProductName: string;
  Description?: string;
  CategoryId: number;
  Price: number;
  SKU: string;
}

export class UpdateProductPriceDto {
  NewPrice: number;
  Reason?: string;
}

export class CreateSaleDto {
  UserId: number;
  SaleNumber: string;
  Items: Array<{
    ProductId: number;
    Quantity: number;
    UnitPrice: number;
  }>;
  Notes?: string;
}

export class CreateCategoryDto {
  CategoryName: string;
  Description?: string;
}

// ============================================================================
// Products Controller
// ============================================================================
@Controller('api/products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  /**
   * GET /api/products
   * Retrieve all active products
   */
  @Get()
  async getAll(): Promise<Product[]> {
    return await this.productService.getAllProducts();
  }

  /**
   * GET /api/products/:id
   * Retrieve a specific product by ID with inventory
   */
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return await this.productService.getProductById(id);
  }

  /**
   * GET /api/products/category/:categoryId
   * Retrieve all products in a specific category
   */
  @Get('category/:categoryId')
  async getByCategory(@Param('categoryId', ParseIntPipe) categoryId: number): Promise<Product[]> {
    return await this.productService.getProductsByCategory(categoryId);
  }

  /**
   * POST /api/products
   * Create a new product
   */
  @Post()
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return await this.productService.createProduct(createProductDto);
  }

  /**
   * PUT /api/products/:id/price
   * Update product price (triggers audit)
   */
  @Put(':id/price')
  async updatePrice(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePriceDto: UpdateProductPriceDto,
  ): Promise<Product> {
    return await this.productService.updateProductPrice(
      id,
      updatePriceDto.NewPrice,
      updatePriceDto.Reason,
    );
  }

  /**
   * GET /api/products/:id/price-history
   * Get price change audit history
   */
  @Get(':id/price-history')
  async getPriceHistory(@Param('id', ParseIntPipe) id: number) {
    return await this.productService.getPriceHistory(id);
  }
}

// ============================================================================
// Inventory Controller
// ============================================================================
@Controller('api/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * GET /api/inventory
   * Retrieve all inventory records
   */
  @Get()
  async getAll(): Promise<Inventory[]> {
    return await this.inventoryService.getAllInventory();
  }

  /**
   * GET /api/inventory/:productId
   * Retrieve inventory for a specific product
   */
  @Get(':productId')
  async getByProductId(@Param('productId', ParseIntPipe) productId: number): Promise<Inventory> {
    return await this.inventoryService.getInventoryByProductId(productId);
  }

  /**
   * GET /api/inventory/low-stock
   * Retrieve products with stock below reorder level
   */
  @Get('low-stock/alert')
  async getLowStock(): Promise<Inventory[]> {
    return await this.inventoryService.getLowStockItems();
  }

  /**
   * POST /api/inventory/:productId/check-availability
   * Check if required quantity is available
   */
  @Post(':productId/check-availability')
  async checkAvailability(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: { requiredQty: number },
  ): Promise<{ available: boolean; message: string }> {
    const isAvailable = await this.inventoryService.checkStockAvailability(
      productId,
      body.requiredQty,
    );
    return {
      available: isAvailable,
      message: isAvailable
        ? 'Sufficient stock available'
        : 'Insufficient stock for this transaction',
    };
  }
}

// ============================================================================
// Sales Controller - Primary interface to Stored Procedure
// ============================================================================
@Controller('api/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * GET /api/sales
   * Retrieve all sales with optional filtering
   */
  @Get()
  async getAll(
    @Query('status') status?: 'Completed' | 'Cancelled' | 'Pending',
    @Query('limit', ParseIntPipe) limit: number = 50,
    @Query('offset', ParseIntPipe) offset: number = 0,
  ): Promise<Sale[]> {
    return await this.salesService.getAllSales(status, limit, offset);
  }

  /**
   * GET /api/sales/:id
   * Retrieve detailed information about a specific sale
   */
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<Sale> {
    return await this.salesService.getSaleById(id);
  }

  /**
   * GET /api/sales/user/:userId
   * Retrieve all sales by a specific user
   */
  @Get('user/:userId')
  async getByUser(@Param('userId', ParseIntPipe) userId: number): Promise<Sale[]> {
    return await this.salesService.getSalesByUser(userId);
  }

  /**
   * POST /api/sales
   * Process a new sale (invokes sp_ProcessSale stored procedure)
   * This is the primary business operation demonstrating database logic separation
   */
  @Post()
  async processSale(@Body() createSaleDto: CreateSaleDto): Promise<{
    SaleId: number;
    Success: boolean;
    Message: string;
  }> {
    // Validation
    if (!createSaleDto.Items || createSaleDto.Items.length === 0) {
      throw new HttpException('Sale must contain at least one item', HttpStatus.BAD_REQUEST);
    }

    return await this.salesService.processSale(
      createSaleDto.UserId,
      createSaleDto.SaleNumber,
      createSaleDto.Items,
      createSaleDto.Notes,
    );
  }

  /**
   * PUT /api/sales/:id/cancel
   * Cancel a sale
   */
  @Put(':id/cancel')
  async cancelSale(@Param('id', ParseIntPipe) id: number): Promise<Sale> {
    return await this.salesService.cancelSale(id);
  }

  /**
   * GET /api/sales/reports/daily
   * Get daily sales report
   */
  @Get('reports/daily')
  async getDailyReport(@Query('days', ParseIntPipe) days: number = 30) {
    return await this.salesService.getDailySalesReport(days);
  }
}

// ============================================================================
// Categories Controller
// ============================================================================
@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * GET /api/categories
   * Retrieve all categories
   */
  @Get()
  async getAll(): Promise<Category[]> {
    return await this.categoryService.getAllCategories();
  }

  /**
   * POST /api/categories
   * Create a new category
   */
  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return await this.categoryService.createCategory(createCategoryDto);
  }
}

// ============================================================================
// Health Check Controller
// ============================================================================
@Controller('api/health')
export class HealthController {
  /**
   * GET /api/health
   * Health check endpoint
   */
  @Get()
  health() {
    return {
      status: 'healthy',
      service: 'Inventory & Sales Management API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
