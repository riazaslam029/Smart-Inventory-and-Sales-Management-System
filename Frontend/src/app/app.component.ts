/**
 * Angular App Component - Root Component
 * Uses Standalone components (Angular 20)
 */

import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/index';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (authService.isAuthenticated$()) {
      <div class="flex h-screen bg-gray-100">
        <!-- Sidebar Navigation -->
        <aside class="w-64 bg-gray-900 text-white shadow-lg">
          <div class="p-6 border-b border-gray-800">
            <h1 class="text-2xl font-bold text-white">📦 Inventory</h1>
            <p class="text-sm text-gray-400 mt-1">Sales Management</p>
          </div>

          <nav class="p-6 space-y-4">
            <a 
              routerLink="/dashboard"
              routerLinkActive="bg-blue-600"
              class="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
              <span class="text-xl">📊</span>
              <span class="ml-3 font-medium">Dashboard</span>
            </a>

            <a 
              routerLink="/sales"
              routerLinkActive="bg-blue-600"
              class="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
              <span class="text-xl">💳</span>
              <span class="ml-3 font-medium">New Sale</span>
            </a>

            <a 
              routerLink="/recent-sales"
              routerLinkActive="bg-blue-600"
              class="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
              <span class="text-xl">📈</span>
              <span class="ml-3 font-medium">Recent Sales</span>
            </a>
          </nav>

          <div class="absolute bottom-0 w-64 p-6 border-t border-gray-800">
            <div class="text-sm text-gray-400">
              <p class="font-semibold text-white mb-2">Tech Stack</p>
              <ul class="space-y-1 text-xs">
                <li>✓ Angular 20 Signals</li>
                <li>✓ NestJS Backend</li>
                <li>✓ MS SQL Database</li>
                <li>✓ Stored Procedures</li>
                <li>✓ Tailwind CSS</li>
              </ul>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="flex-1 overflow-auto">
          <!-- Top Header -->
          <header class="bg-white shadow-sm p-6">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold text-gray-900">Inventory & Sales Management System</h2>
              <div class="flex items-center space-x-4">
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900">{{ authService.username$() }}</p>
                  <p class="text-xs text-gray-500">Administrator</p>
                </div>
                <div class="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold">
                  AD
                </div>
                <button
                  (click)="signOut()"
                  class="ml-2 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-900 hover:text-white transition">
                  Sign Out
                </button>
              </div>
            </div>
          </header>

          <!-- Page Content -->
          <main class="overflow-auto">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
    } @else {
      <div class="min-h-screen bg-gray-100">
        <router-outlet></router-outlet>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class AppComponent {
  title = 'Inventory & Sales Management System';

  constructor(public authService: AuthService) {}

  signOut(): void {
    this.authService.logout();
  }
}
