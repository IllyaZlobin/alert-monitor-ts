import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('messages')
@Index(['telegramMessageId'], { unique: true })
@Index('ix_messages__text_vector', { synchronize: false })
@Index(['processedAt'])
@Index(['createdAt'])
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', name: 'telegram_message_id', unique: true })
  telegramMessageId: number;

  @Column({ type: 'text' })
  text: string;

  @Column({
    type: 'tsvector',
    nullable: false,
    select: false,
    update: false,
    insert: false
  })
  readonly text_vector = undefined;

  @Column({ type: 'varchar', name: 'message_url' })
  messageUrl: string;

  @Column({ type: 'timestamptz', name: 'message_time' })
  messageTime: Date;

  @Column({ type: 'timestamptz', name: 'processed_at', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
