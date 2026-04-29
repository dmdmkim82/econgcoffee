import { type Attendee, type Snapshot } from '../lib/meeting'
import { OrdersPanel } from './OrdersPanel'
import { QuickOrderPanel } from './QuickOrderPanel'

type ParticipantWorkspaceProps = {
  snapshot: Snapshot
  meetingClosed: boolean
  showPrices: boolean
  utilityBar?: React.ReactNode
  onCompleteOrder: (attendeeId: string, attendeeName: string) => void
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
  utilityBar,
  onCompleteOrder,
  onAddAttendee,
  onUpdateAttendee,
  onSkipAttendee,
}: ParticipantWorkspaceProps) {
  const { meeting, attendees, menuItems } = snapshot

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
        onCompleteOrder={onCompleteOrder}
      />
      <OrdersPanel
        attendees={attendees}
        menuItems={menuItems}
        meetingClosed={meetingClosed}
        showPrices={showPrices}
        onUpdateAttendee={onUpdateAttendee}
        onSkipAttendee={onSkipAttendee}
        onCompleteOrder={onCompleteOrder}
      />

      {utilityBar}

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
