/**
 * NestJS Services for Business Logic
 * These services handle database operations and stored procedure calls
 */

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product, Inventory, Sale, SaleItem, Category, User, AuditPriceHistory } from './entities';

// ============================================================================
// Product Service
// ============================================================================
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Get all active products with their inventory
   */
  async getAllProducts(): Promise<Product[]> {
    return await this.productRepository.find({
      where: { IsActive: true },
      relations: ['category', 'inventory'],
      order: { CreatedAt: 'DESC' },
    });
  }

  /**
   * Get product by ID with related data
   */
  async getProductById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { ProductId: id },
      relations: ['category', 'inventory', 'priceHistory'],
    });

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return product;
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await this.productRepository.find({
      where: { CategoryId: categoryId, IsActive: true },
      relations: ['inventory'],
    });
  }

  /**
   * Create a new product
   */
  async createProduct(productData: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(productData);
    return await this.productRepository.save(product);
  }

  /**
   * Update product price (will trigger audit)
   */
  async updateProductPrice(id: number, newPrice: number, reason: string = ''): Promise<Product> {
    if (newPrice <= 0) {
      throw new HttpException('Price must be greater than 0', HttpStatus.BAD_REQUEST);
    }

    const product = await this.getProductById(id);
    product.Price = newPrice;
    return await this.productRepository.save(product);
  }

  /**
   * Get price audit history for a product
   */
  async getPriceHistory(productId: number): Promise<AuditPriceHistory[]> {
    return await this.productRepository.query(
      `SELECT * FROM AuditPriceHistory WHERE ProductId = @0 ORDER BY ChangedAt DESC`,
      [productId]
    );
  }
}

// ============================================================================
// Inventory Service
// ============================================================================
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory) private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Get inventory for a specific product
   */
  async getInventoryByProductId(productId: number): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { ProductId: productId },
      relations: ['product'],
    });

    if (!inventory) {
      throw new HttpException('Inventory not found', HttpStatus.NOT_FOUND);
    }

    return inventory;
  }

  /**
   * Get all inventory records
   */
  async getAllInventory(): Promise<Inventory[]> {
    return await this.inventoryRepository.find({
      relations: ['product'],
      order: { ProductId: 'ASC' },
    });
  }

  /**
   * Check stock availability
   */
  async checkStockAvailability(productId: number, requiredQty: number): Promise<boolean> {
    const inventory = await this.inventoryRepository.findOne({
      where: { ProductId: productId },
    });

    if (!inventory) {
      return false;
    }

    return inventory.Quantity >= requiredQty;
  }

  /**
   * Get low stock items (below reorder level)
   */
  async getLowStockItems(): Promise<Inventory[]> {
    return await this.inventoryRepository
      .createQueryBuilder('inv')
      .where('inv.Quantity <= inv.ReorderLevel')
      .relations(['product'])
      .getMany();
  }

  /**
   * Update reorder level
   */
  async updateReorderLevel(productId: number, newLevel: number): Promise<Inventory> {
    const inventory = await this.getInventoryByProductId(productId);
    inventory.ReorderLevel = newLevel;
    return await this.inventoryRepository.save(inventory);
  }
}

// ============================================================================
// Sales Service - Handles Stored Procedure Execution
// ============================================================================
@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale) private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem) private readonly saleItemRepository: Repository<SaleItem>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Process a sale using the stored procedure sp_ProcessSale
   * This demonstrates executing SQL Server stored procedures from NestJS
   */
  async processSale(
    userId: number,
    saleNumber: string,
    items: Array<{ ProductId: number; Quantity: number; UnitPrice: number }>,
    notes?: string,
  ): Promise<{ SaleId: number; Success: boolean; Message: string }> {
    try {
      // Build the SQL table-valued parameter string
      const itemsTableType = items
        .map((item) => `(${item.ProductId}, ${item.Quantity}, ${item.UnitPrice})`)
        .join(',');

      // Execute the stored procedure
      const query = `
        DECLARE @SaleItems SaleItemDetail;
        DECLARE @SaleId INT;
        DECLARE @ErrorMessage NVARCHAR(MAX);

        INSERT INTO @SaleItems (ProductId, Quantity, UnitPrice) VALUES
        ${itemsTableType};

        EXEC sp_ProcessSale 
          @UserId = @userId,
          @SaleNumber = @saleNumber,
          @SaleItems = @SaleItems,
          @Notes = @notes,
          @SaleId = @SaleId OUTPUT,
          @ErrorMessage = @ErrorMessage OUTPUT;

        SELECT @SaleId AS SaleId, @ErrorMessage AS ErrorMessage;
      `;

      const result = await this.dataSource.query(query, {
        userId,
        saleNumber,
        notes: notes || null,
      });

      if (!result || result.length === 0) {
        throw new Error('Stored procedure returned no result');
      }

      const { SaleId, ErrorMessage } = result[0];

      if (SaleId === 0) {
        throw new HttpException(
          `Sale processing failed: ${ErrorMessage}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        SaleId,
        Success: true,
        Message: `Sale ${saleNumber} processed successfully`,
      };
    } catch (error) {
      throw new HttpException(
        `Error processing sale: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all sales with details
   */
  async getAllSales(
    status?: 'Completed' | 'Cancelled' | 'Pending',
    limit: number = 50,
    offset: number = 0,
  ): Promise<Sale[]> {
    const query = this.saleRepository.createQueryBuilder('sale');

    if (status) {
      query.where('sale.SaleStatus = :status', { status });
    }

    return await query
      .relations(['user', 'saleItems', 'saleItems.product'])
      .orderBy('sale.SaleDate', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();
  }

  /**
   * Get sale details by ID
   */
  async getSaleById(saleId: number): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { SaleId: saleId },
      relations: ['user', 'saleItems', 'saleItems.product'],
    });

    if (!sale) {
      throw new HttpException('Sale not found', HttpStatus.NOT_FOUND);
    }

    return sale;
  }

  /**
   * Get sales by user
   */
  async getSalesByUser(userId: number): Promise<Sale[]> {
    return await this.saleRepository.find({
      where: { UserId: userId },
      relations: ['saleItems', 'saleItems.product'],
      order: { SaleDate: 'DESC' },
    });
  }

  /**
   * Cancel a sale (soft delete by setting status)
   */
  async cancelSale(saleId: number): Promise<Sale> {
    const sale = await this.getSaleById(saleId);
    sale.SaleStatus = 'Cancelled';
    return await this.saleRepository.save(sale);
  }

  /**
   * Get sales report (daily totals)
   */
  async getDailySalesReport(days: number = 30): Promise<any[]> {
    const query = `
      SELECT 
        CAST(SaleDate AS DATE) AS SaleDate,
        COUNT(*) AS TotalSales,
        SUM(TotalAmount) AS DailyTotal,
        AVG(TotalAmount) AS AverageOrder
      FROM Sales
      WHERE SaleDate >= DATEADD(DAY, -@days, CAST(GETUTCDATE() AS DATE))
        AND SaleStatus = 'Completed'
      GROUP BY CAST(SaleDate AS DATE)
      ORDER BY SaleDate DESC
    `;

    return await this.dataSource.query(query, { days });
  }
}

// ============================================================================
// Category Service
// ============================================================================
@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { IsActive: true },
      relations: ['products'],
      order: { CreatedAt: 'ASC' },
    });
  }

  /**
   * Create a new category
   */
  async createCategory(categoryData: Partial<Category>): Promise<Category> {
    const category = this.categoryRepository.create(categoryData);
    return await this.categoryRepository.save(category);
  }
}
