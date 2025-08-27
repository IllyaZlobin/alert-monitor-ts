import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not, MoreThanOrEqual } from 'typeorm';

import { MessageEntity } from '~/database/entities';
import { TelegramMessage } from '~/monitor/types';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>
  ) {}

  /**
   * Save messages to the database. Check max incoming id and save only new messages.
   */
  async saveMessages(telegramMessages: TelegramMessage[]): Promise<MessageEntity[]> {
    if (telegramMessages.length === 0) {
      return [];
    }

    try {
      const maxIncomingId = Math.max(...telegramMessages.map((msg) => msg.id));

      // TODO: Optimize to single query instead of two separate queries
      /*Could use: SELECT MAX(telegram_message_id) as max_existing,
                         EXISTS(SELECT 1 WHERE telegram_message_id = $1) as has_max_incoming
      This would reduce DB roundtrips from 2 to 1, but impact is minimal since
      this method runs only every 30 seconds */
      const existingMaxMessage = await this.messageRepository.findOne({
        where: { telegramMessageId: maxIncomingId }
      });
      if (existingMaxMessage) {
        this.logger.log('All messages are already up to date');
        return [];
      }
      const [maxExistingMessage] = await this.messageRepository.find({
        order: { telegramMessageId: 'DESC' },
        select: ['telegramMessageId'],
        take: 1
      });
      const maxExistingId = maxExistingMessage?.telegramMessageId || 0;
      const newMessages = telegramMessages.filter((msg) => msg.id > maxExistingId);
      if (newMessages.length === 0) {
        this.logger.log('No new messages to save');
        return [];
      }
      const messagesToSave = newMessages.map((msg) => ({
        telegramMessageId: msg.id,
        text: msg.text,
        messageUrl: msg.url,
        messageTime: new Date(msg.time),
        processedAt: null
      }));
      const savedEntities = await this.messageRepository.save(messagesToSave);
      this.logger.log(`Saved ${savedEntities.length} new messages (IDs: ${newMessages.map((m) => m.id).join(', ')})`);
      return savedEntities;
    } catch (error) {
      this.logger.error('Error saving messages:', error);
      throw error;
    }
  }

  async getUnprocessedMessages(): Promise<MessageEntity[]> {
    return this.messageRepository.find({
      where: { processedAt: IsNull() },
      order: { createdAt: 'ASC' }
    });
  }

  async getUnprocessedMessageById(messageId: string): Promise<MessageEntity | null> {
    return this.messageRepository.findOne({
      where: {
        id: messageId,
        processedAt: IsNull()
      }
    });
  }

  async markAsProcessed(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) {
      return;
    }
    await this.messageRepository.update({ id: In(messageIds) }, { processedAt: new Date() });
    this.logger.log(`Messages ${messageIds.length} are marked as processed`);
  }

  async markMessageAsProcessed(messageId: string): Promise<void> {
    await this.markAsProcessed([messageId]);
  }

  async cleanupOldMessages(): Promise<void> {
    const maxMessage = await this.messageRepository.findOne({
      select: ['telegramMessageId'],
      order: { telegramMessageId: 'DESC' },
      where: { processedAt: Not(IsNull()) }
    });
    if (!maxMessage) {
      this.logger.log('No messages found for cleanup');
      return;
    }
    // Delete all messages except the one with the highest telegramMessageId
    const result = await this.messageRepository
      .createQueryBuilder()
      .delete()
      .where('telegram_message_id < :maxId', { maxId: maxMessage.telegramMessageId })
      .andWhere('processed_at IS NOT NULL')
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Deleted ${result.affected} old messages, kept message with ID ${maxMessage.telegramMessageId}`);
    }
    return;
  }

  /**
   * Find messages with passed locations
   */
  async findMessagesWithLocations(locationNames: string[]): Promise<MessageEntity[]> {
    if (locationNames.length === 0) {
      return [];
    }

    // TODO: For very large location lists, consider using unnest() approach
    /* Similar to findLocationsByMessageId but reversed:
    SELECT m.* FROM messages m, unnest($1::text[]) AS loc
    WHERE m.text_vector @@ plainto_tsquery('simple', loc) AND m.processed_at IS NULL */
    const queryBuilder = this.messageRepository.createQueryBuilder('message');
    const searchConditions = locationNames.map(
      (_, index) => `message.text_vector @@ plainto_tsquery('simple', :location${index})`
    );
    queryBuilder.where(`(${searchConditions.join(' OR ')})`);
    locationNames.forEach((location, index) => {
      queryBuilder.setParameter(`location${index}`, location);
    });
    queryBuilder.andWhere('message.processedAt IS NULL').orderBy('message.createdAt', 'ASC');
    return queryBuilder.getMany();
  }

  /**
   * Find locations that are mentioned in the message
   */
  async findLocationsByMessageId(messageId: string, locationNames: string[]): Promise<string[]> {
    if (locationNames.length === 0) {
      return [];
    }
    const foundLocationsQuery = `
      SELECT location_name
      FROM unnest($1::text[]) AS location_name
      WHERE EXISTS (
        SELECT 1 FROM messages 
        WHERE id = $2 
        AND text_vector @@ plainto_tsquery('simple', location_name)
      )
    `;
    const result = await this.messageRepository.query(foundLocationsQuery, [locationNames, messageId]);
    return result.map((row: { location_name: string }) => row.location_name);
  }

  async getMessagesStats(): Promise<{
    total: number;
    processed: number;
    unprocessed: number;
    lastHour: number;
  }> {
    const [total, processed, lastHour] = await Promise.all([
      this.messageRepository.count(),
      this.messageRepository.count({ where: { processedAt: Not(IsNull()) } }),
      this.messageRepository.count({
        where: {
          createdAt: MoreThanOrEqual(new Date(Date.now() - 60 * 60 * 1000))
        }
      })
    ]);

    return {
      total,
      processed,
      unprocessed: total - processed,
      lastHour
    };
  }
}
