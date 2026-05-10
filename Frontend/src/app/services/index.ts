/**
 * Angular Signal-based Services
 * Uses Angular 20 Signals for reactive state management
 * Demonstrates real-time inventory dashboard updates
 */

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ============================================================================
// Type Definitions
// ============================================================================
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

export interface Category {
  CategoryId: number;
  CategoryName: string;
  Description: string;
  IsActive: boolean;
  CreatedAt: Date;
  products?: Product[];
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

// ============================================================================
// Auth Service (Simple Admin Sign-in)
// ============================================================================
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private storageKey = 'inventory-auth';
  isAuthenticated$ = signal(false);
  username$ = signal('');

  constructor() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as { username: string };
      this.isAuthenticated$.set(true);
      this.username$.set(parsed.username);
    }
  }

  login(username: string, password: string): boolean {
    if (username === 'admin' && password === '1234') {
      this.isAuthenticated$.set(true);
      this.username$.set('Admin');
      localStorage.setItem(this.storageKey, JSON.stringify({ username: 'Admin' }));
      return true;
    }

    return false;
  }

  logout(): void {
    this.isAuthenticated$.set(false);
    this.username$.set('');
    localStorage.removeItem(this.storageKey);
  }
}

// ============================================================================
// Product Service with Signals
// ============================================================================
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  // Signals for reactive state management
  products$ = signal<Product[]>([]);
  isLoading$ = signal(false);
  error$ = signal<string | null>(null);
  selectedProductId$ = signal<number | null>(null);

  // Computed signals for derived state
  selectedProduct = computed(() => {
    const selectedId = this.selectedProductId$();
    const productList = this.products$();
    return selectedId ? productList.find((p) => p.ProductId === selectedId) || null : null;
  });

  activeProducts = computed(() => {
    return this.products$().filter((p) => p.IsActive);
  });

  lowStockProducts = computed(() => {
    return this.products$().filter((p) => p.inventory && p.inventory.Quantity <= p.inventory.ReorderLevel);
  });

  totalProductValue = computed(() => {
    return this.products$().reduce((total, p) => {
      const qty = p.inventory?.Quantity || 0;
      return total + p.Price * qty;
    }, 0);
  });

  constructor(private http: HttpClient) {
    // Auto-load products on service initialization
    this.loadProducts();

    // Set up automatic refresh every 30 seconds (real-time dashboard)
    setInterval(() => {
      this.loadProducts();
    }, 30000);
  }

  /**
   * Load all products from API
   */
  loadProducts(): void {
    this.isLoading$.set(true);
    this.error$.set(null);

    this.http.get<Product[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.products$.set(data);
        this.isLoading$.set(false);
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.error$.set('Failed to load products');
        this.isLoading$.set(false);
      },
    });
  }

  /**
   * Get product by ID with full details
   */
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      tap((product) => {
        // Update the products signal if needed
        const currentProducts = this.products$();
        const existingIndex = currentProducts.findIndex((p) => p.ProductId === id);
        if (existingIndex !== -1) {
          currentProducts[existingIndex] = product;
          this.products$.set([...currentProducts]);
        }
      }),
    );
  }

  /**
   * Get products by category
   */
  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/category/${categoryId}`);
  }

  /**
   * Create new product
   */
  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product).pipe(
      tap((newProduct) => {
        const currentProducts = this.products$();
        this.products$.set([...currentProducts, newProduct]);
      }),
    );
  }

  /**
   * Update product price
   */
  updateProductPrice(id: number, newPrice: number, reason?: string): Observable<Product> {
    return this.http
      .put<Product>(`${this.apiUrl}/${id}/price`, { NewPrice: newPrice, Reason: reason })
      .pipe(
        tap((updatedProduct) => {
          const currentProducts = this.products$();
          const index = currentProducts.findIndex((p) => p.ProductId === id);
          if (index !== -1) {
            currentProducts[index] = updatedProduct;
            this.products$.set([...currentProducts]);
          }
        }),
      );
  }

  deleteProduct(id: number): Observable<Product> {
    return this.http.delete<Product>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentProducts = this.products$().filter((product) => product.ProductId !== id);
        this.products$.set(currentProducts);
      }),
    );
  }

  /**
   * Get price history
   */
  getPriceHistory(productId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${productId}/price-history`);
  }

  /**
   * Select a product for detail view
   */
  selectProduct(productId: number): void {
    this.selectedProductId$.set(productId);
  }

  /**
   * Clear product selection
   */
  clearSelection(): void {
    this.selectedProductId$.set(null);
  }
}

