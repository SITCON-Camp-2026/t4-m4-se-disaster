import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

// ponytail: this is a safety-boundary scaffold, not an answer engine.
export function createPhase0Judgement(
  record: Phase0MessyRecord,
): Phase0JudgementDraft {
  const isVerified = record.verificationStatus === "verified";
  const rawText = record.rawText;
  const evidence = [
    `來源類型：${record.sourceType}`,
    `查核狀態：${record.verificationStatus}`,
    `原文內容：${rawText}`,
  ];

  const blockers: string[] = [];

  if (!isVerified) {
    blockers.push("這不是已確認資訊，不能直接當成事實或任務依據。");
  }

  if (record.sourceType === "quick_report") {
    blockers.push("這是快速回報或來源待補資訊，欄位完整性仍需人工確認。");
  }

  if (
    /有人說|有人在群組|社群|疑似|不知道|尚未|可能|似乎|只知道/.test(rawText)
  ) {
    blockers.push("內容帶有轉述、推測或不確定性，不能直接相信。");
  }

  if (/地址|位置|住家|長者|親友|完整地址|集合點/.test(rawText)) {
    blockers.push("資訊涉及地點、隱私或當事人位置，需再確認。");
  }

  if (/不確定|不知道|尚未|衝突|互相/.test(rawText)) {
    blockers.push("資訊內容存在衝突或缺少足夠上下文。");
  }

  const suggestedNextStep = isVerified
    ? "keep_raw"
    : record.sourceType === "quick_report" ||
        rawText.includes("不知道") ||
        rawText.includes("尚未")
      ? "ask_for_more_info"
      : record.id === "M-010"
        ? "create_site_update_suggestion"
        : "send_to_human_review";

  return {
    messyRecordId: record.id,
    possibleKind: "unknown",
    confidence: "low",
    evidence,
    blockers:
      blockers.length > 0 ? blockers : ["目前沒有足夠證據支撐直接採用。"],
    suggestedNextStep,
    unsafeToActDirectly: true,
    isValidInformation: "uncertain",
    classificationReason:
      record.verificationStatus === "unverified"
        ? "這筆資訊目前仍屬未查核的傳聞或現場說法，不能直接視為有效資訊。"
        : "這筆資訊有可觀察的線索，但仍需要人工確認，才能判斷是否可作為有效資訊。",
    reviewNotes: "",
    isCompleted: false,
  };
}
