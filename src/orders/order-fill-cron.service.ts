import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ACTIVITY_ACTION } from '../common/constants/activity-action.constant';
import { ACTIVITY_TARGET } from '../common/constants/activity-target.constant';
import { APP_TIMEZONE } from '../common/constants/app.constant';
import { ActorRole } from '../common/enums';
import { OrderFillService } from './order-fill.service';

@Injectable()
export class OrderFillCronService {
  private readonly logger = new Logger(OrderFillCronService.name);

  constructor(
    private readonly orderFillService: OrderFillService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @Cron('0 2 * * *', { timeZone: APP_TIMEZONE })
  async fillPlaceholderOrderData() {
    try {
      const result = await this.orderFillService.fillAllActiveShops();
      const customersUpdated = result.results.reduce(
        (sum, item) => sum + item.customersUpdated,
        0,
      );
      const ordersProductUpdated = result.results.reduce(
        (sum, item) => sum + item.ordersProductUpdated,
        0,
      );
      const productsCreated = result.results.reduce(
        (sum, item) => sum + item.productsCreated,
        0,
      );

      this.activityLogsService.record({
        action: ACTIVITY_ACTION.ORDER_FILL_CRON,
        actorRole: ActorRole.SYSTEM,
        targetType: ACTIVITY_TARGET.SHOP,
        metadata: {
          shopsProcessed: result.shopsProcessed,
          customersUpdated,
          ordersProductUpdated,
          productsCreated,
        },
      });

      this.logger.log(
        `2AM fill: ${result.shopsProcessed} shops, customers ${customersUpdated}, products ${ordersProductUpdated}, catalog +${productsCreated}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown cron error';
      this.logger.error(`Failed 2AM order fill: ${message}`);
    }
  }
}
