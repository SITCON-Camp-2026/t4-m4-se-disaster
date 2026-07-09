import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "../src/app/App";
import messyReports from "../src/fixtures/phase-0/messy-reports.json";
import { Phase0RawInfoPanel } from "../src/features/phase-0/Phase0RawInfoPanel";
import { Phase0Workbench } from "../src/features/phase-0/Phase0Workbench";

function enterWorkbenchPassword() {
  fireEvent.change(screen.getByLabelText("密碼"), {
    target: { value: "camp2026" },
  });
  fireEvent.click(screen.getByRole("button", { name: "確認進入" }));
}

describe("Phase0Workbench draft editor", () => {
  it("adds a new raw record from the raw info panel", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /新增原始資訊/i }));
    fireEvent.change(screen.getByLabelText(/原始資訊內容/i), {
      target: { value: "新加入的原始資訊" },
    });
    fireEvent.change(screen.getByLabelText(/來源類型/i), {
      target: { value: "現場回報" },
    });
    fireEvent.change(screen.getByLabelText(/時間/i), {
      target: { value: "09:30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "活動中心" }));
    fireEvent.change(screen.getByLabelText(/確認方式/i), {
      target: { value: "親眼看到" },
    });
    fireEvent.click(screen.getByRole("button", { name: /加入清單/i }));

    expect(screen.getByText(/新加入的原始資訊/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "M-013" })).toBeInTheDocument();
  });

  it("syncs a new raw record into the workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /新增原始資訊/i }));
    fireEvent.change(screen.getByLabelText(/原始資訊內容/i), {
      target: { value: "同步到整理工作台的原始資訊" },
    });
    fireEvent.change(screen.getByLabelText(/來源類型/i), {
      target: { value: "現場回報" },
    });
    fireEvent.change(screen.getByLabelText(/時間/i), {
      target: { value: "10:45" },
    });
    fireEvent.click(screen.getByRole("button", { name: "B 區" }));
    fireEvent.change(screen.getByLabelText(/確認方式/i), {
      target: { value: "親眼看到" },
    });
    fireEvent.click(screen.getByRole("button", { name: /加入清單/i }));

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));
    enterWorkbenchPassword();

    expect(screen.getByText("同步到整理工作台的原始資訊")).toBeInTheDocument();
    expect(screen.getAllByText("M-013").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Starter 已載入 13 筆原始資訊"),
    ).toBeInTheDocument();
  });

  it("opens raw record details when clicking an info card", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "查看 M-001 詳細資訊" }),
    );

    const dialog = screen.getByRole("dialog", { name: "M-001" });
    expect(dialog).toHaveTextContent("原始資訊詳細資訊");
    expect(dialog).toHaveTextContent("光復車站後方有人說需要十幾個人清泥");
    expect(dialog).toHaveTextContent("來源：社群轉錄");
    expect(dialog).toHaveTextContent("更新：2026/7/20 09:10");

    fireEvent.click(
      within(dialog).getByRole("button", { name: "複製詳細摘要" }),
    );

    expect(await screen.findByText("已複製詳細摘要。")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("原始資訊 M-001"),
    );
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("光復車站後方有人說需要十幾個人清泥"),
    );

    fireEvent.click(dialog);

    expect(screen.getByRole("dialog", { name: "M-001" })).toBeInTheDocument();

    fireEvent.click(dialog.parentElement as HTMLElement);

    expect(
      screen.queryByRole("dialog", { name: "M-001" }),
    ).not.toBeInTheDocument();
  });

  it("opens a small surprise from the raw information header", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "打開小驚喜" }));

    const dialog = screen.getByRole("dialog", { name: "被找到了！" });
    expect(dialog).toHaveTextContent("小彩蛋");
    expect(
      within(dialog).getByRole("img", { name: "吃餅乾的皮卡丘插圖" }),
    ).toBeInTheDocument();
    expect(dialog).toHaveTextContent("不會修改任何資料");

    fireEvent.click(within(dialog).getByRole("button", { name: "收起來" }));

    expect(
      screen.queryByRole("dialog", { name: "被找到了！" }),
    ).not.toBeInTheDocument();
  });

  it("requires raw text before adding a raw record", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /新增原始資訊/i }));
    fireEvent.click(screen.getByRole("button", { name: /加入清單/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "請先填寫原始資訊內容，才能加入清單。",
    );
    expect(screen.queryByText("系統生成待補提示")).not.toBeInTheDocument();
    expect(screen.queryByText("13 筆資料")).not.toBeInTheDocument();
  });

  it("adds incomplete raw records and marks missing fields for review", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /新增原始資訊/i }));
    fireEvent.change(screen.getByLabelText(/原始資訊內容/i), {
      target: { value: "尚未完成必填欄位的狀況描述" },
    });
    fireEvent.click(screen.getByRole("button", { name: /加入清單/i }));

    expect(screen.getByText("尚未完成必填欄位的狀況描述")).toBeInTheDocument();
    expect(screen.getByText("系統生成待補提示")).toBeInTheDocument();
    expect(
      screen.getByText("這筆快速回報先收入清單，但仍是不完整原始資訊。"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("資訊取得方式未提供，待人工確認。"),
    ).toBeInTheDocument();
    expect(screen.getByText("時間未提供，待人工確認。")).toBeInTheDocument();
    expect(
      screen.getByText("地點或範圍未提供，待人工確認。"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("確認方式未提供，待人工確認。"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("流程判斷：欄位不足，標示為不完整與待人工確認。"),
    ).toBeInTheDocument();
    expect(screen.getByText("13 筆資料")).toBeInTheDocument();
  });

  it("adds required quick report details and keeps the record review-needed", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /新增原始資訊/i }));
    fireEvent.change(screen.getByLabelText(/原始資訊內容/i), {
      target: { value: "填完必填欄位的狀況描述" },
    });
    fireEvent.change(screen.getByLabelText(/時間/i), {
      target: { value: "15:20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "活動中心" }));
    fireEvent.change(screen.getByLabelText(/確認方式/i), {
      target: { value: "聽別人說" },
    });
    fireEvent.change(screen.getByLabelText("備註"), {
      target: { value: "需要整理者再追問來源細節" },
    });
    fireEvent.click(screen.getByRole("button", { name: /加入清單/i }));

    expect(screen.getByText(/填完必填欄位的狀況描述/i)).toBeInTheDocument();
    expect(screen.getByText("系統生成待補提示")).toBeInTheDocument();
    expect(screen.getByText("時間：15:20")).toBeInTheDocument();
    expect(screen.getByText("地點或範圍：活動中心")).toBeInTheDocument();
    expect(screen.getByText("確認方式：聽別人說")).toBeInTheDocument();
    expect(
      screen.getByText("備註：需要整理者再追問來源細節"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("資訊取得方式未提供，待人工確認。"),
    ).toBeInTheDocument();
    expect(screen.getByText("來源：快速回報（來源待補）")).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", { name: "查看 M-013 詳細資訊" }),
    );

    const dialog = screen.getByRole("dialog", { name: "M-013" });
    expect(dialog).toHaveTextContent("新增時取得的所有欄位");
    expect(dialog).toHaveTextContent("原始資訊內容");
    expect(dialog).toHaveTextContent("填完必填欄位的狀況描述");
    expect(within(dialog).getAllByText("資訊取得方式").length).toBeGreaterThan(
      0,
    );
    expect(dialog).toHaveTextContent("未提供（待人工確認）");
    expect(within(dialog).getByText("時間")).toBeInTheDocument();
    expect(dialog).toHaveTextContent("15:20");
    expect(within(dialog).getAllByText("地點或範圍").length).toBeGreaterThan(0);
    expect(dialog).toHaveTextContent("活動中心");
    expect(within(dialog).getAllByText("確認方式").length).toBeGreaterThan(0);
    expect(dialog).toHaveTextContent("聽別人說");
    expect(within(dialog).getByText("備註")).toBeInTheDocument();
    expect(dialog).toHaveTextContent("需要整理者再追問來源細節");
  });

  it("uses AI judgement to fill quick report suggestions from raw text", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /新增原始資訊/i }));
    fireEvent.change(screen.getByLabelText(/原始資訊內容/i), {
      target: {
        value: "LINE 群組轉傳：15:20 活動中心附近有人說需要補物資。",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "AI 判斷並填入" }));

    const notification = screen.getByRole("dialog", {
      name: "AI 已填入欄位",
    });
    expect(notification).toHaveTextContent("來源類型：社群轉錄");
    expect(notification).toHaveTextContent("時間：15:20");
    expect(notification).toHaveTextContent("地點或範圍：活動中心");
    expect(notification).toHaveTextContent("確認方式：聽別人說");
    expect(notification).toHaveTextContent("備註：AI 判斷建議與待確認提醒");

    expect(screen.getByLabelText(/來源類型/i)).toHaveValue("社群轉錄");
    expect(screen.getByLabelText(/時間/i)).toHaveValue("15:20");
    expect(screen.getByRole("button", { name: "活動中心" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText(/確認方式/i)).toHaveValue("聽別人說");

    const noteField = screen.getByLabelText("備註") as HTMLTextAreaElement;
    expect(noteField.value).toContain("AI 判斷建議（需人工確認）");
    expect(noteField.value).toContain("來源建議：社群轉錄");

    fireEvent.click(screen.getByRole("button", { name: "知道了" }));
    fireEvent.click(screen.getByRole("button", { name: /加入清單/i }));

    expect(screen.getByText(/LINE 群組轉傳/)).toBeInTheDocument();
    expect(screen.getByText("資訊取得方式：社群轉錄")).toBeInTheDocument();
    expect(screen.getByText("時間：15:20")).toBeInTheDocument();
    expect(screen.getByText("地點或範圍：活動中心")).toBeInTheDocument();
    expect(screen.getByText("確認方式：聽別人說")).toBeInTheDocument();
  });

  it("asks for raw text before running AI judgement", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /新增原始資訊/i }));
    fireEvent.click(screen.getByRole("button", { name: "AI 判斷並填入" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "請先輸入原始資訊內容，再使用 AI 判斷建議。",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not invent a time when AI judgement cannot find one", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /新增原始資訊/i }));
    fireEvent.change(screen.getByLabelText(/原始資訊內容/i), {
      target: {
        value: "現場回報：學校附近可能需要再確認，但沒有說明時間。",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "AI 判斷並填入" }));

    const notification = screen.getByRole("dialog", {
      name: "AI 已填入欄位",
    });
    expect(notification).toHaveTextContent("地點或範圍：學校周邊");
    expect(notification).toHaveTextContent("確認方式：不確定");
    expect(notification).toHaveTextContent("仍需人工補選");
    expect(notification).toHaveTextContent(
      "時間：AI 未看出明確時間，請人工選擇。",
    );

    expect(screen.getByLabelText(/來源類型/i)).toHaveValue("現場回報");
    expect(screen.getByLabelText(/時間/i)).toHaveValue("");
    expect(screen.getByRole("button", { name: "學校周邊" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText(/確認方式/i)).toHaveValue("不確定");

    const noteField = screen.getByLabelText("備註") as HTMLTextAreaElement;
    expect(noteField.value).toContain("未從文字看出明確時間");
  });

  it("shows a completed status in the raw info list after finishing a draft", () => {
    render(
      <Phase0Workbench
        records={messyReports}
        selectedRecordId={messyReports[0].id}
        onSelect={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /完成整理/i }));

    expect(screen.getAllByText("已完成整理").length).toBeGreaterThan(0);
  });

  it("appends a completion note to the raw info card without replacing the review status", () => {
    render(
      <Phase0RawInfoPanel
        records={messyReports}
        selectedRecordId={messyReports[0].id}
        onSelect={() => undefined}
        onAddRecord={() => undefined}
        completedRecordIds={[messyReports[0].id]}
      />,
    );

    expect(screen.getByText("需要人工確認")).toBeInTheDocument();
    expect(screen.getByText("已完成整理")).toBeInTheDocument();
  });

  it("keeps the original review status text in the workbench queue when a draft is completed", () => {
    render(
      <Phase0Workbench
        records={messyReports}
        selectedRecordId={messyReports[0].id}
        onSelect={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /完成整理/i }));

    const completedButton = screen.getByRole("button", { name: /M-001/i });
    expect(completedButton).toHaveTextContent("待人工確認");
    expect(completedButton).toHaveTextContent("已完成整理");
  });

  it("removes the completion note from the raw info panel when resetting a draft", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));
    enterWorkbenchPassword();
    fireEvent.click(screen.getByRole("button", { name: /完成整理/i }));
    fireEvent.click(screen.getByRole("button", { name: /原始資訊/i }));

    expect(screen.getByText("已完成整理")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));
    enterWorkbenchPassword();
    fireEvent.click(screen.getByRole("button", { name: /重設為初始建議/i }));
    fireEvent.click(screen.getByRole("button", { name: /原始資訊/i }));

    expect(screen.queryByText("已完成整理")).not.toBeInTheDocument();
  });

  it("requires the password when sending a record to the workbench", () => {
    render(<App />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /送到整理工作台/i })[0],
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /輸入整理工作台密碼/i }),
    ).toBeInTheDocument();

    enterWorkbenchPassword();

    expect(screen.getByText(/目前選中的原始資訊/i)).toBeInTheDocument();
  });

  it("creates and edits a draft for the selected record", () => {
    render(
      <Phase0Workbench
        records={messyReports}
        selectedRecordId={messyReports[0].id}
        onSelect={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /建立草稿/i }));

    expect(screen.getByText(/草稿已建立/i)).toBeInTheDocument();

    const kindSelect = screen.getByLabelText(/候選類型/i);
    fireEvent.change(kindSelect, {
      target: { value: "help_request_candidate" },
    });

    expect(kindSelect).toHaveValue("help_request_candidate");
  });
});
