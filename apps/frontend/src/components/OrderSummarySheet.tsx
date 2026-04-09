import { useEffect } from 'react'

type OrderSummaryGroup = {
  label: string
  count: number
  amount: string
  people: string
}

type OrderSummarySheetProps = {
  open: boolean
  groupedOrders: OrderSummaryGroup[]
  totalCups: number
  totalAmount: string
  pendingNames: string
  skippedNames: string
  onClose: () => void
}

export function OrderSummarySheet({
  open,
  groupedOrders,
  totalCups,
  totalAmount,
  pendingNames,
  skippedNames,
  onClose,
}: OrderSummarySheetProps) {
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
    <div
      className="summary-sheet-overlay"
      role="presentation"
      onClick={onClose}
    >
      <section
        aria-label="주문 요약 목록"
        aria-modal="true"
        className="summary-sheet"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="summary-sheet-head">
          <div>
            <span className="panel-kicker">주문 요약</span>
            <h2>메뉴 요약 목록</h2>
          </div>
          <button className="button ghost small" type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        {groupedOrders.length === 0 ? (
          <div className="empty-state compact">
            아직 취합된 주문이 없습니다.
          </div>
        ) : (
          <div className="summary-sheet-list">
            {groupedOrders.map((group) => (
              <article className="summary-sheet-row" key={group.label}>
                <div>
                  <strong>{group.label}</strong>
                  <p>{group.people}</p>
                </div>
                <div className="summary-metrics">
                  <span>x{group.count}</span>
                  <strong>{group.amount}</strong>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="summary-sheet-footer">
          <div className="summary-sheet-total">
            <span>총 수량</span>
            <strong>{totalCups}</strong>
          </div>
          <div className="summary-sheet-total">
            <span>총 금액</span>
            <strong>{totalAmount}</strong>
          </div>
        </div>

        <div className="pending-box">
          <h3>미선택 참석자</h3>
          <p>{pendingNames || '모든 참석자가 응답했습니다.'}</p>
        </div>
        {skippedNames ? (
          <div className="pending-box">
            <h3>스킵 참석자</h3>
            <p>{skippedNames}</p>
          </div>
        ) : null}
      </section>
    </div>
  )
}
