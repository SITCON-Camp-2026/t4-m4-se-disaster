import { useMemo, useState } from "react";
import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import type { Phase0MessyRecord } from "./phase0-types";

const workbenchInstructions =
  "整理工作台使用說明：\n\n1. 先選擇一筆原始資訊。\n2. 點擊「建立草稿」開始整理。\n3. 填寫候選類型、有效性與原因。\n4. 最後點擊「完成整理」表示這筆資訊已整理完成。";

export function Phase0RawInfoPanel({
  records,
  selectedRecordId,
  onSelect,
  completedRecordIds = [],
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
  completedRecordIds?: string[];
}) {
  const [localRecords, setLocalRecords] = useState(records);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRawText, setNewRawText] = useState("");
  const [newSourceType, setNewSourceType] = useState("社群轉錄");
  const [showAddForm, setShowAddForm] = useState(false);

  const reviewNeededRecords = useMemo(
    () => localRecords.filter((record) => record.verificationStatus === "needs_review"),
    [localRecords],
  );
  const unverifiedRecords = useMemo(
    () => localRecords.filter((record) => record.verificationStatus === "unverified"),
    [localRecords],
  );

  const handleSendToWorkbench = (recordId: string) => {
    setIsModalOpen(true);
    onSelect(recordId);
  };

  const getRecordStatusText = (recordId: string) => {
    return completedRecordIds.includes(recordId) ? "已完成整理" : undefined;
  };

  const handleAddRecord = () => {
    if (!newRawText.trim()) {
      return;
    }

    const nextRecord: Phase0MessyRecord = {
      id: `M-${localRecords.length + 1}`,
      rawText: newRawText.trim(),
      sourceType: newSourceType,
      verificationStatus: "needs_review",
      updatedAt: new Date().toISOString(),
    };

    setLocalRecords([nextRecord, ...localRecords]);
    setNewRawText("");
    setNewSourceType("社群轉錄");
    setShowAddForm(false);
  };

  return (
    <div className="phase0-raw">
      <div className="panel__header">
        <div className="panel__header__title">
          <h2>原始資訊</h2>
          <p>這些還不是整理後資料，不能直接當成行動依據。</p>
        </div>
        <div className="panel__header__actions">
          <p>{localRecords.length} 筆資料</p>
        </div>
      </div>

      <div className="phase0-raw__add-trigger">
        <button type="button" onClick={() => setShowAddForm((current) => !current)}>
          {showAddForm ? "取消新增" : "新增原始資訊"}
        </button>
      </div>

      <div className="phase0-raw__add">
        {showAddForm ? (
          <div className="phase0-raw__add-form">
            <label htmlFor="new-raw-text">
              原始資訊內容
              <textarea
                id="new-raw-text"
                value={newRawText}
                onChange={(event) => setNewRawText(event.target.value)}
                rows={3}
              />
            </label>
            <label htmlFor="new-source-type">
              來源類型
              <select
                id="new-source-type"
                value={newSourceType}
                onChange={(event) => setNewSourceType(event.target.value)}
              >
                <option value="社群轉錄">社群轉錄</option>
                <option value="現場回報">現場回報</option>
                <option value="官方公告">官方公告</option>
              </select>
            </label>
            <button type="button" onClick={handleAddRecord}>
              加入清單
            </button>
          </div>
        ) : null}
      </div>

      <div className="phase0-raw__groups">
        <section className="phase0-raw__group">
          <div className="phase0-raw__group-title">
            <h3>需要人工確認</h3>
            <p>{reviewNeededRecords.length} 筆</p>
          </div>
          <div className="grid">
            {reviewNeededRecords.map((record) => (
              <article
                className={`record-card ${record.id === selectedRecordId ? "record-card--selected" : ""}`}
                key={record.id}
              >
                <div className="record-card__header">
                  <h3>{record.id}</h3>
                  <div className="phase0-raw__record-status">
                    <StatusBadge status={record.verificationStatus} />
                    {getRecordStatusText(record.id) ? (
                      <span className="phase0-raw__record-note">{getRecordStatusText(record.id)}</span>
                    ) : null}
                  </div>
                </div>
                <p>{record.rawText}</p>
                <div className="record-card__meta">
                  <SourceLabel sourceType={record.sourceType} />
                  <span>更新：{formatDateTime(record.updatedAt)}</span>
                </div>
                <button type="button" onClick={() => handleSendToWorkbench(record.id)}>
                  送到整理工作台
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="phase0-raw__group">
          <div className="phase0-raw__group-title">
            <h3>未審查</h3>
            <p>{unverifiedRecords.length} 筆</p>
          </div>
          <div className="grid">
            {unverifiedRecords.map((record) => (
              <article
                className={`record-card ${record.id === selectedRecordId ? "record-card--selected" : ""}`}
                key={record.id}
              >
                <div className="record-card__header">
                  <h3>{record.id}</h3>
                  <div className="phase0-raw__record-status">
                    <StatusBadge status={record.verificationStatus} />
                    {getRecordStatusText(record.id) ? (
                      <span className="phase0-raw__record-note">{getRecordStatusText(record.id)}</span>
                    ) : null}
                  </div>
                </div>
                <p>{record.rawText}</p>
                <div className="record-card__meta">
                  <SourceLabel sourceType={record.sourceType} />
                  <span>更新：{formatDateTime(record.updatedAt)}</span>
                </div>
                <button type="button" onClick={() => handleSendToWorkbench(record.id)}>
                  送到整理工作台
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>

      {isModalOpen ? (
        <div className="phase0-modal__backdrop" role="presentation">
          <div
            className="phase0-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workbench-instructions-title"
          >
            <h3 id="workbench-instructions-title">整理工作台使用說明</h3>
            <p className="phase0-modal__content">{workbenchInstructions}</p>
            <button type="button" onClick={() => setIsModalOpen(false)}>
              開始整理
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
