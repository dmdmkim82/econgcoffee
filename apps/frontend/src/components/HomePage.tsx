import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAFE_PRESETS,
  type CafePresetName,
  type CreateMenuSeed,
  type Snapshot,
  type Team,
} from '../lib/meeting'
import { HeroCrema } from './AmbientLayer'
import { CafeLogoIcon } from './CafeLogoIcon'
import { CreateMeetingSheet } from './CreateMeetingSheet'

type CreateMeetingPayload = {
  title: string
  cafeName: CafePresetName
  attendeeNames: string[]
  menuSeeds?: CreateMenuSeed[]
}

type HomePageProps = {
  meetings: Snapshot[]
  teams: Team[]
  theme: 'light' | 'dark'
  onCreateMeeting: (payload: CreateMeetingPayload) => string
  onDeleteMeeting: (shareCode: string) => void
  onDeleteOldMeetings: (shareCodes: string[]) => Promise<number> | number
  onToggleTheme: () => void
}

const FRESH_DAYS = 7
const FRESH_AFTER_MS = FRESH_DAYS * 24 * 60 * 60 * 1000

function isClosed(snapshot: Snapshot) {
  return (
    snapshot.meeting.manuallyClosed ||
    (Boolean(snapshot.meeting.deadline) &&
      new Date(snapshot.meeting.deadline).getTime() <= Date.now())
  )
}

function isAged(snapshot: Snapshot, now: number) {
  const updated = new Date(snapshot.updatedAt).getTime()
  if (Number.isNaN(updated)) return false
  return now - updated > FRESH_AFTER_MS
}

function countCompleted(snapshot: Snapshot) {
  return snapshot.attendees.filter(
    (attendee) => attendee.skipped || attendee.orderCompleted,
  ).length
}

