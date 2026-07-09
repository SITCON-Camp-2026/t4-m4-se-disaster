import { useState } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import type {
  Phase0InformationValidity,
  Phase0JudgementDraft,
  Phase0MessyRecord,
} from "./phase0-types";

const kindLabels: Record<Phase0JudgementDraft["possibleKind"], string> = {
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "任務候選",
  assignment_candidate: "人員指派候選",
  announcement_candidate: "公告候選",
  unknown: "候選類型待判斷",
};

const confidenceLabels: Record<Phase0JudgementDraft["confidence"], string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const nextStepLabels: Record<
  Phase0JudgementDraft["suggestedNextStep"],
  string
> = {
  keep_raw: "先保留原始資訊",
  ask_for_more_info: "補問來源或現場資訊",
  send_to_human_review: "交給人工確認",
  create_candidate_report: "建立候選通報",
  create_site_update_suggestion: "建立地點更新建議",
  do_not_use_yet: "暫時不要使用",
};

const validityLabels: Record<Phase0InformationValidity, string> = {
  valid: "有效資訊",
  uncertain: "待確認",
  invalid: "無效資訊",
};

export function Phase0JudgementCard({
  judgement,
  record,
  onChange,
}: {
  judgement: Phase0JudgementDraft;
  record: Phase0MessyRecord;
  onChange: (updates: Partial<Phase0JudgementDraft>) => void;
}) {
  const [customReasonInput, setCustomReasonInput] = useState("");
  const [isCustomReasonSelected, setIsCustomReasonSelected] = useState(false);
  const selectedReasonValue = isCustomReasonSelected
    ? "其他"
    : judgement.classificationReason;

  const handleReasonChange = (value: string) => {
    if (value === "其他") {
      setIsCustomReasonSelected(true);
      setCustomReasonInput("");
      onChange({ classificationReason: "其他" });
      return;
    }

    setIsCustomReasonSelected(false);
    setCustomReasonInput("");
    onChange({ classificationReason: value });
  };

  const handleCustomReasonChange = (value: string) => {
    setCustomReasonInput(value);
    onChange({ classificationReason: value });
  };

  const displayReason = isCustomReasonSelected
    ? customReasonInput || "請填寫其他理由"
    : judgement.classificationReason ||
      "請在上方填寫為什麼這筆資訊應該被分類為這一類。";

  return (
    <article className="judgement-card">
      <div className="judgement-card__header">
        <div>
          <p className="eyebrow">整理草稿</p>
          <h3>判斷這筆資訊是否可作為有效資訊</h3>
        </div>
        <div className="judgement-card__header__meta">
          <StatusBadge status={record.verificationStatus} />
          {judgement.isCompleted ? (
            <span className="status-badge status-fulfilled">已完成整理</span>
          ) : null}
        </div>
      </div>

      <p>
        這張卡不是標準答案，而是讓你把「不能直接相信」「不能直接變成任務」「需要人工確認」的理由寫出來。
      </p>

      <section className="judgement-summary-grid" aria-label="分類摘要">
        <div className="judgement-summary-card">
          <span className="judgement-summary-card__label">有效性</span>
          <strong>{validityLabels[judgement.isValidInformation]}</strong>
        </div>
        <div className="judgement-summary-card">
          <span className="judgement-summary-card__label">不能直接相信</span>
          <strong>{judgement.unsafeToActDirectly ? "是" : "否"}</strong>
        </div>
        <div className="judgement-summary-card">
          <span className="judgement-summary-card__label">
            不能直接變成任務
          </span>
          <strong>
            {judgement.suggestedNextStep === "send_to_human_review" ||
            judgement.suggestedNextStep === "ask_for_more_info"
              ? "是"
              : "否"}
          </strong>
        </div>
      </section>

      <form className="judgement-form">
        <label htmlFor={`kind-${record.id}`}>
          候選類型
          <select
            id={`kind-${record.id}`}
            value={judgement.possibleKind}
            onChange={(event) =>
              onChange({
                possibleKind: event.target
                  .value as Phase0JudgementDraft["possibleKind"],
              })
            }
          >
            <option value="unknown">候選類型待判斷</option>
            <option value="help_request_candidate">求助候選</option>
            <option value="site_status_candidate">地點狀態候選</option>
            <option value="task_candidate">任務候選</option>
            <option value="assignment_candidate">人員指派候選</option>
            <option value="announcement_candidate">公告候選</option>
          </select>
        </label>

        <label htmlFor={`validity-${record.id}`}>
          是否為有效資訊
          <select
            id={`validity-${record.id}`}
            value={judgement.isValidInformation}
            onChange={(event) =>
              onChange({
                isValidInformation: event.target
                  .value as Phase0InformationValidity,
              })
            }
          >
            <option value="uncertain">待確認</option>
            <option value="valid">有效資訊</option>
            <option value="invalid">無效資訊</option>
          </select>
        </label>

        <label htmlFor={`reason-${record.id}`}>
          分類理由
          <select
            id={`reason-${record.id}`}
            value={selectedReasonValue}
            onChange={(event) => handleReasonChange(event.target.value)}
          >
            <option value="">請選擇</option>
            <option value="來源與時序不明">來源與時序不明</option>
            <option value="內容互相衝突">內容互相衝突</option>
            <option value="缺少可驗證證據">缺少可驗證證據</option>
            <option value="需要人工確認">需要人工確認</option>
            <option value="暫時不適合直接使用">暫時不適合直接使用</option>
            <option value="其他">其他</option>
          </select>
        </label>

        {isCustomReasonSelected ? (
          <label htmlFor={`reason-other-${record.id}`}>
            其他理由
            <input
              id={`reason-other-${record.id}`}
              type="text"
              value={customReasonInput}
              onChange={(event) => handleCustomReasonChange(event.target.value)}
              placeholder="請填寫其他理由"
            />
          </label>
        ) : null}

        <label htmlFor={`review-${record.id}`}>
          人工確認備註
          <textarea
            id={`review-${record.id}`}
            value={judgement.reviewNotes}
            onChange={(event) => onChange({ reviewNotes: event.target.value })}
            rows={3}
          />
        </label>
      </form>

      <dl className="judgement-summary">
        <div>
          <dt>候選類型</dt>
          <dd>{kindLabels[judgement.possibleKind]}</dd>
        </div>
        <div>
          <dt>信心程度</dt>
          <dd>{confidenceLabels[judgement.confidence]}</dd>
        </div>
        <div>
          <dt>下一步</dt>
          <dd>{nextStepLabels[judgement.suggestedNextStep]}</dd>
        </div>
      </dl>

      <section className="judgement-section">
        <h4>分類理由</h4>
        <p>{displayReason}</p>
      </section>

      <section className="judgement-section">
        <h4>人工確認備註</h4>
        <p>{judgement.reviewNotes || "若需要人類再確認，請在這裡寫下提醒。"}</p>
      </section>

      <section>
        <h4>目前只有安全預設</h4>
        <ul>
          {judgement.evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h4>目前卡住的地方</h4>
        <ul>
          {judgement.blockers.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
