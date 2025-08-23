import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UpdateProvider } from '~/bot/update.provider';
import { UserEntity } from '~/database/entities';
import { LocationModule } from '~/database/location/location.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), LocationModule],
  providers: [UpdateProvider]
})
export class BotModule {}
