import { formatPrice } from '../lib/menu'

type HeroPanelProps = {
  meetingClosed: boolean
  shareCode: string
  countdown: string
  menuCount: number
  attendeeCount: number
  completionRate: number
  completedOrders: number
  totalAmount: number
  totalCups: number
}

export function HeroPanel({
  meetingClosed,
  shareCode,
  countdown,
  menuCount,
  attendeeCount,
  completionRate,
  completedOrders,
  totalAmount,
  totalCups,
}: HeroPanelProps) {
  return (
    <header className="hero-panel">
      <div className="hero-copy">
        <span className="eyebrow">SK에코플랜트 미팅용 커피 취합</span>
        <h1>에콩커피</h1>
        <p className="hero-description">
          카페 메뉴판 사진을 올리면 OCR로 메뉴를 자동 등록하고, 참석자별 주문을
          정리해 취합자가 바로 주문할 수 있는 요약본까지 만들어줍니다.
        </p>
        <div className="hero-steps">
          <span className="hero-step">1. 모임 생성</span>
          <span className="hero-step">2. 메뉴 OCR</span>
          <span className="hero-step">3. 참석자 주문 취합</span>
        </div>
        <div className="hero-badges">
          <span className={`status-pill ${meetingClosed ? 'danger' : 'live'}`}>
            {meetingClosed ? '주문 마감' : '취합 진행 중'}
          </span>
          <span className="status-pill neutral">회의 코드 {shareCode}</span>
          <span className="status-pill neutral">{countdown}</span>
        </div>
      </div>
      <div className="hero-stats">
        <article className="stat-card">
          <span className="stat-label">메뉴 수</span>
          <strong>{menuCount}</strong>
          <p>OCR + 수동 등록</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">참석자 수</span>
          <strong>{attendeeCount}</strong>
          <p>취합자가 직접 관리</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">입력 완료율</span>
          <strong>{completionRate}%</strong>
          <p>{completedOrders}명 주문 입력</p>
        </article>
        <article className="stat-card accent">
          <span className="stat-label">예상 주문 금액</span>
          <strong>{formatPrice(totalAmount)}</strong>
          <p>{totalCups}잔 기준</p>
        </article>
      </div>
    </header>
  )
}
