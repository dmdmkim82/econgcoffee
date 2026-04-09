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
  return snapshot.attendees.filter(
    (attendee) => attendee.skipped || attendee.menuItemId,
  ).length
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
            <span className="eyebrow">SK에코플랜트 미팅 커피 취합</span>
            <h1>에콩커피</h1>
            <p className="hero-description">
              모임을 만들고 메뉴판을 올리면 OCR로 메뉴를 정리하고, 참석자 주문과
              최종 요약까지 한 화면에서 빠르게 확인할 수 있습니다.
            </p>
            <div className="compact-metric-grid">
              <article className="mini-stat">
                <span>저장 모임</span>
                <strong>{summary.meetings}</strong>
              </article>
              <article className="mini-stat">
                <span>진행 중</span>
                <strong>{summary.activeMeetings}</strong>
              </article>
              <article className="mini-stat">
                <span>참석자</span>
                <strong>{summary.attendees}</strong>
              </article>
            </div>
          </article>

          <aside className="panel quick-action-card">
            <div className="panel-head">
              <div>
                <span className="panel-kicker">바로 시작</span>
                <h2>모임 만들기 또는 참여하기</h2>
              </div>
            </div>
            <div className="quick-action-grid">
              <button className="button" type="button" onClick={handleCreateMeeting}>
                새 모임 만들기
              </button>
              <form className="join-form compact" onSubmit={handleJoin}>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="모임 코드 입력"
                />
                <button className="button secondary" type="submit">
                  코드로 참여
                </button>
              </form>
            </div>
          </aside>
        </section>

        <section className="panel home-panel">
          <div className="panel-head">
            <div>
              <span className="panel-kicker">최근 모임</span>
              <h2>내가 만든 모임과 참여한 모임</h2>
            </div>
            <span className="status-pill neutral">{meetings.length}개 저장됨</span>
          </div>

          {meetings.length === 0 ? (
            <div className="empty-state compact">
              아직 저장된 모임이 없습니다. 첫 모임을 만들어 커피 주문을 시작해보세요.
            </div>
          ) : (
            <div className="recent-card-list">
              {meetings.map((snapshot) => {
                const closed = isClosed(snapshot)
                const completed = countCompleted(snapshot)

                return (
                  <article
                    className="meeting-card recent-card"
                    key={snapshot.meeting.shareCode}
                  >
                    <div className="meeting-card-copy">
                      <div className="button-row">
                        <span className={`status-pill ${closed ? 'danger' : 'live'}`}>
                          {closed ? '마감' : '진행 중'}
                        </span>
                        <span className="status-pill neutral">
                          코드 {snapshot.meeting.shareCode}
                        </span>
                      </div>
                      <strong>{snapshot.meeting.title || '에콩커피 모임'}</strong>
                      <span>
                        {snapshot.meeting.cafeName || '카페 미정'} /{' '}
                        {snapshot.meeting.place || '장소 미정'}
                      </span>
                      <span>
                        주문 응답 {completed}/{snapshot.attendees.length} · 메뉴{' '}
                        {snapshot.menuItems.length}개
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
                        취합자 화면
                      </button>
                      <button
                        className="button secondary small"
                        type="button"
                        onClick={() => openMeeting(snapshot.meeting.shareCode, 'join')}
                      >
                        참석자 화면
                      </button>
                      <button
                        className="button ghost small"
                        type="button"
                        onClick={() => onDeleteMeeting(snapshot.meeting.shareCode)}
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
      </div>
    </div>
  )
}
