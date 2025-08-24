import { Module } from '@nestjs/common';

import { LocationModule } from '~/database/location/location.module';
import { MessageModule } from '~/database/message/message.module';
import { NotificationModule } from '~/notification/notification.module';
import { MessageProcessingProcessor } from '~/queue/message-processing.processor';
import { ParsingProcessor } from '~/queue/parsing.processor';
import { SchedulerModule } from '~/scheduler/scheduler.module';

@Module({
  imports: [MessageModule, LocationModule, NotificationModule, SchedulerModule],
  providers: [MessageProcessingProcessor, ParsingProcessor],
  exports: [MessageProcessingProcessor]
})
export class QueueModule {}
