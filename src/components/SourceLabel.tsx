import { labelForSourceType } from "./source-labels";
import { useLanguage } from "../i18n/language";

export function SourceLabel({ sourceType }: { sourceType: string }) {
  const { language, t } = useLanguage();

  return (
    <span className="source-label">
      {t("sourcePrefix")}：{labelForSourceType(sourceType, language)}
    </span>
  );
}
