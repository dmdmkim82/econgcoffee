import { type MeetingSettings } from '../lib/meeting'

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
          <span className="panel-kicker">취합자 설정</span>
          <h2>모임 기본 정보</h2>
        </div>
        <span className={`status-pill ${meetingClosed ? 'danger' : 'soft'}`}>
          {meetingClosed ? '닫힘' : '열림'}
        </span>
      </div>
      <div className="field-grid">
        <label className="field">
          <span>모임명</span>
          <input
            value={meeting.title}
            onChange={(event) => onChange('title', event.target.value)}
            placeholder="예: 주간 공정회의 커피"
          />
        </label>
        <label className="field">
          <span>카페명</span>
          <input
            value={meeting.cafeName}
            onChange={(event) => onChange('cafeName', event.target.value)}
            placeholder="예: 메가커피 서린점"
          />
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
            placeholder="회의실 또는 층수"
          />
        </label>
        <label className="field field-full">
          <span>취합 마감시간</span>
          <input
            type="datetime-local"
            value={meeting.deadline}
            onChange={(event) => onChange('deadline', event.target.value)}
          />
          <small>{deadlineLabel}</small>
        </label>
        <label className="field field-full">
          <span>운영 메모</span>
          <textarea
            value={meeting.notes}
            onChange={(event) => onChange('notes', event.target.value)}
            rows={4}
            placeholder="수령 장소, 얼음 관련 안내, 주문 공지 등을 적어두세요."
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
          새 모임 시작
        </button>
      </div>
      <p className="panel-note">
        취합자는 모임 정보, 마감시간, 주문 입력 가능 여부를 관리합니다.
      </p>
    </section>
  )
}
