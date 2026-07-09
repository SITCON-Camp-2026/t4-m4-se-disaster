import { SourceLabel } from "./SourceLabel";
import { StatusBadge } from "./StatusBadge";
import { formatDateTime } from "../lib/date";
import { useLanguage } from "../i18n/language";
import { translateRawText } from "../i18n/phase0-content";

type RecordLike = {
  id: string;
  title?: string;
  name?: string;
  rawText?: string;
  description?: string;
  sourceType: string;
  verificationStatus: string;
  updatedAt: string;
};

export function RecordCard({ record }: { record: RecordLike }) {
  const { language, t } = useLanguage();
  const title = record.title ?? record.name ?? record.id;
  const description = record.rawText ?? record.description;
  const displayedDescription = description
    ? translateRawText(description, language)
    : undefined;
  return (
    <article className="record-card">
      <div className="record-card__header">
        <h3>{title}</h3>
        <StatusBadge status={record.verificationStatus} />
      </div>
      {displayedDescription ? <p>{displayedDescription}</p> : null}
      <div className="record-card__meta">
        <SourceLabel sourceType={record.sourceType} />
        <span>
          {t("updatedAt")}：{formatDateTime(record.updatedAt)}
        </span>
      </div>
    </article>
  );
}
