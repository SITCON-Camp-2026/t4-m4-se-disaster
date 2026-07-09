import { type KeyboardEvent, useMemo, useState } from "react";
import { SourceLabel } from "../../components/SourceLabel";
import { labelForSourceType } from "../../components/source-labels";
import { StatusBadge } from "../../components/StatusBadge";
import { labelForStatus } from "../../components/status-labels";
import { useLanguage } from "../../i18n/language";
import {
  hasRawTextTranslation,
  translateRawText,
} from "../../i18n/phase0-content";
import { formatDateTime } from "../../lib/date";
import surpriseImageUrl from "../../../IMG_20260709_173431.png";
import type { Phase0MessyRecord } from "./phase0-types";

type GeneratedReviewNote = {
  provided: string[];
  missing: string[];
  decisionLog: string[];
};

type RawInfoAiSuggestion = {
  sourceType: string;
  reportedAt: string;
  location: string;
  confirmation: string;
  note: string;
};

type AiFillNotification = {
  filled: string[];
  needsManualReview: string[];
};

type DetailField = {
  label: string;
  value: string;
};

const locationOptions = [
  "車站周邊",
  "活動中心",
  "老街周邊",
  "學校周邊",
  "A 區",
  "B 區",
  "地點不確定",
];

const fullWidthDigitMap: Record<string, string> = {
  "０": "0",
  "１": "1",
  "２": "2",
  "３": "3",
  "４": "4",
  "５": "5",
  "６": "6",
  "７": "7",
  "８": "8",
  "９": "9",
};

function normalizeText(rawText: string) {
  return rawText.replace(/[０-９]/g, (char) => fullWidthDigitMap[char] ?? char);
}

function detectSourceType(rawText: string) {
  if (/官方|公告|公所|市府|政府|消防|警消/.test(rawText)) {
    return "官方公告";
  }

  if (/line|facebook|fb|社群|群組|轉傳|轉貼|網路|貼文/i.test(rawText)) {
    return "社群轉錄";
  }

  if (/現場|我在|我看到|親眼|目擊|志工|回報/.test(rawText)) {
    return "現場回報";
  }

  return "";
}

