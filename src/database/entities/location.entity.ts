import { Column, CreateDateColumn, Entity, Index, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { UserEntity } from '~/database/entities/user.entity';

@Entity('locations')
@Index(['name'])
@Index('ix_locations__name_vector', { synchronize: false })
export class LocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'name' })
  name: string;

  @Column({
    type: 'tsvector',
    nullable: false,
    select: false,
    update: false,
    insert: false
  })
  readonly name_vector = undefined;

  @ManyToMany(() => UserEntity, (user) => user.locations)
  users: UserEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
