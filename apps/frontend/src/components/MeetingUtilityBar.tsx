type MeetingUtilityBarProps = {
  summaryCount: number
  shareLabel: string
  onOpenSummary: () => void
  onOpenShare: () => void
  onOpenMore: () => void
}

export function MeetingUtilityBar({
  summaryCount,
  shareLabel,
  onOpenSummary,
  onOpenShare,
  onOpenMore,
}: MeetingUtilityBarProps) {
  return (
    <section className="meeting-utility-bar" aria-label="보조 기능">
      <button className="button secondary micro" type="button" onClick={onOpenSummary}>
        주문요약{summaryCount > 0 ? ` ${summaryCount}` : ''}
      </button>
      <button className="button secondary micro" type="button" onClick={onOpenShare}>
        {shareLabel}
      </button>
      <button className="button ghost micro" type="button" onClick={onOpenMore}>
        더보기
      </button>
    </section>
  )
}
