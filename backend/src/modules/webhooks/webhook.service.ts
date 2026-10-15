import crypto from 'crypto';
import { prisma } from '../../prisma';
import { config } from '../../config';

export class WebhookService {
  public static async dispatch(organizationId: string, event: string, payload: Record<string, unknown>) {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { organizationId, isActive: true }
    });

    for (const endpoint of endpoints) {
      const subscribedEvents = JSON.parse(endpoint.events || '[]') as string[];
      if (subscribedEvents.length && !subscribedEvents.includes(event) && !subscribedEvents.includes('*')) {
        continue;
      }

      this.deliver(endpoint, event, payload).catch(console.error);
    }
  }

  private static async deliver(endpoint: { id: string; url: string; secret: string }, event: string, payload: Record<string, unknown>) {
    const timestamp = Date.now().toString();
    const bodyString = JSON.stringify({
      id: crypto.randomUUID(),
      event,
      timestamp: parseInt(timestamp, 10),
      data: payload
    });

    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(`${timestamp}.${bodyString}`)
      .digest('hex');

    const headers = {
      'Content-Type': 'application/json',
      'X-Garaa-Signature': `t=${timestamp},v1=${signature}`,
      'X-Garaa-Event': event,
      'User-Agent': 'Garaa-Webhook-Dispatcher/1.0'
    };

    let statusCode: number | null = null;
    let responseBody: string | null = null;
    let status = 'FAILED';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.webhookTimeoutMs);

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: bodyString,
        signal: controller.signal
      });

      clearTimeout(timeout);
      statusCode = response.status;
      responseBody = (await response.text()).slice(0, 1000);
      status = response.ok ? 'SUCCESS' : 'FAILED';
    } catch (err: any) {
      responseBody = err.message || 'Connection timeout or network failure';
    }

    await prisma.webhookDelivery.create({
      data: {
        webhookEndpointId: endpoint.id,
        event,
        payload: bodyString,
        status,
        statusCode,
        responseBody,
        deliveredAt: status === 'SUCCESS' ? new Date() : null
      }
    });
  }
}
