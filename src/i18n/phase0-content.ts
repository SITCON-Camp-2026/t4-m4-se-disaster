import type { Language } from "./language";

const rawTextTranslations: Record<string, string> = {
  "光復車站後方有人說需要十幾個人清泥，地址只有老雜貨店後面。":
    "Someone said that more than a dozen people are needed to clear mud behind Guangfu Station, but the only address given is behind the old grocery store.",
  "溪畔活動中心早上還有雨鞋，但不知道下午還有沒有。":
    "Xipan Activity Center still had rain boots this morning, but it is unknown whether any remain in the afternoon.",
  "老街口那邊已不缺鏟子，現在比較需要水電。原本那張單可能沒更新。":
    "They said shovels are no longer needed around the old street entrance; plumbing and electrical support is needed more now. The original sheet may not have been updated.",
  "有人在群組說溪畔活動中心還有很多雨鞋，叫大家直接過去拿。":
    "Someone in the group said Xipan Activity Center still has many rain boots and told everyone to go directly to pick them up.",
  "截圖寫『中午前道路封閉』，但不知道截圖是哪一天，也不知道是不是官方公告。":
    'The screenshot says "road closed before noon," but it is unknown which day the screenshot is from or whether it is an official notice.',
  "有人回報學校側門可以當集合點，另一位志工說那裡剛剛淹水不適合停留。":
    "Someone reported that the school side gate could be used as a gathering point, but another volunteer said it had just flooded and was not suitable for staying.",
  "社群貼文說某工班可以支援水電，但留言有人說那是昨天的名單，今天沒空。":
    "A social post says a certain work crew can support plumbing and electrical repairs, but a comment says that was yesterday's list and they are unavailable today.",
  "現場回報『A 區先不要再派人』，但沒有說是人太多、道路危險，還是任務已完成。":
    'Field report: "Do not send more people to Area A for now," but it does not say whether there are too many people, the road is dangerous, or the task is complete.',
  "14:20 現場志工在光復車站東側出口回報：臨時集合點目前仍開放，但只接受已完成報到的清淤志工；一般物資請不要送到此處。回報者說入口公告貼在站前遮雨棚，尚未看到官方公告同步更新。":
    "At 14:20, an on-site volunteer at the east exit of Guangfu Station reported that the temporary gathering point is still open, but only accepts mud-clearing volunteers who have completed check-in. Please do not send general supplies there. The reporter said the entrance notice is posted under the rain shelter in front of the station, but they have not yet seen an official notice updated in sync.",
  "【溪畔活動中心現場更新｜14:35】值守志工確認：雨鞋約剩 12 雙，尺寸多為 26-28；飲用水暫時不缺；不再收二手衣物。若要登記水電檢修需求，請改到大進路口服務台。下一次現場盤點預計 16:30。":
    "Xipan Activity Center field update | 14:35. On-duty volunteers confirmed that about 12 pairs of rain boots remain, mostly sizes 26-28; drinking water is not currently short; second-hand clothes are no longer accepted. To register plumbing or electrical repair needs, go to the Dajin intersection service desk. The next field inventory is expected at 16:30.",
  "現場志工代一位不方便使用手機的長者轉述：住家泥水已退，但需要協助搬動大型家具。志工只知道位置在大進路口往溪邊方向第二排住家，尚未確認長者是否同意公開完整地址。":
    "An on-site volunteer relayed on behalf of an older resident who cannot conveniently use a phone: mudwater at the home has receded, but help is needed moving large furniture. The volunteer only knows the location is the second row of homes from Dajin intersection toward the riverside, and has not confirmed whether the older resident agrees to disclose a full address.",
  "外地家屬來電表示親友住在光復老街附近，疑似需要藥品協助，但家屬不在現場，也無法確認親友目前位置。來電者希望有人協助確認狀況，但不確定是否應建立任務。":
    "An out-of-town family member called to say their relative lives near Guangfu Old Street and may need medicine assistance, but the family member is not on site and cannot confirm the relative's current location. The caller hopes someone can help check the situation, but is unsure whether a task should be created.",
  新加入的原始資訊: "Newly added raw information",
  同步到整理工作台的原始資訊: "Raw information synced to the review workbench",
  尚未完成必填欄位的狀況描述:
    "Situation description with required fields still incomplete",
  填完必填欄位的狀況描述:
    "Situation description after required fields were completed",
  "LINE 群組轉傳：15:20 活動中心附近有人說需要補物資。":
    "LINE group forward: at 15:20, someone near the activity center said supplies need to be replenished.",
  "新增的快速回報內容。": "New quick report content.",
};

const sourceTypeLabels: Record<string, string> = {
  social_post: "Social post",
  volunteer_update: "Volunteer update",
  field_report: "Field report",
  official_notice: "Official notice",
  phone_call: "Phone call",
  quick_report: "Quick report",
  社群轉錄: "Social transcript",
  現場回報: "Field report",
  官方公告: "Official announcement",
};

const verificationStatusLabels: Record<string, string> = {
  needs_review: "Needs human review",
  unverified: "Unreviewed",
  verified: "Verified",
  confirmed: "Confirmed",
};

const phase0TextTranslations: Record<string, string> = {
  "這不是已確認資訊，不能直接當成事實或任務依據。":
    "This is not confirmed information and cannot be used directly as fact or task evidence.",
  "這是快速回報或來源待補資訊，欄位完整性仍需人工確認。":
    "This is a quick report or source-missing item, so field completeness still needs human review.",
  "內容帶有轉述、推測或不確定性，不能直接相信。":
    "The content includes relayed information, inference, or uncertainty, so it cannot be trusted directly.",
  "資訊涉及地點、隱私或當事人位置，需再確認。":
    "The information involves location, privacy, or a person's whereabouts and needs further confirmation.",
  "資訊內容存在衝突或缺少足夠上下文。":
    "The information conflicts internally or lacks enough context.",
  "目前沒有足夠證據支撐直接採用。":
    "There is not enough evidence to adopt this directly yet.",
  "這筆資訊目前仍屬未查核的傳聞或現場說法，不能直接視為有效資訊。":
    "This item is still an unreviewed rumor or field statement and cannot be treated directly as valid information.",
  "這筆資訊有可觀察的線索，但仍需要人工確認，才能判斷是否可作為有效資訊。":
    "This item contains observable clues, but human review is still needed before deciding whether it can be valid information.",
};

export function translateRawText(rawText: string, language: Language) {
  if (language === "zh-TW") {
    return rawText;
  }

  return rawTextTranslations[rawText] ?? rawText;
}

export function hasRawTextTranslation(rawText: string, language: Language) {
  return language === "en" && rawTextTranslations[rawText] !== undefined;
}

export function translatePhase0Text(text: string, language: Language) {
  if (language === "zh-TW") {
    return text;
  }

  if (text.startsWith("來源類型：")) {
    const sourceType = text.replace("來源類型：", "");
    return `Source type: ${sourceTypeLabels[sourceType] ?? sourceType}`;
  }

  if (text.startsWith("查核狀態：")) {
    const status = text.replace("查核狀態：", "");
    return `Review status: ${verificationStatusLabels[status] ?? status}`;
  }

  if (text.startsWith("原文內容：")) {
    const rawText = text.replace("原文內容：", "");
    return `Raw information content: ${translateRawText(rawText, language)}`;
  }

  return phase0TextTranslations[text] ?? text;
}
