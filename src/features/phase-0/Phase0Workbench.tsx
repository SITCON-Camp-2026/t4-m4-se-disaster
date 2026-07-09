import { useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useLanguage } from "../../i18n/language";
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
  const { t } = useLanguage();
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const [drafts, setDrafts] = useState<Record<string, Phase0JudgementDraft>>(
    () =>
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

  const currentDraft =
    drafts[selectedRecord.id] ?? createPhase0Judgement(selectedRecord);
  const hasCurrentDraft = Boolean(drafts[selectedRecord.id]);
  const getRecordDisplayStatus = (recordId: string) => {
    return (
      records.find((record) => record.id === recordId)?.verificationStatus ??
      "unknown"
    );
  };

  const getRecordStatusText = (recordId: string) => {
    const draft = drafts[recordId];
    if (!draft?.isCompleted) {
      return undefined;
    }

    return t("completedSorting");
  };
  const draftStatusText = hasCurrentDraft
    ? currentDraft.isCompleted
      ? t("draftCompleted")
      : t("draftCreated")
    : t("draftMissing");

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
        <p className="eyebrow">{t("workbenchEyebrow")}</p>
        <h2>{t("workbenchTitle")}</h2>
        <p>{t("workbenchDescription")}</p>
      </div>

      <div className="workbench__layout">
        <aside
          className="workbench__queue"
          aria-label={t("selectRawInfoLabel")}
        >
          <div className="workbench__panel-title">
            <h3>{t("rawPanelTitle")}</h3>
            <p>{t("selectRawInfoHint")}</p>
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
                  <span className="workbench__queue-item-note">
                    {getRecordStatusText(record.id)}
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </aside>

        <div className="workbench__main">
          <section className="workbench__section">
            <div className="workbench__panel-title">
              <h3>{t("selectedRawInfo")}</h3>
              <p>{t("selectedRawInfoHint")}</p>
            </div>
            <RecordCard record={selectedRecord} />
          </section>

          <div className="judgement-card__actions">
            <div className="judgement-card__actions__buttons">
              <button type="button" onClick={createDraft}>
                {t("createDraft")}
              </button>
              <button type="button" onClick={resetDraft}>
                {t("resetDraft")}
              </button>
              <button type="button" onClick={completeDraft}>
                {t("completeDraft")}
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
            <h3>{t("completionChecklist")}</h3>
            <p>{t("completionChecklistHint")}</p>
          </div>
          <ul>
            <li>
              {`${t("starterLoadedPrefix")} ${records.length} ${t(
                "rawRecordsCountSuffix",
              )}`}
            </li>
            <li>{t("askAgentDraftCrud")}</li>
            <li>{t("sixEditableDrafts")}</li>
            <li>{t("twoHumanCorrections")}</li>
            <li>{t("writeObservations")}</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
