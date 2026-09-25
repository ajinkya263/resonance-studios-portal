"use client";

import { interactiveKey } from "@/components/interactive/keys";
import TeentaalTrainer from "@/components/interactive/TeentaalTrainer";
import TablaAnatomy from "@/components/interactive/TablaAnatomy";
import BolLesson from "@/components/interactive/BolLesson";
import MatchingQuiz from "@/components/interactive/MatchingQuiz";

/**
 * Turn a lesson's media_url into the interactive React element, or null.
 * Supported keys:
 *   teentaal-trainer
 *   anatomy
 *   bol:<slug>          (ta, tin, ge, ka, kat, dha, dhin, tete, tu)
 */
export function renderInteractive(mediaUrl) {
  const key = interactiveKey(mediaUrl);
  if (!key) return null;
  if (key === "teentaal-trainer") return <TeentaalTrainer />;
  if (key === "anatomy") return <TablaAnatomy />;
  if (key.startsWith("bol:")) return <BolLesson slug={key.slice(4)} />;
  if (key.startsWith("quiz:")) return <MatchingQuiz quiz={key.slice(5)} />;
  return null;
}
