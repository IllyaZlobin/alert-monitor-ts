import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ type: 'bigint', unique: true })
  telegramId: number;

  @Column({ type: 'varchar' })
  @Index()
  firstName: string;

  @Column({ type: 'varchar', nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', nullable: true })
  username: string | null;
}
