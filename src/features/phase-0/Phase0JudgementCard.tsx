import { useState } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import { type Language, useLanguage } from "../../i18n/language";
import { translatePhase0Text } from "../../i18n/phase0-content";
import type {
  Phase0InformationValidity,
  Phase0JudgementDraft,
  Phase0MessyRecord,
} from "./phase0-types";

const kindLabels: Record<
  Language,
  Record<Phase0JudgementDraft["possibleKind"], string>
> = {
  "zh-TW": {
    help_request_candidate: "求助候選",
    site_status_candidate: "地點狀態候選",
    task_candidate: "任務候選",
    assignment_candidate: "人員指派候選",
    announcement_candidate: "公告候選",
    unknown: "候選類型待判斷",
  },
  en: {
    help_request_candidate: "Help request candidate",
    site_status_candidate: "Site status candidate",
    task_candidate: "Task candidate",
    assignment_candidate: "Assignment candidate",
    announcement_candidate: "Announcement candidate",
    unknown: "Candidate kind pending",
  },
};

const confidenceLabels: Record<
  Language,
  Record<Phase0JudgementDraft["confidence"], string>
> = {
  "zh-TW": {
    low: "低",
    medium: "中",
    high: "高",
  },
  en: {
    low: "Low",
    medium: "Medium",
    high: "High",
  },
};

const nextStepLabels: Record<
  Language,
  Record<Phase0JudgementDraft["suggestedNextStep"], string>
> = {
  "zh-TW": {
    keep_raw: "先保留原始資訊",
    ask_for_more_info: "補問來源或現場資訊",
    send_to_human_review: "交給人工確認",
    create_candidate_report: "建立候選通報",
    create_site_update_suggestion: "建立地點更新建議",
    do_not_use_yet: "暫時不要使用",
  },
  en: {
    keep_raw: "Keep raw information",
    ask_for_more_info: "Ask for source or field information",
    send_to_human_review: "Send to human review",
    create_candidate_report: "Create candidate report",
    create_site_update_suggestion: "Create site update suggestion",
    do_not_use_yet: "Do not use yet",
  },
};

const validityLabels: Record<
  Language,
  Record<Phase0InformationValidity, string>
> = {
  "zh-TW": {
    valid: "有效資訊",
    uncertain: "待確認",
    invalid: "無效資訊",
  },
  en: {
    valid: "Valid information",
    uncertain: "Needs review",
    invalid: "Invalid information",
  },
};

const reasonLabels: Record<Language, Record<string, string>> = {
  "zh-TW": {
    來源與時序不明: "來源與時序不明",
    內容互相衝突: "內容互相衝突",
    缺少可驗證證據: "缺少可驗證證據",
    需要人工確認: "需要人工確認",
    暫時不適合直接使用: "暫時不適合直接使用",
    其他: "其他",
  },
  en: {
    來源與時序不明: "Source and timing are unclear",
    內容互相衝突: "Content conflicts",
    缺少可驗證證據: "Missing verifiable evidence",
    需要人工確認: "Needs human review",
    暫時不適合直接使用: "Not suitable for direct use yet",
    其他: "Other",
  },
};

