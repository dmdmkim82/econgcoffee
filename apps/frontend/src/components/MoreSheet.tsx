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

const infoItems = [
  {
    title: '서비스 소개',
    description: '에콩커피 소개와 사용 시나리오는 하단 개발 메모에서 확인합니다.',
    badge: '안내',
  },
  {
    title: '변경 이력',
    description: 'v1 MVP 기준 모바일 주문 보드, 메뉴 OCR, 취합 요약 기능을 반영했습니다.',
    badge: 'v1',
  },
  {
    title: '제휴 문의',
    description: '사내 카페 연동과 메뉴 DB 확장 등 운영 협업을 검토할 수 있습니다.',
    badge: '문의',
  },
  {
    title: '이용약관',
    description: '모임 생성, 참석, 주문 취합 흐름의 운영 기준을 정리하는 영역입니다.',
    badge: '정책',
  },
  {
    title: '개인정보처리방침',
    description: '이름과 주문 정보처럼 최소한의 업무 정보만 다루는 방향을 기준으로 둡니다.',
    badge: '정책',
  },
]

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

  const menuActions = [
    {
      title: '주문 요약',
      description: '현재까지 취합된 메뉴별 수량과 최종 요약을 확인합니다.',
      badge: '열기',
      onClick: () => {
        onOpenSummary()
        onClose()
      },
    },
    {
      title: '취합 링크 공유',
      description: '취합자용 링크를 복사하거나 QR로 전달합니다.',
      badge: '공유',
      onClick: () => {
        onOpenOrganizerShare()
        onClose()
      },
    },
    {
      title: '참석 링크 공유',
      description: '참석자가 이름만 입력하고 바로 주문할 수 있는 링크입니다.',
      badge: '공유',
      onClick: () => {
        onOpenParticipantShare()
        onClose()
      },
    },
  ]

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
            <h2>메뉴와 정보, 개발 안내</h2>
          </div>
          <button className="button ghost small" type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <p className="panel-note">
          콧퐁의 더보기 화면 구성을 참고해 자주 쓰는 작업과 운영 안내를 한곳에
          모았습니다.
        </p>

        <div className="more-sheet-group">
          <div className="subhead">
            <h3>메뉴</h3>
            <span>{role === 'organizer' ? '취합자 화면' : '참석자 화면'}</span>
          </div>
          <div className="more-sheet-list">
            {menuActions.map((item) => (
              <button
                className="more-sheet-item"
                key={item.title}
                type="button"
                onClick={item.onClick}
              >
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </div>
                <em>{item.badge}</em>
              </button>
            ))}
          </div>
        </div>

        <div className="more-sheet-group">
          <div className="subhead">
            <h3>정보 / 정책</h3>
            <span>서비스와 운영 안내</span>
          </div>
          <div className="more-sheet-list">
            {infoItems.map((item) => (
              <article className="more-sheet-item more-sheet-item-static" key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </div>
                <em>{item.badge}</em>
              </article>
            ))}
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
                <span>메뉴 가격과 합계 노출 여부를 전환합니다.</span>
              </div>
              <em>{showPrices ? 'ON' : 'OFF'}</em>
            </button>
            <button className="more-sheet-item" type="button" onClick={onToggleTheme}>
              <div>
                <strong>{theme === 'dark' ? '라이트 모드' : '다크 모드'}</strong>
                <span>현재 화면 색상 테마를 전환합니다.</span>
              </div>
              <em>{theme === 'dark' ? 'Dark' : 'Light'}</em>
            </button>
          </div>
        </div>

        <article className="more-sheet-note-card">
          <div className="more-sheet-note-head">
            <div>
              <span className="panel-kicker">서비스 소개</span>
              <h3>더보기 맨 아래 개발 메모</h3>
            </div>
            <span className="status-pill neutral">v1 MVP</span>
          </div>
          <p className="more-sheet-note-copy">
            이름만 입력하고 바로 메뉴를 고를 수 있는 모바일 중심 커피 주문
            보드입니다. 모임 생성부터 메뉴 OCR, 참석자 주문 취합, 최종 요약까지
            한 번에 정리합니다.
          </p>
          <div className="more-sheet-note-grid">
            <div className="more-sheet-note-item">
              <strong>현재 방향</strong>
              <span>
                메인 화면은 빠른 주문, 취합 화면은 OCR과 관리, 더보기는 안내와
                정책을 담는 구조로 정리했습니다.
              </span>
            </div>
            <div className="more-sheet-note-item">
              <strong>참조 반영</strong>
              <span>
                첨부한 콧퐁의 더보기 구성을 참고해 섹션형 목록을 유지하고,
                소개성 문구는 하단에 배치했습니다.
              </span>
            </div>
            <div className="more-sheet-note-item">
              <strong>다음 단계</strong>
              <span>
                실제 사내 배포 시에는 링크 공유, 권한 분리, OCR 정확도 개선,
                주문 알림을 추가하는 흐름으로 확장할 수 있습니다.
              </span>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
