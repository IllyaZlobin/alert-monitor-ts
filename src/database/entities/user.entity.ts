import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { LocationEntity } from './location.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ type: 'bigint', unique: true, name: 'telegram_id' })
  @Index()
  telegramId: number;

  @Column({ type: 'varchar', name: 'first_name' })
  @Index()
  firstName: string;

  @Column({ type: 'varchar', name: 'last_name', nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', nullable: true })
  username: string | null;

  @ManyToMany(() => LocationEntity)
  @JoinTable({
    name: 'users_locations',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'location_id',
      referencedColumnName: 'id'
    }
  })
  locations: LocationEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
