import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { KycSessionStatus } from '../../common/enums/kyc-session-status.enum';
import { KycDocument } from './kyc-document.entity';

@Entity({ name: 'kyc_sessions' })
export class KycSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'user_reference',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  userReference?: string | null;

  @Column({
    type: 'enum',
    enum: KycSessionStatus,
    default: KycSessionStatus.AWAITING_DOCUMENT,
  })
  status!: KycSessionStatus;

  @OneToMany(() => KycDocument, (document) => document.session)
  documents!: KycDocument[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
