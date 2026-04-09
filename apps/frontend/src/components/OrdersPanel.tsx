import { type Attendee, type MenuItem } from '../lib/meeting'
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
    value: string | number,
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

  return (
    <section className="panel panel-wide">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">주문 입력</span>
          <h2>참석자별 메뉴 선택</h2>
        </div>
        <span className={`status-pill ${meetingClosed ? 'danger' : 'soft'}`}>
          {meetingClosed ? '입력 종료' : '입력 가능'}
        </span>
      </div>
      <p className="panel-note">
        미선택 참석자가 먼저 보이고, 커피를 마시지 않는 사람은 카드에서 바로
        안마심 처리할 수 있습니다.
      </p>
      {attendees.length === 0 ? (
        <div className="empty-state">
          참석자를 추가하면 이 영역에서 메뉴와 수량, 온도, 요청사항을 바로
          관리할 수 있습니다.
        </div>
      ) : (
        <div className="order-grid">
          {sortedAttendees.map((attendee) => {
            const fieldsDisabled = meetingClosed || attendee.skipped
            const selectedMenu = menuItems.find((item) => item.id === attendee.menuItemId)
            const statusTone = attendee.skipped
              ? 'skip'
              : attendee.menuItemId
                ? 'live'
                : 'neutral'
            const statusLabel = attendee.skipped
              ? '스킵'
              : attendee.menuItemId
                ? '완료'
                : '미선택'

            return (
              <article className="order-card" key={attendee.id}>
                <div className="order-card-head">
                  <div>
                    <h3>{attendee.name}</h3>
                    <p>{attendee.team || '팀 정보 없음'}</p>
                  </div>
                  <span className={`status-pill ${statusTone}`}>{statusLabel}</span>
                </div>
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
                          : '메뉴를 선택해주세요'}
                      </option>
                      {menuItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                          {showPrices ? ` (${formatVisiblePrice(item.price, showPrices)})` : ''}
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
                      <div className="selection-hint">메뉴를 먼저 선택해주세요.</div>
                    )}
                  </div>
                  <label className="field">
                    <span>사이즈</span>
                    <select
                      value={attendee.size}
                      disabled={fieldsDisabled}
                      onChange={(event) =>
                        onUpdateAttendee(attendee.id, 'size', event.target.value)
                      }
                    >
                      <option value="">기본</option>
                      <option value="Regular">기본</option>
                      <option value="Large">대</option>
                    </select>
                  </label>
                  <label className="field field-full">
                    <span>추가 요청</span>
                    <input
                      value={attendee.note}
                      disabled={fieldsDisabled}
                      onChange={(event) =>
                        onUpdateAttendee(attendee.id, 'note', event.target.value)
                      }
                      placeholder="샷 추가, 얼음 적게, 덜 달게"
                    />
                  </label>
                </div>
                {attendee.skipped ? (
                  <p className="field-disabled-note">
                    이번 모임에서는 커피를 마시지 않는 참석자로 표시됩니다.
                  </p>
                ) : null}
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
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
