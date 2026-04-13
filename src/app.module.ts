import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { AppController } from './app.controller';
import { KycDocument } from './database/entities/kyc-document.entity';
import { KycSession } from './database/entities/kyc-session.entity';
import { KycModule } from './kyc/kyc.module';
import { OcrModule } from './ocr/ocr.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', '127.0.0.1'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
        database: configService.get<string>('DATABASE_NAME', 'ekyc'),
        entities: [KycSession, KycDocument],
        synchronize:
          configService.get<string>('DATABASE_SYNCHRONIZE', 'true') === 'true',
        autoLoadEntities: true,
      }),
    }),
    OcrModule,
    KycModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
