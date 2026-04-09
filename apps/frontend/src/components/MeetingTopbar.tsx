import { Link } from 'react-router-dom'

type MeetingTopbarProps = {
  shareCode: string
  title: string
  role: 'organizer' | 'join'
  summaryCount: number
  onOpenSummary: () => void
  onOpenMore: () => void
}

export function MeetingTopbar({
  shareCode,
  title,
  role,
  summaryCount,
  onOpenSummary,
  onOpenMore,
}: MeetingTopbarProps) {
  return (
    <section className="meeting-topbar">
      <div className="meeting-topbar-header">
        <div className="meeting-topbar-copy">
          <Link className="back-link" to="/">
            홈으로
          </Link>
          <strong>{title || '에콩커피 모임'}</strong>
          <span>모임 코드 {shareCode}</span>
        </div>

        <div className="meeting-topbar-utility">
          <button className="button secondary small" type="button" onClick={onOpenSummary}>
            요약 {summaryCount > 0 ? summaryCount : ''}
          </button>
          <button className="button secondary small" type="button" onClick={onOpenMore}>
            더보기
          </button>
        </div>
      </div>

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
    </section>
  )
}
