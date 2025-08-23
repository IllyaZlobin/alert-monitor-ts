import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LocationEntity, UserEntity } from '~/database/entities';
import { LocationService } from '~/database/location/location.service';

@Module({
  imports: [TypeOrmModule.forFeature([LocationEntity, UserEntity])],
  providers: [LocationService],
  exports: [LocationService]
})
export class LocationModule {}
