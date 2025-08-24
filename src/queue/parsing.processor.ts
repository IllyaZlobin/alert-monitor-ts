import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { PARSING_SCHEDULER_QUEUE } from '~/queue/constants';
import { SchedulerService } from '~/scheduler/scheduler.service';

@Processor(PARSING_SCHEDULER_QUEUE.name)
export class ParsingProcessor extends WorkerHost {
  private readonly logger = new Logger(ParsingProcessor.name);

  constructor(private readonly schedulerService: SchedulerService) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    if (job.name === PARSING_SCHEDULER_QUEUE.jobName) {
      this.logger.log(`Processing parsing job: ${job.id}`);
      const startTime = Date.now();
      await this.schedulerService.executeTask();
      const duration = Date.now() - startTime;
      this.logger.log(`Parsing job ${job.id} completed in ${duration}ms`);
      return;
    }
    this.logger.warn(`Unknown job type: ${job.name}`);
  }
}
