import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "zh-TW" | "en";

const languageStorageKey = "phase0-language";

const translations = {
  "zh-TW": {
    appTitle: "災害資訊整理工作台",
    appDescription:
      "第一階段先用 coding agent 做出可展示的前端原型，再從成果中看見資料品質、角色、狀態與來源的限制。",
    languageSwitch: "English",
    darkMode: "深色模式",
    lightMode: "淺色模式",
    rawTab: "原始資訊",
    workbenchTab: "整理工作台",
    workspaceLabel: "第一階段工作區",
    emptyState: "目前沒有資料",
    passwordTitle: "輸入整理工作台密碼",
    passwordDescription:
      "整理工作台包含可編輯判斷草稿。這是課堂練習用的前端門檻，不代表正式權限控管。",
    passwordLabel: "密碼",
    passwordError: "密碼不正確，請重新輸入。",
    cancel: "取消",
    confirmEnter: "確認進入",
    updatedAt: "更新",
    sourcePrefix: "來源",
    rawPanelTitle: "原始資訊",
    rawPanelDescription: "這些還不是整理後資料，不能直接當成行動依據。",
    recordsCountSuffix: "筆資料",
    rawRecordsCountSuffix: "筆原始資訊",
    openSurprise: "打開小驚喜",
    surpriseTitle: "被找到了！",
    surpriseEyebrow: "小彩蛋",
    surpriseAlt: "吃餅乾的皮卡丘插圖",
    surpriseContent: "這只是原始資訊區塊裡的小驚喜，不會修改任何資料。",
    closeSurprise: "收起來",
    addRaw: "新增原始資訊",
    cancelAdd: "取消新增",
    quickReport: "快速回報",
    quickReportDescription:
      "原始資訊內容必填。來源、時間、地點或範圍、確認方式可先不填；送出後會標示缺漏與待人工確認，不會變成已確認資料。",
    rawContentRequired: "原始資訊內容（必填）",
    aiAssistTitle: "AI 判斷建議",
    aiAssistDescription: "依原始文字先填入可推測欄位；所有建議仍需人工確認。",
    aiAssistButton: "AI 判斷並填入",
    sourceTypeCategory: "來源類型",
    sourceTypeOptional: "來源類型（可先不填）",
    missingSourceOption: "未提供，系統標示待補",
    timeOptional: "時間（可先不填）",
    locationOptional: "地點或範圍（可先不選）",
    mockMapNote: "這是課堂用模擬範圍，不連接真實地圖或真實地址。",
    confirmationOptional: "確認方式（可先不選）",
    selectPlaceholder: "請選擇",
    note: "備註",
    addToList: "加入清單（待確認）",
    rawTextRequiredError: "請先填寫原始資訊內容，才能加入清單。",
    aiNeedsRawTextError: "請先輸入原始資訊內容，再使用 AI 判斷建議。",
    aiFilledTitle: "AI 已填入欄位",
    aiFilledDescription:
      "以下欄位是依原始資訊文字產生的填寫建議，仍需要人工確認。",
    aiFilled: "AI 已填入",
    stillNeedsManualSelection: "仍需人工補選",
    gotIt: "知道了",
    rawDetailEyebrow: "原始資訊詳細資訊",
    rawDetailContent: "原始資訊內容",
    originalRawText: "原始原文",
    detailSummary: "詳細摘要",
    copyDetailSummary: "複製詳細摘要",
    copiedDetailSummary: "已複製詳細摘要。",
    copyUnsupported: "此瀏覽器不支援自動複製。",
    copyFailed: "複製失敗，請改用手動選取。",
    intakeFieldsTitle: "新增時取得的所有欄位",
    informationSourceMethod: "資訊取得方式",
    time: "時間",
    locationOrArea: "地點或範圍",
    confirmationMethod: "確認方式",
    intakeStatus: "收錄狀態",
    addedAt: "加入時間",
    notProvidedReview: "未提供（待人工確認）",
    notProvided: "未提供",
    incompleteReview: "不完整與待人工確認",
    filledStillReview: "欄位已填，仍待人工確認",
    stillNeedsManualReview: "仍需人工確認",
    dataStatus: "資料狀態",
    close: "關閉",
    sendToWorkbench: "送到整理工作台",
    reviewNeededGroup: "需要人工確認",
    unverifiedGroup: "未審查",
    viewDetailsPrefix: "查看",
    viewDetailsSuffix: "詳細資訊",
    completedSorting: "已完成整理",
    generatedReviewHint: "系統生成待補提示",
    reporterProvided: "回報者已提供",
    actionDecisionLog: "操作與判斷紀錄",
    workbenchEyebrow: "整理工作台",
    workbenchTitle:
      "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
    workbenchDescription:
      "這個原型重點不是分類對不對，而是把哪些資訊不能直接相信、不能直接變成任務、需要人工確認說清楚。",
    selectRawInfoLabel: "選擇原始資訊",
    selectRawInfoHint: "選擇一筆資料開始分類",
    selectedRawInfo: "目前選中的原始資訊",
    selectedRawInfoHint: "先看內容，再決定是否能作為有效資訊",
    createDraft: "建立草稿",
    resetDraft: "重設為初始建議",
    completeDraft: "完成整理",
    draftCreated: "草稿已建立，下面的內容會保留你的分類與理由。",
    draftCompleted:
      "草稿已建立，下面的內容會保留你的分類與理由。\n已完成整理：這筆資料已完成整理。",
    draftMissing: "尚未建立草稿，點擊建立草稿後即可開始整理。",
    completionChecklist: "完成檢查",
    completionChecklistHint: "確認這份原型有暴露出問題",
    starterLoadedPrefix: "Starter 已載入",
    askAgentDraftCrud: "請 agent 加上建立、編輯、刪除或重設整理草稿",
    sixEditableDrafts: "至少讓 6 筆原始資訊被嘗試整理成可編輯草稿",
    twoHumanCorrections: "至少挑 2 個候選判斷由人類質疑或修正",
    writeObservations:
      "把資料品質問題寫進 observations，並記錄 agent 哪裡不能直接相信",
    judgementDraft: "整理草稿",
    judgementTitle: "判斷這筆資訊是否可作為有效資訊",
    judgementDescription:
      "這張卡不是標準答案，而是讓你把「不能直接相信」「不能直接變成任務」「需要人工確認」的理由寫出來。",
    classificationSummary: "分類摘要",
    validity: "有效性",
    unsafeToTrust: "不能直接相信",
    cannotBecomeTask: "不能直接變成任務",
    yes: "是",
    no: "否",
    candidateKind: "候選類型",
    validInformationQuestion: "是否為有效資訊",
    classificationReason: "分類理由",
    otherReason: "其他理由",
    humanReviewNote: "人工確認備註",
    confidence: "信心程度",
    nextStep: "下一步",
    safeDefaultOnly: "目前只有安全預設",
    blockersTitle: "目前卡住的地方",
    chooseOption: "請選擇",
    reasonOther: "其他",
    customReasonPlaceholder: "請填寫其他理由",
    displayReasonPlaceholder: "請在上方填寫為什麼這筆資訊應該被分類為這一類。",
    customReasonMissing: "請填寫其他理由",
    reviewNotePlaceholder: "若需要人類再確認，請在這裡寫下提醒。",
  },
  en: {
    appTitle: "Disaster Information Workbench",
    appDescription:
      "In Phase 0, we use a coding agent to build a visible front-end prototype and expose limits in data quality, roles, status, and sources.",
    languageSwitch: "繁體中文",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    rawTab: "Raw Information",
    workbenchTab: "Review Workbench",
    workspaceLabel: "Phase 0 workspace",
    emptyState: "No data yet",
    passwordTitle: "Enter workbench password",
    passwordDescription:
      "The workbench contains editable judgement drafts. This is a classroom front-end gate, not real access control.",
    passwordLabel: "Password",
    passwordError: "Incorrect password. Please try again.",
    cancel: "Cancel",
    confirmEnter: "Enter",
    updatedAt: "Updated",
    sourcePrefix: "Source",
    rawPanelTitle: "Raw Information",
    rawPanelDescription:
      "These are not cleaned records yet and cannot be used as action evidence.",
    recordsCountSuffix: "records",
    rawRecordsCountSuffix: "raw records",
    openSurprise: "Open tiny surprise",
    surpriseTitle: "Found!",
    surpriseEyebrow: "Tiny surprise",
    surpriseAlt: "Illustration of Pikachu eating a cookie",
    surpriseContent:
      "This is only a small surprise in the raw information panel. It does not modify any data.",
    closeSurprise: "Put it away",
    addRaw: "Add raw information",
    cancelAdd: "Cancel add",
    quickReport: "Quick report",
    quickReportDescription:
      "Raw content is required. Source, time, location or area, and confirmation method may stay blank; the item will be marked incomplete and awaiting human review, never confirmed.",
    rawContentRequired: "Raw information content (required)",
    aiAssistTitle: "AI judgement suggestion",
    aiAssistDescription:
      "Fill inferable fields from the raw text first. Every suggestion still needs human review.",
    aiAssistButton: "AI judge and fill",
    sourceTypeCategory: "Source type",
    sourceTypeOptional: "Source type (optional)",
    missingSourceOption: "Not provided, mark as missing",
    timeOptional: "Time (optional)",
    locationOptional: "Location or area (optional)",
    mockMapNote:
      "This is a classroom mock area picker. It does not connect to real maps or real addresses.",
    confirmationOptional: "Confirmation method (optional)",
    selectPlaceholder: "Select",
    note: "Notes",
    addToList: "Add to list (needs review)",
    rawTextRequiredError: "Please enter raw information before adding it.",
    aiNeedsRawTextError:
      "Please enter raw information before using AI judgement suggestions.",
    aiFilledTitle: "AI filled fields",
    aiFilledDescription:
      "The following fields were suggested from the raw text and still need human review.",
    aiFilled: "AI filled",
    stillNeedsManualSelection: "Still needs manual selection",
    gotIt: "Got it",
    rawDetailEyebrow: "Raw information details",
    rawDetailContent: "Raw information content",
    originalRawText: "Original text",
    detailSummary: "Detail summary",
    copyDetailSummary: "Copy detail summary",
    copiedDetailSummary: "Detail summary copied.",
    copyUnsupported: "This browser does not support automatic copy.",
    copyFailed: "Copy failed. Please select manually.",
    intakeFieldsTitle: "All fields captured when added",
    informationSourceMethod: "Information source method",
    time: "Time",
    locationOrArea: "Location or area",
    confirmationMethod: "Confirmation method",
    intakeStatus: "Intake status",
    addedAt: "Added at",
    notProvidedReview: "Not provided (needs human review)",
    notProvided: "Not provided",
    incompleteReview: "Incomplete and awaiting human review",
    filledStillReview: "Fields filled, still awaiting human review",
    stillNeedsManualReview: "Still needs human review",
    dataStatus: "Data status",
    close: "Close",
    sendToWorkbench: "Send to workbench",
    reviewNeededGroup: "Needs Human Review",
    unverifiedGroup: "Unreviewed",
    viewDetailsPrefix: "View",
    viewDetailsSuffix: "details",
    completedSorting: "Review completed",
    generatedReviewHint: "Generated missing-field hints",
    reporterProvided: "Reporter provided",
    actionDecisionLog: "Action and judgement log",
    workbenchEyebrow: "Review Workbench",
    workbenchTitle:
      "Phase 0 succeeds when we explain why something cannot be judged yet, not when we classify it perfectly.",
    workbenchDescription:
      "This prototype focuses on making clear what cannot be trusted directly, cannot become a task directly, and needs human review.",
    selectRawInfoLabel: "Select raw information",
    selectRawInfoHint: "Select one item to start classifying",
    selectedRawInfo: "Selected raw information",
    selectedRawInfoHint:
      "Read the content first, then decide whether it can be valid information",
    createDraft: "Create draft",
    resetDraft: "Reset to initial suggestion",
    completeDraft: "Complete review",
    draftCreated:
      "Draft created. Your classification and reasons are kept below.",
    draftCompleted:
      "Draft created. Your classification and reasons are kept below.\nReview completed: this item has been reviewed.",
    draftMissing: "No draft yet. Create a draft to start reviewing.",
    completionChecklist: "Completion checklist",
    completionChecklistHint: "Check whether this prototype exposes problems",
    starterLoadedPrefix: "Starter loaded",
    askAgentDraftCrud:
      "Ask the agent to add create, edit, delete, or reset for drafts",
    sixEditableDrafts: "Try turning at least 6 raw items into editable drafts",
    twoHumanCorrections:
      "Have humans question or correct at least 2 candidate judgements",
    writeObservations:
      "Write data-quality issues into observations and log where the agent cannot be trusted directly",
    judgementDraft: "Review draft",
    judgementTitle: "Judge whether this information can be valid",
    judgementDescription:
      "This card is not the answer key. It helps you write down why the item cannot be trusted directly, cannot become a task directly, and needs human review.",
    classificationSummary: "Classification summary",
    validity: "Validity",
    unsafeToTrust: "Unsafe to trust directly",
    cannotBecomeTask: "Cannot become a task directly",
    yes: "Yes",
    no: "No",
    candidateKind: "Candidate kind",
    validInformationQuestion: "Is this valid information?",
    classificationReason: "Classification reason",
    otherReason: "Other reason",
    humanReviewNote: "Human review notes",
    confidence: "Confidence",
    nextStep: "Next step",
    safeDefaultOnly: "Safety defaults only",
    blockersTitle: "Current blockers",
    chooseOption: "Select",
    reasonOther: "Other",
    customReasonPlaceholder: "Write another reason",
    displayReasonPlaceholder:
      "Use the field above to explain why this item belongs in this class.",
    customReasonMissing: "Please write another reason",
    reviewNotePlaceholder:
      "If humans need to review this again, write the reminder here.",
  },
} as const;

type TranslationKey = keyof (typeof translations)["zh-TW"];

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

const fallbackLanguageContextValue: LanguageContextValue = {
  language: "zh-TW",
  setLanguage: () => undefined,
  toggleLanguage: () => undefined,
  t: (key) => translations["zh-TW"][key],
};

function getInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "zh-TW";
  }

  return window.localStorage.getItem(languageStorageKey) === "en"
    ? "en"
    : "zh-TW";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(languageStorageKey, language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () =>
        setLanguage((current) => (current === "en" ? "zh-TW" : "en")),
      t: (key) => translations[language][key],
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    return fallbackLanguageContextValue;
  }

  return context;
}
