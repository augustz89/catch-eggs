import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "@/app/page";

test("홈 화면은 계란 받기 게임과 시작 버튼을 보여준다", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: "계란 받기" })
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "시작하기" })).toBeInTheDocument();
});
