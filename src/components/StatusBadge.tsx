import { labelForStatus } from "./status-labels";
import { useLanguage } from "../i18n/language";

export function StatusBadge({ status }: { status: string }) {
  const { language } = useLanguage();

  return (
    <span className={`status-badge status-${status}`}>
      {labelForStatus(status, language)}
    </span>
  );
}
