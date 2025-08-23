import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

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
}
