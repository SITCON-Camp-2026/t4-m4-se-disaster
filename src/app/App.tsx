import { type FormEvent, useEffect, useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import { Phase0RawInfoPanel } from "../features/phase-0/Phase0RawInfoPanel";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import type { Phase0MessyRecord } from "../features/phase-0/phase0-types";

type TabKey = "raw" | "workbench";
type ThemeMode = "light" | "dark";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "raw", label: "原始資訊" },
  { key: "workbench", label: "整理工作台" },
];

const workbenchPassword = "camp2026";
const themeStorageKey = "phase0-theme-mode";
const phase0Records = messyReports satisfies Phase0MessyRecord[];

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(themeStorageKey);
  return storedTheme === "dark" || storedTheme === "light"
    ? storedTheme
    : "light";
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("raw");
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [records, setRecords] = useState<Phase0MessyRecord[]>(() => [
    ...phase0Records,
  ]);
  const [selectedRecordId, setSelectedRecordId] = useState(
    phase0Records[0]?.id ?? "",
  );
  const [completedRecordIds, setCompletedRecordIds] = useState<string[]>([]);
  const [pendingWorkbenchRecordId, setPendingWorkbenchRecordId] = useState<
    string | null
  >(null);
  const [workbenchPasswordInput, setWorkbenchPasswordInput] = useState("");
  const [workbenchPasswordError, setWorkbenchPasswordError] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem(themeStorageKey, themeMode);
  }, [themeMode]);

  function toggleThemeMode() {
    setThemeMode((current) => (current === "dark" ? "light" : "dark"));
  }

  function addRawRecord(record: Phase0MessyRecord) {
    setRecords((current) => [record, ...current]);
    setSelectedRecordId(record.id);
  }

  function requestWorkbenchAccess(recordId: string) {
    setPendingWorkbenchRecordId(recordId);
    setWorkbenchPasswordInput("");
    setWorkbenchPasswordError("");
  }

  function openRawInfo() {
    setActiveTab("raw");
    setPendingWorkbenchRecordId(null);
    setWorkbenchPasswordInput("");
    setWorkbenchPasswordError("");
  }

  function confirmWorkbenchAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (workbenchPasswordInput !== workbenchPassword) {
      setWorkbenchPasswordError("密碼不正確，請重新輸入。");
      return;
    }

    setSelectedRecordId(pendingWorkbenchRecordId ?? selectedRecordId);
    setActiveTab("workbench");
    setPendingWorkbenchRecordId(null);
    setWorkbenchPasswordInput("");
    setWorkbenchPasswordError("");
  }

  function cancelWorkbenchAccess() {
    setPendingWorkbenchRecordId(null);
    setWorkbenchPasswordInput("");
    setWorkbenchPasswordError("");
  }

  return (
    <main className="layout">
      <header className="hero">
        <div className="hero__topline">
          <p className="eyebrow">SITCON Camp 2026</p>
          <button
            className="theme-toggle"
            type="button"
            aria-pressed={themeMode === "dark"}
            onClick={toggleThemeMode}
          >
            {themeMode === "dark" ? "淺色模式" : "深色模式"}
          </button>
        </div>
        <h1>災害資訊整理工作台</h1>
        <p>
          第一階段先用 coding agent
          做出可展示的前端原型，再從成果中看見資料品質、角色、狀態與來源的限制。
        </p>
      </header>

      <nav className="tabs" aria-label="第一階段工作區">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "active" : ""}
            type="button"
            onClick={() =>
              tab.key === "workbench"
                ? requestWorkbenchAccess(selectedRecordId)
                : openRawInfo()
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="panel">
        {records.length === 0 ? (
          <EmptyState message="目前沒有資料" />
        ) : activeTab === "raw" ? (
          <Phase0RawInfoPanel
            records={records}
            selectedRecordId={selectedRecordId}
            onSelect={requestWorkbenchAccess}
            onAddRecord={addRawRecord}
            completedRecordIds={completedRecordIds}
          />
        ) : (
          <Phase0Workbench
            records={records}
            selectedRecordId={selectedRecordId}
            onSelect={setSelectedRecordId}
            onCompleteRecord={(recordId) => {
              setCompletedRecordIds((current) =>
                current.includes(recordId) ? current : [...current, recordId],
              );
            }}
            onResetRecord={(recordId) => {
              setCompletedRecordIds((current) =>
                current.filter((id) => id !== recordId),
              );
            }}
          />
        )}
      </section>

      {pendingWorkbenchRecordId ? (
        <div className="phase0-modal__backdrop" role="presentation">
          <div
            className="phase0-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workbench-password-title"
          >
            <h3 id="workbench-password-title">輸入整理工作台密碼</h3>
            <p className="phase0-modal__content">
              整理工作台包含可編輯判斷草稿。這是課堂練習用的前端門檻，不代表正式權限控管。
            </p>
            <form
              className="workbench-password-form"
              onSubmit={confirmWorkbenchAccess}
            >
              <label htmlFor="workbench-password">
                密碼
                <input
                  autoFocus
                  id="workbench-password"
                  type="password"
                  value={workbenchPasswordInput}
                  onChange={(event) => {
                    setWorkbenchPasswordInput(event.target.value);
                    setWorkbenchPasswordError("");
                  }}
                />
              </label>
              {workbenchPasswordError ? (
                <p className="workbench-password-form__error" role="alert">
                  {workbenchPasswordError}
                </p>
              ) : null}
              <div className="workbench-password-form__actions">
                <button type="button" onClick={cancelWorkbenchAccess}>
                  取消
                </button>
                <button type="submit">確認進入</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
