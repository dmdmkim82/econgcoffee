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
  onCopy: () => Promise<void>
}

export function SummaryPanel({
  groupedOrders,
  totalCups,
  totalAmount,
  pendingNames,
  skippedNames,
  summaryText,
  onCopy,
}: SummaryPanelProps) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">주문 요약</span>
          <h2>최종 주문 집계</h2>
        </div>
        <button className="button secondary small" type="button" onClick={onCopy}>
          요약 복사
        </button>
      </div>
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
                  <span>x{group.count}</span>
                  <strong>{group.amount}</strong>
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
              <strong>{totalAmount}</strong>
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
          <span>{summaryText ? '복사해서 바로 주문 가능' : '주문 입력 후 생성'}</span>
        </div>
        <textarea readOnly rows={12} value={summaryText} />
      </div>
    </section>
  )
}
