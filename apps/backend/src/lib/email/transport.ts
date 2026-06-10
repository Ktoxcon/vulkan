import { AppConfig } from "@vulkan/config/app.config";
import type { TemplateVariables } from "@vulkan/lib/email/transport.types";
import { createTransport } from "nodemailer";
import type { Transporter } from "nodemailer";

let transporterSingleton: Transporter | null = null;

export const EmailTransport = {
  getTransporter(): Transporter {
    if (!transporterSingleton) {
      transporterSingleton = createTransport({
        host: AppConfig.smtp.host,
        port: AppConfig.smtp.port,
        secure: AppConfig.smtp.secure,
        auth: {
          user: AppConfig.smtp.user,
          pass: AppConfig.smtp.pass,
        },
      });
    }
    return transporterSingleton;
  },

  renderTemplate(template: string, variables: TemplateVariables): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
      const value = variables[key as keyof TemplateVariables];
      return value === undefined ? match : value;
    });
  },
};
