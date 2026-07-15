import { listCompanies, listTasks } from "@/lib/db";
import { createTask } from "@/app/actions";
import { AddPanel, Badge, CompanyDot, EmptyState, Field, PageHeader, SubmitButton } from "@/components/ui";
import { FilterBar } from "@/components/FilterBar";
import { StatusSelect } from "@/components/StatusSelect";
import { DeleteButton } from "@/components/DeleteButton";
import { fmtDate, PRIORITIES, TASK_AREAS, TASK_STATUS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ firma?: string }> }) {
  const { firma } = await searchParams;
  const companyId = firma ? Number(firma) : undefined;
  const companies = listCompanies();
  const tasks = listTasks(companyId);
  const today = new Date().toISOString().slice(0, 10);

  const open = tasks.filter((t) => t.status !== "Erledigt");
  const done = tasks.filter((t) => t.status === "Erledigt");

  return (
    <div>
      <PageHeader
        title="Aufgaben"
        sub="Operative To-dos über alle Unternehmen — aus Audits, Playbooks und Monats-Workflows."
      />
      <FilterBar companies={companies} current={companyId} basePath="/aufgaben" />

      {open.length === 0 ? (
        <EmptyState text="Keine offenen Aufgaben." />
      ) : (
        <div className="card divide-y divide-[color:var(--line)]">
          {open.map((t) => {
            const overdue = t.due_date != null && t.due_date < today;
            return (
              <div key={t.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm md:flex-nowrap">
                {t.color_slot != null && <CompanyDot slot={t.color_slot} />}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{t.title}</div>
                  {t.notes && (
                    <div className="truncate text-xs text-muted" title={t.notes}>
                      {t.notes}
                    </div>
                  )}
                </div>
                <Badge>{t.area}</Badge>
                {t.priority === "Hoch" && <Badge tone="warn">! Hoch</Badge>}
                <span className={`w-20 shrink-0 text-right text-xs ${overdue ? "font-medium text-bad" : "text-muted"}`}>
                  {overdue ? "⚠ " : ""}
                  {fmtDate(t.due_date)}
                </span>
                <StatusSelect kind="task" id={t.id} value={t.status} options={TASK_STATUS} />
                <DeleteButton kind="task" id={t.id} label={t.title} />
              </div>
            );
          })}
        </div>
      )}

      {done.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted">Erledigt ({done.length}) anzeigen</summary>
          <div className="card mt-2 divide-y divide-[color:var(--line)]">
            {done.map((t) => (
              <div key={t.id} className="flex items-center gap-2 px-4 py-2 text-sm text-muted">
                {t.color_slot != null && <CompanyDot slot={t.color_slot} />}
                <span className="min-w-0 flex-1 truncate line-through">{t.title}</span>
                <StatusSelect kind="task" id={t.id} value={t.status} options={TASK_STATUS} />
                <DeleteButton kind="task" id={t.id} label={t.title} />
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="mt-4">
        <AddPanel label="Aufgabe anlegen">
          <form action={createTask} className="grid gap-3 md:grid-cols-3">
            <Field label="Aufgabe *">
              <input name="title" required placeholder="z. B. GBP-Kategorien prüfen" />
            </Field>
            <Field label="Unternehmen">
              <select name="company_id" defaultValue={companyId ?? ""}>
                <option value="">— Agentur-intern —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bereich">
              <select name="area">
                {TASK_AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field label="Fällig am">
              <input name="due_date" type="date" />
            </Field>
            <Field label="Priorität">
              <select name="priority" defaultValue="Mittel">
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Notizen">
              <input name="notes" />
            </Field>
            <div className="flex items-end md:col-span-3">
              <SubmitButton>Aufgabe anlegen</SubmitButton>
            </div>
          </form>
        </AddPanel>
      </div>
    </div>
  );
}
