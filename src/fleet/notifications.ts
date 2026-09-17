export type NotifyChannel = "telegram" | "sms" | "email";

export type NotifyTemplate =
  | "welcome"
  | "docs_needed"
  | "partner_created"
  | "partner_error"
  | "loyalty_up"
  | "payout_paid"
  | "support_reply";

const COPY: Record<NotifyTemplate, (vars: Record<string, string>) => string> = {
  welcome: (v) => `Hi ${v.name}, start registration in the Mini App.`,
  docs_needed: (v) => `Still missing: ${v.missing}.`,
  partner_created: (v) => `Profile ${v.driverId} is live. Work rule: ${v.rule}.`,
  partner_error: (v) => `Partner API rejected the application: ${v.reason}.`,
  loyalty_up: (v) => `Level ${v.level}. New work rule ${v.rule}.`,
  payout_paid: (v) => `Payout ${v.amount} for ${v.period} is paid.`,
  support_reply: (v) => `Support: ${v.text}`
};

export type OutboxMessage = {
  id: string;
  channel: NotifyChannel;
  to: string;
  template: NotifyTemplate;
  body: string;
  sentAt?: Date;
  error?: string;
};

let seq = 1;

export class NotificationOutbox {
  readonly rows: OutboxMessage[] = [];

  enqueue(
    channel: NotifyChannel,
    to: string,
    template: NotifyTemplate,
    vars: Record<string, string>
  ): OutboxMessage {
    const msg: OutboxMessage = {
      id: `n_${seq++}`,
      channel,
      to,
      template,
      body: COPY[template](vars)
    };
    this.rows.push(msg);
    return msg;
  }

  async flush(sender: (msg: OutboxMessage) => Promise<void>): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;
    for (const msg of this.rows) {
      if (msg.sentAt) continue;
      try {
        await sender(msg);
        msg.sentAt = new Date();
        sent += 1;
      } catch (error) {
        msg.error = error instanceof Error ? error.message : "send_failed";
        failed += 1;
      }
    }
    return { sent, failed };
  }

  pending(): OutboxMessage[] {
    return this.rows.filter((row) => !row.sentAt);
  }
}
