"use client";

import { useTransition } from "react";
import { setStatus, type ItemKind } from "@/app/actions";

export function StatusSelect({
  kind,
  id,
  value,
  options,
}: {
  kind: ItemKind;
  id: number;
  value: string;
  options: readonly string[];
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={value}
      disabled={pending}
      aria-label="Status ändern"
      className={`text-xs ${pending ? "opacity-50" : ""}`}
      onChange={(e) => {
        const status = e.target.value;
        startTransition(() => setStatus(kind, id, status));
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
