import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MessageEntity } from '~/database/entities';
import { MessageService } from '~/database/message/message.service';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity])],
  providers: [MessageService],
  exports: [MessageService]
})
export class MessageModule {}
