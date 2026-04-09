import { type Attendee, type Snapshot } from '../lib/meeting'
import { QuickOrderPanel } from './QuickOrderPanel'

type ParticipantWorkspaceProps = {
  snapshot: Snapshot
  meetingClosed: boolean
  showPrices: boolean
  onAddAttendee: (name: string, team: string) => string
  onUpdateAttendee: (
    attendeeId: string,
    field: keyof Attendee,
    value: string | number | boolean,
  ) => void
  onSkipAttendee: (attendeeId: string, skipped: boolean) => void
}

export function ParticipantWorkspace({
  snapshot,
  meetingClosed,
  showPrices,
  onAddAttendee,
  onUpdateAttendee,
  onSkipAttendee,
}: ParticipantWorkspaceProps) {
  const { meeting } = snapshot

  return (
    <div className="participant-layout">
      <QuickOrderPanel
        snapshot={snapshot}
        meetingClosed={meetingClosed}
        showPrices={showPrices}
        variant="participant"
        onAddAttendee={onAddAttendee}
        onUpdateAttendee={onUpdateAttendee}
        onSkipAttendee={onSkipAttendee}
      />

      {meeting.notes ? (
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="panel-kicker">안내 메모</span>
              <h2>취합자가 남긴 안내</h2>
            </div>
          </div>
          <div className="notice-box">
            <p>{meeting.notes}</p>
          </div>
        </section>
      ) : null}
    </div>
  )
}
