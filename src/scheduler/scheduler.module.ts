import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { MonitorModule } from '~/monitor/monitor.module';
import { PARSING_SCHEDULER_QUEUE } from '~/queue/constants';
import { SchedulerService } from '~/scheduler/scheduler.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: PARSING_SCHEDULER_QUEUE.name
    }),
    MonitorModule
  ],
  providers: [SchedulerService],
  controllers: [],
  exports: [SchedulerService]
})
export class SchedulerModule {}
