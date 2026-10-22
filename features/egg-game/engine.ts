// 계란 받기 게임 규칙. 화면과 분리된 순수 로직이라 시간(ms)을 직접 넣어 검증할 수 있다.

export const LANE_KEYS = ["z", "x", "c", "v", "b", "n"] as const;
// 왼쪽 바깥 → 왼쪽 중앙 쪽 → 오른쪽 중앙 쪽 → 오른쪽 바깥. 중앙에 가까울수록 길다.
export const LANE_TURNS = [4, 5, 6, 6, 5, 4] as const;

export const MAX_BROKEN = 5;
const BASE_INTERVAL_MS = 3000;
const SPEEDUP_EVERY_MS = 10_000;
const SPEEDUP_RATE = 1.2;
const MIN_INTERVAL_MS = 1000 / 3;
// 한 바퀴 1초라 통로 길이(4~6초)가 도착 간격(3초)보다 길어서, 여러 통로에 계란이 함께 굴러간다.
const BASE_TURN_MS = 1000;
const MIN_TURN_MS = 150;
export const BREAK_EFFECT_MS = 700;

export type GameStatus = "ready" | "playing" | "over";

export type Egg = {
  id: number;
  lane: number;
  spawnAt: number;
  arriveAt: number;
};

export type BrokenEffect = { id: number; lane: number; at: number };

export type GameState = {
  status: GameStatus;
  now: number;
  catcherLane: number;
  caught: number;
  broken: number;
  eggs: Egg[];
  effects: BrokenEffect[];
  nextArrivalAt: number;
  nextId: number;
};

export function createGame(): GameState {
  return {
    status: "ready",
    now: 0,
    catcherLane: 0,
    caught: 0,
    broken: 0,
    eggs: [],
    effects: [],
    // 첫 계란은 가장 짧은 통로를 처음부터 굴러 내려올 시간이 지나야 도착한다.
    nextArrivalAt: Math.min(...LANE_TURNS) * BASE_TURN_MS,
    nextId: 1,
  };
}

export function startGame(): GameState {
  return { ...createGame(), status: "playing" };
}

function speedFactor(at: number) {
  return Math.pow(SPEEDUP_RATE, Math.floor(at / SPEEDUP_EVERY_MS));
}

/** 처음 10초는 3초 간격, 이후 10초마다 20%씩 빨라지고 1초에 3개에서 멈춘다. */
export function arrivalInterval(at: number) {
  return Math.max(BASE_INTERVAL_MS / speedFactor(at), MIN_INTERVAL_MS);
}

/** 한 바퀴 구르는 시간. 도착 간격과 같은 비율로 빨라진다. */
export function turnDuration(at: number) {
  return Math.max(BASE_TURN_MS / speedFactor(at), MIN_TURN_MS);
}

export function moveCatcher(state: GameState, lane: number): GameState {
  if (state.status !== "playing" || lane < 0 || lane >= LANE_TURNS.length) {
    return state;
  }
  return { ...state, catcherLane: lane };
}

/**
 * 시간을 now까지 진행한다. 도착 시각을 먼저 정하고 통로 길이만큼 거꾸로 계산해
 * 출발시키므로 통로마다 바퀴 수가 달라도 계란이 동시에 도착하지 않는다.
 */
export function advance(
  state: GameState,
  now: number,
  random: () => number = Math.random
): GameState {
  if (state.status !== "playing") return state;

  const eggs = [...state.eggs];
  let { nextArrivalAt, nextId } = state;
  const maxTravel = Math.max(...LANE_TURNS) * BASE_TURN_MS;

  while (nextArrivalAt - now <= maxTravel) {
    // 아직 굴러가는 계란이 없는 통로에서 고른다. 모두 차 있으면 아무 통로나 쓴다.
    // 출발 시각이 지금보다 앞서면 통로 중간에서 나타나므로, 제때 출발할 수 있는 통로만 쓴다.
    const busy = new Set(eggs.filter((e) => e.arriveAt > now).map((e) => e.lane));
    const fits = LANE_TURNS.map((_, lane) => lane).filter(
      (lane) => LANE_TURNS[lane] * turnDuration(nextArrivalAt) <= nextArrivalAt - now
    );
    const free = fits.filter((lane) => !busy.has(lane));
    // 탭이 가려져 프레임이 멈췄다 돌아오면 맞는 통로가 없을 수 있어 그때는 아무 통로나 쓴다.
    const choices = free.length > 0 ? free : fits.length > 0 ? fits : LANE_TURNS.map((_, lane) => lane);
    const lane = choices[Math.floor(random() * choices.length)];
    const travel = LANE_TURNS[lane] * turnDuration(nextArrivalAt);
    eggs.push({
      id: nextId++,
      lane,
      spawnAt: nextArrivalAt - travel,
      arriveAt: nextArrivalAt,
    });
    nextArrivalAt += arrivalInterval(nextArrivalAt);
  }

  let { caught, broken } = state;
  let status: GameStatus = state.status;
  const effects = state.effects.filter((e) => now - e.at < BREAK_EFFECT_MS);
  const remaining: Egg[] = [];

  for (const egg of eggs.sort((a, b) => a.arriveAt - b.arriveAt)) {
    if (egg.arriveAt > now || status === "over") {
      remaining.push(egg);
      continue;
    }
    if (egg.lane === state.catcherLane) {
      caught++;
    } else {
      broken++;
      effects.push({ id: egg.id, lane: egg.lane, at: egg.arriveAt });
      if (broken >= MAX_BROKEN) status = "over";
    }
  }

  return {
    ...state,
    now,
    status,
    caught,
    broken,
    eggs: status === "over" ? [] : remaining,
    effects,
    nextArrivalAt,
    nextId,
  };
}

/** 통로 위 진행률(0~1)과 지금까지 구른 바퀴 수. 아직 출발 전이면 null. */
export function eggProgress(egg: Egg, now: number) {
  if (now < egg.spawnAt) return null;
  const progress = Math.min((now - egg.spawnAt) / (egg.arriveAt - egg.spawnAt), 1);
  return { progress, turns: progress * LANE_TURNS[egg.lane] };
}
