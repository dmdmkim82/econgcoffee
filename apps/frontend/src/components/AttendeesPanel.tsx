import { useState, type FormEvent } from 'react'
import { type Attendee } from '../lib/meeting'

type AttendeesPanelProps = {
  attendees: Attendee[]
  onAddAttendee: (name: string, team: string) => void
  onRemoveAttendee: (attendeeId: string) => void
}

export function AttendeesPanel({
  attendees,
  onAddAttendee,
  onRemoveAttendee,
}: AttendeesPanelProps) {
  const [name, setName] = useState('')
  const [team, setTeam] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      return
    }

    onAddAttendee(name.trim(), team.trim())
    setName('')
    setTeam('')
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">참석자 관리</span>
          <h2>참석자 목록</h2>
        </div>
        <span className="status-pill neutral">{attendees.length}명</span>
      </div>
      <form className="inline-form stacked" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="참석자 이름"
        />
        <input
          value={team}
          onChange={(event) => setTeam(event.target.value)}
          placeholder="팀 또는 부서"
        />
        <button className="button" type="submit">
          참석자 추가
        </button>
      </form>
      {attendees.length === 0 ? (
        <div className="empty-state compact">
          참석자를 추가하면 여기에서 주문 진행 상태를 바로 확인할 수 있습니다.
        </div>
      ) : (
        <div className="person-list">
          {attendees.map((attendee) => {
            const tone = attendee.skipped
              ? 'skip'
              : attendee.menuItemId
                ? 'live'
                : 'neutral'
            const label = attendee.skipped
              ? '스킵'
              : attendee.menuItemId
                ? '선택 완료'
                : '대기 중'

            return (
              <article className="person-chip" key={attendee.id}>
                <div>
                  <strong>{attendee.name}</strong>
                  <span>{attendee.team || '팀 정보 없음'}</span>
                </div>
                <div className="person-actions">
                  <span className={`status-pill ${tone}`}>{label}</span>
                  <button
                    className="button ghost small"
                    type="button"
                    onClick={() => onRemoveAttendee(attendee.id)}
                  >
                    제거
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
