import { Link } from 'react-router-dom'

type MeetingTopbarProps = {
  shareCode: string
  title: string
  role: 'organizer' | 'join'
  summaryCount: number
  onCopyOrganizerLink: () => Promise<void>
  onCopyParticipantLink: () => Promise<void>
  onOpenSummary: () => void
}

export function MeetingTopbar({
  shareCode,
  title,
  role,
  summaryCount,
  onCopyOrganizerLink,
  onCopyParticipantLink,
  onOpenSummary,
}: MeetingTopbarProps) {
  return (
    <section className="meeting-topbar">
      <div className="meeting-topbar-copy">
        <Link className="back-link" to="/">
          홈으로
        </Link>
        <strong>{title || '에콩커피 모임'}</strong>
        <span>코드 {shareCode}</span>
      </div>
      <div className="meeting-topbar-actions">
        <div className="role-tabs">
          <Link
            className={`role-tab ${role === 'organizer' ? 'active' : ''}`}
            to={`/meeting/${shareCode}/organizer`}
          >
            취합자
          </Link>
          <Link
            className={`role-tab ${role === 'join' ? 'active' : ''}`}
            to={`/meeting/${shareCode}/join`}
          >
            참석자
          </Link>
        </div>
        <div className="button-row">
          <button className="button small" type="button" onClick={onOpenSummary}>
            요약 목록{summaryCount > 0 ? ` ${summaryCount}` : ''}
          </button>
          <button
            className="button secondary small"
            type="button"
            onClick={onCopyOrganizerLink}
          >
            취합 링크
          </button>
          <button
            className="button secondary small"
            type="button"
            onClick={onCopyParticipantLink}
          >
            참석 링크
          </button>
        </div>
      </div>
    </section>
  )
}
