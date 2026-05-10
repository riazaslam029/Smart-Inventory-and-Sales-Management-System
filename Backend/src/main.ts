/**
 * NestJS Application Entry Point
 * Bootstrap the application
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppDemoModule } from './app-demo.module';
import { AppModule } from './app.module';

async function bootstrap() {
  const useDatabase = (process.env.USE_DATABASE || '').toLowerCase() === 'true';
  const rootModule = useDatabase ? AppModule : AppDemoModule;
  const app = await NestFactory.create(rootModule);

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  });

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);

  console.log(`
    ╔════════════════════════════════════════════════════╗
    ║  Inventory & Sales Management API                  ║
    ║  Server running on: http://localhost:${PORT}        ║
    ║  Environment: ${process.env.NODE_ENV || 'development'} - ${useDatabase ? 'DATABASE MODE' : 'DEMO MODE'}   ║
    ╚════════════════════════════════════════════════════╝
  `);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
