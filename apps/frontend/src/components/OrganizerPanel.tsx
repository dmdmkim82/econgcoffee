import { CAFE_PRESETS, type MeetingSettings } from '../lib/meeting'

type OrganizerPanelProps = {
  meeting: MeetingSettings
  meetingClosed: boolean
  deadlinePassed: boolean
  deadlineLabel: string
  onChange: (field: keyof MeetingSettings, value: string | boolean) => void
  onToggleManualClose: () => void
  onReset: () => void
}

export function OrganizerPanel({
  meeting,
  meetingClosed,
  deadlinePassed,
  deadlineLabel,
  onChange,
  onToggleManualClose,
  onReset,
}: OrganizerPanelProps) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">취합 설정</span>
          <h2>모임 기본 정보</h2>
        </div>
        <span className={`status-pill ${meetingClosed ? 'danger' : 'soft'}`}>
          {meetingClosed ? '마감됨' : '열림'}
        </span>
      </div>
      <div className="field-grid">
        <label className="field">
          <span>모임 이름</span>
          <input
            value={meeting.title}
            onChange={(event) => onChange('title', event.target.value)}
            placeholder="예: 공정회의 커피 주문"
          />
        </label>
        <label className="field">
          <span>카페 이름</span>
          <input
            value={meeting.cafeName}
            onChange={(event) => onChange('cafeName', event.target.value)}
            placeholder="예: 카페 아뜰리에"
          />
          <div className="button-row inline-chip-row">
            {CAFE_PRESETS.map((cafeName) => (
              <button
                className={`button ghost small ${
                  meeting.cafeName === cafeName ? 'active-chip' : ''
                }`}
                key={cafeName}
                type="button"
                onClick={() => onChange('cafeName', cafeName)}
              >
                {cafeName}
              </button>
            ))}
          </div>
        </label>
        <label className="field">
          <span>취합자</span>
          <input
            value={meeting.organizer}
            onChange={(event) => onChange('organizer', event.target.value)}
            placeholder="담당자 이름"
          />
        </label>
        <label className="field">
          <span>미팅 장소</span>
          <input
            value={meeting.place}
            onChange={(event) => onChange('place', event.target.value)}
            placeholder="회의실 이름 또는 위치"
          />
        </label>
        <label className="field field-full">
          <span>취합 마감 시간</span>
          <input
            type="datetime-local"
            value={meeting.deadline}
            onChange={(event) => onChange('deadline', event.target.value)}
          />
          <small>{deadlineLabel}</small>
        </label>
        <label className="field field-full">
          <span>안내 메모</span>
          <textarea
            value={meeting.notes}
            onChange={(event) => onChange('notes', event.target.value)}
            rows={4}
            placeholder="배달 위치, 얼음 안내, 취합 공지 등을 적어주세요."
          />
        </label>
      </div>
      <div className="button-row">
        <button
          className="button"
          type="button"
          disabled={deadlinePassed}
          onClick={onToggleManualClose}
        >
          {meeting.manuallyClosed ? '취합 다시 열기' : '지금 마감'}
        </button>
        <button className="button secondary" type="button" onClick={onReset}>
          새 모임처럼 초기화
        </button>
      </div>
      <p className="panel-note">
        이 섹션은 취합자가 마감 시간, 장소, 공지 문구를 조정할 때만 확인하면
        됩니다.
      </p>
    </section>
  )
}
