import { useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import { createPhase0Judgement } from "./phase0-heuristics";
import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

export function Phase0Workbench({
  records,
  selectedRecordId,
  onSelect,
  onCompleteRecord,
  onResetRecord,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
  onCompleteRecord?: (recordId: string) => void;
  onResetRecord?: (recordId: string) => void;
}) {
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const [drafts, setDrafts] = useState<Record<string, Phase0JudgementDraft>>(() =>
    Object.fromEntries(
      records.slice(0, 6).map((record) => [
        record.id,
        {
          ...createPhase0Judgement(record),
          isValidInformation: "uncertain",
          classificationReason: "",
          reviewNotes: "",
        },
      ]),
    ),
  );

  const currentDraft = drafts[selectedRecord.id] ?? createPhase0Judgement(selectedRecord);
  const hasCurrentDraft = Boolean(drafts[selectedRecord.id]);
  const getRecordDisplayStatus = (recordId: string) => {
    return records.find((record) => record.id === recordId)?.verificationStatus ?? "unknown";
  };

  const getRecordStatusText = (recordId: string) => {
    const draft = drafts[recordId];
    if (!draft?.isCompleted) {
      return undefined;
    }

    return "已完成整理";
  };
  const draftStatusText = hasCurrentDraft
    ? currentDraft.isCompleted
      ? "草稿已建立，下面的內容會保留你的分類與理由。\n已完成整理：這筆資料已完成整理。"
      : "草稿已建立，下面的內容會保留你的分類與理由。"
    : "尚未建立草稿，點擊建立草稿後即可開始整理。";

  function createDraft() {
    setDrafts((prev) => ({
      ...prev,
      [selectedRecord.id]: {
        ...createPhase0Judgement(selectedRecord),
        isValidInformation: "uncertain",
        classificationReason: "",
        reviewNotes: "",
      },
    }));
  }

  function updateDraft(updates: Partial<Phase0JudgementDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [selectedRecord.id]: {
        ...(prev[selectedRecord.id] ?? createPhase0Judgement(selectedRecord)),
        ...updates,
      },
    }));
  }

  function resetDraft() {
    setDrafts((prev) => ({
      ...prev,
      [selectedRecord.id]: {
        ...createPhase0Judgement(selectedRecord),
        isValidInformation: "uncertain",
        classificationReason: "",
        reviewNotes: "",
        isCompleted: false,
      },
    }));
    onResetRecord?.(selectedRecord.id);
  }

  function completeDraft() {
    setDrafts((prev) => ({
      ...prev,
      [selectedRecord.id]: {
        ...(prev[selectedRecord.id] ?? createPhase0Judgement(selectedRecord)),
        isCompleted: true,
      },
    }));
    onCompleteRecord?.(selectedRecord.id);
  }

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <p className="eyebrow">整理工作台</p>
        <h2>第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。</h2>
        <p>
          這個原型重點不是分類對不對，而是把哪些資訊不能直接相信、不能直接變成任務、需要人工確認說清楚。
        </p>
      </div>

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇原始資訊">
          <div className="workbench__panel-title">
            <h3>原始資訊</h3>
            <p>選擇一筆資料開始分類</p>
          </div>
          {records.map((record) => (
            <button
              className={record.id === selectedRecord.id ? "active" : ""}
              key={record.id}
              type="button"
              onClick={() => onSelect(record.id)}
            >
              <span>{record.id}</span>
              <div className="workbench__queue-item-status">
                <StatusBadge status={getRecordDisplayStatus(record.id)} />
                {getRecordStatusText(record.id) ? (
                  <span className="workbench__queue-item-note">{getRecordStatusText(record.id)}</span>
                ) : null}
              </div>
            </button>
          ))}
        </aside>

        <div className="workbench__main">
          <section className="workbench__section">
            <div className="workbench__panel-title">
              <h3>目前選中的原始資訊</h3>
              <p>先看內容，再決定是否能作為有效資訊</p>
            </div>
            <RecordCard record={selectedRecord} />
          </section>

          <div className="judgement-card__actions">
            <div className="judgement-card__actions__buttons">
              <button type="button" onClick={createDraft}>
                建立草稿
              </button>
              <button type="button" onClick={resetDraft}>
                重設為初始建議
              </button>
              <button type="button" onClick={completeDraft}>
                完成整理
              </button>
            </div>
            <p role="status" aria-live="polite">
              {draftStatusText}
            </p>
          </div>

          <Phase0JudgementCard
            judgement={currentDraft}
            record={selectedRecord}
            onChange={updateDraft}
          />
        </div>

        <aside className="workbench__checklist">
          <div className="workbench__panel-title">
            <h3>完成檢查</h3>
            <p>確認這份原型有暴露出問題</p>
          </div>
          <ul>
            <li>Starter 已載入 {records.length} 筆原始資訊</li>
            <li>請 agent 加上建立、編輯、刪除或重設整理草稿</li>
            <li>至少讓 6 筆原始資訊被嘗試整理成可編輯草稿</li>
            <li>至少挑 2 個候選判斷由人類質疑或修正</li>
            <li>
              把資料品質問題寫進 observations，並記錄 agent 哪裡不能直接相信
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