export function HomePage({
  meetings,
  teams,
  theme,
  onCreateMeeting,
  onDeleteMeeting,
  onDeleteOldMeetings,
  onToggleTheme,
}: HomePageProps) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [draftMeetingTitle, setDraftMeetingTitle] = useState('')
  const [draftCafeName, setDraftCafeName] = useState<CafePresetName | ''>('')
  const [showAged, setShowAged] = useState(false)
  const [purgingOld, setPurgingOld] = useState(false)
  const canCreateMeeting = Boolean(draftMeetingTitle.trim() && draftCafeName)

  const now = Date.now()
  const freshMeetings = meetings.filter((snapshot) => !isAged(snapshot, now))
  const agedMeetings = meetings.filter((snapshot) => isAged(snapshot, now))

  async function handleDeleteOldMeetings() {
    if (agedMeetings.length === 0 || purgingOld) return
    if (
      !window.confirm(
        `${FRESH_DAYS}일 이전의 과거 모임 ${agedMeetings.length}건을 모두 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`,
      )
    ) {
      return
    }
    setPurgingOld(true)
    try {
      await onDeleteOldMeetings(agedMeetings.map((m) => m.meeting.shareCode))
    } finally {
      setPurgingOld(false)
    }
  }

  const summary = (() => {
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
  })()

  function resetCreateDraft() {
    setDraftMeetingTitle('')
    setDraftCafeName('')
    setIsCreateSheetOpen(false)
  }

  function openMeeting(shareCode: string, role: 'organizer' | 'join') {
    navigate(`/meeting/${shareCode}/${role}`)
  }

  function handleCreateMeeting(payload: { attendeeNames: string[] }) {
    const finalCafeName = draftCafeName || CAFE_PRESETS[0]
    const shareCode = onCreateMeeting({
      attendeeNames: payload.attendeeNames,
      title: draftMeetingTitle.trim(),
      cafeName: finalCafeName,
    })
    openMeeting(shareCode, 'organizer')
    resetCreateDraft()
  }

  function handleOpenCreateSheet() {
    if (!canCreateMeeting) {
      return
    }

    setIsCreateSheetOpen(true)
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
      <CreateMeetingSheet
        open={isCreateSheetOpen}
        title={draftMeetingTitle}
        cafeName={draftCafeName}
        teams={teams}
        onClose={() => setIsCreateSheetOpen(false)}
        onSubmit={handleCreateMeeting}
      />

      <div className="compact-home">
        <div className="home-utility-row">
          <button className="button secondary small" type="button" onClick={onToggleTheme}>
            {theme === 'dark' ? '라이트 모드' : '다크 모드'}
          </button>
        </div>

        <section className="compact-home-hero">
          <article className="panel compact-home-copy home-brand-panel">
            <HeroCrema />
            <span className="eyebrow">SK에코플랜트 미팅 커피 취합</span>
            <h1 className="home-brand-panel-greeting">에콩커피<br />오늘은 뭐 마실까요?</h1>
            <p className="hero-description">
              취합자가 카페를 정하고, 참석자는 자기 이름을 눌러 바로 메뉴를 고를 수 있어요.
            </p>
            <div style={{ marginTop: 14 }}>
              <span className="live-pill">
                {summary.activeMeetings > 0
                  ? `LIVE · 진행 중 ${summary.activeMeetings}건`
                  : '오늘의 새 모임 만들기'}
              </span>
            </div>
            <div className="compact-metric-grid">
              <article className="mini-stat">
                <span>전체 모임</span>
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
                <h2>미팅 이름과 카페를 먼저 정하고 시작하세요</h2>
              </div>
            </div>
            <div className="quick-action-grid">
              <label className="field field-full">
                <span>새 미팅 이름</span>
                <input
                  value={draftMeetingTitle}
                  onChange={(event) => setDraftMeetingTitle(event.target.value)}
                  placeholder="예: 공정회의 커피 주문"
                />
              </label>
              <div className="field field-full">
                <span>카페 선택</span>
                <div className="cafe-picker-grid">
                  {CAFE_PRESETS.map((presetCafeName) => (
                    <button
                      className={`cafe-picker-card ${
                        draftCafeName === presetCafeName ? 'active' : ''
                      }`}
                      key={presetCafeName}
                      type="button"
                      onClick={() => setDraftCafeName(presetCafeName)}
                    >
                      <CafeLogoIcon name={presetCafeName} size={44} />
                      <span>{presetCafeName}</span>
                    </button>
                  ))}
                </div>
              </div>
              {draftCafeName ? (
                <div className="status-callout">
                  카페를 선택했습니다. 참석자를 입력하면 바로 미팅이 만들어집니다.
                </div>
              ) : (
                <div className="status-callout">
                  먼저 카페를 고르면 한 카페 기준으로만 미팅이 만들어집니다.
                </div>
              )}
              {!draftMeetingTitle.trim() ? (
                <div className="status-callout">
                  미팅 이름을 먼저 적어야 어떤 회의 주문인지 바로 구분할 수 있습니다.
                </div>
              ) : null}
              <button
                className="button"
                type="button"
                disabled={!canCreateMeeting}
                onClick={handleOpenCreateSheet}
              >
                새 미팅 만들기
              </button>
              <form className="join-form compact" onSubmit={handleJoin}>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="모임 코드 입력"
                />
                <button className="button secondary" type="submit">
                  코드로 참석
                </button>
              </form>
            </div>
          </aside>
        </section>

        <section className="panel home-panel">
          <div className="panel-head">
            <div>
              <span className="panel-kicker">최근 모임</span>
              <h2>다시 이어서 보기</h2>
            </div>
            <span className="status-pill neutral">{freshMeetings.length}개</span>
          </div>

          {freshMeetings.length === 0 ? (
            <div className="empty-state compact">
              {meetings.length === 0
                ? '아직 저장된 미팅이 없습니다. 첫 미팅을 만들어 커피 주문을 시작해보세요.'
                : `최근 ${FRESH_DAYS}일 안에 진행한 미팅이 없습니다. 새 미팅을 만들어보세요.`}
            </div>
          ) : (
            <div className="recent-card-list">
              {freshMeetings.map((snapshot) => {
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
                        주문 응답 {completed}/{snapshot.attendees.length}명 · 메뉴{' '}
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
                        취합 화면
                      </button>
                      <button
                        className="button secondary small"
                        type="button"
                        onClick={() => openMeeting(snapshot.meeting.shareCode, 'join')}
                      >
                        참석 화면
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

          {agedMeetings.length > 0 ? (
            <details
              className="aged-meetings"
              open={showAged}
              onToggle={(event) =>
                setShowAged((event.currentTarget as HTMLDetailsElement).open)
              }
            >
              <summary>
                <span>
                  {FRESH_DAYS}일 이전 과거 모임 {agedMeetings.length}건
                </span>
                <span className="aged-meetings-hint">
                  열어서 살펴보거나 일괄 정리할 수 있어요
                </span>
              </summary>
              <div className="aged-meetings-actions">
                <button
                  className="button ghost small"
                  type="button"
                  disabled={purgingOld}
                  onClick={handleDeleteOldMeetings}
                >
                  {purgingOld ? '삭제 중…' : `과거 모임 ${agedMeetings.length}건 모두 삭제`}
                </button>
                <span className="aged-meetings-note">
                  서버 저장 후 30일이 지나면 자동으로 정리됩니다.
                </span>
              </div>
              <div className="recent-card-list">
                {agedMeetings.map((snapshot) => {
                  const closed = isClosed(snapshot)
                  const completed = countCompleted(snapshot)
                  const updatedAt = new Date(snapshot.updatedAt)
                  const updatedLabel = Number.isNaN(updatedAt.getTime())
                    ? ''
                    : new Intl.DateTimeFormat('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                      }).format(updatedAt)

                  return (
                    <article
                      className="meeting-card recent-card aged"
                      key={snapshot.meeting.shareCode}
                    >
                      <div className="meeting-card-copy">
                        <div className="button-row">
                          <span className={`status-pill ${closed ? 'skip' : 'neutral'}`}>
                            {updatedLabel || '과거'}
                          </span>
                          <span className="status-pill neutral">
                            코드 {snapshot.meeting.shareCode}
                          </span>
                        </div>
                        <strong>{snapshot.meeting.title || '에콩커피 모임'}</strong>
                        <span>
                          {snapshot.meeting.cafeName || '카페 미정'} ·{' '}
                          {completed}/{snapshot.attendees.length}명 응답
                        </span>
                      </div>
                      <div className="meeting-card-actions">
                        <button
                          className="button secondary small"
                          type="button"
                          onClick={() =>
                            openMeeting(snapshot.meeting.shareCode, 'organizer')
                          }
                        >
                          다시 보기
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
            </details>
          ) : null}
        </section>
      </div>
    </div>
  )
}
