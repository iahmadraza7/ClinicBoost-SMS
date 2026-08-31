ALTER TABLE "drafts" ADD COLUMN "correction_note" text;
ALTER TABLE "drafts" ADD COLUMN "redraft_of" uuid;
ALTER TABLE "kb_entries" ADD COLUMN "source_draft_id" uuid;
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_redraft_of_drafts_id_fk" FOREIGN KEY ("redraft_of") REFERENCES "drafts"("id") ON DELETE SET NULL;
ALTER TABLE "kb_entries" ADD CONSTRAINT "kb_entries_source_draft_id_drafts_id_fk" FOREIGN KEY ("source_draft_id") REFERENCES "drafts"("id") ON DELETE SET NULL;
