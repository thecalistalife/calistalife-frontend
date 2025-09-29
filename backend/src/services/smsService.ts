import { config } from '@/utils/config';
import { logger } from '@/utils/logger';

class SMSService {
  private brevoApi?: any;

  constructor() {
    if (config.BREVO_API_KEY) {
      const SibApiV3Sdk = require('sib-api-v3-sdk');
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = config.BREVO_API_KEY;
      this.brevoApi = new SibApiV3Sdk.TransactionalSMSApi();
    }
  }

  async sendOrderSMS(type: 'shipped' | 'out_for_delivery' | 'delivered', order: any, trackingNumber?: string) {
    if (!this.brevoApi || !config.BREVO_SMS_SENDER) {
      logger.warn('Brevo SMS not configured; skipping SMS');
      return;
    }

    const phoneNumber = order.shipping_address?.phone || order.billing_address?.phone;
    if (!phoneNumber) {
      logger.info({ orderNumber: order.order_number }, 'No phone number for SMS');
      return;
    }

    let message = '';
    switch (type) {
      case 'shipped':
        message = `Your CalistaLife order #${order.order_number} has shipped! ${trackingNumber ? `Tracking: ${trackingNumber}` : ''} Track at calistalife.com/orders`;
        break;
      case 'out_for_delivery':
        message = `Your CalistaLife order #${order.order_number} is out for delivery today! Expect it soon.`;
        break;
      case 'delivered':
        message = `Your CalistaLife order #${order.order_number} has been delivered! We hope you love it. Leave a review at calistalife.com/orders`;
        break;
    }

    try {
      const sendSms = {
        sender: config.BREVO_SMS_SENDER,
        recipient: phoneNumber,
        content: message,
        type: 'transactional'
      };

      await this.brevoApi.sendTransacSms(sendSms);
      logger.info({ orderNumber: order.order_number, type, phoneNumber }, 'Brevo SMS sent successfully');
    } catch (error) {
      logger.error({ err: error, orderNumber: order.order_number, type }, 'Brevo SMS send failed');
    }
  }
}

export const smsService = new SMSService();
