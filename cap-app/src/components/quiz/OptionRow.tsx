"use client";

import type { ExamOption } from "@/lib/types";

export type OptionVisualState =
  | "idle"
  | "selected"
  | "correct"
  | "wrong"
  | "disabled-idle";

interface OptionRowProps {
  option: ExamOption;
  state: OptionVisualState;
  onSelect?: () => void;
}

export default function OptionRow({ option, state, onSelect }: OptionRowProps) {
  const classes = ["option-row"];
  if (state === "selected") classes.push("selected");
  if (state === "correct") classes.push("correct", "disabled");
  if (state === "wrong") classes.push("wrong", "disabled");
  if (state === "disabled-idle") classes.push("disabled");

  const clickable = state === "idle" || state === "selected";

  return (
    <div
      className={classes.join(" ")}
      data-id={option.id}
      onClick={clickable ? onSelect : undefined}
      role={clickable ? "button" : undefined}
    >
      <div className="option-letter">{option.id.toUpperCase()}</div>
      <div className="option-text">{option.text}</div>
    </div>
  );
}
