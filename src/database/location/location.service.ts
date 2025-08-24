import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IConfig } from '~/config/types';
import { LocationEntity, UserEntity } from '~/database/entities';
import { nonNull } from '~/utils';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(LocationEntity) private readonly locationRepository: Repository<LocationEntity>,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService<IConfig, true>
  ) {}

  async addLocation(input: addLocationInput) {
    const location = this.locationRepository.create(input);
    await this.locationRepository.save(location);
    return location;
  }

  async findLocations(query: string) {
    const queryBuilder = this.locationRepository.createQueryBuilder();
    queryBuilder.where(`name_vector @@ plainto_tsquery_prefix('simple', :query)`, { query }).limit(50);
    return queryBuilder.getMany();
  }

  async getLocationById(id: string) {
    return this.locationRepository.findOne({ where: { id } });
  }

  async getLocationByName(name: string) {
    return this.locationRepository.findOne({ where: { name } });
  }

  async addLocationToUser(telegramId: number, locationId: string) {
    const user = await this.userRepository.findOne({
      where: { telegramId },
      relations: ['locations']
    });
    if (!user) {
      throw new Error('User not found');
    }
    const location = await this.locationRepository.findOne({ where: { id: locationId } });
    if (!location) {
      throw new Error('Location not found');
    }
    if (!user.locations) {
      user.locations = [];
    }
    const locationExists = user.locations.some((loc) => loc.id === locationId);
    if (locationExists) {
      return { user, location, alreadyExists: true };
    }
    user.locations.push(location);
    await this.userRepository.save(user);
    return { user, location, alreadyExists: false };
  }

  async getUserLocations(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['locations']
    });
    return user?.locations || [];
  }

  async getUserLocationsByTelegramId(telegramId: number) {
    const user = await this.userRepository.findOne({
      where: { telegramId },
      relations: ['locations']
    });
    return user?.locations || [];
  }

  async removeLocationFromUser(userId: number, locationId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['locations']
    });
    if (!user || !user.locations) {
      return;
    }
    user.locations = user.locations.filter((loc) => loc.id !== locationId);
    await this.userRepository.save(user);
    return;
  }

  async removeLocationFromUserByTelegramId(telegramId: number, locationId: string) {
    const user = await this.userRepository.findOne({
      where: { telegramId },
      relations: ['locations']
    });
    if (!user || !user.locations) {
      return;
    }
    user.locations = user.locations.filter((loc) => loc.id !== locationId);
    await this.userRepository.save(user);
    return;
  }

  async getAllUserLocationMappings(): Promise<Array<{ userId: number; locationName: string; telegramId: number }>> {
    const users = await this.userRepository.find({
      relations: ['locations']
    });
    const mappings: Array<{ userId: number; locationName: string; telegramId: number }> = [];
    users.forEach((user) => {
      if (user.locations && user.locations.length > 0) {
        user.locations.forEach((location) => {
          mappings.push({
            userId: user.id,
            locationName: location.name,
            telegramId: user.telegramId
          });
        });
      }
    });

    return mappings;
  }

  async isUserLocationLimitExceeded(telegramId: number) {
    const locationCount = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.locations', 'location')
      .where('user.telegramId = :telegramId', { telegramId })
      .select('COUNT(location.id)', 'count')
      .getRawOne();
    const count = parseInt(locationCount?.count || '0', 10);
    return count >= nonNull(this.configService.get('app.userLocationsLimit', { infer: true }));
  }
}

interface addLocationInput {
  name: string;
}
