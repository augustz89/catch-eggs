import { describe, expect, test } from "vitest";

import {
  MAX_BROKEN,
  advance,
  arrivalInterval,
  moveCatcher,
  startGame,
  type GameState,
} from "./engine";

// 항상 같은 통로(0번, Z)로 계란을 보낸다.
const laneZero = () => 0;

function runUntil(state: GameState, until: number, step = 16) {
  let next = state;
  for (let t = next.now; t < until && next.status === "playing"; t += step) {
    next = advance(next, t, laneZero);
  }
  return advance(next, until, laneZero);
}

describe("도착 간격", () => {
  test("처음 10초는 3초, 이후 10초마다 20%씩 빨라지고 1초에 3개에서 멈춘다", () => {
    expect(arrivalInterval(0)).toBe(3000);
    expect(arrivalInterval(9_999)).toBe(3000);
    expect(arrivalInterval(10_000)).toBeCloseTo(2500);
    expect(arrivalInterval(20_000)).toBeCloseTo(3000 / 1.44);
    expect(arrivalInterval(600_000)).toBeCloseTo(1000 / 3);
  });
});

describe("계란 판정", () => {
  test("받는 사람이 통로에 있으면 받은 계란이 늘어난다", () => {
    const state = runUntil(startGame(), 4000);
    expect(state.caught).toBe(1);
    expect(state.broken).toBe(0);
  });

  test("받는 사람이 없으면 깨진 계란이 늘어난다", () => {
    const state = runUntil(moveCatcher(startGame(), 3), 4000);
    expect(state.caught).toBe(0);
    expect(state.broken).toBe(1);
    expect(state.effects).toHaveLength(1);
  });

  test("깨진 계란이 5개가 되면 게임이 끝난다", () => {
    const state = runUntil(moveCatcher(startGame(), 3), 60_000);
    expect(state.broken).toBe(MAX_BROKEN);
    expect(state.status).toBe("over");
  });
});

describe("계란 배치", () => {
  // 매 프레임 진행하며 계란이 도착한 시각과, 함께 굴러가는 통로 수의 최댓값을 모은다.
  function simulate(until: number) {
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let state = startGame();
    const landedAt: number[] = [];
    let maxRollingLanes = 0;
    for (let t = 0; t <= until; t += 16) {
      const before = state.caught + state.broken;
      state = advance(state, t, random);
      if (state.caught + state.broken > before) landedAt.push(t);
      const rolling = state.eggs.filter((e) => e.spawnAt <= t);
      maxRollingLanes = Math.max(maxRollingLanes, new Set(rolling.map((e) => e.lane)).size);
      for (const egg of rolling) expect(egg.spawnAt).toBeGreaterThanOrEqual(0);
    }
    return { landedAt, maxRollingLanes };
  }

  test("첫 계란은 4초에, 이후 처음 10초 동안은 3초 간격으로 따로 도착한다", () => {
    const { landedAt } = simulate(10_000);
    expect(landedAt.map((t) => Math.round(t / 100) * 100)).toEqual([4000, 7000, 10_000]);
  });

  test("두 군데 이상의 통로에서 계란이 시간차를 두고 함께 굴러간다", () => {
    const { maxRollingLanes } = simulate(20_000);
    expect(maxRollingLanes).toBeGreaterThanOrEqual(2);
  });
});
