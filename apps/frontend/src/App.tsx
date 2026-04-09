import { type ChangeEvent, startTransition, useEffect, useRef, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'
import './App.css'
import { AttendeesPanel } from './components/AttendeesPanel'
import { HeroPanel } from './components/HeroPanel'
import { HomePage } from './components/HomePage'
import { MeetingTopbar } from './components/MeetingTopbar'
import { MenuPanel } from './components/MenuPanel'
import { OcrPanel } from './components/OcrPanel'
import { OrderSummarySheet } from './components/OrderSummarySheet'
import { OrdersPanel } from './components/OrdersPanel'
import { OrganizerPanel } from './components/OrganizerPanel'
import { ParticipantWorkspace } from './components/ParticipantWorkspace'
import { SummaryPanel } from './components/SummaryPanel'
import {
  deleteMeetingFromApi,
  fetchMeetingFromApi,
  fetchMeetingsFromApi,
  saveMeetingToApi,
} from './lib/api'
import {
  type Attendee,
  type MeetingSettings,
  type MenuItem,
  type Snapshot,
  createId,
  formatCountdown,
  formatDeadlineLabel,
  mergeMenuItems,
} from './lib/meeting'
import {
  createMeetingSnapshot,
  createMeetingsStore,
  listMeetings,
  loadMeetingsStore,
  removeMeeting,
  saveMeetingsStore,
  type MeetingsStore,
  upsertMeeting,
} from './lib/meetings-store'
import { formatPrice, parseMenuText } from './lib/menu'

type OcrState = {
  status: 'idle' | 'processing' | 'success' | 'error'
  progress: number
  confidence: number | null
  message: string
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

function AppRoutes() {
  const [store, setStore] = useState<MeetingsStore>(() => loadMeetingsStore())
  const initialStoreRef = useRef(store)

  useEffect(() => {
    saveMeetingsStore(store)
  }, [store])

  useEffect(() => {
    let ignore = false

    async function hydrateFromServer() {
      try {
        const meetings = await fetchMeetingsFromApi()
        const remoteStore = createMeetingsStore(meetings)

        if (
          meetings.length === 0 &&
          Object.keys(initialStoreRef.current).length > 0
        ) {
          await Promise.all(
            Object.values(initialStoreRef.current).map((snapshot) =>
              saveMeetingToApi(snapshot).catch(() => snapshot),
            ),
          )
          return
        }

        if (!ignore) {
          setStore({
            ...initialStoreRef.current,
            ...remoteStore,
          })
        }
      } catch {
        // Keep the local cache when the API is not reachable.
      }
    }

    void hydrateFromServer()

    return () => {
      ignore = true
    }
  }, [])

  function handleCreateMeeting() {
    const snapshot = createMeetingSnapshot()

    setStore((currentStore) => upsertMeeting(currentStore, snapshot))
    void saveMeetingToApi(snapshot)

    return snapshot.meeting.shareCode
  }

  function handleDeleteMeeting(shareCode: string) {
    if (!window.confirm('??紐⑥엫?????紐⑸줉?먯꽌 ??젣?좉퉴??')) {
      return
    }

    setStore((currentStore) => removeMeeting(currentStore, shareCode))
    void deleteMeetingFromApi(shareCode)
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            meetings={listMeetings(store)}
            onCreateMeeting={handleCreateMeeting}
            onDeleteMeeting={handleDeleteMeeting}
          />
        }
      />
      <Route
        path="/meeting/:shareCode/:role"
        element={<MeetingPage store={store} setStore={setStore} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

type MeetingPageProps = {
  store: MeetingsStore
  setStore: React.Dispatch<React.SetStateAction<MeetingsStore>>
}

function MeetingPage({ store, setStore }: MeetingPageProps) {
  const navigate = useNavigate()
  const { shareCode = '', role = '' } = useParams()
  const normalizedCode = shareCode.toUpperCase()
  const normalizedRole = role === 'organizer' || role === 'join' ? role : null
  const snapshot = store[normalizedCode]

  const [ocrState, setOcrState] = useState<OcrState>({
    status: 'idle',
    progress: 0,
    confidence: null,
    message: '硫붾돱???대?吏瑜??щ━硫?OCR???먮룞?쇰줈 ?ㅽ뻾?⑸땲??',
  })
  const [feedback, setFeedback] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSummarySheetOpen, setIsSummarySheetOpen] = useState(false)
  const [hasRemoteLookupFinished, setHasRemoteLookupFinished] = useState(
    Boolean(snapshot),
  )

  useEffect(() => {
    if (!feedback) {
      return undefined
    }

    const timer = window.setTimeout(() => setFeedback(''), 3200)
    return () => window.clearTimeout(timer)
  }, [feedback])

  useEffect(() => {
    setIsSummarySheetOpen(false)
  }, [normalizedCode, normalizedRole])

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  useEffect(() => {
    let ignore = false

    async function loadMeetingFromServer() {
      try {
        const remoteSnapshot = await fetchMeetingFromApi(normalizedCode)

        if (!ignore) {
          setStore((currentStore) => upsertMeeting(currentStore, remoteSnapshot))
        }
      } catch {
        // Keep local state when the server cannot find or load the meeting.
      } finally {
        if (!ignore) {
          setHasRemoteLookupFinished(true)
        }
      }
    }

    if (!normalizedRole || !normalizedCode) {
      return undefined
    }

    void loadMeetingFromServer()

    return () => {
      ignore = true
    }
  }, [normalizedCode, normalizedRole, setStore])

  useEffect(() => {
    if (!snapshot) {
      return undefined
    }

    let ignore = false

    const intervalId = window.setInterval(() => {
      void fetchMeetingFromApi(normalizedCode)
        .then((remoteSnapshot) => {
          if (ignore) {
            return
          }

          setStore((currentStore) => {
            const currentSnapshot = currentStore[normalizedCode]

            if (!currentSnapshot) {
              return upsertMeeting(currentStore, remoteSnapshot)
            }

            if (
              new Date(remoteSnapshot.updatedAt).getTime() >
              new Date(currentSnapshot.updatedAt).getTime()
            ) {
              return upsertMeeting(currentStore, remoteSnapshot)
            }

            return currentStore
          })
        })
        .catch(() => {
          // Polling failures should not interrupt local editing.
        })
    }, 5000)

    return () => {
      ignore = true
      window.clearInterval(intervalId)
    }
  }, [normalizedCode, snapshot, setStore])

  if (!normalizedRole) {
    return <Navigate to="/" replace />
  }

  if (!snapshot) {
    if (!hasRemoteLookupFinished) {
      return (
        <div className="shell">
          <section className="panel not-found-panel">
            <div className="panel-head">
              <div>
                <span className="panel-kicker">불러오는 중</span>
                <h2>모임 정보를 서버에서 확인하고 있습니다.</h2>
              </div>
            </div>
          </section>
        </div>
      )
    }

    return (
      <div className="shell">
        <section className="panel not-found-panel">
          <div className="panel-head">
            <div>
              <span className="panel-kicker">紐⑥엫 ?놁쓬</span>
              <h2>?대떦 肄붾뱶??紐⑥엫??李얠? 紐삵뻽?듬땲??</h2>
            </div>
          </div>
          <p className="panel-note">
            濡쒖뺄 ?꾨줈?좏???湲곗??쇰줈????釉뚮씪?곗?????λ맂 紐⑥엫留??????덉뒿?덈떎.
          </p>
          <div className="button-row">
            <button className="button" type="button" onClick={() => navigate('/')}>
              ?덉쑝濡??대룞
            </button>
          </div>
        </section>
      </div>
    )
  }

  const { meeting, menuItems, attendees, rawOcrText } = snapshot
  const menuLookup = new Map(menuItems.map((item) => [item.id, item]))
  const deadlinePassed =
    Boolean(meeting.deadline) && new Date(meeting.deadline).getTime() <= Date.now()
  const meetingClosed = meeting.manuallyClosed || deadlinePassed
  const completedOrders = attendees.filter((attendee) =>
    attendee.skipped || menuLookup.has(attendee.menuItemId),
  ).length
  const skippedAttendees = attendees.filter((attendee) => attendee.skipped)
  const pendingAttendees = attendees.filter(
    (attendee) => !attendee.skipped && !menuLookup.has(attendee.menuItemId),
  )
  const completionRate =
    attendees.length > 0 ? Math.round((completedOrders / attendees.length) * 100) : 0

  const groupedOrders = Object.values(
    attendees.reduce<
      Record<
        string,
        {
          label: string
          count: number
          amount: number
          people: string[]
        }
      >
    >((groups, attendee) => {
      const menuItem = menuLookup.get(attendee.menuItemId)

      if (!menuItem) {
        return groups
      }

      const options = [
        attendee.temperature || null,
        attendee.size || null,
        attendee.note.trim() || null,
      ].filter(Boolean)
      const label =
        options.length > 0
          ? `${menuItem.name} / ${options.join(' / ')}`
          : menuItem.name
      const key = `${label}::${menuItem.price}`

      if (!groups[key]) {
        groups[key] = {
          label,
          count: 0,
          amount: 0,
          people: [],
        }
      }

      groups[key].count += attendee.quantity
      groups[key].amount += menuItem.price * attendee.quantity
      groups[key].people.push(
        attendee.quantity > 1
          ? `${attendee.name} x${attendee.quantity}`
          : attendee.name,
      )

      return groups
    }, {}),
  ).sort((left, right) => right.count - left.count || right.amount - left.amount)

  const totalAmount = groupedOrders.reduce((sum, group) => sum + group.amount, 0)
  const totalCups = groupedOrders.reduce((sum, group) => sum + group.count, 0)
  const skippedNames = skippedAttendees.map((attendee) => attendee.name).join(', ')
  const pendingNames = pendingAttendees.map((attendee) => attendee.name).join(', ')
  const summaryTextOutput =
    groupedOrders.length === 0
      ? [
          `[${meeting.title || '에콩커피 주문'}]`,
          `카페: ${meeting.cafeName || '미정'}`,
          `장소: ${meeting.place || '미정'}`,
          skippedNames ? `스킵: ${skippedNames}` : '',
          pendingNames
            ? `미선택: ${pendingNames}`
            : '모든 참석자가 응답했습니다.',
        ]
          .filter(Boolean)
          .join('\n')
      : [
          `[${meeting.title || '에콩커피 주문'}]`,
          `카페: ${meeting.cafeName || '미정'}`,
          `장소: ${meeting.place || '미정'}`,
          `취합자: ${meeting.organizer || '미정'}`,
          `마감: ${formatDeadlineLabel(meeting.deadline)}`,
          '',
          ...groupedOrders.map(
            (group, index) =>
              `${index + 1}. ${group.label} x${group.count} (${formatPrice(
                group.amount,
              )}) - ${group.people.join(', ')}`,
          ),
          '',
          `총 ${totalCups}잔 / ${formatPrice(totalAmount)}`,
          skippedNames ? `스킵: ${skippedNames}` : '',
          pendingNames
            ? `미선택: ${pendingNames}`
            : '모든 참석자가 응답했습니다.',
        ]
          .filter(Boolean)
          .join('\n')

  function patchSnapshot(recipe: (currentSnapshot: Snapshot) => Snapshot) {
    if (!snapshot) {
      return
    }

    const nextSnapshot = recipe(snapshot)

    setStore((currentStore) => upsertMeeting(currentStore, nextSnapshot))
    void saveMeetingToApi(nextSnapshot).catch(() => {
      setFeedback('?쒕쾭 ??μ씠 ?좎떆 ?ㅽ뙣?덉뒿?덈떎. ?꾩옱 釉뚮씪?곗? ?곹깭???좎??⑸땲??')
    })
  }

  function updateMeetingField(field: keyof MeetingSettings, value: string | boolean) {
    patchSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      meeting: {
        ...currentSnapshot.meeting,
        [field]: value,
      },
    }))
  }

  function updateMenuField(
    menuItemId: string,
    field: keyof MenuItem,
    value: string | number,
  ) {
    patchSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      menuItems: currentSnapshot.menuItems.map((item) =>
        item.id === menuItemId ? { ...item, [field]: value } : item,
      ),
    }))
  }

  function updateAttendeeField(
    attendeeId: string,
    field: keyof Attendee,
    value: string | number,
  ) {
    patchSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      attendees: currentSnapshot.attendees.map((attendee) =>
        attendee.id === attendeeId
          ? {
              ...attendee,
              [field]: value,
              skipped:
                field === 'menuItemId' && typeof value === 'string' && value
                  ? false
                  : attendee.skipped,
            }
          : attendee,
      ),
    }))
  }

  function handleSkipAttendee(attendeeId: string, skipped: boolean) {
    patchSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      attendees: currentSnapshot.attendees.map((attendee) =>
        attendee.id === attendeeId
          ? {
              ...attendee,
              skipped,
              menuItemId: skipped ? '' : attendee.menuItemId,
              quantity: skipped ? 1 : attendee.quantity,
              temperature: skipped ? '' : attendee.temperature,
              size: skipped ? '' : attendee.size,
              note: skipped ? '' : attendee.note,
            }
          : attendee,
      ),
    }))
  }

  function handleAddMenu(name: string, price: number) {
    patchSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      menuItems: mergeMenuItems(currentSnapshot.menuItems, [
        {
          id: createId('menu'),
          name,
          price,
          source: 'manual',
        },
      ]),
    }))
    setFeedback('?섎룞 硫붾돱瑜?異붽??덉뒿?덈떎.')
  }

  function handleRemoveMenu(menuItemId: string) {
    patchSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      menuItems: currentSnapshot.menuItems.filter((item) => item.id !== menuItemId),
      attendees: currentSnapshot.attendees.map((attendee) =>
        attendee.menuItemId === menuItemId
          ? { ...attendee, menuItemId: '' }
          : attendee,
      ),
    }))
  }

  function handleAddAttendee(name: string, team: string) {
    const newAttendeeId = createId('attendee')

    patchSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      attendees: [
        ...currentSnapshot.attendees,
        {
          id: newAttendeeId,
          name,
          team,
          menuItemId: '',
          skipped: false,
          quantity: 1,
          temperature: '',
          size: '',
          note: '',
        },
      ],
    }))

    return newAttendeeId
  }

  function handleRemoveAttendee(attendeeId: string) {
    patchSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      attendees: currentSnapshot.attendees.filter(
        (attendee) => attendee.id !== attendeeId,
      ),
    }))
  }

  function applyRawTextToMenu() {
    const parsedItems = parseMenuText(rawOcrText).map((candidate) => ({
      id: createId('menu'),
      name: candidate.name,
      price: candidate.price,
      source: 'ocr' as const,
    }))

    if (parsedItems.length === 0) {
      setFeedback('媛寃⑹씠 ?ы븿??硫붾돱 以꾩쓣 李얠? 紐삵뻽?듬땲??')
      return
    }

    patchSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      menuItems: mergeMenuItems(currentSnapshot.menuItems, parsedItems),
    }))
    setFeedback(`${parsedItems.length}媛?硫붾돱瑜?OCR 寃곌낵?먯꽌 諛섏쁺?덉뒿?덈떎.`)
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }

    setImagePreview(URL.createObjectURL(file))
    setOcrState({
      status: 'processing',
      progress: 0,
      confidence: null,
      message:
        'OCR 遺꾩꽍???쒖옉?⑸땲?? 泥??ㅽ뻾? ?몄뼱 紐⑤뜽 ?ㅼ슫濡쒕뱶 ?뚮Ц??議곌툑 ??嫄몃┫ ???덉뒿?덈떎.',
    })

    let worker:
      | Awaited<ReturnType<(typeof import('tesseract.js'))['createWorker']>>
      | null = null

    try {
      const Tesseract = await import('tesseract.js')
      worker = await Tesseract.createWorker('kor+eng', Tesseract.OEM.LSTM_ONLY, {
        logger: (message) => {
          setOcrState((current) => ({
            ...current,
            progress: message.progress,
            message: `OCR 吏꾪뻾瑜?${Math.round(message.progress * 100)}%`,
          }))
        },
      })

      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
        preserve_interword_spaces: '1',
      })

      const result = await worker.recognize(file)
      const text = result.data.text ?? ''
      const parsedItems = parseMenuText(text).map((candidate) => ({
        id: createId('menu'),
        name: candidate.name,
        price: candidate.price,
        source: 'ocr' as const,
      }))

      startTransition(() => {
        patchSnapshot((currentSnapshot) => ({
          ...currentSnapshot,
          rawOcrText: text,
          menuItems: mergeMenuItems(currentSnapshot.menuItems, parsedItems),
        }))
      })

      setOcrState({
        status: 'success',
        progress: 1,
        confidence: result.data.confidence ?? null,
        message:
          parsedItems.length > 0
            ? `${parsedItems.length}媛?硫붾돱 ?꾨낫瑜??먮룞?쇰줈 異붽??덉뒿?덈떎.`
            : 'OCR? ?꾨즺?먯?留?硫붾돱 ?꾨낫瑜?李얠? 紐삵뻽?듬땲?? ?띿뒪?몃? ?섏젙?????ㅼ떆 諛섏쁺?댁＜?몄슂.',
      })
    } catch (error) {
      setOcrState({
        status: 'error',
        progress: 0,
        confidence: null,
        message:
          error instanceof Error
            ? error.message
            : 'OCR 泥섎━ 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.',
      })
    } finally {
      if (worker) {
        await worker.terminate()
      }

      event.target.value = ''
    }
  }

  async function handleCopySummary() {
    if (!summaryTextOutput) {
      setFeedback('아직 복사할 주문 요약이 없습니다.')
      return
    }

    try {
      await navigator.clipboard.writeText(summaryTextOutput)
      setFeedback('주문 요약을 복사했습니다.')
    } catch {
      setFeedback('브라우저 복사 권한이 없어 직접 선택해서 복사해주세요.')
    }
  }

  async function handleCopyPath(nextRole: 'organizer' | 'join') {
    const link = `${window.location.origin}/meeting/${normalizedCode}/${nextRole}`

    try {
      await navigator.clipboard.writeText(link)
      setFeedback(
        nextRole === 'organizer'
          ? '痍⑦빀??留곹겕瑜?蹂듭궗?덉뒿?덈떎.'
          : '李몄꽍??留곹겕瑜?蹂듭궗?덉뒿?덈떎.',
      )
    } catch {
      setFeedback('留곹겕 蹂듭궗 沅뚰븳???놁뼱 吏곸젒 二쇱냼李?URL??蹂듭궗?댁＜?몄슂.')
    }
  }

  function handleResetWorkspace() {
    if (!window.confirm('?꾩옱 痍⑦빀 ?댁슜??珥덇린?뷀븯怨???紐⑥엫 ?곹깭濡??섎룎由닿퉴??')) {
      return
    }

    const freshSnapshot = createMeetingSnapshot()

    patchSnapshot((currentSnapshot) => ({
      ...freshSnapshot,
      meeting: {
        ...freshSnapshot.meeting,
        shareCode: currentSnapshot.meeting.shareCode,
      },
      createdAt: currentSnapshot.createdAt,
    }))

    setOcrState({
      status: 'idle',
      progress: 0,
      confidence: null,
      message: '硫붾돱???대?吏瑜??щ━硫?OCR???먮룞?쇰줈 ?ㅽ뻾?⑸땲??',
    })
    setFeedback('紐⑥엫 ?곗씠?곕? 珥덇린?뷀뻽?듬땲??')
  }

  return (
    <div className="shell">
      <MeetingTopbar
        shareCode={normalizedCode}
        title={meeting.title}
        role={normalizedRole}
        summaryCount={groupedOrders.length}
        onCopyOrganizerLink={() => handleCopyPath('organizer')}
        onCopyParticipantLink={() => handleCopyPath('join')}
        onOpenSummary={() => setIsSummarySheetOpen(true)}
      />
      <HeroPanel
        meetingClosed={meetingClosed}
        shareCode={meeting.shareCode}
        countdown={formatCountdown(meeting.deadline)}
        menuCount={menuItems.length}
        attendeeCount={attendees.length}
        completionRate={completionRate}
        completedOrders={completedOrders}
        totalAmount={totalAmount}
        totalCups={totalCups}
      />
      <OrderSummarySheet
        open={isSummarySheetOpen}
        groupedOrders={groupedOrders.map((group) => ({
          label: group.label,
          count: group.count,
          amount: formatPrice(group.amount),
          people: group.people.join(', '),
        }))}
        totalCups={totalCups}
        totalAmount={formatPrice(totalAmount)}
        pendingNames={pendingNames}
        skippedNames={skippedNames}
        onClose={() => setIsSummarySheetOpen(false)}
      />
      {feedback ? <div className="feedback-banner">{feedback}</div> : null}
      {normalizedRole === 'organizer' ? (
        <main className="workspace-grid">
          <OrganizerPanel
            meeting={meeting}
            meetingClosed={meetingClosed}
            deadlinePassed={deadlinePassed}
            deadlineLabel={formatDeadlineLabel(meeting.deadline)}
            onChange={updateMeetingField}
            onToggleManualClose={() =>
              updateMeetingField('manuallyClosed', !meeting.manuallyClosed)
            }
            onReset={handleResetWorkspace}
          />
          <OcrPanel
            ocrState={ocrState}
            imagePreview={imagePreview}
            rawOcrText={rawOcrText}
            onUpload={handleImageUpload}
            onRawTextChange={(value) =>
              patchSnapshot((currentSnapshot) => ({
                ...currentSnapshot,
                rawOcrText: value,
              }))
            }
            onApplyRawText={applyRawTextToMenu}
          />
          <MenuPanel
            menuItems={menuItems}
            onAddMenu={handleAddMenu}
            onUpdateMenu={updateMenuField}
            onRemoveMenu={handleRemoveMenu}
          />
          <AttendeesPanel
            attendees={attendees}
            onAddAttendee={handleAddAttendee}
            onRemoveAttendee={handleRemoveAttendee}
          />
          <OrdersPanel
            attendees={attendees}
            menuItems={menuItems}
            meetingClosed={meetingClosed}
            onUpdateAttendee={updateAttendeeField}
            onSkipAttendee={handleSkipAttendee}
          />
          <SummaryPanel
            groupedOrders={groupedOrders.map((group) => ({
              label: group.label,
              count: group.count,
              amount: formatPrice(group.amount),
              people: group.people.join(', '),
            }))}
            totalCups={totalCups}
            totalAmount={formatPrice(totalAmount)}
            pendingNames={pendingNames}
            skippedNames={skippedNames}
            summaryText={summaryTextOutput}
            onCopy={handleCopySummary}
          />
        </main>
      ) : (
        <ParticipantWorkspace
          snapshot={snapshot}
          meetingClosed={meetingClosed}
          onAddAttendee={handleAddAttendee}
          onUpdateAttendee={updateAttendeeField}
          onSkipAttendee={handleSkipAttendee}
        />
      )}
    </div>
  )
}

export default App

