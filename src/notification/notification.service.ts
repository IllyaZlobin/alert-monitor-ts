import { Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import _ from 'lodash';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

import { MessageEntity } from '~/database/entities';

dayjs.extend(utc);
dayjs.extend(timezone);

const TELEGRAM_RATE_LIMIT = {
  MAX_MESSAGES_PER_SECOND: 30,
  SAFE_BATCH_SIZE: 30,
  BATCH_DELAY_MS: 1000
} as const;

interface NotificationData {
  userId: number; // user's telegram ID
  message: MessageEntity;
  matchedLocation: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  async sendAlertNotification(data: NotificationData): Promise<void> {
    try {
      const { userId, message, matchedLocation } = data;
      const notificationText = this.formatAlertMessage(message, matchedLocation);
      await this.bot.telegram.sendMessage(userId, notificationText, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📖 Читати повідомлення',
                url: message.messageUrl
              }
            ]
          ]
        }
      });
      this.logger.log(`Sent alert notification to user ${userId} for location: ${matchedLocation}`);
    } catch (error) {
      this.logger.error(`Error sending alert notification to user ${data.userId}:`, error);
      if (error.code === 403) {
        this.logger.warn(`User ${data.userId} blocked the bot`);
      } else if (error.code === 400) {
        this.logger.warn(`User ${data.userId} not found or deleted their account`);
      }
      throw error;
    }
  }

  /**
   * Rate limiting strategy:
   * - Small batches (≤30 messages): Send immediately in parallel
   * - Large batches (>30 messages): Split into chunks of 30 with 1s delays between batches
   */
  async sendBulkAlertNotifications(notifications: NotificationData[]): Promise<void> {
    if (notifications.length === 0) {
      return;
    }

    this.logger.log(`Sending ${notifications.length} notifications`);

    if (notifications.length <= TELEGRAM_RATE_LIMIT.SAFE_BATCH_SIZE) {
      const sendPromises = notifications.map((notification) =>
        this.sendAlertNotification(notification).catch((error) => {
          this.logger.error(`Failed to send notification to user ${notification.userId}:`, error);
          return;
        })
      );
      await Promise.allSettled(sendPromises);
    } else {
      this.logger.log(
        `Large batch detected (${notifications.length} notifications). Sending in batches of ${TELEGRAM_RATE_LIMIT.SAFE_BATCH_SIZE}`
      );
      for (let i = 0; i < notifications.length; i += TELEGRAM_RATE_LIMIT.SAFE_BATCH_SIZE) {
        const batch = notifications.slice(i, i + TELEGRAM_RATE_LIMIT.SAFE_BATCH_SIZE);
        const batchNumber = Math.floor(i / TELEGRAM_RATE_LIMIT.SAFE_BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(notifications.length / TELEGRAM_RATE_LIMIT.SAFE_BATCH_SIZE);
        this.logger.log(`Sending batch ${batchNumber}/${totalBatches} (${batch.length} notifications)`);
        const sendPromises = batch.map((notification) =>
          this.sendAlertNotification(notification).catch((error) => {
            this.logger.error(`Failed to send notification to user ${notification.userId}:`, error);
            return;
          })
        );
        await Promise.allSettled(sendPromises);
        // Add delay between batches (except for the last batch)
        if (i + TELEGRAM_RATE_LIMIT.SAFE_BATCH_SIZE < notifications.length) {
          this.logger.log(`Waiting ${TELEGRAM_RATE_LIMIT.BATCH_DELAY_MS}ms before next batch...`);
          await this.delay(TELEGRAM_RATE_LIMIT.BATCH_DELAY_MS);
        }
      }
    }

    this.logger.log(`Finished sending notifications`);
  }

  private formatAlertMessage(message: MessageEntity, matchedLocation: string): string {
    const messageTime = dayjs(message.messageTime).tz('Europe/Kiev').format('DD.MM.YYYY HH:mm');
    return `
🚨 <b>ТРИВОГА!</b> 🚨

📍 <b>Локація:</b> ${_.capitalize(matchedLocation)}
🕐 <b>Час:</b> ${messageTime}

<b>Повідомлення:</b>
${_.escape(message.text)}

⚠️ <i>Будьте обережні та дотримуйтесь правил безпеки!</i>
    `.trim();
  }

  async sendProcessingStats(
    adminUserId: number,
    stats: {
      processedMessages: number;
      sentNotifications: number;
      errors: number;
    }
  ): Promise<void> {
    const statsText = `
📊 <b>Статистика обробки</b>

📨 Оброблено повідомлень: ${stats.processedMessages}
🔔 Відправлено сповіщень: ${stats.sentNotifications}  
❌ Помилок: ${stats.errors}

🕐 Час: ${dayjs().tz('Europe/Kiev').format('DD.MM.YYYY HH:mm')}
    `.trim();
    try {
      await this.bot.telegram.sendMessage(adminUserId, statsText, {
        parse_mode: 'HTML'
      });
    } catch (error) {
      this.logger.error(`Error sending processing stats to admin ${adminUserId}:`, error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
