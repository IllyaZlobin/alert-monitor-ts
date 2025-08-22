import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { Monitor } from '~/monitor/monitor';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [Monitor]
})
export class MonitorModule {}
