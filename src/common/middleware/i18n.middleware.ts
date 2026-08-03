import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { parseLocale, type ApiLocale } from '../utils/i18n.util';

/**
 * Attaches `req.locale` parsed from `Accept-Language` header.
 * Zero-impact: simply enriches the request object.
 */
@Injectable()
export class I18nMiddleware implements NestMiddleware {
  use(req: Request & { locale?: ApiLocale }, _res: Response, next: NextFunction) {
    req.locale = parseLocale(req.headers['accept-language'] as string);
    next();
  }
}
