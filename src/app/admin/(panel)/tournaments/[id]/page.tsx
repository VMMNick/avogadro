import { notFound } from 'next/navigation'
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { DeleteButton } from '@/components/admin/ui'
import { deleteTournamentAction } from '../../../actions'
import { TournamentForm } from '@/components/admin/forms'
import { StandingsEditor } from '@/components/admin/StandingsEditor'
import { fivbPoints } from '@/lib/validation'
import { CLUB_NAME } from '@/lib/constants'

export const metadata = { title: 'Редагування турніру' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const db = getDb()
  const [[tournament], [{ n }], teams, played] = await Promise.all([
    db.select().from(schema.tournaments).where(eq(schema.tournaments.id, id)).limit(1),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.matches).where(eq(schema.matches.tournamentId, id)),
    db.select({ id: schema.teams.id, name: schema.teams.name }).from(schema.teams).orderBy(schema.teams.name),
    db
      .select({ our: schema.matches.ourSets, their: schema.matches.theirSets })
      .from(schema.matches)
      .where(and(eq(schema.matches.tournamentId, id), isNotNull(schema.matches.ourSets))),
  ])
  if (!tournament) notFound()
  // Наш рядок таблиці з уже внесених результатів цього турніру
  const ours = played.length
    ? {
        played: played.length,
        wins: played.filter((m) => m.our! > m.their!).length,
        losses: played.filter((m) => m.our! < m.their!).length,
        setsFor: played.reduce((s, m) => s + m.our!, 0),
        setsAgainst: played.reduce((s, m) => s + m.their!, 0),
        points: played.reduce((s, m) => s + fivbPoints(m.our!, m.their!), 0),
      }
    : null
  return (
    <>
      <div className="adm-page-head">
        <h1>{tournament.name}</h1>
      </div>
      <TournamentForm tournament={tournament} />
      <div style={{ marginTop: 20 }}>
        <StandingsEditor
          tournamentId={tournament.id}
          initial={tournament.standings ?? []}
          teams={teams}
          clubName={CLUB_NAME}
          ours={ours}
        />
      </div>
      <section className="adm-card" style={{ marginTop: 20 }}>
        <h2>Видалення</h2>
        <form action={deleteTournamentAction} className="adm-actions">
          <input type="hidden" name="id" value={tournament.id} />
          <span className="adm-muted">
            Прибрати турнір з довідника.{n > 0 && ` Його ігри (${n}) залишаться, просто без турніру.`}
          </span>
          <DeleteButton />
        </form>
      </section>
    </>
  )
}