function detectReportedAt(rawText: string) {
  const normalizedText = normalizeText(rawText);
  const clockMatch = normalizedText.match(
    /(?:^|[^\d])([01]?\d|2[0-3])[:：]([0-5]\d)(?:[^\d]|$)/,
  );

  if (clockMatch) {
    return `${clockMatch[1].padStart(2, "0")}:${clockMatch[2]}`;
  }

  const chineseTimeMatch = normalizedText.match(
    /(凌晨|早上|上午|中午|下午|晚上)?\s*([0-9]{1,2})\s*(?:點|点|時|时)\s*(半|([0-5]?\d)\s*分?)?/,
  );

  if (!chineseTimeMatch) {
    return "";
  }

  const period = chineseTimeMatch[1] ?? "";
  let hour = Number(chineseTimeMatch[2]);
  const minute =
    chineseTimeMatch[3] === "半" ? 30 : Number(chineseTimeMatch[4] ?? 0);

  if (period === "下午" || period === "晚上") {
    hour = hour < 12 ? hour + 12 : hour;
  }

  if (period === "凌晨" && hour === 12) {
    hour = 0;
  }

  if (hour > 23 || minute > 59) {
    return "";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function detectLocation(rawText: string) {
  const exactOption = locationOptions.find((option) =>
    rawText.includes(option),
  );

  if (exactOption) {
    return exactOption;
  }

  if (/車站|火車站|捷運|站前/.test(rawText)) {
    return "車站周邊";
  }

  if (/活動中心|里民中心|社區中心/.test(rawText)) {
    return "活動中心";
  }

  if (/老街/.test(rawText)) {
    return "老街周邊";
  }

  if (/學校|國小|國中|高中|校門/.test(rawText)) {
    return "學校周邊";
  }

  if (/A\s*區|Ａ\s*區/i.test(rawText)) {
    return "A 區";
  }

  if (/B\s*區|Ｂ\s*區/i.test(rawText)) {
    return "B 區";
  }

  return "地點不確定";
}

function detectConfirmation(rawText: string) {
  if (/不確定|疑似|可能|好像|未確認|不知道/.test(rawText)) {
    return "不確定";
  }

  if (/親眼|我看到|我在|目擊/.test(rawText)) {
    return "親眼看到";
  }

  if (/聽說|有人說|朋友說|群組|轉傳|轉貼|line|facebook|fb/i.test(rawText)) {
    return "聽別人說";
  }

  return "不確定";
}

function buildAiSuggestion(rawText: string): RawInfoAiSuggestion {
  const sourceType = detectSourceType(rawText);
  const reportedAt = detectReportedAt(rawText);
  const location = detectLocation(rawText);
  const confirmation = detectConfirmation(rawText);
  const missingHints = [
    sourceType ? "" : "未從文字看出明確資訊取得方式，來源仍待人工確認。",
    reportedAt ? "" : "未從文字看出明確時間，時間欄位仍需人工選擇。",
    location === "地點不確定"
      ? "未從文字看出明確地點，先標示為地點不確定。"
      : "",
  ].filter(Boolean);
  const filledHints = [
    sourceType ? `來源建議：${sourceType}` : "",
    reportedAt ? `時間建議：${reportedAt}` : "",
    `地點或範圍建議：${location}`,
    `確認方式建議：${confirmation}`,
  ].filter(Boolean);

  return {
    sourceType,
    reportedAt,
    location,
    confirmation,
    note: [
      "AI 判斷建議（需人工確認）：",
      ...filledHints,
      ...missingHints,
      "以上是依原始文字產生的欄位建議，不代表資訊已查核。",
    ].join("\n"),
  };
}

function createNextRecordId(records: Phase0MessyRecord[]) {
  const nextNumber =
    records.reduce((maxNumber, record) => {
      const match = record.id.match(/^M-(\d+)$/);

      if (!match) {
        return maxNumber;
      }

      return Math.max(maxNumber, Number(match[1]));
    }, 0) + 1;

  return `M-${String(nextNumber).padStart(3, "0")}`;
}

export function Phase0RawInfoPanel({
  records,
  selectedRecordId,
  onSelect,
  onAddRecord,
  completedRecordIds = [],
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
  onAddRecord: (record: Phase0MessyRecord) => void;
  completedRecordIds?: string[];
}) {
  const { language, t } = useLanguage();
  const [newRawText, setNewRawText] = useState("");
  const [newSourceType, setNewSourceType] = useState("");
  const [newReportedAt, setNewReportedAt] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newConfirmation, setNewConfirmation] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newFormError, setNewFormError] = useState("");
  const [generatedReviewNotes, setGeneratedReviewNotes] = useState<
    Record<string, GeneratedReviewNote>
  >({});
  const [aiFillNotification, setAiFillNotification] =
    useState<AiFillNotification | null>(null);
  const [detailRecordId, setDetailRecordId] = useState<string | null>(null);
  const [detailCopyMessage, setDetailCopyMessage] = useState("");
  const [showPikachuSurprise, setShowPikachuSurprise] = useState(false);
  const [surpriseClickCount, setSurpriseClickCount] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);

  const reviewNeededRecords = useMemo(
    () =>
      records.filter((record) => record.verificationStatus === "needs_review"),
    [records],
  );
  const unverifiedRecords = useMemo(
    () =>
      records.filter((record) => record.verificationStatus === "unverified"),
    [records],
  );

  const getRecordStatusText = (recordId: string) => {
    return completedRecordIds.includes(recordId)
      ? t("completedSorting")
      : undefined;
  };
  const detailRecord = detailRecordId
    ? records.find((record) => record.id === detailRecordId)
    : undefined;

  const handleAddRecord = () => {
    if (!newRawText.trim()) {
      setNewFormError(t("rawTextRequiredError"));
      return;
    }

    const recordId = createNextRecordId(records);
    const provided = [
      newSourceType
        ? `${t("informationSourceMethod")}：${labelForSourceType(
            newSourceType,
            language,
          )}`
        : "",
      newReportedAt.trim() ? `${t("time")}：${newReportedAt.trim()}` : "",
      newLocation.trim()
        ? `${t("locationOrArea")}：${labelForSourceType(newLocation, language)}`
        : "",
      newConfirmation
        ? `${t("confirmationMethod")}：${labelForSourceType(
            newConfirmation,
            language,
          )}`
        : "",
      newNote.trim() ? `${t("note")}：${newNote.trim()}` : "",
    ].filter(Boolean);
    const missingFields = [
      newSourceType
        ? ""
        : language === "en"
          ? "Information source method is missing and needs human review."
          : "資訊取得方式未提供，待人工確認。",
      newReportedAt.trim()
        ? ""
        : language === "en"
          ? "Time is missing and needs human review."
          : "時間未提供，待人工確認。",
      newLocation.trim()
        ? newLocation === "地點不確定"
          ? language === "en"
            ? "Location or area is still uncertain and needs human review."
            : "地點或範圍仍不確定，待人工確認。"
          : ""
        : language === "en"
          ? "Location or area is missing and needs human review."
          : "地點或範圍未提供，待人工確認。",
      newConfirmation
        ? ""
        : language === "en"
          ? "Confirmation method is missing and needs human review."
          : "確認方式未提供，待人工確認。",
    ].filter(Boolean);
    const isIncomplete = missingFields.length > 0;
    const missing = [
      isIncomplete
        ? language === "en"
          ? "This quick report was added to the list, but it is still incomplete raw information."
          : "這筆快速回報先收入清單，但仍是不完整原始資訊。"
        : language === "en"
          ? "This quick report was added to the list, but it still needs human review before cleanup."
          : "這筆快速回報已收入清單，但仍需人工確認後才能整理。",
      ...missingFields,
    ];
    const decisionLog = [
      language === "en"
        ? "Kept the original text and added it to the raw information list."
        : "保留原文並收入原始資訊清單。",
      isIncomplete
        ? language === "en"
          ? "Flow judgement: fields are incomplete, so mark as incomplete and awaiting human review."
          : "流程判斷：欄位不足，標示為不完整與待人工確認。"
        : language === "en"
          ? "Flow judgement: fields are filled, but still awaiting human review."
          : "流程判斷：欄位已填，仍維持待人工確認，等待整理者判斷。",
      newNote.includes("AI 判斷建議") ||
      newNote.includes("AI judgement suggestion")
        ? language === "en"
          ? "AI suggestion: fields were assisted by AI suggestions and still need human review."
          : "AI 建議：欄位由 AI 建議輔助填入，仍需人工檢查採用。"
        : "",
    ].filter(Boolean);
    const collectedAt = new Date().toISOString();

    const nextRecord: Phase0MessyRecord = {
      id: recordId,
      rawText: newRawText.trim(),
      sourceType: newSourceType || "quick_report",
      verificationStatus: "needs_review",
      updatedAt: collectedAt,
      intakeDetails: {
        sourceType: newSourceType,
        reportedAt: newReportedAt.trim(),
        location: newLocation.trim(),
        confirmation: newConfirmation,
        note: newNote.trim(),
        collectedAt,
        isIncomplete,
        missingFields,
      },
    };

    onAddRecord(nextRecord);
    setGeneratedReviewNotes((current) => ({
      ...current,
      [recordId]: {
        provided,
        missing,
        decisionLog,
      },
    }));
    setNewRawText("");
    setNewSourceType("");
    setNewReportedAt("");
    setNewLocation("");
    setNewConfirmation("");
    setNewNote("");
    setNewFormError("");
    setAiFillNotification(null);
    setShowAddForm(false);
  };

  const handleAiSuggestion = () => {
    if (!newRawText.trim()) {
      setNewFormError(t("aiNeedsRawTextError"));
      return;
    }

    const suggestion = buildAiSuggestion(newRawText);
    const filled = [
      suggestion.sourceType
        ? `${t("sourceTypeCategory")}：${labelForSourceType(
            suggestion.sourceType,
            language,
          )}`
        : "",
      suggestion.reportedAt ? `${t("time")}：${suggestion.reportedAt}` : "",
      `${t("locationOrArea")}：${labelForSourceType(
        suggestion.location,
        language,
      )}`,
      `${t("confirmationMethod")}：${labelForSourceType(
        suggestion.confirmation,
        language,
      )}`,
      `${t("note")}：${language === "en" ? "AI judgement suggestions and review reminders" : "AI 判斷建議與待確認提醒"}`,
    ].filter(Boolean);
    const needsManualReview = [
      suggestion.sourceType
        ? ""
        : language === "en"
          ? "Source type: AI did not detect a clear source. Please select manually or keep it missing."
          : "來源類型：AI 未看出明確來源，請人工選擇或保留待補。",
      suggestion.reportedAt
        ? ""
        : language === "en"
          ? "Time: AI did not detect a clear time. Please select manually."
          : "時間：AI 未看出明確時間，請人工選擇。",
      suggestion.location === "地點不確定"
        ? language === "en"
          ? "Location or area: AI can only mark it as uncertain. Please select manually."
          : "地點或範圍：AI 只能標示不確定，請人工補選。"
        : "",
    ].filter(Boolean);

    setNewSourceType(suggestion.sourceType);
    setNewReportedAt(suggestion.reportedAt);
    setNewLocation(suggestion.location);
    setNewConfirmation(suggestion.confirmation);
    setNewNote((current) => {
      const trimmedNote = current.trim();

      if (!trimmedNote || trimmedNote.startsWith("AI 判斷建議")) {
        return language === "en"
          ? [
              "AI judgement suggestion (needs human review):",
              suggestion.sourceType
                ? `Source suggestion: ${labelForSourceType(
                    suggestion.sourceType,
                    language,
                  )}`
                : "",
              suggestion.reportedAt
                ? `Time suggestion: ${suggestion.reportedAt}`
                : "",
              `Location or area suggestion: ${labelForSourceType(
                suggestion.location,
                language,
              )}`,
              `Confirmation method suggestion: ${labelForSourceType(
                suggestion.confirmation,
                language,
              )}`,
              "These field suggestions come from the raw text and do not mean the information is verified.",
            ]
              .filter(Boolean)
              .join("\n")
          : suggestion.note;
      }

      return `${trimmedNote}\n${suggestion.note}`;
    });
    setNewFormError("");
    setAiFillNotification({ filled, needsManualReview });
  };

  const renderRecordReviewNote = (recordId: string) => {
    const reviewNote = generatedReviewNotes[recordId];

    if (!reviewNote) {
      return null;
    }

    return (
      <section className="record-card__generated-note">
        <h4>{t("generatedReviewHint")}</h4>
        {reviewNote.provided.length > 0 ? (
          <div>
            <strong>{t("reporterProvided")}</strong>
            <ul>
              {reviewNote.provided.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div>
          <strong>{t("stillNeedsManualReview")}</strong>
          <ul>
            {reviewNote.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        {reviewNote.decisionLog.length > 0 ? (
          <div>
            <strong>{t("actionDecisionLog")}</strong>
            <ul>
              {reviewNote.decisionLog.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    );
  };

  const renderIntakeDetails = (record: Phase0MessyRecord) => {
    const details = record.intakeDetails;

    if (!details) {
      return null;
    }

    const fields: DetailField[] = [
      {
        label: t("informationSourceMethod"),
        value: details.sourceType
          ? labelForSourceType(details.sourceType, language)
          : t("notProvidedReview"),
      },
      {
        label: t("time"),
        value: details.reportedAt || t("notProvidedReview"),
      },
      {
        label: t("locationOrArea"),
        value: details.location
          ? labelForSourceType(details.location, language)
          : t("notProvidedReview"),
      },
      {
        label: t("confirmationMethod"),
        value: details.confirmation
          ? labelForSourceType(details.confirmation, language)
          : t("notProvidedReview"),
      },
      {
        label: t("note"),
        value: details.note || t("notProvided"),
      },
      {
        label: t("intakeStatus"),
        value: details.isIncomplete
          ? t("incompleteReview")
          : t("filledStillReview"),
      },
      {
        label: t("addedAt"),
        value: formatDateTime(details.collectedAt),
      },
    ];

    return (
      <section>
        <h4>{t("intakeFieldsTitle")}</h4>
        <dl className="phase0-raw__detail-fields">
          {fields.map((field) => (
            <div key={field.label}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
        {details.missingFields.length > 0 ? (
          <div className="phase0-raw__detail-missing">
            <strong>{t("stillNeedsManualReview")}</strong>
            <ul>
              {details.missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    );
  };

  const buildDetailSummary = (record: Phase0MessyRecord) => {
    const reviewNote = generatedReviewNotes[record.id];
    const details = record.intakeDetails;
    const statusText = getRecordStatusText(record.id);
    const displayedRawText = translateRawText(record.rawText, language);
    const lines = [
      `${t("rawPanelTitle")} ${record.id}`,
      `${t("rawDetailContent")}：${displayedRawText}`,
      hasRawTextTranslation(record.rawText, language)
        ? `${t("originalRawText")}：${record.rawText}`
        : "",
      `${t("informationSourceMethod")}：${labelForSourceType(
        details?.sourceType || record.sourceType || t("notProvided"),
        language,
      )}`,
      `${t("dataStatus")}：${labelForStatus(record.verificationStatus, language)}`,
      statusText ? `${t("completedSorting")}：${statusText}` : "",
      `${t("updatedAt")}：${formatDateTime(record.updatedAt)}`,
      details ? `${t("time")}：${details.reportedAt || t("notProvided")}` : "",
      details
        ? `${t("locationOrArea")}：${
            details.location
              ? labelForSourceType(details.location, language)
              : t("notProvided")
          }`
        : "",
      details
        ? `${t("confirmationMethod")}：${
            details.confirmation
              ? labelForSourceType(details.confirmation, language)
              : t("notProvided")
          }`
        : "",
      details ? `${t("note")}：${details.note || t("notProvided")}` : "",
      details
        ? `${t("intakeStatus")}：${
            details.isIncomplete
              ? t("incompleteReview")
              : t("filledStillReview")
          }`
        : "",
      reviewNote?.missing.length
        ? `${t("stillNeedsManualReview")}：${reviewNote.missing.join(" / ")}`
        : "",
    ].filter(Boolean);

    return lines.join("\n");
  };

  const copyDetailSummary = async (record: Phase0MessyRecord) => {
    if (!navigator.clipboard?.writeText) {
      setDetailCopyMessage(t("copyUnsupported"));
      return;
    }

    try {
      await navigator.clipboard.writeText(buildDetailSummary(record));
      setDetailCopyMessage(t("copiedDetailSummary"));
    } catch {
      setDetailCopyMessage(t("copyFailed"));
    }
  };

  const openSurpriseAfterThreeClicks = () => {
    const nextClickCount = surpriseClickCount + 1;

    if (nextClickCount < 3) {
      setSurpriseClickCount(nextClickCount);
      return;
    }

    setSurpriseClickCount(0);
    setShowPikachuSurprise(true);
  };

  const closePikachuSurprise = () => {
    setSurpriseClickCount(0);
    setShowPikachuSurprise(false);
  };

  const openRecordDetail = (recordId: string) => {
    setDetailRecordId(recordId);
    setDetailCopyMessage("");
  };

  const handleRecordCardKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    recordId: string,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openRecordDetail(recordId);
  };

  const renderRecordCard = (record: Phase0MessyRecord) => (
    <article
      aria-label={`${t("viewDetailsPrefix")} ${record.id} ${t(
        "viewDetailsSuffix",
      )}`}
      className={`record-card record-card--clickable ${record.id === selectedRecordId ? "record-card--selected" : ""}`}
      key={record.id}
      role="button"
      tabIndex={0}
      onClick={() => openRecordDetail(record.id)}
      onKeyDown={(event) => handleRecordCardKeyDown(event, record.id)}
    >
      <div className="record-card__header">
        <h3>{record.id}</h3>
        <div className="phase0-raw__record-status">
          <StatusBadge status={record.verificationStatus} />
          {getRecordStatusText(record.id) ? (
            <span className="phase0-raw__record-note">
              {getRecordStatusText(record.id)}
            </span>
          ) : null}
        </div>
      </div>
      <p>{translateRawText(record.rawText, language)}</p>
      {renderRecordReviewNote(record.id)}
      <div className="record-card__meta">
        <SourceLabel sourceType={record.sourceType} />
        <span>
          {t("updatedAt")}：{formatDateTime(record.updatedAt)}
        </span>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onSelect(record.id);
        }}
      >
        {t("sendToWorkbench")}
      </button>
    </article>
  );

  return (
    <div className="phase0-raw">
      <div className="panel__header">
        <div className="panel__header__title">
          <h2>{t("rawPanelTitle")}</h2>
          <p>{t("rawPanelDescription")}</p>
        </div>
        <div className="panel__header__actions">
          <button
            aria-label={t("openSurprise")}
            className="phase0-raw__surprise-button"
            title={t("openSurprise")}
            type="button"
            onClick={openSurpriseAfterThreeClicks}
          >
            <span aria-hidden="true">⚡</span>
          </button>
          <p>
            {records.length} {t("recordsCountSuffix")}
          </p>
        </div>
      </div>

      <div className="phase0-raw__add-trigger">
        <button
          className={
            showAddForm
              ? "phase0-raw__add-toggle phase0-raw__add-toggle--cancel"
              : "phase0-raw__add-toggle"
          }
          type="button"
          onClick={() => setShowAddForm((current) => !current)}
        >
          {showAddForm ? t("cancelAdd") : t("addRaw")}
        </button>
      </div>

      <div className="phase0-raw__add">
        {showAddForm ? (
          <div className="phase0-raw__add-form">
            <div className="phase0-raw__add-note">
              <h3>{t("quickReport")}</h3>
              <p>{t("quickReportDescription")}</p>
            </div>
            <label htmlFor="new-raw-text">
              {t("rawContentRequired")}
              <textarea
                id="new-raw-text"
                value={newRawText}
                onChange={(event) => {
                  setNewRawText(event.target.value);
                  setNewFormError("");
                }}
                rows={3}
              />
            </label>
            <div className="phase0-raw__ai-assist">
              <div>
                <h3>{t("aiAssistTitle")}</h3>
                <p>{t("aiAssistDescription")}</p>
              </div>
              <button type="button" onClick={handleAiSuggestion}>
                {t("aiAssistButton")}
              </button>
            </div>
            <label htmlFor="new-source-type">
              {t("sourceTypeOptional")}
              <select
                id="new-source-type"
                value={newSourceType}
                onChange={(event) => {
                  setNewSourceType(event.target.value);
                  setNewFormError("");
                }}
              >
                <option value="">{t("missingSourceOption")}</option>
                <option value="社群轉錄">
                  {labelForSourceType("社群轉錄", language)}
                </option>
                <option value="現場回報">
                  {labelForSourceType("現場回報", language)}
                </option>
                <option value="官方公告">
                  {labelForSourceType("官方公告", language)}
                </option>
              </select>
            </label>
            <label htmlFor="new-reported-at">
              {t("timeOptional")}
              <input
                id="new-reported-at"
                type="time"
                value={newReportedAt}
                onChange={(event) => {
                  setNewReportedAt(event.target.value);
                  setNewFormError("");
                }}
              />
            </label>
            <fieldset className="phase0-map-picker">
              <legend>{t("locationOptional")}</legend>
              <div className="phase0-map-picker__grid" role="radiogroup">
                {locationOptions.map((option) => (
                  <button
                    key={option}
                    aria-pressed={newLocation === option}
                    className={newLocation === option ? "active" : ""}
                    type="button"
                    onClick={() => {
                      setNewLocation(option);
                      setNewFormError("");
                    }}
                  >
                    {labelForSourceType(option, language)}
                  </button>
                ))}
              </div>
              <p>{t("mockMapNote")}</p>
            </fieldset>
            <label htmlFor="new-confirmation">
              {t("confirmationOptional")}
              <select
                id="new-confirmation"
                value={newConfirmation}
                onChange={(event) => {
                  setNewConfirmation(event.target.value);
                  setNewFormError("");
                }}
              >
                <option value="">{t("selectPlaceholder")}</option>
                <option value="親眼看到">
                  {labelForSourceType("親眼看到", language)}
                </option>
                <option value="聽別人說">
                  {labelForSourceType("聽別人說", language)}
                </option>
                <option value="不確定">
                  {labelForSourceType("不確定", language)}
                </option>
              </select>
            </label>
            <label htmlFor="new-note">
              {t("note")}
              <textarea
                id="new-note"
                value={newNote}
                onChange={(event) => {
                  setNewNote(event.target.value);
                  setNewFormError("");
                }}
                rows={2}
              />
            </label>
            {newFormError ? (
              <p className="phase0-raw__add-error" role="alert">
                {newFormError}
              </p>
            ) : null}
            <div className="phase0-raw__add-actions">
              <button
                className="phase0-raw__add-submit"
                type="button"
                onClick={handleAddRecord}
              >
                {t("addToList")}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {aiFillNotification ? (
        <div className="phase0-modal__backdrop" role="presentation">
          <div
            className="phase0-modal phase0-raw__ai-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-fill-notification-title"
          >
            <h3 id="ai-fill-notification-title">{t("aiFilledTitle")}</h3>
            <p className="phase0-modal__content">{t("aiFilledDescription")}</p>
            <section>
              <h4>{t("aiFilled")}</h4>
              <ul>
                {aiFillNotification.filled.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            {aiFillNotification.needsManualReview.length > 0 ? (
              <section>
                <h4>{t("stillNeedsManualSelection")}</h4>
                <ul>
                  {aiFillNotification.needsManualReview.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            <button type="button" onClick={() => setAiFillNotification(null)}>
              {t("gotIt")}
            </button>
          </div>
        </div>
      ) : null}

      {showPikachuSurprise ? (
        <div
          className="phase0-modal__backdrop"
          role="presentation"
          onClick={closePikachuSurprise}
        >
          <div
            className="phase0-modal phase0-surprise-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pikachu-surprise-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="eyebrow">{t("surpriseEyebrow")}</p>
            <h3 id="pikachu-surprise-title">{t("surpriseTitle")}</h3>
            <img
              alt={t("surpriseAlt")}
              className="phase0-surprise-modal__image"
              src={surpriseImageUrl}
            />
            <p className="phase0-modal__content">{t("surpriseContent")}</p>
            <button type="button" onClick={closePikachuSurprise}>
              {t("closeSurprise")}
            </button>
          </div>
        </div>
      ) : null}

      {detailRecord ? (
        <div
          className="phase0-modal__backdrop"
          role="presentation"
          onClick={() => setDetailRecordId(null)}
        >
          <div
            className="phase0-modal phase0-raw__detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="raw-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="phase0-raw__detail-header">
              <div>
                <p className="eyebrow">{t("rawDetailEyebrow")}</p>
                <h3 id="raw-detail-title">{detailRecord.id}</h3>
              </div>
              <StatusBadge status={detailRecord.verificationStatus} />
            </div>
            <section>
              <h4>{t("rawDetailContent")}</h4>
              <p>{translateRawText(detailRecord.rawText, language)}</p>
              {hasRawTextTranslation(detailRecord.rawText, language) ? (
                <p className="phase0-raw__original-text">
                  <strong>{t("originalRawText")}：</strong>
                  {detailRecord.rawText}
                </p>
              ) : null}
            </section>
            <section className="phase0-raw__detail-copy">
              <h4>{t("detailSummary")}</h4>
              <button
                type="button"
                onClick={() => void copyDetailSummary(detailRecord)}
              >
                {t("copyDetailSummary")}
              </button>
              {detailCopyMessage ? (
                <p className="phase0-raw__copy-message">{detailCopyMessage}</p>
              ) : null}
            </section>
            {renderIntakeDetails(detailRecord)}
            <section>
              <h4>{t("dataStatus")}</h4>
              <div className="phase0-raw__detail-meta">
                <SourceLabel sourceType={detailRecord.sourceType} />
                <StatusBadge status={detailRecord.verificationStatus} />
                {getRecordStatusText(detailRecord.id) ? (
                  <span className="status-badge status-fulfilled">
                    {getRecordStatusText(detailRecord.id)}
                  </span>
                ) : null}
                <span>
                  {t("updatedAt")}：{formatDateTime(detailRecord.updatedAt)}
                </span>
              </div>
            </section>
            {renderRecordReviewNote(detailRecord.id)}
            <div className="phase0-raw__detail-actions">
              <button type="button" onClick={() => setDetailRecordId(null)}>
                {t("close")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailRecordId(null);
                  onSelect(detailRecord.id);
                }}
              >
                {t("sendToWorkbench")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="phase0-raw__groups">
        <section className="phase0-raw__group">
          <div className="phase0-raw__group-title">
            <h3>{t("reviewNeededGroup")}</h3>
            <p>
              {reviewNeededRecords.length} {t("recordsCountSuffix")}
            </p>
          </div>
          <div className="grid">
            {reviewNeededRecords.map((record) => renderRecordCard(record))}
          </div>
        </section>

        <section className="phase0-raw__group">
          <div className="phase0-raw__group-title">
            <h3>{t("unverifiedGroup")}</h3>
            <p>
              {unverifiedRecords.length} {t("recordsCountSuffix")}
            </p>
          </div>
          <div className="grid">
            {unverifiedRecords.map((record) => renderRecordCard(record))}
          </div>
        </section>
      </div>
    </div>
  );
}
