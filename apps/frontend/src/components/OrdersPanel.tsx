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
}

function getAttendeeRank(attendee: Attendee) {
  if (attendee.skipped) {
    return 2
  }

  if (attendee.menuItemId) {
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
    <section className="panel panel-wide">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">참여자 현황</span>
          <h2>누가 무엇을 골랐는지 한눈에 확인하세요</h2>
        </div>
        <span className="status-pill neutral">
          {completedCount}/{attendees.length || 0}명 응답
        </span>
      </div>

      <p className="panel-note">
        주문이 들어오면 이 목록에 바로 반영됩니다. 필요할 때만 각 사람별 세부 내용을 펼쳐 수정하세요.
      </p>

      {attendees.length === 0 ? (
        <div className="empty-state">
          아직 참석자가 없습니다. 아래 관리 영역에서 직접 추가하거나 참석 링크로 입력을 받아 주세요.
        </div>
      ) : (
        <div className="attendance-board">
          {sortedAttendees.map((attendee) => {
            const selectedMenu = menuItems.find((item) => item.id === attendee.menuItemId)
            const canUseDecaf = Boolean(
              selectedMenu && isCoffeeMenuName(selectedMenu.name),
            )
            const fieldsDisabled = meetingClosed || attendee.skipped
            const temperatureLabel = attendee.temperature || '온도 미선택'
            const statusTone = attendee.skipped
              ? 'skip'
              : attendee.menuItemId
                ? 'live'
                : 'neutral'
            const statusLabel = attendee.skipped
              ? '안마심'
              : attendee.menuItemId
                ? '주문'
                : '대기'
            const detailLine = attendee.skipped
              ? '이번 주문은 안마심으로 처리되었습니다.'
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
                    <span>{attendee.team || '팀 정보 없음'}</span>
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
                  <span className="accordion-trigger">편집</span>
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

                    <label className="field">
                      <span>수량</span>
                      <input
                        type="number"
                        min={1}
                        max={9}
                        value={attendee.quantity}
                        disabled={fieldsDisabled}
                        onChange={(event) =>
                          onUpdateAttendee(
                            attendee.id,
                            'quantity',
                            Math.min(9, Math.max(1, Number(event.target.value || 1))),
                          )
                        }
                      />
                    </label>

                    <div className="field">
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
                        <span>원두 옵션</span>
                        <div className="checkbox-group">
                          <label
                            className={`checkbox-chip ${attendee.decaf ? 'active' : ''}`}
                          >
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
    </section>
  )
}
