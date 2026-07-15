"use client";

import { useTransition } from "react";
import { removeItem, type ItemKind } from "@/app/actions";

export function DeleteButton({ kind, id, label }: { kind: ItemKind; id: number; label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`${label} löschen`}
      title={`${label} löschen`}
      className="text-muted hover:text-bad disabled:opacity-40"
      onClick={() => {
        if (confirm(`„${label}" wirklich löschen?`)) {
          startTransition(() => removeItem(kind, id));
        }
      }}
    >
      ✕
    </button>
  );
}
