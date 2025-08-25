import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { MessageEntity } from '~/database/entities';
import { LocationService } from '~/database/location/location.service';
import { MessageService } from '~/database/message/message.service';
import { NotificationService } from '~/notification/notification.service';
import { MESSAGE_PROCESSING_QUEUE } from '~/queue/constants';

interface ProcessMessageJobData {
  messageId: string;
}

@Processor(MESSAGE_PROCESSING_QUEUE.name)
export class MessageProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageProcessingProcessor.name);

  constructor(
    private readonly messageService: MessageService,
    private readonly locationService: LocationService,
    private readonly notificationService: NotificationService
  ) {
    super();
  }

  async process(job: Job<ProcessMessageJobData>): Promise<void> {
    const { messageId } = job.data;

    this.logger.log(`Message is processing: ${messageId}`);

    const targetMessage = await this.messageService.getUnprocessedMessageById(messageId);
    if (!targetMessage) {
      this.logger.warn(`Message ${messageId} not found or has been already processed`);
      return;
    }

    try {
      const userLocations = await this.locationService.getAllUserLocationMappings();

      if (userLocations.length === 0) {
        this.logger.log('There are no any locations for checking');
        await this.messageService.markMessageAsProcessed(messageId);
        return;
      }

      const matches = await this.findLocationMatches(targetMessage, userLocations);
      if (matches.length === 0) {
        this.logger.log(`No location matches found for the message ${messageId}`);
        await this.messageService.markMessageAsProcessed(messageId);
        return;
      }

      this.logger.log(`Found ${matches.length} matches with locations for the message ${messageId}`);

      // TODO Save users's alert notifications to the database. In the future to aggregate them and collect statistics.
      const userNotifications = this.groupNotificationsByUser(matches, targetMessage);
      await this.notificationService.sendBulkAlertNotifications(userNotifications);

      this.logger.log(
        `Message ${messageId} was successfully processed, sent ${userNotifications.length} notifications`
      );
    } catch (error) {
      this.logger.error(`Error processing the message ${messageId}:`, error);
    } finally {
      await this.messageService.markMessageAsProcessed(messageId);
    }
  }

  private async findLocationMatches(
    targetMessage: MessageEntity,
    userLocations: Array<{ userId: number; locationName: string; telegramId: number }>
  ): Promise<Array<{ userId: number; locationName: string; telegramId: number }>> {
    const uniqueLocations = [...new Set(userLocations.map((ul) => ul.locationName))];
    if (uniqueLocations.length === 0) {
      return [];
    }

    const matchedLocations = await this.messageService.findLocationsByMessageId(targetMessage.id, uniqueLocations);
    if (matchedLocations.length === 0) {
      return [];
    }

    const matches: Array<{ userId: number; locationName: string; telegramId: number }> = [];
    for (const location of matchedLocations) {
      const usersWithLocation = userLocations.filter((ul) => ul.locationName === location);
      matches.push(...usersWithLocation);
    }
    return matches;
  }

  private groupNotificationsByUser(
    matches: Array<{ userId: number; locationName: string; telegramId: number }>,
    message: MessageEntity
  ): Array<{ userId: number; message: MessageEntity; matchedLocation: string }> {
    // TODO: Minor optimization - could use Set instead of Array + includes() for better performance
    // with large location lists per user, but current approach is fine for typical usage
    const groupedByUser = new Map<number, string[]>();

    matches.forEach((match) => {
      const existing = groupedByUser.get(match.telegramId) || [];
      if (!existing.includes(match.locationName)) {
        existing.push(match.locationName);
      }
      groupedByUser.set(match.telegramId, existing);
    });

    const notifications: Array<{ userId: number; message: MessageEntity; matchedLocation: string }> = [];
    groupedByUser.forEach((locations, telegramId) => {
      const matchedLocation = locations.length > 1 ? locations.join(', ') : locations[0];
      notifications.push({
        userId: telegramId,
        message: message,
        matchedLocation: matchedLocation
      });
    });
    return notifications;
  }
}
