import { useMemo, useState, type FormEvent } from 'react'
import { type Attendee, type Snapshot } from '../lib/meeting'
import { formatPrice } from '../lib/menu'

type ParticipantWorkspaceProps = {
  snapshot: Snapshot
  meetingClosed: boolean
  onAddAttendee: (name: string, team: string) => string
  onUpdateAttendee: (
    attendeeId: string,
    field: keyof Attendee,
    value: string | number,
  ) => void
  onSkipAttendee: (attendeeId: string, skipped: boolean) => void
}

export function ParticipantWorkspace({
  snapshot,
  meetingClosed,
  onAddAttendee,
  onUpdateAttendee,
  onSkipAttendee,
}: ParticipantWorkspaceProps) {
  const { meeting, attendees, menuItems } = snapshot
  const [selectedAttendeeId, setSelectedAttendeeId] = useState('')
  const [newName, setNewName] = useState('')
  const [newTeam, setNewTeam] = useState('')

  const activeAttendeeId = attendees.some(
    (attendee) => attendee.id === selectedAttendeeId,
  )
    ? selectedAttendeeId
    : attendees[0]?.id ?? ''

  const selectedAttendee = attendees.find(
    (attendee) => attendee.id === activeAttendeeId,
  )
  const selectedMenu = menuItems.find(
    (item) => item.id === selectedAttendee?.menuItemId,
  )

  const completionStats = useMemo(() => {
    const completed = attendees.filter(
      (attendee) => attendee.skipped || attendee.menuItemId,
    ).length

    return {
      completed,
      total: attendees.length,
    }
  }, [attendees])

  function handleAddSelf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (meetingClosed || !newName.trim()) {
      return
    }

    const attendeeId = onAddAttendee(newName.trim(), newTeam.trim())
    setSelectedAttendeeId(attendeeId)
    setNewName('')
    setNewTeam('')
  }

  const orderFieldsDisabled =
    meetingClosed || !selectedAttendee || selectedAttendee.skipped
  const statusTone = selectedAttendee?.skipped
    ? 'skip'
    : selectedAttendee?.menuItemId
      ? 'live'
      : 'neutral'
  const statusLabel = selectedAttendee?.skipped
    ? '스킵'
    : selectedAttendee?.menuItemId
      ? '선택 완료'
      : '미선택'

  return (
    <div className="participant-layout">
      <section className="panel participant-summary">
        <div className="panel-head">
          <div>
            <span className="panel-kicker">참석자 화면</span>
            <h2>내 주문 입력</h2>
          </div>
          <span className={`status-pill ${meetingClosed ? 'danger' : 'live'}`}>
            {meetingClosed ? '마감됨' : '선택 가능'}
          </span>
        </div>
        <div className="participant-meta-grid">
          <article className="mini-stat">
            <span>카페</span>
            <strong>{meeting.cafeName || '미정'}</strong>
          </article>
          <article className="mini-stat">
            <span>장소</span>
            <strong>{meeting.place || '미정'}</strong>
          </article>
          <article className="mini-stat">
            <span>진행 현황</span>
            <strong>
              {completionStats.completed}/{completionStats.total}
            </strong>
          </article>
        </div>
        {meeting.notes ? (
          <div className="notice-box">
            <strong>취합자 메모</strong>
            <p>{meeting.notes}</p>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-kicker">참석자 선택</span>
            <h2>내 이름 선택 또는 추가</h2>
          </div>
        </div>
        <label className="field">
          <span>기존 참석자에서 선택</span>
          <select
            value={activeAttendeeId}
            onChange={(event) => setSelectedAttendeeId(event.target.value)}
          >
            <option value="">이름을 선택해주세요</option>
            {attendees.map((attendee) => (
              <option key={attendee.id} value={attendee.id}>
                {attendee.name}
                {attendee.team ? ` · ${attendee.team}` : ''}
                {attendee.skipped
                  ? ' (스킵)'
                  : attendee.menuItemId
                    ? ' (완료)'
                    : ''}
              </option>
            ))}
          </select>
        </label>
        <form className="inline-form stacked" onSubmit={handleAddSelf}>
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="새 참석자 이름"
          />
          <input
            value={newTeam}
            onChange={(event) => setNewTeam(event.target.value)}
            placeholder="팀 또는 부서"
          />
          <button className="button" type="submit" disabled={meetingClosed}>
            내 이름 추가
          </button>
        </form>
      </section>

      <section className="panel panel-wide">
        <div className="panel-head">
          <div>
            <span className="panel-kicker">주문 입력</span>
            <h2>선택한 참석자 주문</h2>
          </div>
        </div>
        {!selectedAttendee ? (
          <div className="empty-state">
            참석자를 선택하거나 본인 이름을 추가하면 주문을 입력할 수 있습니다.
          </div>
        ) : (
          <div className="participant-order-grid">
            <div className="participant-order-form">
              <div className="order-card-head">
                <div>
                  <h3>{selectedAttendee.name}</h3>
                  <p>{selectedAttendee.team || '팀 정보 없음'}</p>
                </div>
                <span className={`status-pill ${statusTone}`}>{statusLabel}</span>
              </div>
              <div className="order-fields">
                <label className="field field-full">
                  <span>메뉴 선택</span>
                  <select
                    value={selectedAttendee.menuItemId}
                    disabled={orderFieldsDisabled || menuItems.length === 0}
                    onChange={(event) =>
                      onUpdateAttendee(
                        selectedAttendee.id,
                        'menuItemId',
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      {menuItems.length === 0
                        ? '등록된 메뉴가 없습니다'
                        : '메뉴를 선택해주세요'}
                    </option>
                    {menuItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({formatPrice(item.price)})
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
                    value={selectedAttendee.quantity}
                    disabled={orderFieldsDisabled}
                    onChange={(event) =>
                      onUpdateAttendee(
                        selectedAttendee.id,
                        'quantity',
                        Math.min(9, Math.max(1, Number(event.target.value || 1))),
                      )
                    }
                  />
                </label>
                <label className="field">
                  <span>온도</span>
                  <select
                    value={selectedAttendee.temperature}
                    disabled={orderFieldsDisabled}
                    onChange={(event) =>
                      onUpdateAttendee(
                        selectedAttendee.id,
                        'temperature',
                        event.target.value,
                      )
                    }
                  >
                    <option value="">기본</option>
                    <option value="ICE">ICE</option>
                    <option value="HOT">HOT</option>
                  </select>
                </label>
                <label className="field">
                  <span>사이즈</span>
                  <select
                    value={selectedAttendee.size}
                    disabled={orderFieldsDisabled}
                    onChange={(event) =>
                      onUpdateAttendee(selectedAttendee.id, 'size', event.target.value)
                    }
                  >
                    <option value="">기본</option>
                    <option value="Regular">기본</option>
                    <option value="Large">라지</option>
                  </select>
                </label>
                <label className="field field-full">
                  <span>추가 요청</span>
                  <input
                    value={selectedAttendee.note}
                    disabled={orderFieldsDisabled}
                    onChange={(event) =>
                      onUpdateAttendee(selectedAttendee.id, 'note', event.target.value)
                    }
                    placeholder="샷 추가, 얼음 적게, 연하게 등"
                  />
                </label>
              </div>
              {selectedAttendee.skipped ? (
                <p className="field-disabled-note">
                  이번 모임에서 이 참석자는 커피를 주문하지 않는 상태로 기록됩니다.
                </p>
              ) : null}
              <div className="button-row order-card-actions">
                <button
                  aria-pressed={selectedAttendee.skipped}
                  className="button ghost small"
                  type="button"
                  disabled={meetingClosed}
                  onClick={() =>
                    onSkipAttendee(
                      selectedAttendee.id,
                      !selectedAttendee.skipped,
                    )
                  }
                >
                  {selectedAttendee.skipped ? '스킵 취소' : '안마심'}
                </button>
              </div>
            </div>

            <div className="participant-side-column">
              <div className="preview-card">
                <h3>내 주문 미리보기</h3>
                {selectedAttendee.skipped ? (
                  <div className="personal-summary">
                    <strong>이번 주문 스킵</strong>
                    <p>커피를 마시지 않는 참석자로 취합됩니다.</p>
                    <span>필요하면 스킵을 취소하고 메뉴를 다시 선택할 수 있습니다.</span>
                  </div>
                ) : selectedMenu ? (
                  <div className="personal-summary">
                    <strong>{selectedMenu.name}</strong>
                    <p>
                      {selectedAttendee.quantity}잔 · {formatPrice(selectedMenu.price)}
                    </p>
                    <span>
                      {selectedAttendee.temperature || '기본'} /{' '}
                      {selectedAttendee.size || '기본'} /{' '}
                      {selectedAttendee.note || '요청 없음'}
                    </span>
                  </div>
                ) : (
                  <div className="empty-state compact">
                    아직 선택한 메뉴가 없습니다.
                  </div>
                )}
              </div>
              <div className="preview-card">
                <h3>메뉴 목록</h3>
                {menuItems.length === 0 ? (
                  <div className="empty-state compact">
                    아직 등록된 메뉴가 없습니다.
                  </div>
                ) : (
                  <div className="catalog-list">
                    {menuItems.map((item) => (
                      <div className="catalog-row" key={item.id}>
                        <strong>{item.name}</strong>
                        <span>{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
