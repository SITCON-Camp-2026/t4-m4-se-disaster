import type { Language } from "../i18n/language";

const sourceLabels: Record<Language, Record<string, string>> = {
  "zh-TW": {
    field_report: "現場回報",
    phone_call: "電話",
    social_post: "社群轉錄",
    official_notice: "官方公告",
    volunteer_update: "志工更新",
    quick_report: "快速回報（來源待補）",
    mock: "模擬資料",
    社群轉錄: "社群轉錄",
    現場回報: "現場回報",
    官方公告: "官方公告",
    車站周邊: "車站周邊",
    活動中心: "活動中心",
    老街周邊: "老街周邊",
    學校周邊: "學校周邊",
    "A 區": "A 區",
    "B 區": "B 區",
    地點不確定: "地點不確定",
    親眼看到: "親眼看到",
    聽別人說: "聽別人說",
    不確定: "不確定",
  },
  en: {
    field_report: "Field report",
    phone_call: "Phone call",
    social_post: "Social repost",
    official_notice: "Official notice",
    volunteer_update: "Volunteer update",
    quick_report: "Quick report (source missing)",
    mock: "Mock data",
    社群轉錄: "Social repost",
    現場回報: "Field report",
    官方公告: "Official notice",
    車站周邊: "Station area",
    活動中心: "Activity center",
    老街周邊: "Old street area",
    學校周邊: "School area",
    "A 區": "Area A",
    "B 區": "Area B",
    地點不確定: "Location uncertain",
    親眼看到: "Saw it in person",
    聽別人說: "Heard from others",
    不確定: "Uncertain",
  },
};

export function labelForSourceType(
  sourceType: string,
  language: Language = "zh-TW",
) {
  return sourceLabels[language][sourceType] ?? sourceType;
}
