/**
 * NestJS Application Module
 * Main entry point for the backend API
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import {
  Role,
  User,
  Category,
  Product,
  Inventory,
  Sale,
  SaleItem,
  AuditPriceHistory,
} from './entities';

import {
  ProductService,
  InventoryService,
  SalesService,
  CategoryService,
} from './services';

import {
  ProductsController,
  InventoryController,
  SalesController,
  CategoriesController,
  HealthController,
} from './controllers';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Configure TypeORM connection to MS SQL Server
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '1433'),
      username: process.env.DB_USERNAME || 'sa',
      password: process.env.DB_PASSWORD || 'Password123!',
      database: process.env.DB_NAME || 'InventorySystem',
      entities: [Role, User, Category, Product, Inventory, Sale, SaleItem, AuditPriceHistory],
      synchronize: false, // Use migrations instead
      logging: process.env.NODE_ENV === 'development',
      ssl: false,
      options: {
        encrypt: false,
        trustServerCertificate: false,
      },
    }),

    // Register entities
    TypeOrmModule.forFeature([
      Role,
      User,
      Category,
      Product,
      Inventory,
      Sale,
      SaleItem,
      AuditPriceHistory,
    ]),
  ],

  controllers: [
    HealthController,
    ProductsController,
    InventoryController,
    SalesController,
    CategoriesController,
  ],

  providers: [ProductService, InventoryService, SalesService, CategoryService],
})
export class AppModule {}

/**
 * Example .env file needed:
 * 
 * NODE_ENV=development
 * PORT=3000
 * 
 * DB_HOST=localhost
 * DB_PORT=1433
 * DB_USERNAME=sa
 * DB_PASSWORD=Password123!
 * DB_NAME=InventorySystem
 */
