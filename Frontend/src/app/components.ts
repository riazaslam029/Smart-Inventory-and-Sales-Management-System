/**
 * Angular Standalone Components
 * Uses Angular 20 with signals for reactive state management
 */

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductService, InventoryService, SalesService, CategoryService, AuthService } from './services/index';
import { Router } from '@angular/router';

// ============================================================================
// Admin Sign-in Component
// ============================================================================
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
      <div class="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-slate-900">Admin Sign In</h1>
          <p class="text-sm text-slate-600 mt-1">Use your admin credentials to continue.</p>
        </div>

        @if (errorMessage()) {
          <div class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {{ errorMessage() }}
          </div>
        }

        <form (ngSubmit)="signIn()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              [(ngModel)]="username"
              name="username"
              class="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-slate-700 outline-none"
              placeholder="admin"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              [(ngModel)]="password"
              name="password"
              type="password"
              class="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-slate-700 outline-none"
              placeholder="1234"
            />
          </div>
          <button
            type="submit"
            class="w-full rounded-lg bg-slate-900 text-white py-2 font-semibold hover:bg-slate-800 transition">
            Sign In
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  signIn(): void {
    const ok = this.authService.login(this.username.trim(), this.password.trim());
    if (!ok) {
      this.errorMessage.set('Invalid credentials. Use admin / 1234.');
      return;
    }

    this.router.navigate(['/dashboard']);
  }
}

