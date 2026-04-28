import { type DeadlineUrgency } from '../lib/meeting'
import { formatVisiblePrice } from '../lib/menu'

type HeroPanelProps = {
  meetingClosed: boolean
  shareCode: string
  countdown: string
  countdownUrgency: DeadlineUrgency
  menuCount: number
  attendeeCount: number
  completionRate: number
  completedOrders: number
  totalAmount: number
  totalCups: number
  showPrices: boolean
}

const URGENCY_TONE: Record<DeadlineUrgency, string> = {
  open: 'neutral',
  soft: 'soft',
  warn: 'warn',
  danger: 'danger',
  closed: 'danger',
}

export function HeroPanel({
  meetingClosed,
  shareCode,
  countdown,
  countdownUrgency,
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
          참석자 주문 현황과 최종 주문 수량을 한 화면에서 빠르게 확인할 수 있습니다.
        </p>
        <div className="hero-steps">
          <span className="hero-step">1. 이름 입력</span>
          <span className="hero-step">2. 메뉴 선택</span>
          <span className="hero-step">3. 주문 취합</span>
        </div>
        <div className="hero-badges">
          <span className={`status-pill ${meetingClosed ? 'danger' : 'live'}`}>
            {meetingClosed ? '주문 마감' : '취합 진행 중'}
          </span>
          <span className="status-pill neutral">코드 {shareCode}</span>
          <span className={`status-pill ${URGENCY_TONE[countdownUrgency]}`}>{countdown}</span>
        </div>
      </div>

      <div className="hero-stats">
        <article className="stat-card">
          <span className="stat-label">메뉴 수</span>
          <strong>{menuCount}</strong>
          <p>기본 메뉴와 직접 추가한 메뉴를 포함합니다.</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">참석자 수</span>
          <strong>{attendeeCount}</strong>
          <p>현재 주문을 선택할 수 있는 인원입니다.</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">응답률</span>
          <strong>{completionRate}%</strong>
          <p>{completedOrders}명이 응답을 마쳤습니다.</p>
        </article>
        <article className="stat-card accent">
          <span className="stat-label">예상 주문 금액</span>
          <strong>{formatVisiblePrice(totalAmount, showPrices)}</strong>
          <p>총 {totalCups}잔 기준입니다.</p>
        </article>
      </div>
    </header>
  )
}
