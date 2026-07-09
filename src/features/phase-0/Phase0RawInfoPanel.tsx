import { type KeyboardEvent, useMemo, useState } from "react";
import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import type { Phase0MessyRecord } from "./phase0-types";

type GeneratedReviewNote = {
  provided: string[];
  missing: string[];
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
    return completedRecordIds.includes(recordId) ? "已完成整理" : undefined;
  };
  const detailRecord = detailRecordId
    ? records.find((record) => record.id === detailRecordId)
    : undefined;

  const handleAddRecord = () => {
    if (
      !newRawText.trim() ||
      !newReportedAt.trim() ||
      !newLocation.trim() ||
      !newConfirmation
    ) {
      setNewFormError(
        "請先填寫原始資訊內容、時間、地點或範圍、確認方式，才能加入清單。",
      );
      return;
    }

    const recordId = createNextRecordId(records);
    const provided = [
      newSourceType ? `資訊取得方式：${newSourceType}` : "",
      newReportedAt.trim() ? `時間：${newReportedAt.trim()}` : "",
      newLocation.trim() ? `地點或範圍：${newLocation.trim()}` : "",
      newConfirmation ? `確認方式：${newConfirmation}` : "",
      newNote.trim() ? `備註：${newNote.trim()}` : "",
    ].filter(Boolean);
    const missing = [
      newSourceType ? "" : "資訊取得方式未提供，待人工確認。",
    ].filter(Boolean);

    const nextRecord: Phase0MessyRecord = {
      id: recordId,
      rawText: newRawText.trim(),
      sourceType: newSourceType || "quick_report",
      verificationStatus: "needs_review",
      updatedAt: new Date().toISOString(),
    };

    onAddRecord(nextRecord);
    setGeneratedReviewNotes((current) => ({
      ...current,
      [recordId]: {
        provided,
        missing: ["這筆快速回報先收入清單，但仍是不完整原始資訊。", ...missing],
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
      setNewFormError("請先輸入原始資訊內容，再使用 AI 判斷建議。");
      return;
    }

    const suggestion = buildAiSuggestion(newRawText);
    const filled = [
      suggestion.sourceType ? `來源類型：${suggestion.sourceType}` : "",
      suggestion.reportedAt ? `時間：${suggestion.reportedAt}` : "",
      `地點或範圍：${suggestion.location}`,
      `確認方式：${suggestion.confirmation}`,
      "備註：AI 判斷建議與待確認提醒",
    ].filter(Boolean);
    const needsManualReview = [
      suggestion.sourceType
        ? ""
        : "來源類型：AI 未看出明確來源，請人工選擇或保留待補。",
      suggestion.reportedAt ? "" : "時間：AI 未看出明確時間，請人工選擇。",
      suggestion.location === "地點不確定"
        ? "地點或範圍：AI 只能標示不確定，請人工補選。"
        : "",
    ].filter(Boolean);

    setNewSourceType(suggestion.sourceType);
    setNewReportedAt(suggestion.reportedAt);
    setNewLocation(suggestion.location);
    setNewConfirmation(suggestion.confirmation);
    setNewNote((current) => {
      const trimmedNote = current.trim();

      if (!trimmedNote || trimmedNote.startsWith("AI 判斷建議")) {
        return suggestion.note;
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
        <h4>系統生成待補提示</h4>
        {reviewNote.provided.length > 0 ? (
          <div>
            <strong>回報者已提供</strong>
            <ul>
              {reviewNote.provided.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div>
          <strong>仍需人工確認</strong>
          <ul>
            {reviewNote.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
    );
  };

  const openRecordDetail = (recordId: string) => {
    setDetailRecordId(recordId);
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
      aria-label={`查看 ${record.id} 詳細資訊`}
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
      <p>{record.rawText}</p>
      {renderRecordReviewNote(record.id)}
      <div className="record-card__meta">
        <SourceLabel sourceType={record.sourceType} />
        <span>更新：{formatDateTime(record.updatedAt)}</span>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onSelect(record.id);
        }}
      >
        送到整理工作台
      </button>
    </article>
  );

  return (
    <div className="phase0-raw">
      <div className="panel__header">
        <div className="panel__header__title">
          <h2>原始資訊</h2>
          <p>這些還不是整理後資料，不能直接當成行動依據。</p>
        </div>
        <div className="panel__header__actions">
          <p>{records.length} 筆資料</p>
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
          {showAddForm ? "取消新增" : "新增原始資訊"}
        </button>
      </div>

      <div className="phase0-raw__add">
        {showAddForm ? (
          <div className="phase0-raw__add-form">
            <div className="phase0-raw__add-note">
              <h3>快速回報</h3>
              <p>
                原始資訊內容、時間、地點或範圍、確認方式必填。送出後仍會標示為待人工確認，不會變成已確認資料。
              </p>
            </div>
            <label htmlFor="new-raw-text">
              原始資訊內容（必填）
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
                <h3>AI 判斷建議</h3>
                <p>依原始文字先填入可推測欄位；所有建議仍需人工確認。</p>
              </div>
              <button type="button" onClick={handleAiSuggestion}>
                AI 判斷並填入
              </button>
            </div>
            <label htmlFor="new-source-type">
              來源類型（可先不填）
              <select
                id="new-source-type"
                value={newSourceType}
                onChange={(event) => {
                  setNewSourceType(event.target.value);
                  setNewFormError("");
                }}
              >
                <option value="">未提供，系統標示待補</option>
                <option value="社群轉錄">社群轉錄</option>
                <option value="現場回報">現場回報</option>
                <option value="官方公告">官方公告</option>
              </select>
            </label>
            <label htmlFor="new-reported-at">
              時間（必填）
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
              <legend>地點或範圍（必填）</legend>
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
                    {option}
                  </button>
                ))}
              </div>
              <p>這是課堂用模擬範圍，不連接真實地圖或真實地址。</p>
            </fieldset>
            <label htmlFor="new-confirmation">
              確認方式（必填）
              <select
                id="new-confirmation"
                value={newConfirmation}
                onChange={(event) => {
                  setNewConfirmation(event.target.value);
                  setNewFormError("");
                }}
              >
                <option value="">請選擇</option>
                <option value="親眼看到">親眼看到</option>
                <option value="聽別人說">聽別人說</option>
                <option value="不確定">不確定</option>
              </select>
            </label>
            <label htmlFor="new-note">
              備註
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
                加入清單（待確認）
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
            <h3 id="ai-fill-notification-title">AI 已填入欄位</h3>
            <p className="phase0-modal__content">
              以下欄位是依原始資訊文字產生的填寫建議，仍需要人工確認。
            </p>
            <section>
              <h4>AI 已填入</h4>
              <ul>
                {aiFillNotification.filled.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            {aiFillNotification.needsManualReview.length > 0 ? (
              <section>
                <h4>仍需人工補選</h4>
                <ul>
                  {aiFillNotification.needsManualReview.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            <button type="button" onClick={() => setAiFillNotification(null)}>
              知道了
            </button>
          </div>
        </div>
      ) : null}

      {detailRecord ? (
        <div className="phase0-modal__backdrop" role="presentation">
          <div
            className="phase0-modal phase0-raw__detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="raw-detail-title"
          >
            <div className="phase0-raw__detail-header">
              <div>
                <p className="eyebrow">原始資訊詳細資訊</p>
                <h3 id="raw-detail-title">{detailRecord.id}</h3>
              </div>
              <StatusBadge status={detailRecord.verificationStatus} />
            </div>
            <section>
              <h4>原始資訊內容</h4>
              <p>{detailRecord.rawText}</p>
            </section>
            <section>
              <h4>資料狀態</h4>
              <div className="phase0-raw__detail-meta">
                <SourceLabel sourceType={detailRecord.sourceType} />
                <StatusBadge status={detailRecord.verificationStatus} />
                {getRecordStatusText(detailRecord.id) ? (
                  <span className="status-badge status-fulfilled">
                    {getRecordStatusText(detailRecord.id)}
                  </span>
                ) : null}
                <span>更新：{formatDateTime(detailRecord.updatedAt)}</span>
              </div>
            </section>
            {renderRecordReviewNote(detailRecord.id)}
            <div className="phase0-raw__detail-actions">
              <button type="button" onClick={() => setDetailRecordId(null)}>
                關閉
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailRecordId(null);
                  onSelect(detailRecord.id);
                }}
              >
                送到整理工作台
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="phase0-raw__groups">
        <section className="phase0-raw__group">
          <div className="phase0-raw__group-title">
            <h3>需要人工確認</h3>
            <p>{reviewNeededRecords.length} 筆</p>
          </div>
          <div className="grid">
            {reviewNeededRecords.map((record) => renderRecordCard(record))}
          </div>
        </section>

        <section className="phase0-raw__group">
          <div className="phase0-raw__group-title">
            <h3>未審查</h3>
            <p>{unverifiedRecords.length} 筆</p>
          </div>
          <div className="grid">
            {unverifiedRecords.map((record) => renderRecordCard(record))}
          </div>
        </section>
      </div>
    </div>
  );
}
