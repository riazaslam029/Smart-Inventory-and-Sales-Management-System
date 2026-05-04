/**
 * TypeORM Entities for Inventory & Sales Management System
 * These map to the MS SQL database tables
 */

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Check, Index } from 'typeorm';

// ============================================================================
// Role Entity
// ============================================================================
@Entity('Roles')
export class Role {
  @PrimaryGeneratedColumn()
  RoleId: number;

  @Column({ type: 'nvarchar', length: 50, unique: true })
  RoleName: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  Description: string;

  @CreateDateColumn()
  CreatedAt: Date;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}

// ============================================================================
// User Entity (RBAC)
// ============================================================================
@Entity('Users')
@Index(['Email'])
@Index(['RoleId'])
export class User {
  @PrimaryGeneratedColumn()
  UserId: number;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  Username: string;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  Email: string;

  @Column({ type: 'nvarchar', length: 255 })
  PasswordHash: string;

  @ManyToOne(() => Role, (role) => role.users, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'RoleId' })
  role: Role;

  @Column()
  RoleId: number;

  @Column({ type: 'bit', default: 1 })
  IsActive: boolean;

  @CreateDateColumn()
  CreatedAt: Date;

  @UpdateDateColumn()
  UpdatedAt: Date;

  @OneToMany(() => Sale, (sale) => sale.user)
  sales: Sale[];

  @OneToMany(() => AuditPriceHistory, (audit) => audit.changedBy)
  priceChanges: AuditPriceHistory[];
}

// ============================================================================
// Category Entity
// ============================================================================
@Entity('Categories')
export class Category {
  @PrimaryGeneratedColumn()
  CategoryId: number;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  CategoryName: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  Description: string;

  @Column({ type: 'bit', default: 1 })
  IsActive: boolean;

  @CreateDateColumn()
  CreatedAt: Date;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}

// ============================================================================
// Product Entity
// ============================================================================
@Entity('Products')
@Index(['CategoryId'])
@Index(['SKU'])
@Check('Price > 0')
export class Product {
  @PrimaryGeneratedColumn()
  ProductId: number;

  @Column({ type: 'nvarchar', length: 200 })
  ProductName: string;

  @Column({ type: 'nvarchar', length: 1000, nullable: true })
  Description: string;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'CategoryId' })
  category: Category;

  @Column()
  CategoryId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  Price: number;

  @Column({ type: 'nvarchar', length: 50, unique: true })
  SKU: string;

  @Column({ type: 'bit', default: 1 })
  IsActive: boolean;

  @CreateDateColumn()
  CreatedAt: Date;

  @UpdateDateColumn()
  UpdatedAt: Date;

  @OneToOne(() => Inventory, (inventory) => inventory.product, { cascade: true })
  inventory: Inventory;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.product)
  saleItems: SaleItem[];

  @OneToMany(() => AuditPriceHistory, (audit) => audit.product, { cascade: true })
  priceHistory: AuditPriceHistory[];
}

// ============================================================================
// Inventory Entity (Stock Tracking)
// ============================================================================
@Entity('Inventory')
@Index(['ProductId'])
@Check('Quantity >= 0')
@Check('ReorderLevel >= 0')
export class Inventory {
  @PrimaryGeneratedColumn()
  InventoryId: number;

  @OneToOne(() => Product, (product) => product.inventory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ProductId' })
  product: Product;

  @Column({ unique: true })
  ProductId: number;

  @Column({ type: 'int' })
  Quantity: number;

  @Column({ type: 'int', default: 10 })
  ReorderLevel: number;

  @Column({ type: 'int', nullable: true })
  MaxStock: number;

  @CreateDateColumn()
  LastRestockedAt: Date;

  @UpdateDateColumn()
  UpdatedAt: Date;
}

// ============================================================================
// Sale Entity (Orders)
// ============================================================================
@Entity('Sales')
@Index(['UserId'])
@Index(['SaleDate'])
@Index(['SaleStatus'])
@Check("SaleStatus IN ('Completed', 'Cancelled', 'Pending')")
@Check('TotalAmount >= 0')
export class Sale {
  @PrimaryGeneratedColumn()
  SaleId: number;

  @Column({ type: 'nvarchar', length: 50, unique: true })
  SaleNumber: string;

  @ManyToOne(() => User, (user) => user.sales, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'UserId' })
  user: User;

  @Column()
  UserId: number;

  @CreateDateColumn()
  SaleDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  TotalAmount: number;

  @Column({ type: 'nvarchar', length: 20, default: 'Completed' })
  SaleStatus: 'Completed' | 'Cancelled' | 'Pending';

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  Notes: string;

  @CreateDateColumn()
  CreatedAt: Date;

  @UpdateDateColumn()
  UpdatedAt: Date;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.sale, { cascade: true })
  saleItems: SaleItem[];
}

// ============================================================================
// SaleItem Entity (Line Items)
// ============================================================================
@Entity('SaleItems')
@Index(['SaleId'])
@Index(['ProductId'])
@Check('Quantity > 0')
@Check('UnitPrice > 0')
@Check('LineTotal > 0')
export class SaleItem {
  @PrimaryGeneratedColumn()
  SaleItemId: number;

  @ManyToOne(() => Sale, (sale) => sale.saleItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'SaleId' })
  sale: Sale;

  @Column()
  SaleId: number;

  @ManyToOne(() => Product, (product) => product.saleItems, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ProductId' })
  product: Product;

  @Column()
  ProductId: number;

  @Column({ type: 'int' })
  Quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  UnitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  LineTotal: number;

  @CreateDateColumn()
  CreatedAt: Date;
}

// ============================================================================
// AuditPriceHistory Entity (Auditing)
// ============================================================================
@Entity('AuditPriceHistory')
@Index(['ProductId'])
@Index(['ChangedAt'])
export class AuditPriceHistory {
  @PrimaryGeneratedColumn()
  AuditId: number;

  @ManyToOne(() => Product, (product) => product.priceHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ProductId' })
  product: Product;

  @Column()
  ProductId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  OldPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  NewPrice: number;

  @ManyToOne(() => User, (user) => user.priceChanges, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ChangedBy' })
  changedBy: User;

  @Column()
  ChangedBy: number;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  ChangeReason: string;

  @CreateDateColumn()
  ChangedAt: Date;
}
