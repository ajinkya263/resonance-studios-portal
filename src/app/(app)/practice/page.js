import TanpuraPlayer from "@/components/practice/TanpuraPlayer";
import LehraPlayer from "@/components/practice/LehraPlayer";
import Reveal from "@/components/Reveal";

export const metadata = { title: "Practice Tools — Resonance Studios" };

export default function PracticePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-saffron-100 px-3 py-1 text-xs font-semibold text-saffron-600">
          Riyaz tools
        </p>
        <h1 className="font-display text-3xl text-indigo-900 md:text-4xl">
          Practice Studio
        </h1>
        <p className="mt-2 max-w-2xl text-indigo-500">
          A tanpura drone to hold your sur and a Teentaal lehra to practice
          against — both generated live in your browser. Pick your key and play.
        </p>
        <div className="gold-rule mt-3" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <TanpuraPlayer />
        </Reveal>
        <Reveal delay={100}>
          <LehraPlayer />
        </Reveal>
      </div>

      <p className="mt-6 text-center text-xs text-indigo-400">
        Tip: run the tanpura and lehra together for a full practice backing.
        Headphones recommended.
      </p>
    </div>
  );
}
