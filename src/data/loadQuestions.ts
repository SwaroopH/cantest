import questionsData from "../../data/questions.json";
import type { Question } from "../types";

export const questions = questionsData as Question[];

export function getQuestions(): Question[] {
  return questions;
}
