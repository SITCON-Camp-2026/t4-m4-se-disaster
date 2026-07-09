import type { Language } from "../i18n/language";

export const statusLabels: Record<Language, Record<string, string>> = {
  "zh-TW": {
    unverified: "未查核",
    needs_review: "待人工確認",
    verified: "已確認",
    rejected: "已拒絕",
    unknown: "未知",
    reported_open: "有人回報開放",
    reported_closed: "有人回報關閉",
    verified_open: "確認開放",
    verified_closed: "確認關閉",
    draft: "草稿",
    open: "可處理",
    matching: "媒合中",
    assigned: "已指派",
    fulfilled: "已完成",
    cancelled: "已取消",
    requested: "請求中",
    confirmed: "已確認承接",
    completed: "已完成",
  },
  en: {
    unverified: "Unverified",
    needs_review: "Needs human review",
    verified: "Verified",
    rejected: "Rejected",
    unknown: "Unknown",
    reported_open: "Reported open",
    reported_closed: "Reported closed",
    verified_open: "Verified open",
    verified_closed: "Verified closed",
    draft: "Draft",
    open: "Actionable",
    matching: "Matching",
    assigned: "Assigned",
    fulfilled: "Fulfilled",
    cancelled: "Cancelled",
    requested: "Requested",
    confirmed: "Confirmed",
    completed: "Completed",
  },
};

export function labelForStatus(
  status: string,
  language: Language = "zh-TW",
): string {
  return statusLabels[language][status] ?? status;
}
