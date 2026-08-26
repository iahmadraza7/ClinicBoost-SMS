import { redirect } from "next/navigation";

import { requireOperator } from "@/server/auth";

export default async function Page() {
  await requireOperator();
  redirect("/queue");
}
