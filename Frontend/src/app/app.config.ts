/**
 * Angular App Configuration
 * Setup for Angular 20 standalone application
 */

import { ApplicationConfig, inject } from '@angular/core';
import { provideRouter, CanActivateFn, Router } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './services/index';

const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated$()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([
      {
        path: 'login',
        loadComponent: () => import('./components').then((m) => m.LoginComponent),
      },
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./components').then((m) => m.ProductListComponent),
      },
      {
        path: 'sales',
        canActivate: [authGuard],
        loadComponent: () => import('./components').then((m) => m.SalesProcessorComponent),
      },
      {
        path: 'recent-sales',
        canActivate: [authGuard],
        loadComponent: () => import('./components').then((m) => m.RecentSalesComponent),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ]),
    provideAnimations(),
    provideHttpClient(),
  ],
};
