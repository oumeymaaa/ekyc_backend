import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { mkdirSync } from 'fs';
import * as express from 'express';
async function bootstrap() {
 const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });  
  app.enableCors({
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });  
  app.use((req, _res, next) => {
    if ((req.headers['content-type'] ?? '').startsWith('multipart/')) {
      return next();                        // hand off to Multer
    }
    express.json({ limit: '10mb' })(req, _res, next);
  });

  app.use((req, _res, next) => {
    if ((req.headers['content-type'] ?? '').startsWith('multipart/')) {
      return next();
    }
    express.urlencoded({ limit: '10mb', extended: true })(req, _res, next);
  });

  // ── 3. Static assets ─────────────────────────────────────────────────────
  mkdirSync('./uploads/logos', { recursive: true });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
