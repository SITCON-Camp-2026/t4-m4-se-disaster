import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../src/app/App";

function enterWorkbenchPassword() {
  fireEvent.change(screen.getByLabelText("密碼"), {
    target: { value: "pika" },
  });
  fireEvent.click(screen.getByRole("button", { name: "確認進入" }));
}

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders starter title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊整理工作台")).toBeInTheDocument();
  });

  it("toggles between light and dark mode", () => {
    render(<App />);

    const darkModeButton = screen.getByRole("button", { name: "深色模式" });
    expect(darkModeButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(darkModeButton);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem("phase0-theme-mode")).toBe("dark");

    const lightModeButton = screen.getByRole("button", { name: "淺色模式" });
    expect(lightModeButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(lightModeButton);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(window.localStorage.getItem("phase0-theme-mode")).toBe("light");
  });

  it("keeps the home page focused on phase 0 tabs", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "原始資訊" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "整理工作台" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "通報" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "地點" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "志工任務" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "人員指派" }),
    ).not.toBeInTheDocument();
  });

  it("shows review states in the phase 0 workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));
    enterWorkbenchPassword();

    expect(
      screen.getByText(
        "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
  });

  it("keeps draft CRUD as learner work instead of starter output", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));
    enterWorkbenchPassword();

    expect(screen.getByText(/草稿已建立/)).toBeInTheDocument();
    expect(
      screen.getByText(/請 agent 加上建立、編輯、刪除或重設整理草稿/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/已產生 \d+ 筆安全邊界草稿/),
    ).not.toBeInTheDocument();
  });

  it("requires the classroom password before entering the workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByRole("heading", { name: "輸入整理工作台密碼" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("密碼"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "確認進入" }));

    expect(screen.getByRole("alert")).toHaveTextContent("密碼不正確");
    expect(
      screen.queryByText(
        "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
      ),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("密碼"), {
      target: { value: "pika" },
    });
    fireEvent.click(screen.getByRole("button", { name: "確認進入" }));

    expect(
      screen.getByText(
        "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
      ),
    ).toBeInTheDocument();
  });
});
