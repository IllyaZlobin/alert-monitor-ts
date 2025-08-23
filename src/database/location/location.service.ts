import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LocationEntity, UserEntity } from '~/database/entities';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(LocationEntity) private readonly locationRepository: Repository<LocationEntity>,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>
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
}

interface addLocationInput {
  name: string;
}
