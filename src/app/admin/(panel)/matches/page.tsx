import Link from "next/link";
import { listMatches } from "@/lib/data";
import { formatDateShort } from "@/lib/format";
import { DeleteButton } from "@/components/admin/ui";
import { deleteMatchAction } from "../../actions";
import { Flash } from "@/components/admin/Flash";

export const metadata = { title: "Матчі" };

const SORTS = {
  "date-desc": { label: "Дата: нові спочатку" },
  "date-asc": { label: "Дата: старі спочатку" },
  "opponent-asc": { label: "Суперник: А → Я" },
  "opponent-desc": { label: "Суперник: Я → А" },
} as const;
type Sort = keyof typeof SORTS;

const byOpponent = new Intl.Collator("uk", {
  sensitivity: "base",
  numeric: true,
});

function sortMatches<T extends { opponent: string; startsAt: Date }>(
  rows: T[],
  sort: Sort,
) {
  const byDate = (a: T, b: T) => a.startsAt.getTime() - b.startsAt.getTime();
  const sorted = [...rows];
  switch (sort) {
    case "date-asc":
      return sorted.sort(byDate);
    case "opponent-asc":
      return sorted.sort(
        (a, b) => byOpponent.compare(a.opponent, b.opponent) || byDate(b, a),
      );
    case "opponent-desc":
      return sorted.sort(
        (a, b) => byOpponent.compare(b.opponent, a.opponent) || byDate(b, a),
      );
    default:
      return sorted.sort((a, b) => byDate(b, a));
  }
}

const sortHref = (sort: Sort) =>
  sort === "date-desc" ? "/admin/matches" : `/admin/matches?sort=${sort}`;

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const [rows, params] = await Promise.all([listMatches(), searchParams]);
  const sort: Sort =
    params.sort && params.sort in SORTS ? (params.sort as Sort) : "date-desc";
  const matches = sortMatches(rows, sort);
  // Клік по заголовку колонки: перший — основний порядок, повторний — зворотний
  const dateNext: Sort = sort === "date-desc" ? "date-asc" : "date-desc";
  const opponentNext: Sort =
    sort === "opponent-asc" ? "opponent-desc" : "opponent-asc";
  const arrow = (col: "date" | "opponent") =>
    sort.startsWith(col) ? (sort.endsWith("asc") ? " ↑" : " ↓") : "";
  return (
    <>
      <div className="adm-page-head">
        <h1>Матчі</h1>
        <div className="adm-actions">
          <Link href="/admin/matches/new" className="adm-btn adm-btn-primary">
            + Матч
          </Link>
          <Link
            href="/admin/matches/new?kind=friendly"
            className="adm-btn adm-btn-primary"
          >
            + Товариська гра
          </Link>
        </div>
      </div>
      <Flash params={params} />
      <section className="adm-card">
        {matches.length === 0 ? (
          <p className="adm-empty">Матчів ще немає.</p>
        ) : (
          <>
            <nav className="adm-sort" aria-label="Сортування">
              <span className="adm-sort-label">Сортувати:</span>
              {(Object.keys(SORTS) as Sort[]).map((s) => (
                <Link
                  key={s}
                  href={sortHref(s)}
                  className="adm-btn adm-btn-sm"
                  aria-current={s === sort ? "true" : undefined}
                  scroll={false}
                >
                  {SORTS[s].label}
                </Link>
              ))}
            </nav>
            <table className="adm-table">
              <thead>
                <tr>
                  <th
                    aria-sort={
                      sort.startsWith("date")
                        ? sort.endsWith("asc")
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    <Link
                      href={sortHref(dateNext)}
                      className="adm-th-sort"
                      aria-current={
                        sort.startsWith("date") ? "true" : undefined
                      }
                      scroll={false}
                    >
                      Дата{arrow("date")}
                    </Link>
                  </th>
                  <th
                    aria-sort={
                      sort.startsWith("opponent")
                        ? sort.endsWith("asc")
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    <Link
                      href={sortHref(opponentNext)}
                      className="adm-th-sort"
                      aria-current={
                        sort.startsWith("opponent") ? "true" : undefined
                      }
                      scroll={false}
                    >
                      Суперник{arrow("opponent")}
                    </Link>
                  </th>
                  <th>Рахунок</th>
                  <th className="adm-hide-sm">Зал</th>
                  <th className="adm-actions-col" />
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  return (
                    <tr key={m.id}>
                      <td>{formatDateShort(m.startsAt)}</td>
                      <td>
                        <Link href={`/admin/matches/${m.id}`}>
                          {m.opponent}
                        </Link>
                        {m.kind === "friendly" && (
                          <span className="adm-badge adm-badge-friendly">
                            Товариська
                          </span>
                        )}
                      </td>
                      <td>
                        {m.status === "played" ? (
                          <span className="adm-badge adm-badge-accent">
                            {m.ourSets}:{m.theirSets}
                          </span>
                        ) : m.status === "upcoming" ? (
                          <span className="adm-badge">Скоро</span>
                        ) : (
                          <span
                            className="adm-badge"
                            title="Гру зіграно — додайте рахунок"
                          >
                            Без рахунку
                          </span>
                        )}
                      </td>
                      <td className="adm-hide-sm">{m.location ?? "—"}</td>
                      <td className="adm-actions-col">
                        <div className="adm-row-actions">
                          <Link
                            href={`/admin/matches/${m.id}`}
                            className="adm-btn adm-btn-sm"
                          >
                            Змінити
                          </Link>
                          <form action={deleteMatchAction}>
                            <input type="hidden" name="id" value={m.id} />
                            <DeleteButton />
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </section>
    </>
  );
}
