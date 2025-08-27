import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { MessageModule } from '~/database/message/message.module';
import { Monitor } from '~/monitor/monitor';
import { MESSAGE_PROCESSING_QUEUE } from '~/queue/constants';

@Module({
  imports: [
    HttpModule,
    MessageModule,
    BullModule.registerQueue({
      name: MESSAGE_PROCESSING_QUEUE.name
    })
  ],
  providers: [Monitor],
  exports: [Monitor]
})
export class MonitorModule {}
