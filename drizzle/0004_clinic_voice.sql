ALTER TABLE "clinics" ADD COLUMN "voice" text;
ALTER TABLE "clinics" ADD COLUMN "voice_pending" text;
ALTER TABLE "clinics" ADD COLUMN "voice_reviewed_by" text;
ALTER TABLE "clinics" ADD COLUMN "voice_reviewed_at" timestamp with time zone;
