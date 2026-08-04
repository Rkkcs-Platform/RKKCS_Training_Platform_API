import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ApiLocale } from '../utils/i18n.util';

/**
 * Controller parameter decorator to extract the parsed locale from the request.
 *
 * Usage:
 * ```ts
 * @Get()
 * findAll(@Locale() locale: ApiLocale) { ... }
 * ```
 */
export const Locale = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ApiLocale => {
    const request = ctx.switchToHttp().getRequest();
    return request.locale ?? 'en';
  },
);
