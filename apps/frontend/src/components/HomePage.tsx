import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { type Snapshot } from '../lib/meeting'

type HomePageProps = {
  meetings: Snapshot[]
  onCreateMeeting: () => string
  onDeleteMeeting: (shareCode: string) => void
}

function isClosed(snapshot: Snapshot) {
  return (
    snapshot.meeting.manuallyClosed ||
    (Boolean(snapshot.meeting.deadline) &&
      new Date(snapshot.meeting.deadline).getTime() <= Date.now())
  )
}

function countCompleted(snapshot: Snapshot) {
  return snapshot.attendees.filter((attendee) => attendee.menuItemId).length
}

export function HomePage({
  meetings,
  onCreateMeeting,
  onDeleteMeeting,
}: HomePageProps) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  const summary = useMemo(() => {
    return meetings.reduce(
      (accumulator, snapshot) => ({
        meetings: accumulator.meetings + 1,
        activeMeetings: accumulator.activeMeetings + (isClosed(snapshot) ? 0 : 1),
        attendees: accumulator.attendees + snapshot.attendees.length,
      }),
      {
        meetings: 0,
        activeMeetings: 0,
        attendees: 0,
      },
    )
  }, [meetings])

  function openMeeting(shareCode: string, role: 'organizer' | 'join') {
    navigate(`/meeting/${shareCode}/${role}`)
  }

  function handleCreateMeeting() {
    const shareCode = onCreateMeeting()
    openMeeting(shareCode, 'organizer')
  }

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const shareCode = code.trim().toUpperCase()

    if (!shareCode) {
      return
    }

    openMeeting(shareCode, 'join')
  }

  return (
    <div className="shell">
      <div className="compact-home">
        <section className="compact-home-hero">
          <article className="panel compact-home-copy">
            <span className="eyebrow">Mobile-first coffee board</span>
            <h1>Ekong Coffee</h1>
            <p className="hero-description">
              A tighter meeting order board for mobile and desktop. Create a
              meeting, share the join link, and check the final order at a glance.
            </p>
            <div className="compact-metric-grid">
              <article className="mini-stat">
                <span>Meetings</span>
                <strong>{summary.meetings}</strong>
              </article>
              <article className="mini-stat">
                <span>Active</span>
                <strong>{summary.activeMeetings}</strong>
              </article>
              <article className="mini-stat">
                <span>Attendees</span>
                <strong>{summary.attendees}</strong>
              </article>
            </div>
          </article>

          <aside className="panel quick-action-card">
            <div className="panel-head">
              <div>
                <span className="panel-kicker">Quick actions</span>
                <h2>Open fast</h2>
              </div>
            </div>
            <div className="quick-action-grid">
              <button className="button" type="button" onClick={handleCreateMeeting}>
                Create meeting
              </button>
              <form className="join-form compact" onSubmit={handleJoin}>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Meeting code"
                />
                <button className="button secondary" type="submit">
                  Join
                </button>
              </form>
            </div>
          </aside>
        </section>

        <section className="panel home-panel">
          <div className="panel-head">
            <div>
              <span className="panel-kicker">Recent meetings</span>
              <h2>Compact meeting list</h2>
            </div>
            <span className="status-pill neutral">{meetings.length} saved</span>
          </div>

          {meetings.length === 0 ? (
            <div className="empty-state compact">
              No saved meetings yet. Create the first meeting to begin.
            </div>
          ) : (
            <div className="recent-card-list">
              {meetings.map((snapshot) => {
                const closed = isClosed(snapshot)
                const completed = countCompleted(snapshot)

                return (
                  <article className="meeting-card recent-card" key={snapshot.meeting.shareCode}>
                    <div className="meeting-card-copy">
                      <div className="button-row">
                        <span className={`status-pill ${closed ? 'danger' : 'live'}`}>
                          {closed ? 'Closed' : 'Live'}
                        </span>
                        <span className="status-pill neutral">
                          {snapshot.meeting.shareCode}
                        </span>
                      </div>
                      <strong>{snapshot.meeting.title || 'Ekong Coffee meeting'}</strong>
                      <span>
                        {snapshot.meeting.cafeName || 'Cafe TBD'} /{' '}
                        {snapshot.meeting.place || 'Location TBD'}
                      </span>
                      <span>
                        Orders {completed}/{snapshot.attendees.length} / Menu{' '}
                        {snapshot.menuItems.length}
                      </span>
                    </div>

                    <div className="meeting-card-actions">
                      <button
                        className="button small"
                        type="button"
                        onClick={() =>
                          openMeeting(snapshot.meeting.shareCode, 'organizer')
                        }
                      >
                        Organizer
                      </button>
                      <button
                        className="button secondary small"
                        type="button"
                        onClick={() => openMeeting(snapshot.meeting.shareCode, 'join')}
                      >
                        Join
                      </button>
                      <button
                        className="button ghost small"
                        type="button"
                        onClick={() => onDeleteMeeting(snapshot.meeting.shareCode)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
