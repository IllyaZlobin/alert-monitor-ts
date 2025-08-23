import { Controller, Get } from '@nestjs/common';

import { MessageService } from '~/database/message/message.service';
import { Monitor } from '~/monitor/monitor';

// TODO: Remove MonitorController. Now it needs only for testing purposes

@Controller('monitor')
export class MonitorController {
  constructor(
    private readonly monitorService: Monitor,
    private readonly messageService: MessageService
  ) {}

  @Get('messages')
  async getChannelMessages() {
    return this.monitorService.getChannelMessages();
  }

  @Get('parse-and-process')
  async parseAndProcessMessages() {
    await this.monitorService.parseAndProcessMessages();
    return;
  }

  @Get('cleanup')
  async cleanupOldMessages() {
    await this.monitorService.cleanupOldMessages();
    return;
  }

  @Get('stats')
  async getMessagesStats() {
    return this.messageService.getMessagesStats();
  }
}
