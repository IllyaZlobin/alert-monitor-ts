import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

import { AppEnvironment } from '~/config';
import { IConfig } from '~/config/types';
import { Monitor } from '~/monitor/monitor';
import { MESSAGE_CLEANUP_QUEUE, PARSING_SCHEDULER_QUEUE } from '~/queue/constants';
@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private isRunning = false;
  private readonly intervalSeconds: number;

  constructor(
    private readonly monitor: Monitor,
    private readonly configService: ConfigService<IConfig, true>,
    @InjectQueue(PARSING_SCHEDULER_QUEUE.name) private readonly parsingQueue: Queue,
    @InjectQueue(MESSAGE_CLEANUP_QUEUE.name) private readonly messageCleanupQueue: Queue
  ) {
    this.intervalSeconds = parseInt(process.env.PARSE_INTERVAL_SECONDS || '30'); // TODO use config
  }

  async onModuleInit() {
    this.logger.log('Schedule is initializing');

    const shouldAutoStart = this.configService.get('app.env', { infer: true }) === AppEnvironment.PRODUCTION;

    if (shouldAutoStart) {
      await this.start();
      await this.startMessageCleanup();
    } else {
      this.logger.log('Auto schedule running was disabled');
    }
  }

  async onModuleDestroy() {
    this.logger.log('Stopping the scheduler...');
    await this.stop();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.logger.log(`Schedule planner is starting with interval ${this.intervalSeconds} seconds`);
    await this.parsingQueue.add(
      PARSING_SCHEDULER_QUEUE.jobName,
      {},
      {
        repeat: {
          every: this.intervalSeconds * 1000
        },
        removeOnComplete: 50, // Keep last 50 completed jobs
        removeOnFail: 10 // Keep last 10 failed jobs
      }
    );

    this.isRunning = true;
    this.logger.log('Schedule planner is running');
  }

  async startMessageCleanup(): Promise<void> {
    await this.messageCleanupQueue.add(
      MESSAGE_CLEANUP_QUEUE.jobName,
      {},
      {
        repeat: {
          every: 1000 * 60 * 60 * 24 * 2 // every 2 days
        },
        removeOnComplete: 50,
        removeOnFail: 10
      }
    );
    this.logger.log('Message cleanup scheduler started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    const repeatableJobs = await this.parsingQueue.getJobSchedulers();
    for (const job of repeatableJobs) {
      if (job.name.includes(PARSING_SCHEDULER_QUEUE.jobName)) {
        await this.parsingQueue.removeJobScheduler(job.key);
        this.logger.log(`Removed repeatable job: ${job.key}`);
      }
      if (job.name.includes(MESSAGE_CLEANUP_QUEUE.jobName)) {
        await this.messageCleanupQueue.removeJobScheduler(job.key);
        this.logger.log(`Removed message cleanup job: ${job.key}`);
      }
    }
    this.isRunning = false;
    this.logger.log('Schedule planner was stopped');
  }

  async restart(): Promise<void> {
    this.logger.log('Restarting scheduler...');
    await this.stop();
    await this.start();
  }

  async executeTask(): Promise<void> {
    try {
      this.logger.log('Start parsing and processing messages...');
      const startTime = Date.now();
      await this.monitor.parseAndProcessMessages();
      const executionTime = Date.now() - startTime;
      this.logger.log(`Cycle completed in ${executionTime}ms`);
    } catch (error) {
      this.logger.error('Error executing scheduler cycle:', error);
      throw error;
    }
  }
}
