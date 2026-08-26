/**
 * The repository layer. The only code permitted to import the Drizzle client.
 *
 * Every function here takes clinicId as its explicit first argument, except the
 * clinic lookups themselves, which are the tenancy root. There is no
 * cross-clinic read anywhere in the product; the operator dashboard fans out
 * per clinic rather than querying across them.
 */
export * as audit from "./audit";
export * as blockedTerms from "./blocked-terms";
export * as clinics from "./clinics";
export * as contacts from "./contacts";
export * as conversations from "./conversations";
export * as drafts from "./drafts";
export * as kb from "./kb";
export * as messages from "./messages";
export * as offers from "./offers";
export * as usage from "./usage";

export { withTransaction, type Executor, type Tx } from "./executor";
