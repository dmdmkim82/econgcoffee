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
        <span className="eyebrow">SK에코플랜트 미팅 커피 취합</span>
        <h1>에콩커피</h1>
        <p className="hero-description">
          메뉴판 사진 OCR, 참석자 주문 입력, 최종 주문 요약까지 한 흐름으로
          정리하는 세로형 커피 취합 보드입니다.
        </p>
        <div className="hero-steps">
          <span className="hero-step">1. 모임 생성</span>
          <span className="hero-step">2. 메뉴 OCR</span>
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
          <p>OCR과 수동 입력 메뉴</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">참석자 수</span>
          <strong>{attendeeCount}</strong>
          <p>현재 주문 대상 인원</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">응답률</span>
          <strong>{completionRate}%</strong>
          <p>{completedOrders}명 응답 완료</p>
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
