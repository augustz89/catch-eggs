"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import { CoopBackground, NEST_WIDTH, NestBox } from "./coop-art";
import {
  BREAK_EFFECT_MS,
  LANE_KEYS,
  MAX_BROKEN,
  advance,
  createGame,
  eggProgress,
  moveCatcher,
  startGame,
  type GameState,
} from "./engine";

const WIDTH = 640;
const HEIGHT = 420;
const LANE_END_Y = 300;
const FLOOR_Y = 345;
const NEST_EXIT_X = NEST_WIDTH + 4;

// 왼쪽 통로: 바깥(짧음) → 중앙 쪽(김). 각 통로는 산란장 출구에서 시작한다. 오른쪽은 좌우 대칭.
const LEFT_LANES = [
  { start: { x: NEST_EXIT_X, y: 180 }, end: { x: 110, y: LANE_END_Y } },
  { start: { x: NEST_EXIT_X, y: 125 }, end: { x: 200, y: LANE_END_Y } },
  { start: { x: NEST_EXIT_X, y: 70 }, end: { x: 290, y: LANE_END_Y } },
];
const LANES = [
  ...LEFT_LANES,
  ...[...LEFT_LANES].reverse().map(({ start, end }) => ({
    start: { x: WIDTH - start.x, y: start.y },
    end: { x: WIDTH - end.x, y: end.y },
  })),
];

function lanePoint(lane: number, progress: number) {
  const { start, end } = LANES[lane];
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
  };
}

export function EggGame() {
  const [game, setGame] = useState<GameState>(createGame);
  const gameRef = useRef(game);
  const startedAt = useRef(0);

  const update = useCallback((next: GameState) => {
    gameRef.current = next;
    setGame(next);
  }, []);

  const start = useCallback(() => {
    startedAt.current = performance.now();
    update(startGame());
  }, [update]);

  useEffect(() => {
    if (game.status !== "playing") return;
    let frame = requestAnimationFrame(function tick(time) {
      update(advance(gameRef.current, time - startedAt.current));
      if (gameRef.current.status === "playing") frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [game.status, update]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const lane = LANE_KEYS.indexOf(event.key.toLowerCase() as (typeof LANE_KEYS)[number]);
      if (lane >= 0) {
        update(moveCatcher(gameRef.current, lane));
      } else if (event.key === "Enter" && gameRef.current.status !== "playing") {
        start();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [start, update]);

  const catcherX = LANES[game.catcherLane].end.x;

  // 계란이 깨진 통로의 암탉만, 깨짐 효과가 보이는 동안 놀란다.
  function startledAge(lane: number) {
    const effect = game.effects.findLast((e) => e.lane === lane);
    return effect ? Math.min((game.now - effect.at) / BREAK_EFFECT_MS, 1) : null;
  }

  return (
    <section className="flex w-full max-w-3xl flex-col gap-4" data-status={game.status} data-testid="egg-game">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">계란 받기</h1>
        <dl className="flex gap-6 text-lg">
          <div className="flex gap-2">
            <dt className="text-muted-foreground">받은 계란</dt>
            <dd className="font-semibold tabular-nums" data-testid="caught">{game.caught}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">깨진 계란</dt>
            <dd className="font-semibold tabular-nums text-destructive" data-testid="broken">
              {game.broken} / {MAX_BROKEN}
            </dd>
          </div>
        </dl>
      </header>

      <div className="relative overflow-hidden rounded-xl border">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block w-full" role="img" aria-label="계란 통로와 계란 받는 사람">
          <CoopBackground width={WIDTH} height={HEIGHT} floorY={FLOOR_Y} />

          {LANES.map(({ start, end }, lane) => (
            <g key={lane}>
              <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#6f4426" strokeWidth={14} strokeLinecap="round" />
              <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#b07a4a" strokeWidth={8} strokeLinecap="round" />
              <NestBox x={start.x} y={start.y} side={lane < 3 ? "left" : "right"} startled={startledAge(lane)} />
              <text x={end.x} y={HEIGHT - 12} textAnchor="middle" fill="#5c3a1e" className="text-[18px] font-semibold uppercase">
                {LANE_KEYS[lane]}
              </text>
            </g>
          ))}

          {game.eggs.map((egg) => {
            const pos = eggProgress(egg, game.now);
            if (!pos) return null;
            const { x, y } = lanePoint(egg.lane, pos.progress);
            return (
              <g key={egg.id} data-egg-lane={egg.lane} data-arrive-at={egg.arriveAt} transform={`translate(${x} ${y - 14}) rotate(${pos.turns * 360})`}>
                <ellipse rx={10} ry={13} fill="#fffaf0" stroke="#8d6e63" strokeWidth={2} />
                <ellipse cx={-3} cy={-5} rx={3} ry={4} fill="#ffffff" />
              </g>
            );
          })}

          {game.effects.map((effect) => {
            const age = Math.min((game.now - effect.at) / BREAK_EFFECT_MS, 1);
            const x = LANES[effect.lane].end.x;
            return (
              <g key={effect.id} opacity={1 - age} transform={`translate(${x} ${FLOOR_Y + 22})`} data-testid="broken-effect">
                <ellipse rx={16 + age * 8} ry={6} fill="#fffaf0" stroke="#8d6e63" strokeWidth={1.5} />
                <circle r={6} fill="#f4a261" />
                <path d="M -14 -4 l 5 -9 l 4 7 l 5 -10 l 4 9 l 6 -6" fill="none" stroke="#8d6e63" strokeWidth={2} transform={`translate(0 ${-age * 10})`} />
              </g>
            );
          })}

          <g transform={`translate(${catcherX} ${LANE_END_Y + 22})`} data-testid="catcher" data-lane={game.catcherLane}>
            <circle cy={-6} r={12} fill="#ffd6a5" stroke="#6d4c41" strokeWidth={2} />
            <rect x={-12} y={8} width={24} height={34} rx={8} fill="#4f6d7a" />
            <path d="M -26 8 Q 0 30 26 8 Z" fill="#c8a165" stroke="#6d4c41" strokeWidth={2} />
          </g>
        </svg>

        {game.status !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 text-center" role="dialog" aria-label={game.status === "over" ? "게임 종료" : "게임 시작"}>
            {game.status === "over" ? (
              <>
                <p className="font-heading text-3xl font-semibold">게임 종료</p>
                <p className="text-lg text-muted-foreground">받은 계란 {game.caught}개 · 깨진 계란 {game.broken}개</p>
                <Button size="lg" onClick={start}>다시 하기</Button>
              </>
            ) : (
              <>
                <p className="text-lg text-muted-foreground">Z X C V B N 키로 통로를 옮겨 계란을 받아요</p>
                <Button size="lg" onClick={start}>시작하기</Button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
