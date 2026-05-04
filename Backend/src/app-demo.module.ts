import { Module } from '@nestjs/common';
import {
  CategoriesController,
  CategoryService,
  HealthController,
  InventoryController,
  InventoryService,
  ProductsController,
  ProductService,
  SalesController,
  SalesService,
} from './demo-api';

@Module({
  imports: [],
  controllers: [
    ProductsController,
    InventoryController,
    SalesController,
    CategoriesController,
    HealthController,
  ],
  providers: [
    ProductService,
    InventoryService,
    SalesService,
    CategoryService,
  ],
})
export class AppDemoModule {}
