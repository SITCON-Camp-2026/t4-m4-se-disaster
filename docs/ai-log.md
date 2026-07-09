# AI Log

這份紀錄用來留下小組如何使用 AI / Coding Agent 的操作脈絡。重點不是逐字保存所有對話，而是記錄重要協作、取捨與人類判斷。

## 什麼時候要記錄

請在以下情況更新本檔案：

- AI 協助分析原始資訊。
- AI 協助找出不能判斷處。
- AI 協助判斷哪些資訊不能直接相信。
- AI 協助判斷哪些資訊不能直接變成任務。
- AI 協助修改畫面標示或前端工作台。
- AI 可能補了原文沒有的資訊。
- AI 建議被小組拒絕，且拒絕原因和安全 / 正確性 / scope 有關
- AI 輸出可能造成誤導，例如把未確認資料寫成已確認事實

## 不需要記錄

- 不需要逐字貼完整對話
- 不需要記錄每一次小型 autocomplete
- 不需要記錄單純修 typo 或格式化

## 紀錄格式

| 時間       | 階段       | 任務                                   | AI / Agent 建議                                                                                                  | 採用 / 拒絕 | 人類判斷理由                                                                     | 相關檔案 / commit                                                                                                                                                        |
| ---------- | ---------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-07-09 | Phase 0    | 在工作台加入有效資訊分類與草稿編輯     | 建議讓每筆資訊可被標記為有效 / 待確認 / 無效，並搭配候選類型與人工確認備註                                       | 採用        | 這樣能更清楚區分「是否可作為有效資訊」與「是否能直接成為任務」                   | `src/features/phase-0/Phase0Workbench.tsx`, `src/features/phase-0/Phase0JudgementCard.tsx`                                                                               |
| 2026-07-09 | Release 01 | 依 01-interview-kit 產生使用者訪談草稿 | 依回報者、資訊整理者、行動者三個 persona 產生訪談紀錄、彙整與 v1 需求取捨草稿；本次不引用既有 prototype 資料細節 | 部分採用    | 採用角色風險與人工確認提醒；不把 AI 草稿視為最終決策，仍需小隊與人類刪改確認     | `release-packs/01-interview-kit/docs/interview-notes.md`, `release-packs/01-interview-kit/docs/interview-summary.md`, `release-packs/01-interview-kit/docs/decisions.md` |
| 2026-07-09 | Release 01 | 啟用 sub-agent 模擬不同觀點的使用者    | 三個 sub-agent 分別模擬回報者、資訊整理者、行動者；共同指出狀態詞不清、整理得太乾淨、未確認資訊被誤用的風險      | 採用        | 使用者要求啟用 sub-agent；採用具體使用者語氣與衝突需求，但仍保留人類待補欄位     | `release-packs/01-interview-kit/docs/interview-notes.md`, `release-packs/01-interview-kit/docs/interview-summary.md`, `release-packs/01-interview-kit/docs/decisions.md` |
| 2026-07-09 | Phase 0    | 進入整理工作台前加入密碼輸入           | 建議在 `App.tsx` 統一攔截頁籤與原始資訊卡片入口，使用課堂示範密碼 `camp2026`；不使用真實密碼或正式權限控管       | 採用        | 這符合使用者要求，但前端密碼只能作為課堂門檻，不能視為安全機制                   | `src/app/App.tsx`, `src/features/phase-0/Phase0RawInfoPanel.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`, `tests/phase0-workbench.test.tsx`                 |
| 2026-07-09 | Release 01 | 依訪談取捨調整快速回報流程             | 建議改為原始資訊內容、時間、地點或範圍、確認方式必填，並新增備註欄位；來源未提供時仍生成待人工確認提示           | 採用        | 這符合最新要求；畫面只生成缺漏或待確認提示，不補真實事實                         | `src/features/phase-0/Phase0RawInfoPanel.tsx`, `src/components/SourceLabel.tsx`, `src/styles/global.css`, `tests/phase0-workbench.test.tsx`                              |
| 2026-07-09 | Release 01 | 將快速回報的時間與地點改為選取         | 建議把時間改成小時分鐘選擇器，地點或範圍改成課堂用模擬地圖點選；拒絕放入使用者貼上的 Google Maps API key         | 部分採用    | 採用選取式輸入；不採用外部 Google Maps API，避免放入 API key、真實地圖或真實地址 | `src/features/phase-0/Phase0RawInfoPanel.tsx`, `src/styles/global.css`, `tests/phase0-workbench.test.tsx`                                                                |
| 2026-07-09 | Phase 0    | 美化新增原始資訊按鈕                   | 建議把「取消新增」做成次要取消樣式，把「加入清單（待確認）」做成主要行動按鈕並固定在表單底部                     | 採用        | 只調整視覺層級，不改資料狀態或查核邏輯                                           | `src/features/phase-0/Phase0RawInfoPanel.tsx`, `src/styles/global.css`                                                                                                   |
| 2026-07-09 | Phase 0    | 新增明暗模式切換                       | 建議在首頁標題區加入明暗模式切換，使用 CSS 變數管理主要色彩，並用 localStorage 保留使用者選擇                    | 採用        | 這只影響閱讀舒適度與展示體驗，不改變原始資訊、查核狀態或救災判斷                 | `src/app/App.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`                                                                                                   |
| 2026-07-09 | Phase 0    | 在新增原始資訊表單加入 AI 判斷建議     | 建議用本機規則依原始文字推測來源、時間、地點、確認方式與備註；沒有明確時間時不憑空生成時間                       | 採用        | 符合快速填寫需求，但仍保留待人工確認，不呼叫外部 AI 或把推測標成事實             | `src/features/phase-0/Phase0RawInfoPanel.tsx`, `src/styles/global.css`, `tests/phase0-workbench.test.tsx`                                                                |
| 2026-07-09 | Phase 0    | 顯示 AI 自動填入欄位通知               | 建議在 AI 填入後用彈窗列出已填欄位與仍需人工補選欄位，讓使用者知道哪些內容來自推測                               | 採用        | 這能降低使用者誤把 AI 填寫視為已確認的風險，仍不改變資料查核狀態                 | `src/features/phase-0/Phase0RawInfoPanel.tsx`, `src/styles/global.css`, `tests/phase0-workbench.test.tsx`                                                                |
| 2026-07-09 | Phase 0    | 讓新增原始資訊同步到整理工作台         | 建議把新增 records 狀態上移到 `App.tsx`，讓原始資訊清單與整理工作台共用同一份前端狀態                            | 採用        | 符合使用者需求；只做本次瀏覽中的前端同步，不新增後端、資料庫或整理後資料         | `src/app/App.tsx`, `src/features/phase-0/Phase0RawInfoPanel.tsx`, `tests/phase0-workbench.test.tsx`                                                                      |
| 2026-07-09 | Phase 0    | 統一新增原始資訊編號格式               | 建議新增資料時從既有 `M-###` 編號取最大值加一，並用三位數補零，例如 `M-013`                                      | 採用        | 讓新增資料與既有原始資訊編號一致；不改查核狀態、來源判斷或資料內容               | `src/features/phase-0/Phase0RawInfoPanel.tsx`, `tests/phase0-workbench.test.tsx`                                                                                         |
| 2026-07-09 | Phase 0    | 原始資訊卡片點擊顯示詳細資訊           | 建議讓原始資訊卡片可點擊開啟彈窗，顯示編號、原文、來源、查核狀態、更新時間與待補提示                             | 採用        | 這能讓使用者檢視當前資訊框內容；只呈現既有原始資訊，不新增查核結論               | `src/features/phase-0/Phase0RawInfoPanel.tsx`, `src/styles/global.css`, `tests/phase0-workbench.test.tsx`                                                                |

## 範例

| 時間  | 階段    | 任務         | AI / Agent 建議                        | 採用 / 拒絕 | 人類判斷理由                              | 相關檔案 / commit             |
| ----- | ------- | ------------ | -------------------------------------- | ----------- | ----------------------------------------- | ----------------------------- |
| 09:45 | Phase 0 | 分析原始資訊 | 建議把社群貼文直接轉成 verified report | 拒絕        | 社群貼文來源未確認，應保持 `needs_review` | `docs/phase0-observations.md` |

## 課後反思

### AI 幫助最大的地方

-

### AI 最容易誤導的地方

-

### 下次使用 AI 開發前，我們會先準備

-
