import { formatVisiblePrice } from '../lib/menu'

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
  showPrices: boolean
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
  showPrices,
}: HeroPanelProps) {
  return (
    <header className="hero-panel">
      <div className="hero-copy">
        <span className="eyebrow">SK에코플랜트 미팅 커피 취합</span>
        <h1>에콩커피</h1>
        <p className="hero-description">
          메뉴 OCR부터 참석자 주문과 최종 요약까지 세로 화면에 맞춰 빠르게
          정리합니다.
        </p>
        <div className="hero-steps">
          <span className="hero-step">1. 모임 생성</span>
          <span className="hero-step">2. 메뉴 확인</span>
          <span className="hero-step">3. 주문 취합</span>
        </div>
        <div className="hero-badges">
          <span className={`status-pill ${meetingClosed ? 'danger' : 'live'}`}>
            {meetingClosed ? '주문 마감' : '취합 진행 중'}
          </span>
          <span className="status-pill neutral">코드 {shareCode}</span>
          <span className="status-pill neutral">{countdown}</span>
        </div>
      </div>
      <div className="hero-stats">
        <article className="stat-card">
          <span className="stat-label">메뉴 수</span>
          <strong>{menuCount}</strong>
          <p>이미지 메뉴와 직접 입력 포함</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">참석자 수</span>
          <strong>{attendeeCount}</strong>
          <p>주문을 선택할 수 있는 인원</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">응답률</span>
          <strong>{completionRate}%</strong>
          <p>{completedOrders}명 응답 완료</p>
        </article>
        <article className="stat-card accent">
          <span className="stat-label">예상 주문 금액</span>
          <strong>{formatVisiblePrice(totalAmount, showPrices)}</strong>
          <p>{totalCups}잔 기준</p>
        </article>
      </div>
    </header>
  )
}
