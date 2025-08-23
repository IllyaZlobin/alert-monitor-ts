import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { LocationModule } from '~/database/location/location.module';
import { MessageModule } from '~/database/message/message.module';
import { NotificationModule } from '~/notification/notification.module';
import { MESSAGE_PROCESSING_QUEUE } from '~/queue/constants';
import { MessageProcessingProcessor } from '~/queue/message-processing.processor';

@Module({
  imports: [
    MessageModule,
    LocationModule,
    NotificationModule,
    BullModule.registerQueue({
      name: MESSAGE_PROCESSING_QUEUE.name
    })
  ],
  providers: [MessageProcessingProcessor],
  exports: [MessageProcessingProcessor]
})
export class QueueModule {}
