import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { UserStatus } from '../users/userstatus.entity';
import { Organisation } from '../organisation/organisation.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host:     process.env.DB_HOST     || '127.0.0.1',   
  port:     parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME     || 'ekyc',
  entities: [User, Role, UserStatus, Organisation],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});