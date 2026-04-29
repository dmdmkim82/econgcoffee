type SummaryGroup = {
  label: string
  count: number
  amount: string
  people: string
}

type SummaryPanelProps = {
  groupedOrders: SummaryGroup[]
  totalCups: number
  totalAmount: string
  pendingNames: string
  skippedNames: string
  summaryText: string
  showPrices: boolean
  onCopy: () => Promise<void>
}

export function SummaryPanel({
  groupedOrders,
  totalCups,
  totalAmount,
  pendingNames,
  skippedNames,
  summaryText,
  showPrices,
  onCopy,
}: SummaryPanelProps) {
  return (
    <details className="panel collapsible-panel" open>
      <summary className="panel-head">
        <div>
          <span className="panel-kicker">주문 요약</span>
          <h2>최종 주문 집계</h2>
        </div>
        <button
          className="button secondary small"
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void onCopy()
          }}
        >
          요약 복사
        </button>
        <span aria-hidden="true" className="collapse-chevron">▾</span>
      </summary>

      {groupedOrders.length === 0 ? (
        <div className="empty-state compact">
          주문이 입력되면 메뉴별 수량과 금액이 자동으로 집계됩니다.
        </div>
      ) : (
        <>
          <div className="summary-list">
            {groupedOrders.map((group) => (
              <article className="summary-row" key={group.label}>
                <div>
                  <strong>{group.label}</strong>
                  <p>{group.people}</p>
                </div>
                <div className="summary-metrics">
                  <span>{group.count}잔</span>
                  <strong>{showPrices ? group.amount : '금액 숨김'}</strong>
                </div>
              </article>
            ))}
          </div>

          <div className="summary-totals">
            <div>
              <span>총 수량</span>
              <strong>{totalCups}</strong>
            </div>
            <div>
              <span>총 금액</span>
              <strong>{showPrices ? totalAmount : '금액 숨김'}</strong>
            </div>
          </div>
        </>
      )}

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

      <div className="summary-copy-box">
        <div className="subhead">
          <h3>주문 전달용 텍스트</h3>
          <span>{summaryText ? '복사해서 바로 주문할 수 있습니다.' : '주문 입력 후 생성됩니다.'}</span>
        </div>
        <textarea readOnly rows={12} value={summaryText} />
      </div>
    </details>
  )
}
