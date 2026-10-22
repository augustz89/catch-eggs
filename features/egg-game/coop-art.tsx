// 닭장 배경과 산란장(둥지 상자 + 암탉) 임시 그림. 게임 판과 같은 SVG 좌표계를 쓴다.

export const NEST_WIDTH = 74;
const NEST_HEIGHT = 50;

export function CoopBackground({ width, height, floorY }: { width: number; height: number; floorY: number }) {
  const planks = Array.from({ length: Math.ceil(width / 40) }, (_, i) => i * 40);
  return (
    <g aria-hidden>
      {/* 나무 벽 */}
      <rect width={width} height={height} fill="#e9c99a" />
      {planks.map((x, i) => (
        <rect key={x} x={x} width={40} height={floorY} fill={i % 2 ? "#e3bf8c" : "#ecd0a5"} stroke="#c89b6a" strokeWidth={1} />
      ))}
      {/* 지붕 들보 */}
      <rect width={width} height={18} fill="#8d5a34" />
      <rect y={18} width={width} height={4} fill="#6f4426" />
      {/* 창문 */}
      <g transform={`translate(${width / 2 - 45} 44)`}>
        <rect width={90} height={64} rx={4} fill="#bfe3f2" stroke="#8d5a34" strokeWidth={6} />
        <circle cx={66} cy={20} r={10} fill="#ffe08a" />
        <path d="M 0 52 Q 25 38 45 50 T 90 46 V 64 H 0 Z" fill="#9ccc8a" />
        <line x1={45} y1={0} x2={45} y2={64} stroke="#8d5a34" strokeWidth={4} />
        <line x1={0} y1={32} x2={90} y2={32} stroke="#8d5a34" strokeWidth={4} />
      </g>
      {/* 짚이 깔린 바닥 */}
      <rect y={floorY} width={width} height={height - floorY} fill="#e6c36a" />
      <rect y={floorY} width={width} height={4} fill="#b8913f" />
      {Array.from({ length: 40 }, (_, i) => {
        const x = (i * 53) % width;
        const y = floorY + 10 + ((i * 29) % (height - floorY - 14));
        return <path key={i} d={`M ${x} ${y} l 14 -4 M ${x + 4} ${y + 3} l 10 2`} stroke="#c9a24a" strokeWidth={2} strokeLinecap="round" />;
      })}
    </g>
  );
}

