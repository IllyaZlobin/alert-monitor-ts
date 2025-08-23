import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { Repository } from 'typeorm';

import { UserEntity } from '~/database/entities';
import { nonNull } from '~/utils';

@Update()
export class UpdateProvider {
  private readonly logger = new Logger(UpdateProvider.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const user = nonNull(ctx.from);
    await this.userRepo.upsert(
      { telegramId: user.id, firstName: user.first_name, username: user.username, lastName: user.last_name },
      { conflictPaths: { telegramId: true }, skipUpdateIfNoValuesChanged: true, upsertType: 'on-conflict-do-update' }
    );
    ctx.reply(`Вітаю! Ви успішно зареєструвались!`);
  }
}
