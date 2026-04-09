import { useEffect } from 'react'

type MoreSheetProps = {
  open: boolean
  role: 'organizer' | 'join'
  showPrices: boolean
  theme: 'light' | 'dark'
  onClose: () => void
  onOpenSummary: () => void
  onOpenOrganizerShare: () => void
  onOpenParticipantShare: () => void
  onTogglePriceVisibility: () => void
  onToggleTheme: () => void
}

export function MoreSheet({
  open,
  role,
  showPrices,
  theme,
  onClose,
  onOpenSummary,
  onOpenOrganizerShare,
  onOpenParticipantShare,
  onTogglePriceVisibility,
  onToggleTheme,
}: MoreSheetProps) {
  useEffect(() => {
    if (!open) {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="summary-sheet-overlay" role="presentation" onClick={onClose}>
      <section
        aria-label="더보기"
        aria-modal="true"
        className="share-sheet more-sheet"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="summary-sheet-head">
          <div>
            <span className="panel-kicker">더보기</span>
            <h2>공유와 화면 설정</h2>
          </div>
          <button className="button ghost small" type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <p className="panel-note">
          자주 쓰지 않는 기능은 이곳에서 한 번에 처리하세요.
        </p>

        <div className="more-sheet-group">
          <div className="subhead">
            <h3>바로가기</h3>
            <span>{role === 'organizer' ? '취합자 화면' : '참석자 화면'}</span>
          </div>
          <div className="more-sheet-list">
            <button
              className="more-sheet-item"
              type="button"
              onClick={() => {
                onOpenSummary()
                onClose()
              }}
            >
              <div>
                <strong>요약 목록</strong>
                <span>현재 주문 수량과 최종 요약을 확인합니다.</span>
              </div>
              <em>열기</em>
            </button>
            <button
              className="more-sheet-item"
              type="button"
              onClick={() => {
                onOpenOrganizerShare()
                onClose()
              }}
            >
              <div>
                <strong>취합 링크 공유</strong>
                <span>취합자용 링크를 복사하거나 QR로 공유합니다.</span>
              </div>
              <em>공유</em>
            </button>
            <button
              className="more-sheet-item"
              type="button"
              onClick={() => {
                onOpenParticipantShare()
                onClose()
              }}
            >
              <div>
                <strong>참석 링크 공유</strong>
                <span>참석자가 이름 입력 후 바로 주문할 링크입니다.</span>
              </div>
              <em>공유</em>
            </button>
          </div>
        </div>

        <div className="more-sheet-group">
          <div className="subhead">
            <h3>화면 설정</h3>
            <span>보기 옵션</span>
          </div>
          <div className="more-sheet-list">
            <button className="more-sheet-item" type="button" onClick={onTogglePriceVisibility}>
              <div>
                <strong>{showPrices ? '금액 숨기기' : '금액 보기'}</strong>
                <span>메뉴 가격과 합계 표시를 전환합니다.</span>
              </div>
              <em>{showPrices ? 'ON' : 'OFF'}</em>
            </button>
            <button className="more-sheet-item" type="button" onClick={onToggleTheme}>
              <div>
                <strong>{theme === 'dark' ? '라이트 모드' : '다크 모드'}</strong>
                <span>현재 화면 색상을 더 편한 모드로 바꿉니다.</span>
              </div>
              <em>{theme === 'dark' ? 'Dark' : 'Light'}</em>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