/** startled: 놀란 지 지난 비율(0~1). null이면 평소처럼 앉아 있다. */
function Hen({ flip, startled }: { flip: boolean; startled: number | null }) {
  const scared = startled !== null;
  // 놀라면 펄쩍 뛰었다 내려앉으며 부르르 떤다.
  const jump = scared ? Math.sin(Math.PI * startled) * 12 : 0;
  const shake = scared ? Math.sin(startled * 60) * 2 * (1 - startled) : 0;
  return (
    <g transform={`${flip ? "scale(-1 1) " : ""}translate(${shake} ${-jump})`} data-hen-startled={scared || undefined}>
      {/* 꼬리 */}
      <path d="M -24 -10 q -10 -14 -2 -22 q 4 10 10 14 Z" fill="#f2efe8" stroke="#8a7f70" strokeWidth={1.5} />
      {/* 놀라서 펼친 날개 */}
      {scared && (
        <>
          <path d="M -6 -16 q -16 -22 -30 -18 q 10 8 12 20 Z" fill="#fbf8f2" stroke="#8a7f70" strokeWidth={1.5} />
          <path d="M 6 -16 q 4 -24 -6 -32 q -4 12 -8 26 Z" fill="#f2efe8" stroke="#8a7f70" strokeWidth={1.5} />
        </>
      )}
      {/* 몸통 */}
      <ellipse cx={0} cy={-8} rx={24} ry={16} fill="#fbf8f2" stroke="#8a7f70" strokeWidth={1.5} />
      {!scared && <path d="M -12 -10 q 10 10 22 0" fill="none" stroke="#c9c1b4" strokeWidth={2} />}
      {/* 머리, 볏, 부리, 눈 */}
      <circle cx={18} cy={-26} r={10} fill="#fbf8f2" stroke="#8a7f70" strokeWidth={1.5} />
      <path d="M 12 -35 q 2 -7 5 -2 q 2 -7 5 -1 q 3 -5 4 2 Z" fill="#e63946" />
      {scared ? (
        <>
          {/* 벌린 부리와 동그랗게 뜬 눈 */}
          <path d="M 27 -29 l 9 -2 l -9 4 Z M 27 -25 l 9 3 l -9 0 Z" fill="#f4a261" />
          <circle cx={21} cy={-28} r={4} fill="#ffffff" stroke="#3d2b1f" strokeWidth={1} />
          <circle cx={22} cy={-28} r={1.6} fill="#3d2b1f" />
          {/* 깜짝 표시 */}
          <text x={flip ? -30 : 30} y={-42} transform={flip ? "scale(-1 1)" : undefined} textAnchor="middle" fill="#e63946" fontSize={18} fontWeight={800}>!</text>
        </>
      ) : (
        <>
          <path d="M 27 -27 l 8 3 l -8 3 Z" fill="#f4a261" />
          <circle cx={21} cy={-28} r={1.8} fill="#3d2b1f" />
        </>
      )}
      <path d="M 22 -20 q 2 6 -1 8 q -3 -3 -1 -8 Z" fill="#e63946" />
    </g>
  );
}

/** 놀란 닭에서 날리는 깃털 두어 개. */
function Feathers({ startled }: { startled: number }) {
  return (
    <g opacity={1 - startled}>
      {[-14, 4, 18].map((dx, i) => (
        <ellipse
          key={dx}
          cx={dx + startled * (i - 1) * 14}
          cy={-30 - startled * 18 + i * 4}
          rx={4}
          ry={1.6}
          transform={`rotate(${30 + i * 50 + startled * 120} ${dx} -30)`}
          fill="#fbf8f2"
          stroke="#8a7f70"
          strokeWidth={0.8}
        />
      ))}
    </g>
  );
}

/**
 * 나무 둥지 상자 안에 짚을 깔고 암탉이 앉아 있는 산란장 한 칸. (x, y)는 계란이 나오는 출구.
 * startled가 있으면 이 칸의 암탉이 화들짝 놀란다.
 */
export function NestBox({
  x,
  y,
  side,
  startled = null,
}: {
  x: number;
  y: number;
  side: "left" | "right";
  startled?: number | null;
}) {
  const flip = side === "right";
  const left = flip ? x : x - NEST_WIDTH;
  return (
    <g aria-hidden>
      <rect x={left} y={y - NEST_HEIGHT + 10} width={NEST_WIDTH} height={NEST_HEIGHT} fill="#7a4a2a" />
      <rect x={left + 4} y={y - NEST_HEIGHT + 14} width={NEST_WIDTH - 8} height={NEST_HEIGHT - 8} fill="#4a2c18" />
      <g transform={`translate(${left + NEST_WIDTH / 2} ${y + 2})`}>
        <Hen flip={flip} startled={startled} />
      </g>
      {/* 짚 둥지 */}
      <path d={`M ${left + 4} ${y + 4} q ${NEST_WIDTH / 2 - 4} -12 ${NEST_WIDTH - 8} 0 v 6 h -${NEST_WIDTH - 8} Z`} fill="#e6c36a" stroke="#b8913f" strokeWidth={1.5} />
      <rect x={left} y={y + 8} width={NEST_WIDTH} height={6} fill="#8d5a34" />
      {startled !== null && (
        <g transform={`translate(${left + NEST_WIDTH / 2} ${y + 2})`}>
          <Feathers startled={startled} />
        </g>
      )}
    </g>
  );
}
