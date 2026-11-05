export interface NotificationResult {
  success: boolean;
  messageId: string;
  provider: 'mock-email' | 'mock-sms';
  recipient: string;
  deliveredToGateway: boolean;
  status: 'MOCK_DELIVERED' | 'FAILED';
  deliveryNote: string;
  timestamp: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export interface SMSPayload {
  to: string;
  message: string;
}

class MockNotificationService {
  private log: NotificationResult[] = [];

  /**
   * Mock Email Provider
   * Explicitly indicates mock status and never claims real SMTP/external delivery.
   */
  public async sendEmail(payload: EmailPayload): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: true,
      messageId: `MOCK-EMAIL-${Date.now().toString().slice(-6)}`,
      provider: 'mock-email',
      recipient: payload.to,
      deliveredToGateway: false, // NOT delivered to external network
      status: 'MOCK_DELIVERED',
      deliveryNote: '[DEVELOPMENT MOCK] Email queued and logged to mock provider interface. No external SMTP delivery was attempted.',
      timestamp: new Date().toISOString(),
    };
    this.log.push(result);
    return result;
  }

  /**
   * Mock SMS Provider
   * Explicitly indicates mock status and never claims real telecommunication delivery.
   */
  public async sendSMS(payload: SMSPayload): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: true,
      messageId: `MOCK-SMS-${Date.now().toString().slice(-6)}`,
      provider: 'mock-sms',
      recipient: payload.to,
      deliveredToGateway: false, // NOT delivered to external telecommunication carrier
      status: 'MOCK_DELIVERED',
      deliveryNote: '[DEVELOPMENT MOCK] SMS queued and logged to mock SMS provider interface. No external carrier transmission occurred.',
      timestamp: new Date().toISOString(),
    };
    this.log.push(result);
    return result;
  }

  public getLoggedNotifications(): NotificationResult[] {
    return [...this.log];
  }
}

export const notificationService = new MockNotificationService();
