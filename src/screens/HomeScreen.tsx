import { ChapterPicker } from "../components/ChapterPicker";
import { CoverageChart, type CoverageRow } from "../components/CoverageChart";
import { GeoMark } from "../components/GeoMark";
import { ProvincePicker } from "../components/ProvincePicker";
import { StatRail } from "../components/StatRail";
import { delay } from "../lib/css";
import { MOCK_DURATION_SECONDS, MOCK_QUESTION_COUNT, PASS_SCORE } from "../lib/exam";
import type { Province, ProvinceId } from "../lib/provinces";
import type { ProgressStore } from "../types";

type Props = {
  province: Province;
  questionCount: number;
  coverage: CoverageRow[];
  chapterCounts: Record<string, number>;
  practiceChapter: string | "all";
  progress: ProgressStore;
  onProvinceChange: (id: ProvinceId) => void;
  onPracticeChapterChange: (value: string | "all") => void;
  onStartMock: () => void;
  onStartPractice: () => void;
};

export function HomeScreen({
  province,
  questionCount,
  coverage,
  chapterCounts,
  practiceChapter,
  progress,
  onProvinceChange,
  onPracticeChapterChange,
  onStartMock,
  onStartPractice,
}: Props) {
  const minutes = Math.round(MOCK_DURATION_SECONDS / 60);

  return (
    <main className="main home">
      <section className="poster">
        <div className="poster-copy">
          <p className="eyebrow poster-eyebrow wipe">{province.name} · Discover Canada</p>
          <h1 className="poster-title display">
            <span className="poster-line wipe" style={delay(70)}>
              Citizenship
            </span>
            <span className="poster-line wipe" style={delay(160)}>
              Mock
            </span>
            <span className="poster-line wipe" style={delay(250)}>
              Test
            </span>
          </h1>
          <p className="poster-lede rise" style={delay(390)}>
            <strong>{questionCount} questions</strong> drawn from the official Discover Canada
            study guide, including capital and region items for {province.capital}. A mock exam is{" "}
            {MOCK_QUESTION_COUNT} questions in {minutes} minutes — {PASS_SCORE} correct to pass.
          </p>
        </div>

        <GeoMark />
      </section>

      <StatRail
        stats={[
          { value: questionCount, label: "Questions in scope" },
          { value: coverage.length, label: "Chapters" },
          { value: MOCK_QUESTION_COUNT, label: "Per mock exam" },
          { value: minutes, label: "Minutes allowed" },
        ]}
      />

      <ProvincePicker value={province.id} onChange={onProvinceChange} />

      <section className="modes">
        <article className="mode mode--mock">
          <span className="mode-ghost num outline-type" aria-hidden="true">
            {MOCK_QUESTION_COUNT}
          </span>
          <p className="eyebrow">Timed</p>
          <h2>Mock exam</h2>
          <p>
            A {MOCK_QUESTION_COUNT}-question set mixed across chapters, with at least one{" "}
            {province.shortLabel} capital or regions question. Submits automatically at 0:00.
          </p>
          <button type="button" className="btn btn--marigold" onClick={onStartMock}>
            Start mock exam
          </button>
          {progress.lastMockScore !== null && (
            <p className="mode-note num">
              Last: {progress.lastMockScore}/{MOCK_QUESTION_COUNT} ·{" "}
              {progress.lastMockPassed ? "passed" : "not passed"}
            </p>
          )}
        </article>

        <article className="mode mode--practice">
          <p className="eyebrow">Untimed</p>
          <h2>Practice by chapter</h2>
          <p>The answer and its source explanation, revealed as soon as you commit.</p>
          <ChapterPicker
            value={practiceChapter}
            onChange={onPracticeChapterChange}
            counts={chapterCounts}
          />
          <button type="button" className="btn btn--primary" onClick={onStartPractice}>
            Start practice
          </button>
          {progress.practiceAnswered > 0 && (
            <p className="mode-note num muted">
              {progress.practiceAnswered} answers recorded
            </p>
          )}
        </article>
      </section>

      <CoverageChart rows={coverage} />

      <aside className="disclaimer">
        <strong>Unofficial study aid.</strong> Only IRCC’s Discover Canada guide is authoritative.
        Third-party tests and questions are not official. Source:{" "}
        <a
          href="https://www.canada.ca/en/immigration-refugees-citizenship/corporate/publications-manuals/discover-canada/read-online.html"
          target="_blank"
          rel="noreferrer"
        >
          Discover Canada (Canada.ca)
        </a>
        .
      </aside>
    </main>
  );
}
