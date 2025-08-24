import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { Action, Command, Ctx, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/types';
import { Repository } from 'typeorm';

import { UserEntity } from '~/database/entities';
import { LocationService } from '~/database/location/location.service';
import { nonNull } from '~/utils';

@Update()
export class UpdateProvider {
  private readonly logger = new Logger(UpdateProvider.name);

  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    private readonly locationService: LocationService
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const user = nonNull(ctx.from);
    await this.userRepo.upsert(
      { telegramId: user.id, firstName: user.first_name, username: user.username, lastName: user.last_name },
      { conflictPaths: { telegramId: true }, skipUpdateIfNoValuesChanged: true, upsertType: 'on-conflict-do-update' }
    );
    await ctx.reply(`Вітаю! Ви успішно зареєструвались!`);
    return;
  }

  @Command('add_location')
  async onAddLocation(@Ctx() ctx: Context) {
    const text = ctx.text;
    const locationName = text?.replace('/add_location', '').trim();
    if (!locationName) {
      await ctx.reply(
        '🔍 <b>Введіть назву локації:</b>\n\n' +
          '<b>Приклади:</b>\n' +
          '• <code>/add_location Київ</code>\n' +
          '• <code>/add_location Одеса</code>\n\n' +
          '• <code>/add_location Поділ</code>\n\n' +
          '• <code>/add_location Жуляни</code>\n\n' +
          '• <code>/add_location Бровари</code>\n\n' +
          '<i>Просто напишіть команду та назву локації</i>',
        { parse_mode: 'HTML' }
      );
      return;
    }
    const validationResult = this.validateLocationName(locationName);
    if (!validationResult.isValid) {
      await ctx.reply(
        `❌ **Помилка валідації:**\n\n` + `${validationResult.error}\n\n` + 'Спробуйте ще раз з правильною назвою.',
        { parse_mode: 'Markdown' }
      );
      return;
    }
    const existingLocation = await this.locationService.getLocationByName(locationName.toLowerCase());
    if (existingLocation) {
      await this.locationService.addLocationToUser(nonNull(ctx.from).id, existingLocation.id);
      await ctx.reply(`✅ Локація "${_.capitalize(locationName)}" успішно додана до вашого списку`);
      return;
    }
    const newLocation = await this.locationService.addLocation({
      name: locationName.toLowerCase()
    });
    await this.locationService.addLocationToUser(nonNull(ctx.from).id, newLocation.id);
    await ctx.reply(`✅ Локація "${_.capitalize(newLocation.name)}" успішно додана до вашого списку`);
  }

  @Command('list_locations')
  async onListLocations(@Ctx() ctx: Context) {
    const userId = nonNull(ctx.from).id;
    const locations = await this.locationService.getUserLocationsByTelegramId(userId);

    if (locations.length === 0) {
      await ctx.reply(
        '📍 <b>У вас немає збережених локацій</b>\n\n' +
          'Щоб додати локацію, скористайтесь командою:\n' +
          '<code>/add_location назва_міста</code>',
        { parse_mode: 'HTML' }
      );
      return;
    }

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: locations.map((location) => [
        {
          text: `❌ Видалити "${_.capitalize(location.name)}"`,
          callback_data: `delete_location:${location.id}`
        }
      ])
    };

    await ctx.reply(
      `📍 <b>Ваші локації (${locations.length}):</b>\n\n` +
        locations.map((location, index) => `${index + 1}. ${_.capitalize(location.name)}`).join('\n') +
        '\n\n<i>Натисніть на кнопку, щоб видалити локацію:</i>',
      {
        parse_mode: 'HTML',
        reply_markup: keyboard
      }
    );
  }

  @Command('help')
  async onHelp(@Ctx() ctx: Context) {
    const helpMessage =
      '🤖 <b>Довідка по командах бота</b>\n\n' +
      '🏠 <b>Основні команди:</b>\n' +
      '• <code>/start</code> - Почати роботу з ботом та зареєструватись\n' +
      '• <code>/help</code> - Показати це повідомлення з довідкою\n\n' +
      '📍 <b>Управління локаціями:</b>\n' +
      '• <code>/add_location</code> [назва] - Додати локацію для моніторингу\n' +
      '• <code>/list_locations</code> - Переглянути всі збережені локації\n\n' +
      '💡 <b>Приклади використання:</b>\n' +
      '• <code>/add_location Київ</code>\n' +
      '• <code>/add_location Одеса</code>\n' +
      '• <code>/add_location Львів</code>\n\n' +
      '📝 <b>Примітки:</b>\n' +
      '• Назва локації має бути довжиною від 3 до 50 символів\n' +
      '• Можна використовувати українські літери, пробіли та дефіс\n' +
      '• Кожна додана локація буде відстежуватись на предмет тривог\n\n' +
      '❓ <b>Потрібна допомога?</b>\n' +
      'Якщо у вас виникли питання, будь ласка, перегляньте опис бота та напишіть нам в телеграмі або на електронну пошту.';

    await ctx.reply(helpMessage, { parse_mode: 'HTML' });
  }

  @Action(/delete_location:(.+)/)
  async onDeleteLocation(@Ctx() ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }

    const callbackData = ctx.callbackQuery.data;
    const locationId = callbackData.split(':')[1];
    const userId = nonNull(ctx.from).id;

    try {
      await this.locationService.removeLocationFromUserByTelegramId(userId, locationId);

      await ctx.answerCbQuery('✅ Локацію успішно видалено');

      const updatedLocations = await this.locationService.getUserLocationsByTelegramId(userId);
      if (updatedLocations.length === 0) {
        await ctx.editMessageText(
          '📍 <b>У вас немає збережених локацій</b>\n\n' +
            'Щоб додати локацію, скористайтесь командою:\n' +
            '<code>/add_location назва_міста</code>',
          { parse_mode: 'HTML' }
        );
      } else {
        const keyboard: InlineKeyboardMarkup = {
          inline_keyboard: updatedLocations.map((location) => [
            {
              text: `❌ Видалити "${_.capitalize(location.name)}"`,
              callback_data: `delete_location:${location.id}`
            }
          ])
        };
        await ctx.editMessageText(
          `📍 <b>Ваші локації (${updatedLocations.length}):</b>\n\n` +
            updatedLocations.map((location, index) => `${index + 1}. ${location.name}`).join('\n') +
            '\n\n<i>Натисніть на кнопку, щоб видалити локацію:</i>',
          {
            parse_mode: 'HTML',
            reply_markup: keyboard
          }
        );
      }
    } catch (error) {
      this.logger.error('Error deleting location:', error);
      await ctx.answerCbQuery('❌ Помилка при видаленні локації');
    }
  }

  private validateLocationName(locationName: string): { isValid: boolean; error?: string } {
    if (locationName.length < 3) {
      return { isValid: false, error: 'Назва локації занадто коротка (мінімум 3 символи)' };
    }
    if (locationName.length > 50) {
      return { isValid: false, error: 'Назва локації занадто довга (максимум 50 символів)' };
    }
    const forbiddenChars = /[<>{}[\]|\\^`!@#$%^&*()_+=~`{}|:";<>?,./]/;
    if (forbiddenChars.test(locationName)) {
      return { isValid: false, error: 'Назва містить заборонені символи (дозволяється тільки дефіс "-")' };
    }
    if (/^\d+$/.test(locationName)) {
      return { isValid: false, error: 'Назва не може складатися тільки з цифр' };
    }
    if (/\d/.test(locationName)) {
      return { isValid: false, error: 'Назва не може містити цифри' };
    }
    if (/^\s+$/.test(locationName)) {
      return { isValid: false, error: 'Назва не може складатися тільки з пробілів' };
    }
    if (/^\d/.test(locationName)) {
      return { isValid: false, error: 'Назва не може починатися з цифри' };
    }
    if (locationName.endsWith(' ')) {
      return { isValid: false, error: 'Назва не може закінчуватися пробілом' };
    }
    if (/\s{2,}/.test(locationName)) {
      return { isValid: false, error: 'Назва не може містити кілька пробілів підряд' };
    }
    if (locationName.endsWith('.')) {
      return { isValid: false, error: 'Назва не може закінчуватися крапкою' };
    }
    if (locationName.startsWith('-')) {
      return { isValid: false, error: 'Назва не може починатися з дефісу' };
    }
    if (locationName.endsWith('-')) {
      return { isValid: false, error: 'Назва не може закінчуватися дефісом' };
    }
    if (/-{2,}/.test(locationName)) {
      return { isValid: false, error: 'Назва не може містити кілька дефісів підряд' };
    }
    return { isValid: true };
  }
}
