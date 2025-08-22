import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, isAxiosError } from 'axios';
import * as cheerio from 'cheerio';
import { catchError, firstValueFrom } from 'rxjs';

import { IConfig } from '~/config/types';
import { TelegramMessage } from '~/monitor/types';

@Injectable()
export class Monitor {
  private readonly logger = new Logger(Monitor.name);

  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache'
  };

  constructor(
    private readonly configService: ConfigService<IConfig, true>,
    private readonly httpService: HttpService
  ) {
    this.httpService.axiosRef.defaults.headers.common = this.headers;
  }

  async getChannelMessages(): Promise<TelegramMessage[]> {
    try {
      const baseUrl = this.configService.get('telegram.publicAlertGroupUrl', {
        infer: true
      });
      const urlWithParams = `${baseUrl}?embed=1&mode=tme`;

      const response = await firstValueFrom(
        this.httpService.get(urlWithParams).pipe(
          catchError((err: AxiosError) => {
            console.error(err);
            throw new Error("Can't get channel messages");
          })
        )
      );
      const $ = cheerio.load(response.data);

      const messages: any[] = [];
      let messageBlocks = $('.tgme_widget_message');
      if (messageBlocks.length === 0) {
        this.logger.warn('Could load messages. Tryign with different selector');
        messageBlocks = $('[data-post]');
      }

      this.logger.log(`Found ${messageBlocks.length} message blocks on the page`);

      messageBlocks.each((_, element) => {
        try {
          const $block = $(element);

          let messageLink = $block.find('a.tgme_widget_message_date').first();
          if (messageLink.length === 0) {
            messageLink = $block.find('.tgme_widget_message_meta').first();
          }

          const messageUrl = messageLink.attr('href') || '';
          if (!messageUrl) return;

          const messageIdMatch = messageUrl.match(/\/(\d+)$/);
          if (!messageIdMatch) return;

          const messageId = parseInt(messageIdMatch[1]);

          const textDiv = $block.find('.tgme_widget_message_text');
          const messageText = textDiv.text().trim() || '';

          let timeElem = $block.find('time').first();
          if (timeElem.length === 0) {
            timeElem = $block.find('.tgme_widget_message_meta').first();
          }
          const messageTime = timeElem.attr('datetime') || '';

          if (messageId && messageText) {
            messages.push({
              id: messageId,
              text: messageText,
              time: messageTime,
              url: messageUrl
            });
          }
        } catch (error) {
          this.logger.error(`Error with processing messages`, error);
          throw error;
        }
      });
      return messages;
    } catch (error) {
      this.logger.error(`Error with retrieving messages : ${error}`);
      if (isAxiosError(error)) {
        console.error(`HTTP status: ${error.response?.status}`);
        console.error(`URL: ${error.response?.config?.baseURL}`);
      }
      return [];
    }
  }
}
