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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      return
    }

    onAddAttendee(name.trim(), '')
    setName('')
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">참석자 수동 관리</span>
          <h2>생성 팝업 이후에도 참석자 이름을 계속 추가할 수 있습니다</h2>
        </div>
        <span className="status-pill neutral">{attendees.length}명</span>
      </div>

      <form className="inline-form stacked" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="참석자 이름"
        />
        <button className="button" type="submit">
          참석자 추가
        </button>
      </form>

      {attendees.length === 0 ? (
        <div className="empty-state compact">
          새 미팅 만들기 팝업에서 미리 넣지 않았다면 여기서 참석자를 계속 추가하면 됩니다.
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
              ? '안마심'
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
                    삭제
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
