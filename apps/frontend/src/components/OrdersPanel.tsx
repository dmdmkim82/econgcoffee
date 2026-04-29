import {
  getMenuDisplayPrice,
  isCoffeeMenuName,
  type Attendee,
  type MenuItem,
} from '../lib/meeting'
import { formatVisiblePrice } from '../lib/menu'
import { TemperatureSelector } from './TemperatureSelector'

type OrdersPanelProps = {
  attendees: Attendee[]
  menuItems: MenuItem[]
  meetingClosed: boolean
  showPrices: boolean
  onUpdateAttendee: (
    attendeeId: string,
    field: keyof Attendee,
    value: string | number | boolean,
  ) => void
  onSkipAttendee: (attendeeId: string, skipped: boolean) => void
  onCompleteOrder: (attendeeId: string, attendeeName: string) => void
}

function getAttendeeRank(attendee: Attendee) {
  if (attendee.skipped) {
    return 2
  }

  if (attendee.orderCompleted) {
    return 1
  }

  return 0
}

export function OrdersPanel({
  attendees,
  menuItems,
  meetingClosed,
  showPrices,
  onUpdateAttendee,
  onSkipAttendee,
  onCompleteOrder,
}: OrdersPanelProps) {
  const sortedAttendees = [...attendees].sort((left, right) => {
    const rankDiff = getAttendeeRank(left) - getAttendeeRank(right)

    if (rankDiff !== 0) {
      return rankDiff
    }

    return left.name.localeCompare(right.name, 'ko-KR')
  })

  const completedCount = attendees.filter(
    (attendee) => attendee.skipped || attendee.menuItemId,
  ).length

  return (
    <details className="panel panel-wide collapsible-panel">
      <summary className="panel-head">
        <div>
          <span className="panel-kicker">참석자 현황</span>
          <h2>이름별 주문 상태와 수정</h2>
        </div>
        <span className="status-pill neutral">
          {completedCount}/{attendees.length || 0}명 응답
        </span>
        <span aria-hidden="true" className="collapse-chevron">▾</span>
      </summary>

      <p className="panel-note">
        헤더를 눌러 펼치면 이름별로 메뉴를 직접 골라 주문할 수 있어요. 위 빠른 주문 입력에서 받은 주문도 자동으로 반영됩니다.
      </p>

      {attendees.length === 0 ? (
        <div className="empty-state">
          아직 참석자가 없습니다. 아래 새 미팅 만들기 또는 참석자 수동 관리에서 이름을 추가해 주세요.
        </div>
      ) : (
        <div className="attendance-board">
          {sortedAttendees.map((attendee) => {
            const selectedMenu = menuItems.find((item) => item.id === attendee.menuItemId)
            const canUseDecaf = Boolean(
              selectedMenu && isCoffeeMenuName(selectedMenu.name),
            )
            const fieldsDisabled = meetingClosed || attendee.skipped
            const temperatureLabel = attendee.temperature || '온도 선택 전'
            const statusTone = attendee.skipped
              ? 'skip'
              : attendee.orderCompleted
                ? 'live'
                : 'neutral'
            const statusLabel = attendee.skipped
              ? '안마심'
              : attendee.orderCompleted
                ? '주문 완료'
                : '대기'
            const canConfirmOrder =
              !meetingClosed &&
              !attendee.skipped &&
              Boolean(selectedMenu) &&
              Boolean(attendee.temperature)
            const detailLine = attendee.skipped
              ? '이번 주문에서 제외된 참석자입니다.'
              : selectedMenu
                ? `${selectedMenu.name}${
                    attendee.decaf && canUseDecaf ? ' · 디카페인' : ''
                  }${
                    showPrices
                      ? ` · ${formatVisiblePrice(
                          getMenuDisplayPrice(selectedMenu, attendee.decaf),
                          showPrices,
                        )}`
                      : ''
                  }`
                : '아직 메뉴를 선택하지 않았습니다.'

            return (
              <details className="attendance-row" key={attendee.id}>
                <summary className="attendance-summary">
                  <div className="attendee-avatar" aria-hidden="true">
                    {attendee.name.slice(0, 1) || '?'}
                  </div>
                  <div className="attendance-main">
                    <strong>{attendee.name}</strong>
                  </div>
                  <div className="attendance-order">
                    <strong>{detailLine}</strong>
                    <div className="attendance-badges">
                      <span className={`status-pill ${statusTone}`}>{statusLabel}</span>
                      {selectedMenu && !attendee.skipped ? (
                        <span
                          className={`temperature-pill ${
                            attendee.temperature === 'HOT'
                              ? 'hot'
                              : attendee.temperature === 'ICE'
                                ? 'ice'
                                : 'neutral'
                          }`}
                        >
                          {temperatureLabel}
                        </span>
                      ) : null}
                      {attendee.decaf && canUseDecaf ? (
                        <span className="status-pill soft">디카페인</span>
                      ) : null}
                      {attendee.note ? (
                        <span className="status-pill neutral">{attendee.note}</span>
                      ) : null}
                    </div>
                  </div>
                  <span className="accordion-trigger">수정</span>
                </summary>

                <div className="attendance-editor">
                  <div className="order-fields">
                    <label className="field field-full">
                      <span>메뉴 선택</span>
                      <select
                        value={attendee.menuItemId}
                        disabled={fieldsDisabled || menuItems.length === 0}
                        onChange={(event) =>
                          onUpdateAttendee(attendee.id, 'menuItemId', event.target.value)
                        }
                      >
                        <option value="">
                          {menuItems.length === 0
                            ? '등록된 메뉴가 없습니다'
                            : '메뉴를 선택하세요'}
                        </option>
                        {menuItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                            {showPrices
                              ? ` (${formatVisiblePrice(item.price, showPrices)})`
                              : ''}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="field field-full">
                      <span>온도</span>
                      {selectedMenu ? (
                        <TemperatureSelector
                          availableTemperatures={selectedMenu.availableTemperatures}
                          disabled={fieldsDisabled}
                          value={attendee.temperature}
                          onChange={(value) =>
                            onUpdateAttendee(attendee.id, 'temperature', value)
                          }
                        />
                      ) : (
                        <div className="selection-hint">메뉴를 먼저 선택하세요.</div>
                      )}
                    </div>

                    {canUseDecaf ? (
                      <div className="field field-full">
                        <span>커피 옵션</span>
                        <div className="checkbox-group">
                          <label className={`checkbox-chip ${attendee.decaf ? 'active' : ''}`}>
                            <input
                              checked={attendee.decaf}
                              disabled={fieldsDisabled}
                              type="checkbox"
                              onChange={(event) =>
                                onUpdateAttendee(
                                  attendee.id,
                                  'decaf',
                                  event.target.checked,
                                )
                              }
                            />
                            <span>디카페인 변경 +700원</span>
                          </label>
                        </div>
                      </div>
                    ) : null}

                    <label className="field field-full">
                      <span>추가 요청</span>
                      <input
                        value={attendee.note}
                        disabled={fieldsDisabled}
                        onChange={(event) =>
                          onUpdateAttendee(attendee.id, 'note', event.target.value)
                        }
                        placeholder="샷 추가, 덜 달게, 얼음 적게"
                      />
                    </label>
                  </div>

                  <div className="button-row order-card-actions">
                    <button
                      className="button small"
                      type="button"
                      disabled={!canConfirmOrder}
                      onClick={(event) => {
                        const detailsElement = event.currentTarget.closest('details')
                        if (detailsElement instanceof HTMLDetailsElement) {
                          detailsElement.open = false
                        }
                        onCompleteOrder(attendee.id, attendee.name)
                      }}
                    >
                      주문완료
                    </button>
                    <button
                      aria-pressed={attendee.skipped}
                      className="button ghost small"
                      type="button"
                      disabled={meetingClosed}
                      onClick={() => onSkipAttendee(attendee.id, !attendee.skipped)}
                    >
                      {attendee.skipped ? '스킵 취소' : '안마심'}
                    </button>
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </details>
  )
}