// ============================================================================
// Inventory Service with Signals
// ============================================================================
@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private apiUrl = `${environment.apiUrl}/inventory`;

  // Signals for inventory state
  inventoryItems$ = signal<Inventory[]>([]);
  isLoading$ = signal(false);
  error$ = signal<string | null>(null);
  lowStockAlerts$ = signal<Inventory[]>([]);

  // Computed total inventory value
  totalInventoryValue = computed(() => {
    return 0; // Would calculate based on product prices
  });

  constructor(private http: HttpClient) {
    this.loadInventory();

    // Real-time updates: refresh every 20 seconds
    setInterval(() => {
      this.loadInventory();
      this.loadLowStockAlerts();
    }, 20000);
  }

  /**
   * Load all inventory records
   */
  loadInventory(): void {
    this.isLoading$.set(true);
    this.http.get<Inventory[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.inventoryItems$.set(data);
        this.isLoading$.set(false);
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.error$.set('Failed to load inventory');
        this.isLoading$.set(false);
      },
    });
  }

  /**
   * Get inventory for specific product
   */
  getInventoryByProductId(productId: number): Observable<Inventory> {
    return this.http.get<Inventory>(`${this.apiUrl}/${productId}`);
  }

  /**
   * Load low stock alerts
   */
  loadLowStockAlerts(): void {
    this.http.get<Inventory[]>(`${this.apiUrl}/low-stock/alert`).subscribe({
      next: (data) => {
        this.lowStockAlerts$.set(data);
      },
      error: (err) => {
        console.error('Error loading low stock alerts:', err);
      },
    });
  }

  /**
   * Check if product is in stock
   */
  checkAvailability(productId: number, quantity: number): Observable<{ available: boolean; message: string }> {
    return this.http.post<{ available: boolean; message: string }>(
      `${this.apiUrl}/${productId}/check-availability`,
      { requiredQty: quantity }
    );
  }

  /**
   * Update reorder level for a product
   */
  updateReorderLevel(productId: number, newLevel: number): Observable<Inventory> {
    return this.http.put<Inventory>(`${this.apiUrl}/${productId}/reorder-level`, {
      ReorderLevel: newLevel,
    });
  }

  updateQuantity(productId: number, quantity: number): Observable<Inventory> {
    return this.http.put<Inventory>(`${this.apiUrl}/${productId}/quantity`, {
      Quantity: quantity,
    });
  }
}

// ============================================================================
// Category Service
// ============================================================================
@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;

  categories$ = signal<Category[]>([]);
  isLoading$ = signal(false);

  constructor(private http: HttpClient) {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading$.set(true);
    this.http.get<Category[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.categories$.set(data);
        this.isLoading$.set(false);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.isLoading$.set(false);
      },
    });
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category).pipe(
      tap((newCategory) => {
        const current = this.categories$();
        this.categories$.set([...current, newCategory]);
      }),
    );
  }
}

// ============================================================================
// Sales Service with Signals - Demonstrates Stored Procedure Integration
// ============================================================================
@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private apiUrl = `${environment.apiUrl}/sales`;

  // Signals for sales state
  sales$ = signal<Sale[]>([]);
  isProcessing$ = signal(false);
  processingError$ = signal<string | null>(null);
  successMessage$ = signal<string | null>(null);

  // Computed: recent sales
  recentSales = computed(() => {
    return this.sales$().slice(0, 10);
  });

  constructor(private http: HttpClient) {
    this.loadSales();

    // Real-time sales updates: refresh every 15 seconds
    setInterval(() => {
      this.loadSales();
    }, 15000);
  }

  /**
   * Load all sales
   */
  loadSales(): void {
    this.http.get<Sale[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.sales$.set(data);
      },
      error: (err) => {
        console.error('Error loading sales:', err);
      },
    });
  }

  /**
   * Process a new sale via stored procedure
   * This demonstrates the backend executing sp_ProcessSale
   */
  processSale(saleData: {
    UserId: number;
    SaleNumber: string;
    Items: Array<{ ProductName?: string; ProductId?: number; Quantity: number; UnitPrice?: number }>;
    Notes?: string;
  }): Observable<{ SaleId: number; Success: boolean; Message: string }> {
    this.isProcessing$.set(true);
    this.processingError$.set(null);
    this.successMessage$.set(null);

    return this.http
      .post<{ SaleId: number; Success: boolean; Message: string }>(this.apiUrl, saleData)
      .pipe(
        tap((result) => {
          this.isProcessing$.set(false);
          if (result.Success) {
            this.successMessage$.set(result.Message);
            // Refresh sales list
            this.loadSales();
          } else {
            this.processingError$.set(result.Message);
          }
        }),
        tap({
          error: (err) => {
            this.isProcessing$.set(false);
            const message = err?.error?.Message || err?.message || 'Sale failed';
            this.processingError$.set(message);
          },
        }),
      );
  }

  /**
   * Get sale details by ID
   */
  getSaleById(id: number): Observable<Sale> {
    return this.http.get<Sale>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get sales by user
   */
  getSalesByUser(userId: number): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Cancel a sale
   */
  cancelSale(saleId: number): Observable<Sale> {
    return this.http.put<Sale>(`${this.apiUrl}/${saleId}/cancel`, {}).pipe(
      tap(() => {
        this.loadSales();
      }),
    );
  }

  /**
   * Get daily sales report
   */
  getDailyReport(days: number = 30): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports/daily?days=${days}`);
  }

  /**
   * Clear error/success messages
   */
  clearMessages(): void {
    this.processingError$.set(null);
    this.successMessage$.set(null);
  }
}
