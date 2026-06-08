"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
};

export function ChipInput({ value, onChange, placeholder, suggestions }: Props) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
  };
  const remove = (v: string) => onChange(value.filter((t) => t !== v));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
      setDraft("");
    } else if (e.key === "Backspace" && !draft && value.length) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) {
              add(draft);
              setDraft("");
            }
          }}
          placeholder={placeholder}
          className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {suggestions
            .filter((s) => !value.includes(s))
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="rounded-full border border-dashed border-input px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
