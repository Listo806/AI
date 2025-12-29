import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  PushNotificationService,
  PushSubscriptionDto,
  SendNotificationDto,
} from './push-notification.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('integrations/notifications')
@UseGuards(JwtAuthGuard)
export class PushNotificationController {
  constructor(private readonly pushNotificationService: PushNotificationService) {}

  /**
   * Get VAPID public key (for frontend subscription)
   */
  @Get('vapid-key')
  getVapidKey() {
    try {
      const publicKey = this.pushNotificationService.getVapidPublicKey();
      return {
        success: true,
        data: {
          publicKey,
        },
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  @Post('subscribe')
  async subscribe(
    @Body() subscriptionDto: PushSubscriptionDto,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.pushNotificationService.subscribe(
        user.id,
        subscriptionDto,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  @Post('unsubscribe')
  async unsubscribe(
    @Body('endpoint') endpoint: string,
    @CurrentUser() user: any,
  ) {
    if (!endpoint) {
      throw new BadRequestException('Endpoint is required');
    }

    try {
      await this.pushNotificationService.unsubscribe(user.id, endpoint);
      return {
        success: true,
        message: 'Unsubscribed successfully',
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Unsubscribe from all push notifications
   */
  @Delete('unsubscribe-all')
  async unsubscribeAll(@CurrentUser() user: any) {
    try {
      const result = await this.pushNotificationService.unsubscribeAll(user.id);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get user's subscriptions
   */
  @Get('subscriptions')
  async getSubscriptions(@CurrentUser() user: any) {
    try {
      const subscriptions = await this.pushNotificationService.getUserSubscriptions(user.id);
      return {
        success: true,
        data: {
          subscriptions,
          count: subscriptions.length,
        },
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Send notification to current user (for testing)
   */
  @Post('send-test')
  async sendTestNotification(
    @Body() notificationDto: SendNotificationDto,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.pushNotificationService.sendToUser(user.id, notificationDto);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Send notification to a specific user (admin/team owner)
   */
  @Post('send')
  async sendNotification(
    @Body() sendDto: SendNotificationDto & { userId?: string; teamId?: string },
    @CurrentUser() user: any,
  ) {
    try {
      let result;

      if (sendDto.userId) {
        // Verify user has permission (same user or admin)
        if (sendDto.userId !== user.id && user.role !== 'admin') {
          throw new BadRequestException('Insufficient permissions');
        }
        result = await this.pushNotificationService.sendToUser(sendDto.userId, sendDto);
      } else if (sendDto.teamId) {
        // Verify user is in the team
        if (user.teamId !== sendDto.teamId && user.role !== 'admin') {
          throw new BadRequestException('Insufficient permissions');
        }
        result = await this.pushNotificationService.sendToTeam(sendDto.teamId, sendDto);
      } else {
        // Send to all (admin only)
        if (user.role !== 'admin') {
          throw new BadRequestException('Only admins can send to all users');
        }
        result = await this.pushNotificationService.sendToAll(sendDto);
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get configuration status
   */
  @Get('config/status')
  async getConfigStatus() {
    return this.pushNotificationService.getConfigStatus();
  }
}

