import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { getLessonIfUnlocked } from "@/lib/access";
import LessonViewer from "@/components/LessonViewer";

export async function generateMetadata({ params }) {
  const { lesson } = await getLessonIfUnlocked(params.id);
  return { title: lesson ? `${lesson.title} — Resonance Studios` : "Lesson" };
}

export default async function LessonPage({ params }) {
  const { lesson, module, siblings, completed, error } =
    await getLessonIfUnlocked(params.id);

  if (error) {
    return <LessonBlocked reason={error} />;
  }

  return (
    <LessonViewer
      lesson={lesson}
      module={module}
      siblings={siblings}
      completed={completed}
    />
  );
}

/** Friendly gate for locked / missing lessons. */
function LessonBlocked({ reason }) {
  const copy = {
    locked: {
      title: "This lesson is still locked",
      body: "Keep practicing — it will unlock as you progress through the course, or when your teacher grants early access.",
    },
    not_found: {
      title: "Lesson not found",
      body: "This lesson may have been moved or removed.",
    },
    unauthenticated: {
      title: "Please sign in",
      body: "You need to be signed in to view lessons.",
    },
  }[reason] || { title: "Unavailable", body: "Please try again later." };

  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-cream-200 text-indigo-400">
        <Lock size={26} />
      </span>
      <h1 className="font-display text-2xl text-indigo-900">{copy.title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-indigo-500">{copy.body}</p>
      <Link href="/dashboard" className="btn-primary mt-6">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>
    </div>
  );
}
