import { clinicSmsLabel } from "@/server/clinics/fields";

export function SmsStatus({
  smsNumber,
  size = "sm",
}: {
  smsNumber: string | null;
  size?: "xs" | "sm";
}) {
  const { connected, label } = clinicSmsLabel(smsNumber);
  const className = connected
    ? size === "xs"
      ? "text-xs text-neutral-600"
      : "text-sm text-neutral-600"
    : size === "xs"
      ? "text-xs font-medium text-amber-700"
      : "text-sm font-medium text-amber-700";

  return <p className={className}>{label}</p>;
}
