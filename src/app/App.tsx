import { type FormEvent, useEffect, useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import { Phase0RawInfoPanel } from "../features/phase-0/Phase0RawInfoPanel";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import type { Phase0MessyRecord } from "../features/phase-0/phase0-types";
import { LanguageProvider, useLanguage } from "../i18n/language";

type TabKey = "raw" | "workbench";
type ThemeMode = "light" | "dark";

const workbenchPassword = "pika";
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
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const { t, toggleLanguage } = useLanguage();
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
      setWorkbenchPasswordError(t("passwordError"));
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
          <div className="hero__controls">
            <button
              className="language-toggle"
              type="button"
              onClick={toggleLanguage}
            >
              {t("languageSwitch")}
            </button>
            <button
              className="theme-toggle"
              type="button"
              aria-pressed={themeMode === "dark"}
              onClick={toggleThemeMode}
            >
              {themeMode === "dark" ? t("lightMode") : t("darkMode")}
            </button>
          </div>
        </div>
        <h1>{t("appTitle")}</h1>
        <p>{t("appDescription")}</p>
      </header>

      <nav className="tabs" aria-label={t("workspaceLabel")}>
        {(["raw", "workbench"] satisfies TabKey[]).map((tabKey) => (
          <button
            key={tabKey}
            className={activeTab === tabKey ? "active" : ""}
            type="button"
            onClick={() =>
              tabKey === "workbench"
                ? requestWorkbenchAccess(selectedRecordId)
                : openRawInfo()
            }
          >
            {tabKey === "raw" ? t("rawTab") : t("workbenchTab")}
          </button>
        ))}
      </nav>

      <section className="panel">
        {records.length === 0 ? (
          <EmptyState message={t("emptyState")} />
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
            <h3 id="workbench-password-title">{t("passwordTitle")}</h3>
            <p className="phase0-modal__content">{t("passwordDescription")}</p>
            <form
              className="workbench-password-form"
              onSubmit={confirmWorkbenchAccess}
            >
              <label htmlFor="workbench-password">
                {t("passwordLabel")}
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
                  {t("cancel")}
                </button>
                <button type="submit">{t("confirmEnter")}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
