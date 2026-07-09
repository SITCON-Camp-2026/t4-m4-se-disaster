import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app/App";
import messyReports from "../src/fixtures/phase-0/messy-reports.json";
import { Phase0RawInfoPanel } from "../src/features/phase-0/Phase0RawInfoPanel";
import { Phase0Workbench } from "../src/features/phase-0/Phase0Workbench";

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
    fireEvent.click(screen.getByRole("button", { name: /加入清單/i }));

    expect(screen.getByText(/新加入的原始資訊/i)).toBeInTheDocument();
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

    expect(screen.getByText("已完成整理")).toBeInTheDocument();
  });

  it("appends a completion note to the raw info card without replacing the review status", () => {
    render(
      <Phase0RawInfoPanel
        records={messyReports}
        selectedRecordId={messyReports[0].id}
        onSelect={() => undefined}
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

    fireEvent.click(screen.getByRole("button", { name: /整理工作台/i }));
    fireEvent.click(screen.getByRole("button", { name: /完成整理/i }));
    fireEvent.click(screen.getByRole("button", { name: /原始資訊/i }));

    expect(screen.getByText("已完成整理")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /整理工作台/i }));
    fireEvent.click(screen.getByRole("button", { name: /重設為初始建議/i }));
    fireEvent.click(screen.getByRole("button", { name: /原始資訊/i }));

    expect(screen.queryByText("已完成整理")).not.toBeInTheDocument();
  });

  it("shows workbench instructions in a modal when sending a record to the workbench", () => {
    render(
      <Phase0RawInfoPanel
        records={messyReports}
        selectedRecordId={messyReports[0].id}
        onSelect={() => undefined}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /送到整理工作台/i })[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /整理工作台使用說明/i }),
    ).toBeInTheDocument();
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
