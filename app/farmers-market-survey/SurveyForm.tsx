"use client";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

import { useState, useTransition } from "react";
import { questions, type Question } from "./questions";
import { submitSurvey } from "./actions";

type Answers = Record<string, string | string[]>;

export default function SurveyForm() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [openTexts, setOpenTexts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const visibleQuestions = questions.filter((q) => {
    if (q.id === "wfb_rating") {
      const attendance = answers["wfb_attendance"];
      return attendance === "Yes, this season" || attendance === "Yes, in the past";
    }
    return true;
  });

  const totalSteps = visibleQuestions.length;
  const clampedStep = Math.min(step, totalSteps - 1);
  if (clampedStep !== step) setStep(clampedStep);
  const question = visibleQuestions[clampedStep];
  const progress = ((clampedStep + 1) / totalSteps) * 100;

  function setAnswer(questionId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError(null);
  }

  function setOtherText(questionId: string, value: string) {
    setOtherTexts((prev) => ({ ...prev, [questionId]: value }));
  }

  function setOpenText(questionId: string, value: string) {
    setOpenTexts((prev) => ({ ...prev, [questionId]: value }));
  }

  function validateStep(): boolean {
    const q = visibleQuestions[step];
    const answer = answers[q.id];

    if (q.required) {
      if (q.type === "email") {
        const email = (answer as string) || "";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setError("Please enter a valid email address.");
          return false;
        }
        return true;
      }

      if (q.type === "text") {
        // Text questions marked required need content
        if (!answer || (answer as string).trim() === "") {
          setError("Please provide a response.");
          return false;
        }
        return true;
      }

      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        setError("Please select an option to continue.");
        return false;
      }

      // If "Other" is selected, require the text input
      if (q.hasOther) {
        const isOtherSelected = Array.isArray(answer)
          ? answer.includes("Other")
          : answer === "Other";
        if (isOtherSelected && (!otherTexts[q.id] || otherTexts[q.id].trim() === "")) {
          setError("Please specify your answer for 'Other'.");
          return false;
        }
      }
    }

    return true;
  }

  function handleNext() {
    if (!validateStep()) return;
    if (step < totalSteps - 1) {
      setStep(step + 1);
      setError(null);
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
      setError(null);
    }
  }

  function handleSubmit() {
    if (!validateStep()) return;

    startTransition(async () => {
      // Build final payload
      const payload: Record<string, string> = {};
      for (const q of questions) {
        const answer = answers[q.id];
        if (Array.isArray(answer)) {
          let values = [...answer];
          if (values.includes("Other") && otherTexts[q.id]) {
            values = values.map((v) =>
              v === "Other" ? `Other: ${otherTexts[q.id]}` : v
            );
          }
          payload[q.id] = values.join("; ");
        } else if (answer === "Other" && otherTexts[q.id]) {
          payload[q.id] = `Other: ${otherTexts[q.id]}`;
        } else {
          payload[q.id] = (answer as string) || "";
        }

        if (q.hasOpenText && openTexts[q.id]) {
          payload[`${q.id}_comment`] = openTexts[q.id];
        }
      }

      const result = await submitSurvey(payload);
      if (result.success) {
        if (typeof window !== "undefined" && typeof window.fbq === "function") {
          window.fbq("track", "CompleteRegistration");
        }
        setSubmitted(true);
      } else {
        setError(result.error || "Something went wrong. Please try again.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-survey-cream flex items-center justify-center p-4">
        <div className="bg-survey-card rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-survey-green-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-survey-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-survey-brown mb-2">
            Thank you!
          </h2>
          <p className="text-survey-brown-light">
            Your responses have been recorded. You&apos;re entered in the raffle
            for a $100 Sendik&apos;s gift card. Good luck!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-survey-cream flex flex-col items-center justify-center p-4">
      <div className="bg-survey-card rounded-2xl shadow-lg max-w-lg w-full overflow-hidden">
        {/* Progress bar */}
        <div className="h-2 bg-survey-green-light">
          <div
            className="h-full bg-survey-green transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6 sm:p-8">
          {/* Step counter */}
          <p className="text-sm text-survey-brown-light mb-1">
            Question {step + 1} of {totalSteps}
          </p>

          {/* Question title */}
          <h2 className="text-xl sm:text-2xl font-bold text-survey-brown mb-1 leading-tight">
            {question.title}
          </h2>

          {question.subtitle && (
            <p className="text-sm text-survey-brown-light mb-4 italic">
              {question.subtitle}
            </p>
          )}

          {!question.subtitle && <div className="mb-6" />}

          {/* Question body */}
          <div className="space-y-3 mb-6">
            <QuestionBody
              question={question}
              answer={answers[question.id]}
              otherText={otherTexts[question.id] || ""}
              openText={openTexts[question.id] || ""}
              onAnswer={(val) => setAnswer(question.id, val)}
              onOtherText={(val) => setOtherText(question.id, val)}
              onOpenText={(val) => setOpenText(question.id, val)}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 text-survey-brown-light hover:text-survey-brown font-medium rounded-lg transition-colors cursor-pointer"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-survey-green text-white font-semibold rounded-lg hover:bg-survey-green-mid transition-colors cursor-pointer"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="px-6 py-2.5 bg-survey-gold text-white font-semibold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionBody({
  question,
  answer,
  otherText,
  openText,
  onAnswer,
  onOtherText,
  onOpenText,
}: {
  question: Question;
  answer: string | string[] | undefined;
  otherText: string;
  openText: string;
  onAnswer: (val: string | string[]) => void;
  onOtherText: (val: string) => void;
  onOpenText: (val: string) => void;
}) {
  switch (question.type) {
    case "single-select":
      return (
        <SingleSelect
          question={question}
          value={(answer as string) || ""}
          otherText={otherText}
          onSelect={onAnswer}
          onOtherText={onOtherText}
        />
      );
    case "multi-select":
      return (
        <MultiSelect
          question={question}
          values={(answer as string[]) || []}
          otherText={otherText}
          onSelect={onAnswer}
          onOtherText={onOtherText}
        />
      );
    case "rating":
      return (
        <RatingQuestion
          question={question}
          value={(answer as string) || ""}
          openText={openText}
          onSelect={onAnswer}
          onOpenText={onOpenText}
        />
      );
    case "text":
      return (
        <TextQuestion
          value={(answer as string) || ""}
          onChange={onAnswer}
        />
      );
    case "email":
      return (
        <EmailQuestion
          value={(answer as string) || ""}
          onChange={onAnswer}
        />
      );
  }
}

function SingleSelect({
  question,
  value,
  otherText,
  onSelect,
  onOtherText,
}: {
  question: Question;
  value: string;
  otherText: string;
  onSelect: (val: string) => void;
  onOtherText: (val: string) => void;
}) {
  const allOptions = [
    ...(question.options || []),
    ...(question.hasOther ? ["Other"] : []),
  ];

  return (
    <>
      {allOptions.map((option) => (
        <label
          key={option}
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            value === option
              ? "border-survey-green bg-survey-green-light"
              : "border-survey-border hover:border-survey-green-mid"
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              value === option
                ? "border-survey-green"
                : "border-survey-border"
            }`}
          >
            {value === option && (
              <span className="w-2.5 h-2.5 rounded-full bg-survey-green" />
            )}
          </span>
          <span className="text-survey-brown">{option === "Other" ? "Other (please specify)" : option}</span>
          <input
            type="radio"
            name={question.id}
            value={option}
            checked={value === option}
            onChange={() => onSelect(option)}
            className="sr-only"
          />
        </label>
      ))}
      {value === "Other" && question.hasOther && (
        <input
          type="text"
          value={otherText}
          onChange={(e) => onOtherText(e.target.value)}
          placeholder="Please specify..."
          className="w-full p-3 rounded-lg border border-survey-border focus:border-survey-green focus:outline-none text-survey-brown bg-white"
          autoFocus
        />
      )}
    </>
  );
}

function MultiSelect({
  question,
  values,
  otherText,
  onSelect,
  onOtherText,
}: {
  question: Question;
  values: string[];
  otherText: string;
  onSelect: (val: string[]) => void;
  onOtherText: (val: string) => void;
}) {
  const allOptions = [
    ...(question.options || []),
    ...(question.hasOther ? ["Other"] : []),
  ];

  function toggle(option: string) {
    if (values.includes(option)) {
      onSelect(values.filter((v) => v !== option));
    } else {
      onSelect([...values, option]);
    }
  }

  return (
    <>
      <p className="text-sm text-survey-brown-light -mt-1">Select all that apply</p>
      {allOptions.map((option) => {
        const checked = values.includes(option);
        return (
          <label
            key={option}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              checked
                ? "border-survey-green bg-survey-green-light"
                : "border-survey-border hover:border-survey-green-mid"
            }`}
          >
            <span
              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 ${
                checked
                  ? "border-survey-green bg-survey-green"
                  : "border-survey-border"
              }`}
            >
              {checked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="text-survey-brown">{option === "Other" ? "Other (please specify)" : option}</span>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(option)}
              className="sr-only"
            />
          </label>
        );
      })}
      {values.includes("Other") && question.hasOther && (
        <input
          type="text"
          value={otherText}
          onChange={(e) => onOtherText(e.target.value)}
          placeholder="Please specify..."
          className="w-full p-3 rounded-lg border border-survey-border focus:border-survey-green focus:outline-none text-survey-brown bg-white"
          autoFocus
        />
      )}
    </>
  );
}

function RatingQuestion({
  question,
  value,
  openText,
  onSelect,
  onOpenText,
}: {
  question: Question;
  value: string;
  openText: string;
  onSelect: (val: string) => void;
  onOpenText: (val: string) => void;
}) {
  const numericOptions = (question.options || []).filter((o) => /^\d$/.test(o));
  const textOptions = (question.options || []).filter((o) => !/^\d$/.test(o));

  return (
    <>
      {/* Star-style rating */}
      <div className="flex gap-2 justify-center py-2">
        {numericOptions.map((num) => {
          const selected = value === num;
          const filled = value && /^\d$/.test(value) && parseInt(num) <= parseInt(value);
          return (
            <button
              key={num}
              type="button"
              onClick={() => onSelect(num)}
              className={`w-12 h-12 rounded-full text-lg font-bold transition-colors cursor-pointer ${
                filled
                  ? "bg-survey-gold text-white"
                  : selected
                  ? "bg-survey-gold text-white"
                  : "bg-survey-gold-light text-survey-brown hover:bg-survey-gold hover:text-white"
              }`}
            >
              {num}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-survey-brown-light px-1">
        <span>Poor</span>
        <span>Excellent</span>
      </div>

      {/* Non-numeric option */}
      {textOptions.map((option) => (
        <label
          key={option}
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            value === option
              ? "border-survey-green bg-survey-green-light"
              : "border-survey-border hover:border-survey-green-mid"
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              value === option ? "border-survey-green" : "border-survey-border"
            }`}
          >
            {value === option && (
              <span className="w-2.5 h-2.5 rounded-full bg-survey-green" />
            )}
          </span>
          <span className="text-survey-brown">{option}</span>
          <input
            type="radio"
            name={question.id}
            value={option}
            checked={value === option}
            onChange={() => onSelect(option)}
            className="sr-only"
          />
        </label>
      ))}

      {/* Open text elaboration */}
      {question.hasOpenText && (
        <textarea
          value={openText}
          onChange={(e) => onOpenText(e.target.value)}
          placeholder={question.openTextLabel || "Any additional comments..."}
          rows={3}
          className="w-full p-3 rounded-lg border border-survey-border focus:border-survey-green focus:outline-none text-survey-brown bg-white resize-none"
        />
      )}
    </>
  );
}

function TextQuestion({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer here..."
      rows={4}
      className="w-full p-3 rounded-lg border border-survey-border focus:border-survey-green focus:outline-none text-survey-brown bg-white resize-none"
    />
  );
}

function EmailQuestion({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <form onSubmit={(e) => e.preventDefault()} autoComplete="on">
      <input
        type="email"
        name="email"
        id="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="your@email.com"
        className="w-full p-3 rounded-lg border border-survey-border focus:border-survey-green focus:outline-none text-survey-brown bg-white"
        autoComplete="email"
      />
    </form>
  );
}
