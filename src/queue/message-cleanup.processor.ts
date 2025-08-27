import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { MessageService } from '~/database/message/message.service';
import { MESSAGE_CLEANUP_QUEUE } from '~/queue/constants';

@Processor(MESSAGE_CLEANUP_QUEUE.name)
export class MessageCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageCleanupProcessor.name);

  constructor(private readonly messageService: MessageService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Cleaning up old messages');
    await this.messageService.cleanupOldMessages();
    this.logger.log('Old messages cleaned up');
  }
}
