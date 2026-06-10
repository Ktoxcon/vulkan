import type { TemplateVariables } from "@vulkan/lib/email/transport.types";
import { vi } from "vitest";

export type SentMail = {
  from?: string;
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
};

export type FakeTransport = {
  sent: SentMail[];
  failNext: number;
  sendMail: ReturnType<typeof vi.fn>;
  getTransporter: () => { sendMail: ReturnType<typeof vi.fn> };
  renderTemplate: (template: string, variables: TemplateVariables) => string;
  reset: () => void;
};

export function createFakeTransport(): FakeTransport {
  const fake: FakeTransport = {
    sent: [],
    failNext: 0,
    sendMail: vi.fn(async (mail: SentMail) => {
      if (fake.failNext > 0) {
        fake.failNext -= 1;
        throw new Error("SMTP delivery failed");
      }
      fake.sent.push(mail);
      return { messageId: `msg-${fake.sent.length}` };
    }),
    getTransporter: () => ({ sendMail: fake.sendMail }),
    renderTemplate: (template, variables) =>
      template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
        const value = variables[key as keyof TemplateVariables];
        return value === undefined ? match : value;
      }),
    reset: () => {
      fake.sent = [];
      fake.failNext = 0;
      fake.sendMail.mockClear();
    },
  };
  return fake;
}
