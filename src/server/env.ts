import { z } from "zod";

const boolish = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");

/**
 * .env.example ships every key with an empty value, so an unset secret arrives
 * as "" rather than undefined and would defeat `??` fallbacks downstream.
 */
const optional = () =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().optional(),
  );

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  AUTH_SECRET: optional(),
  OPERATOR_EMAIL: optional(),
  OPERATOR_PASSWORD_HASH: optional(),

  ANTHROPIC_API_KEY: optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),

  // Defaults to console so that holding credentials is never on its own enough
  // to spend credits. Going live is this one setting.
  SMS_PROVIDER: z.enum(["console", "mobile_message"]).default("console"),
  MOBILE_MESSAGE_API_USER: optional(),
  MOBILE_MESSAGE_API_PASSWORD: optional(),
  MOBILE_MESSAGE_WEBHOOK_SECRET: optional(),
  MOBILE_MESSAGE_TEST_SENDER: z.string().default("+61485900170"),
  /**
   * Which clinic owns inbound messages arriving on a number no clinic claims.
   * The test number is shared, so per-clinic routing cannot be proven yet; this
   * makes moving to dedicated numbers a config change rather than a rebuild.
   */
  SHARED_NUMBER_CLINIC_SLUG: optional(),

  RESEND_API_KEY: optional(),
  RESEND_FROM: z.string().default("notify@notify.clinicboost.com.au"),
  OPERATOR_NOTIFY_EMAIL: optional(),
  OPERATOR_NOTIFY_MOBILE: optional(),

  GLOBAL_KILL_SWITCH: boolish,
  MAX_SEGMENTS_PER_DRAFT: z.coerce.number().int().positive().default(3),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const detail = parsed.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("\n  ");
  throw new Error(`Invalid environment:\n  ${detail}`);
}

export const env = parsed.data;
