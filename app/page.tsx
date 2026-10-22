import { EggGame } from "@/features/egg-game";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <EggGame />
    </main>
  );
}