export function Phase0JudgementCard({
  judgement,
  record,
  onChange,
}: {
  judgement: Phase0JudgementDraft;
  record: Phase0MessyRecord;
  onChange: (updates: Partial<Phase0JudgementDraft>) => void;
}) {
  const { language, t } = useLanguage();
  const [customReasonInput, setCustomReasonInput] = useState("");
  const [isCustomReasonSelected, setIsCustomReasonSelected] = useState(false);
  const selectedReasonValue = isCustomReasonSelected
    ? "其他"
    : judgement.classificationReason;

  const handleReasonChange = (value: string) => {
    if (value === "其他") {
      setIsCustomReasonSelected(true);
      setCustomReasonInput("");
      onChange({ classificationReason: "其他" });
      return;
    }

    setIsCustomReasonSelected(false);
    setCustomReasonInput("");
    onChange({ classificationReason: value });
  };

  const handleCustomReasonChange = (value: string) => {
    setCustomReasonInput(value);
    onChange({ classificationReason: value });
  };

  const displayReason = isCustomReasonSelected
    ? customReasonInput || t("customReasonMissing")
    : translatePhase0Text(
        judgement.classificationReason || t("displayReasonPlaceholder"),
        language,
      );
  const displayedPresetReason =
    !isCustomReasonSelected && judgement.classificationReason
      ? (reasonLabels[language][judgement.classificationReason] ??
        translatePhase0Text(judgement.classificationReason, language))
      : displayReason;

  return (
    <article className="judgement-card">
      <div className="judgement-card__header">
        <div>
          <p className="eyebrow">{t("judgementDraft")}</p>
          <h3>{t("judgementTitle")}</h3>
        </div>
        <div className="judgement-card__header__meta">
          <StatusBadge status={record.verificationStatus} />
          {judgement.isCompleted ? (
            <span className="status-badge status-fulfilled">
              {t("completedSorting")}
            </span>
          ) : null}
        </div>
      </div>

      <p>{t("judgementDescription")}</p>

      <section
        className="judgement-summary-grid"
        aria-label={t("classificationSummary")}
      >
        <div className="judgement-summary-card">
          <span className="judgement-summary-card__label">{t("validity")}</span>
          <strong>
            {validityLabels[language][judgement.isValidInformation]}
          </strong>
        </div>
        <div className="judgement-summary-card">
          <span className="judgement-summary-card__label">
            {t("unsafeToTrust")}
          </span>
          <strong>{judgement.unsafeToActDirectly ? t("yes") : t("no")}</strong>
        </div>
        <div className="judgement-summary-card">
          <span className="judgement-summary-card__label">
            {t("cannotBecomeTask")}
          </span>
          <strong>
            {judgement.suggestedNextStep === "send_to_human_review" ||
            judgement.suggestedNextStep === "ask_for_more_info"
              ? t("yes")
              : t("no")}
          </strong>
        </div>
      </section>

      <form className="judgement-form">
        <label htmlFor={`kind-${record.id}`}>
          {t("candidateKind")}
          <select
            id={`kind-${record.id}`}
            value={judgement.possibleKind}
            onChange={(event) =>
              onChange({
                possibleKind: event.target
                  .value as Phase0JudgementDraft["possibleKind"],
              })
            }
          >
            {Object.entries(kindLabels[language]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor={`validity-${record.id}`}>
          {t("validInformationQuestion")}
          <select
            id={`validity-${record.id}`}
            value={judgement.isValidInformation}
            onChange={(event) =>
              onChange({
                isValidInformation: event.target
                  .value as Phase0InformationValidity,
              })
            }
          >
            <option value="uncertain">
              {validityLabels[language].uncertain}
            </option>
            <option value="valid">{validityLabels[language].valid}</option>
            <option value="invalid">{validityLabels[language].invalid}</option>
          </select>
        </label>

        <label htmlFor={`reason-${record.id}`}>
          {t("classificationReason")}
          <select
            id={`reason-${record.id}`}
            value={selectedReasonValue}
            onChange={(event) => handleReasonChange(event.target.value)}
          >
            <option value="">{t("chooseOption")}</option>
            {Object.entries(reasonLabels[language]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {isCustomReasonSelected ? (
          <label htmlFor={`reason-other-${record.id}`}>
            {t("otherReason")}
            <input
              id={`reason-other-${record.id}`}
              type="text"
              value={customReasonInput}
              onChange={(event) => handleCustomReasonChange(event.target.value)}
              placeholder={t("customReasonPlaceholder")}
            />
          </label>
        ) : null}

        <label htmlFor={`review-${record.id}`}>
          {t("humanReviewNote")}
          <textarea
            id={`review-${record.id}`}
            value={judgement.reviewNotes}
            onChange={(event) => onChange({ reviewNotes: event.target.value })}
            rows={3}
          />
        </label>
      </form>

      <dl className="judgement-summary">
        <div>
          <dt>{t("candidateKind")}</dt>
          <dd>{kindLabels[language][judgement.possibleKind]}</dd>
        </div>
        <div>
          <dt>{t("confidence")}</dt>
          <dd>{confidenceLabels[language][judgement.confidence]}</dd>
        </div>
        <div>
          <dt>{t("nextStep")}</dt>
          <dd>{nextStepLabels[language][judgement.suggestedNextStep]}</dd>
        </div>
      </dl>

      <section className="judgement-section">
        <h4>{t("classificationReason")}</h4>
        <p>{displayedPresetReason}</p>
      </section>

      <section className="judgement-section">
        <h4>{t("humanReviewNote")}</h4>
        <p>{judgement.reviewNotes || t("reviewNotePlaceholder")}</p>
      </section>

      <section>
        <h4>{t("safeDefaultOnly")}</h4>
        <ul>
          {judgement.evidence.map((item) => (
            <li key={item}>{translatePhase0Text(item, language)}</li>
          ))}
        </ul>
      </section>

      <section>
        <h4>{t("blockersTitle")}</h4>
        <ul>
          {judgement.blockers.map((item) => (
            <li key={item}>{translatePhase0Text(item, language)}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