// ============================================================================
// Product List Component (Inventory Dashboard)
// ============================================================================
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
        <p class="text-gray-600 mt-2">Real-time product inventory tracking with automatic updates</p>
      </div>

      <!-- Add Product Form -->
      <div class="bg-white p-6 rounded-lg shadow mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Add Product</h2>
          <span class="text-sm text-gray-500">Demo mode is live</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-600">Product Name</label>
            <input [(ngModel)]="newProduct.ProductName" name="productName" placeholder="Product name" class="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-600">SKU</label>
            <input [(ngModel)]="newProduct.SKU" name="sku" placeholder="SKU" class="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-600">Category</label>
            <select [(ngModel)]="newProduct.CategoryId" name="categoryId" class="w-full px-4 py-2 border rounded-lg bg-white">
              @for (category of categoryService.categories$(); track category.CategoryId) {
                <option [value]="category.CategoryId">{{ category.CategoryName }}</option>
              }
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-600">Price</label>
            <input [(ngModel)]="newProduct.Price" name="price" type="number" step="0.01" placeholder="Price" class="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-600">Stock Quantity</label>
            <input [(ngModel)]="newProduct.Quantity" name="quantity" type="number" placeholder="Stock qty" class="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-600">Description</label>
            <input [(ngModel)]="newProduct.Description" name="description" placeholder="Description" class="w-full px-4 py-2 border rounded-lg" />
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <button (click)="createProduct()" class="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">Add Product</button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-gray-600 text-sm font-medium">Total Products</h3>
          <p class="text-3xl font-bold text-blue-600 mt-2">{{ productService.activeProducts().length }}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-gray-600 text-sm font-medium">Low Stock Items</h3>
          <p class="text-3xl font-bold text-red-600 mt-2">{{ productService.lowStockProducts().length }}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-gray-600 text-sm font-medium">Total Inventory Value</h3>
          <p class="text-3xl font-bold text-green-600 mt-2">{{ productService.totalProductValue() | currency }}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-gray-600 text-sm font-medium">Low Stock Alerts</h3>
          <p class="text-3xl font-bold text-orange-600 mt-2">{{ inventoryService.lowStockAlerts$().length }}</p>
        </div>
      </div>

      <!-- Graphical Inventory Stats -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Inventory Health Chart</h2>
          <span class="text-sm text-gray-500">Stock levels by product</span>
        </div>
        <div class="space-y-4">
          @for (product of productService.activeProducts(); track product.ProductId) {
            <div>
              <div class="flex justify-between text-sm text-gray-700 mb-1">
                <span>{{ product.ProductName }}</span>
                <span>{{ product.inventory?.Quantity || 0 }} units</span>
              </div>
              <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div class="h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" [style.width.%]="getBarWidth(product)"></div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Products Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Product Inventory</h2>
        </div>

        @if (productService.isLoading$()) {
          <div class="p-12 text-center text-gray-500">Loading products...</div>
        } @else if (productService.error$()) {
          <div class="p-6 bg-red-50 border border-red-200 rounded text-red-700">
            {{ productService.error$() }}
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Product Name</th>
                  <th class="px-6 py-3 text-right text-sm font-semibold text-gray-900">Price</th>
                  <th class="px-6 py-3 text-right text-sm font-semibold text-gray-900">Stock</th>
                  <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                  <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (product of productService.activeProducts(); track product.ProductId) {
                  <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm text-gray-900">{{ product.ProductName }}</td>
                    <td class="px-6 py-4 text-right text-sm text-gray-900 font-semibold">{{ product.Price | currency }}</td>
                    <td class="px-6 py-4 text-right text-sm text-gray-900">
                      {{ product.inventory?.Quantity || 0 }}
                    </td>
                    <td class="px-6 py-4 text-center text-sm">
                      @if ((product.inventory?.Quantity || 0) <= (product.inventory?.ReorderLevel || 0)) {
                        <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Low Stock</span>
                      } @else {
                        <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">In Stock</span>
                      }
                    </td>
                    <td class="px-6 py-4 text-center">
                      <div class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1">
                        <button 
                          (click)="editProduct(product.ProductId)"
                          class="text-slate-700 hover:text-slate-900 text-xs font-semibold uppercase tracking-wide">
                          Edit
                        </button>
                        <span class="h-4 w-px bg-gray-300"></span>
                        <button 
                          (click)="deleteProduct(product.ProductId)"
                          class="text-red-600 hover:text-red-700 text-xs font-semibold uppercase tracking-wide">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Low Stock Alerts -->
      @if (inventoryService.lowStockAlerts$().length > 0) {
        <div class="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
          <h3 class="text-lg font-semibold text-yellow-900 mb-4">⚠️ Low Stock Alerts</h3>
          <div class="space-y-2">
            @for (item of inventoryService.lowStockAlerts$(); track item.InventoryId) {
              <div class="flex justify-between items-center p-2 bg-white rounded border border-yellow-200">
                <span class="text-gray-900">{{ item.product?.ProductName }}</span>
                <span class="text-yellow-700 font-semibold">
                  {{ item.Quantity }}/{{ item.ReorderLevel }} (Reorder Level)
                </span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        --tw-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color);
      }
    `,
  ],
})
export class ProductListComponent implements OnInit {
  newProduct = {
    ProductName: '',
    Description: '',
    CategoryId: 1,
    Price: 0,
    SKU: '',
    Quantity: 0,
  };

  constructor(
    public productService: ProductService,
    public inventoryService: InventoryService,
    public categoryService: CategoryService,
  ) {}

  ngOnInit(): void {
    // Services auto-load data on initialization
    // Signals provide reactive updates without manual refresh
  }

  getBarWidth(product: { inventory?: { Quantity: number; MaxStock?: number } }): number {
    const quantity = product.inventory?.Quantity || 0;
    const maxStock = product.inventory?.MaxStock || 100;
    return Math.min(100, Math.max(5, (quantity / maxStock) * 100));
  }

  createProduct(): void {
    if (!this.newProduct.ProductName || !this.newProduct.SKU || !this.newProduct.Price) {
      alert('Please complete all product fields');
      return;
    }

    this.productService.createProduct(this.newProduct).subscribe({
      next: () => {
        this.newProduct = { ProductName: '', Description: '', CategoryId: 1, Price: 0, SKU: '', Quantity: 0 };
        this.inventoryService.loadInventory();
      },
    });
  }

  editProduct(productId: number): void {
    const priceValue = window.prompt('Enter the new product price');
    if (!priceValue) {
      return;
    }
    const parsedPrice = Number(priceValue);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Please enter a valid price greater than zero');
      return;
    }

    const stockValue = window.prompt('Enter the new stock quantity');
    if (stockValue === null) {
      return;
    }
    const parsedStock = Number(stockValue);
    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      alert('Please enter a valid stock quantity');
      return;
    }

    this.productService.updateProductPrice(productId, parsedPrice, 'Manual dashboard update').subscribe({
      next: () => {
        this.inventoryService.updateQuantity(productId, parsedStock).subscribe({
          next: () => {
            this.inventoryService.loadInventory();
            this.productService.loadProducts();
          },
        });
      },
    });
  }

  deleteProduct(productId: number): void {
    const confirmDelete = window.confirm('Delete this product? This will mark it inactive in demo mode.');
    if (!confirmDelete) {
      return;
    }

    this.productService.deleteProduct(productId).subscribe({
      next: () => this.inventoryService.loadInventory(),
    });
  }
}

// ============================================================================
// Sales Processing Component
// ============================================================================
@Component({
  selector: 'app-sales-processor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Create New Sale</h1>
        <p class="text-gray-600 mt-2">Process sales with real-time inventory updates via stored procedure</p>
      </div>

      <div class="bg-white rounded-lg shadow p-8 max-w-2xl">
        @if (salesService.successMessage$()) {
          <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded text-green-700">
            ✓ {{ salesService.successMessage$() }}
          </div>
        }

        @if (salesService.processingError$()) {
          <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            ✗ {{ salesService.processingError$() }}
          </div>
        }

        <form (ngSubmit)="processSale()" class="space-y-6">
          <!-- User Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">User</label>
            <select 
              [(ngModel)]="selectedUserId" 
              name="userId"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select User</option>
              <option value="3">Salesperson</option>
            </select>
          </div>

          <!-- Sale Number -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Sale Number</label>
            <input 
              [(ngModel)]="saleNumber" 
              name="saleNumber"
              placeholder="SALE-2024-001"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
          </div>

          <!-- Sale Items -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Sale Items</h3>
            @for (item of saleItems(); let i = $index; track i) {
              <div class="flex gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div class="flex-1 space-y-1">
                  <label class="text-xs font-semibold text-gray-600">Product Name</label>
                  <select
                    [(ngModel)]="item.ProductName"
                    [name]="'productName_' + i"
                    (change)="syncItemPrice(i)"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select product</option>
                    @for (product of productService.activeProducts(); track product.ProductId) {
                      <option [value]="product.ProductName">{{ product.ProductName }}</option>
                    }
                  </select>
                </div>
                <div class="w-24 space-y-1">
                  <label class="text-xs font-semibold text-gray-600">Quantity</label>
                  <input 
                    [(ngModel)]="item.Quantity" 
                    [name]="'qty_' + i"
                    type="number"
                    placeholder="Qty"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
                <div class="w-28 space-y-1">
                  <label class="text-xs font-semibold text-gray-600">Unit Price</label>
                  <input 
                    [(ngModel)]="item.UnitPrice" 
                    [name]="'price_' + i"
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
                <button 
                  type="button"
                  (click)="removeItem(i)"
                  class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                  Remove
                </button>
              </div>
            }
            <button 
              type="button"
              (click)="addItem()"
              class="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium">
              + Add Item
            </button>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea 
              [(ngModel)]="notes" 
              name="notes"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit"
            [disabled]="salesService.isProcessing$()"
            class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors">
            @if (salesService.isProcessing$()) {
              Processing...
            } @else {
              Process Sale (Stored Procedure)
            }
          </button>
        </form>
      </div>
    </div>
  `,
})
export class SalesProcessorComponent {
  selectedUserId = '3';
  saleNumber = '';
  notes = '';
  saleItems = signal<Array<{ ProductName: string; Quantity: number; UnitPrice: number }>>([
    { ProductName: '', Quantity: 0, UnitPrice: 0 },
  ]);

  constructor(public salesService: SalesService, public productService: ProductService) {}

  addItem(): void {
    const current = this.saleItems();
    this.saleItems.set([...current, { ProductName: '', Quantity: 0, UnitPrice: 0 }]);
  }

  removeItem(index: number): void {
    const current = this.saleItems();
    this.saleItems.set(current.filter((_, i) => i !== index));
  }

  processSale(): void {
    if (!this.selectedUserId || !this.saleNumber) {
      alert('Please fill in all required fields');
      return;
    }

    const validItems = this.saleItems().filter((item) => item.ProductName && item.Quantity > 0);
    if (validItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    this.salesService.processSale({
      UserId: parseInt(this.selectedUserId),
      SaleNumber: this.saleNumber,
      Items: validItems,
      Notes: this.notes,
    }).subscribe({
      next: () => {
        // Reset form
        this.saleNumber = '';
        this.notes = '';
        this.saleItems.set([{ ProductName: '', Quantity: 0, UnitPrice: 0 }]);
      },
      error: () => {
        // errors are handled by the service
      },
    });
  }

  syncItemPrice(index: number): void {
    const items = [...this.saleItems()];
    const selected = this.productService.activeProducts().find((product) => product.ProductName === items[index].ProductName);
    if (selected) {
      items[index].UnitPrice = selected.Price;
      this.saleItems.set(items);
    }
  }
}

// ============================================================================
// Recent Sales Component (Real-time Updates)
// ============================================================================
@Component({
  selector: 'app-recent-sales',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-gray-50">
      <div class="bg-white rounded-lg shadow mb-8">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Recent Sales (Auto-refreshing)</h2>
          <p class="text-sm text-gray-600 mt-1">Updates every 15 seconds</p>
        </div>

        @if (salesService.recentSales().length > 0) {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Sale #</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th class="px-6 py-3 text-right text-sm font-semibold text-gray-900">Total</th>
                  <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                @for (sale of salesService.recentSales(); track sale.SaleId) {
                  <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm font-medium text-blue-600">{{ sale.SaleNumber }}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">{{ sale.SaleDate | date: 'short' }}</td>
                    <td class="px-6 py-4 text-right text-sm font-semibold text-gray-900">{{ sale.TotalAmount | currency }}</td>
                    <td class="px-6 py-4 text-center text-sm">
                      <span [ngClass]="{
                        'bg-green-100 text-green-800': sale.SaleStatus === 'Completed',
                        'bg-red-100 text-red-800': sale.SaleStatus === 'Cancelled',
                        'bg-yellow-100 text-yellow-800': sale.SaleStatus === 'Pending'
                      }" class="px-3 py-1 rounded-full text-xs font-semibold">
                        {{ sale.SaleStatus }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="p-6 text-center text-gray-500">No sales yet</div>
        }
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Sales Overview</h3>
          <span class="text-sm text-gray-500">Top 6 sales by value</span>
        </div>
        <div class="space-y-4">
          @for (sale of salesService.recentSales().slice(0, 6); track sale.SaleId) {
            <div>
              <div class="flex justify-between text-sm text-gray-700 mb-1">
                <span>{{ sale.SaleNumber }}</span>
                <span>{{ sale.TotalAmount | currency }}</span>
              </div>
              <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div class="h-3 bg-gradient-to-r from-emerald-500 to-lime-500 rounded-full" [style.width.%]="getSaleBarWidth(sale.TotalAmount)"></div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class RecentSalesComponent {
  constructor(public salesService: SalesService) {}

  getSaleBarWidth(total: number): number {
    const max = Math.max(...this.salesService.recentSales().map((sale) => sale.TotalAmount), 1);
    return Math.min(100, Math.max(8, (total / max) * 100));
  }
}
