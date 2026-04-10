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
import { MeetingUtilityBar } from './components/MeetingUtilityBar'
import { MenuPanel } from './components/MenuPanel'
import { MoreSheet } from './components/MoreSheet'
import { OcrPanel } from './components/OcrPanel'
import { OrderSummarySheet } from './components/OrderSummarySheet'
import { OrdersPanel } from './components/OrdersPanel'
import { OrganizerPanel } from './components/OrganizerPanel'
import { ParticipantWorkspace } from './components/ParticipantWorkspace'
import { QuickOrderPanel } from './components/QuickOrderPanel'
import { ShareLinkSheet } from './components/ShareLinkSheet'
import { SummaryPanel } from './components/SummaryPanel'
import {
  apiSyncEnabled,
  deleteMeetingFromApi,
  fetchMeetingFromApi,
  fetchMeetingsFromApi,
  saveMeetingToApi,
} from './lib/api'
import {
    type Attendee,
    type MeetingSettings,
    type MenuItem,
    type NutritionInfo,
    type Snapshot,
    type TemperatureOption,
  createLatelierMenuItems,
  createId,
  formatCountdown,
  formatDeadlineLabel,
  getMenuDisplayPrice,
  inferTemperaturesFromMenuName,
  isCoffeeMenuName,
  mergeMenuItems,
  normalizeSnapshot,
  resolveTemperatureSelection,
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

const PRICE_VISIBILITY_STORAGE_KEY = 'ekong-coffee-show-prices'
const THEME_STORAGE_KEY = 'ekong-coffee-theme'

type ThemeMode = 'light' | 'dark'

function getStoredTheme(): ThemeMode {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return storedTheme === 'light' ? 'light' : 'dark'
}

type OcrState = {
  status: 'idle' | 'processing' | 'success' | 'error'
  progress: number
  confidence: number | null
  message: string
}

type ShareTarget = {
  role: 'organizer' | 'join'
  title: string
  description: string
  link: string
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
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme())
  const initialStoreRef = useRef(store)

  useEffect(() => {
    saveMeetingsStore(store)
  }, [store])

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    let ignore = false

    async function hydrateFromServer() {
      if (!apiSyncEnabled) {
        return
      }

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
    if (apiSyncEnabled) {
      void saveMeetingToApi(snapshot).catch(() => {
        // Keep the local meeting when the API is unavailable.
      })
    }

    return snapshot.meeting.shareCode
  }

  function handleDeleteMeeting(shareCode: string) {
    if (!window.confirm('이 모임을 최근 목록에서 삭제할까요?')) {
      return
    }

    setStore((currentStore) => removeMeeting(currentStore, shareCode))
    if (apiSyncEnabled) {
      void deleteMeetingFromApi(shareCode).catch(() => {
        // Keep the local deletion even if the API is unavailable.
      })
    }
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            meetings={listMeetings(store)}
            theme={theme}
            onCreateMeeting={handleCreateMeeting}
            onDeleteMeeting={handleDeleteMeeting}
            onToggleTheme={() =>
              setTheme((currentTheme) =>
                currentTheme === 'dark' ? 'light' : 'dark',
              )
            }
          />
        }
      />
      <Route
        path="/meeting/:shareCode/:role"
        element={
          <MeetingPage
            store={store}
            setStore={setStore}
            theme={theme}
            onToggleTheme={() =>
              setTheme((currentTheme) =>
                currentTheme === 'dark' ? 'light' : 'dark',
              )
            }
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

type MeetingPageProps = {
  store: MeetingsStore
  setStore: React.Dispatch<React.SetStateAction<MeetingsStore>>
  theme: ThemeMode
  onToggleTheme: () => void
}

function MeetingPage({
  store,
  setStore,
  theme,
  onToggleTheme,
}: MeetingPageProps) {
  const navigate = useNavigate()
  const { shareCode = '', role = '' } = useParams()
  const normalizedCode = shareCode.toUpperCase()
  const normalizedRole = role === 'organizer' || role === 'join' ? role : null
  const snapshot = store[normalizedCode]
  const latestSnapshotRef = useRef(snapshot)

  const [ocrState, setOcrState] = useState<OcrState>({
    status: 'idle',
    progress: 0,
    confidence: null,
    message: '메뉴 이미지를 올리면 OCR이 자동으로 실행됩니다.',
  })
  const [feedback, setFeedback] = useState('')
  const [completionToast, setCompletionToast] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSummarySheetOpen, setIsSummarySheetOpen] = useState(false)
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false)
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null)
  const [showPrices, setShowPrices] = useState(() => {
    const storedValue = window.localStorage.getItem(PRICE_VISIBILITY_STORAGE_KEY)
    return storedValue !== 'false'
  })
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
    if (!completionToast) {
      return undefined
    }

    const timer = window.setTimeout(() => setCompletionToast(''), 1650)
    return () => window.clearTimeout(timer)
  }, [completionToast])

  useEffect(() => {
    setIsSummarySheetOpen(false)
    setIsMoreSheetOpen(false)
    setShareTarget(null)
    setCompletionToast('')
  }, [normalizedCode, normalizedRole])

  useEffect(() => {
    latestSnapshotRef.current = snapshot
  }, [snapshot])

  useEffect(() => {
    window.localStorage.setItem(
      PRICE_VISIBILITY_STORAGE_KEY,
      String(showPrices),
    )
  }, [showPrices])

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
      if (!apiSyncEnabled) {
        if (!ignore) {
          setHasRemoteLookupFinished(true)
        }

        return
      }

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

    if (!apiSyncEnabled) {
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

      const unitPrice = getMenuDisplayPrice(menuItem, attendee.decaf)
      const options = [
        attendee.temperature || null,
        attendee.decaf ? '디카페인' : null,
        attendee.note.trim() || null,
      ].filter(Boolean)
      const label =
        options.length > 0
          ? `${menuItem.name} / ${options.join(' / ')}`
          : menuItem.name
      const key = `${label}::${unitPrice}`

      if (!groups[key]) {
        groups[key] = {
          label,
          count: 0,
          amount: 0,
          people: [],
        }
      }

      groups[key].count += attendee.quantity
      groups[key].amount += unitPrice * attendee.quantity
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
              `${index + 1}. ${group.label} · ${group.count}잔 · ${
                showPrices ? formatPrice(group.amount) : '금액 숨김'
              } - ${group.people.join(', ')}`,
          ),
          '',
          `총 ${totalCups}잔 / ${
            showPrices ? formatPrice(totalAmount) : '금액 숨김'
          }`,
          skippedNames ? `스킵: ${skippedNames}` : '',
          pendingNames
            ? `미선택: ${pendingNames}`
            : '모든 참석자가 응답했습니다.',
        ]
          .filter(Boolean)
          .join('\n')

  function patchSnapshot(recipe: (currentSnapshot: Snapshot) => Snapshot) {
    const baseSnapshot = latestSnapshotRef.current

    if (!baseSnapshot) {
      return
    }

    const nextSnapshot = normalizeSnapshot(recipe(baseSnapshot))
    latestSnapshotRef.current = nextSnapshot

    setStore((currentStore) => upsertMeeting(currentStore, nextSnapshot))

    if (!apiSyncEnabled) {
      return
    }

    void saveMeetingToApi(nextSnapshot).catch(() => {
      setFeedback('서버 저장에 실패해 현재 브라우저 상태로만 유지합니다.')
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
    value: string | number | TemperatureOption[] | NutritionInfo | null,
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
    value: string | number | boolean,
  ) {
    patchSnapshot((currentSnapshot) => {
      const menuLookup = new Map(
        currentSnapshot.menuItems.map((item) => [item.id, item]),
      )

      return {
        ...currentSnapshot,
        attendees: currentSnapshot.attendees.map((attendee) => {
          if (attendee.id !== attendeeId) {
            return attendee
          }

          if (field === 'menuItemId') {
            const nextMenuItemId = typeof value === 'string' ? value : ''
            const selectedMenu = menuLookup.get(nextMenuItemId)

            return {
              ...attendee,
              menuItemId: nextMenuItemId,
              skipped: nextMenuItemId ? false : attendee.skipped,
              decaf:
                attendee.decaf && Boolean(selectedMenu && isCoffeeMenuName(selectedMenu.name)),
              temperature: resolveTemperatureSelection(
                attendee.temperature,
                selectedMenu,
              ),
            }
          }

          if (field === 'temperature') {
            const selectedMenu = menuLookup.get(attendee.menuItemId)
            const nextTemperature =
              value === 'HOT' || value === 'ICE' ? value : ''

            return {
              ...attendee,
              temperature: resolveTemperatureSelection(
                nextTemperature,
                selectedMenu,
              ),
            }
          }

          if (field === 'decaf') {
            const selectedMenu = menuLookup.get(attendee.menuItemId)

            return {
              ...attendee,
              decaf:
                Boolean(value) &&
                Boolean(selectedMenu && isCoffeeMenuName(selectedMenu.name)),
            }
          }

          return {
            ...attendee,
            [field]: value,
          }
        }),
      }
    })
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
              decaf: skipped ? false : attendee.decaf,
              size: skipped ? '' : attendee.size,
              note: skipped ? '' : attendee.note,
            }
          : attendee,
      ),
    }))
  }

  function handleAddMenu(
    name: string,
    price: number,
    availableTemperatures: TemperatureOption[],
  ) {
    patchSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
        menuItems: mergeMenuItems(currentSnapshot.menuItems, [
          {
            id: createId('menu'),
            name,
            price,
            availableTemperatures,
            nutritionInfo: null,
            source: 'manual',
          },
        ]),
    }))
    setFeedback('수동 메뉴를 추가했습니다.')
  }

  function handleLoadPresetMenu() {
    patchSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      menuItems: mergeMenuItems(
        currentSnapshot.menuItems,
        createLatelierMenuItems(),
      ),
      meeting: {
        ...currentSnapshot.meeting,
        cafeName: currentSnapshot.meeting.cafeName || "L'atelier",
      },
    }))
    setFeedback('이미지 메뉴를 현재 모임에 추가했습니다.')
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
          decaf: false,
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
      availableTemperatures: inferTemperaturesFromMenuName(candidate.name),
      nutritionInfo: null,
      source: 'ocr' as const,
    }))

    if (parsedItems.length === 0) {
      setFeedback('가격이 포함된 메뉴 줄을 찾지 못했습니다.')
      return
    }

    patchSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      menuItems: mergeMenuItems(currentSnapshot.menuItems, parsedItems),
    }))
    setFeedback(`${parsedItems.length}개 메뉴를 OCR 결과에서 반영했습니다.`)
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
        availableTemperatures: inferTemperaturesFromMenuName(candidate.name),
        nutritionInfo: null,
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

  function buildMeetingLink(nextRole: 'organizer' | 'join') {
    return `${window.location.origin}/meeting/${normalizedCode}/${nextRole}`
  }

  function openShareSheet(nextRole: 'organizer' | 'join') {
    const isOrganizer = nextRole === 'organizer'

    setIsMoreSheetOpen(false)
    setShareTarget({
      role: nextRole,
      title: isOrganizer ? '취합 링크 공유' : '참석 링크 공유',
      description: isOrganizer
        ? '취합자용 링크입니다. 관리와 최종 주문 취합에 사용합니다.'
        : '참석자용 링크입니다. 이름 입력 후 메뉴 선택에 사용합니다.',
      link: buildMeetingLink(nextRole),
    })
  }

  async function handleCopyPath(nextRole: 'organizer' | 'join') {
    const link = buildMeetingLink(nextRole)

    try {
      await navigator.clipboard.writeText(link)
      setFeedback(
        nextRole === 'organizer'
          ? '취합 링크를 복사했습니다.'
          : '참석 링크를 복사했습니다.',
      )
    } catch {
      setFeedback('브라우저 복사 권한이 없어 직접 링크를 복사해주세요.')
    }
  }

  async function handleShareToKakao(nextRole: 'organizer' | 'join') {
    const link = buildMeetingLink(nextRole)
    const title = meeting.title || '에콩커피'
    const text =
      nextRole === 'organizer'
        ? `${title} 취합 링크입니다.`
        : `${title} 참석 링크입니다.`

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: link,
        })
        setFeedback('공유 창을 열었습니다. 카카오톡을 선택해 공유해 주세요.')
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
      }
    }

    await handleCopyPath(nextRole)
    setFeedback('이 브라우저에서는 공유 창을 지원하지 않아 링크를 복사했습니다.')
  }

  function handleResetWorkspace() {
    if (!window.confirm('현재 취합 내용을 초기화하고 새 모임 상태로 되돌릴까요?')) {
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
      message: '메뉴 이미지를 올리면 OCR이 자동으로 실행됩니다.',
    })
    setFeedback('모임 데이터를 초기화했습니다.')
  }

  function handleCompleteOrder(attendeeName: string) {
    setCompletionToast(`${attendeeName}님 주문 완료!`)
  }

  return (
    <div className="shell">
      <MeetingTopbar
        shareCode={normalizedCode}
        title={meeting.title}
        role={normalizedRole}
      />
      <MoreSheet
        open={isMoreSheetOpen}
        role={normalizedRole}
        showPrices={showPrices}
        theme={theme}
        onClose={() => setIsMoreSheetOpen(false)}
        onOpenSummary={() => setIsSummarySheetOpen(true)}
        onOpenOrganizerShare={() => openShareSheet('organizer')}
        onOpenParticipantShare={() => openShareSheet('join')}
        onTogglePriceVisibility={() => setShowPrices((currentValue) => !currentValue)}
        onToggleTheme={onToggleTheme}
      />
      <ShareLinkSheet
        open={Boolean(shareTarget)}
        title={shareTarget?.title ?? ''}
        description={shareTarget?.description ?? ''}
        link={shareTarget?.link ?? ''}
        onClose={() => setShareTarget(null)}
        onCopy={() => handleCopyPath(shareTarget?.role ?? 'join')}
        onShareToKakao={() => handleShareToKakao(shareTarget?.role ?? 'join')}
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
        showPrices={showPrices}
        onClose={() => setIsSummarySheetOpen(false)}
      />
      {completionToast ? (
        <div className="completion-toast-overlay" aria-live="polite" role="status">
          <div className="completion-toast">
            <div className="completion-toast-check" aria-hidden="true">
              <span />
            </div>
            <strong>주문 완료!</strong>
            <p>{completionToast}</p>
          </div>
        </div>
      ) : null}
      {feedback ? <div className="feedback-banner">{feedback}</div> : null}
      {normalizedRole === 'organizer' ? (
        <>
          <QuickOrderPanel
            snapshot={snapshot}
            meetingClosed={meetingClosed}
            showPrices={showPrices}
            variant="organizer"
            onAddAttendee={handleAddAttendee}
            onUpdateAttendee={updateAttendeeField}
            onSkipAttendee={handleSkipAttendee}
            onCompleteOrder={handleCompleteOrder}
          />
          <MeetingUtilityBar
            summaryCount={groupedOrders.length}
            shareLabel="취합 링크"
            onOpenSummary={() => setIsSummarySheetOpen(true)}
            onOpenShare={() => openShareSheet('organizer')}
            onOpenMore={() => setIsMoreSheetOpen(true)}
          />
          <main className="workspace-grid">
            <OrdersPanel
              attendees={attendees}
              menuItems={menuItems}
              meetingClosed={meetingClosed}
              showPrices={showPrices}
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
              showPrices={showPrices}
              onCopy={handleCopySummary}
            />
            <details className="admin-details">
              <summary>모임 현황 보기</summary>
              <div className="admin-details-body">
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
                  showPrices={showPrices}
                />
              </div>
            </details>
            <details className="admin-details">
              <summary>메뉴 보기 및 편집</summary>
              <div className="admin-details-body">
                <MenuPanel
                  menuItems={menuItems}
                  showPrices={showPrices}
                  onAddMenu={handleAddMenu}
                  onUpdateMenu={updateMenuField}
                  onRemoveMenu={handleRemoveMenu}
                  onLoadPresetMenu={handleLoadPresetMenu}
                  onTogglePriceVisibility={() =>
                    setShowPrices((currentValue) => !currentValue)
                  }
                />
              </div>
            </details>
            <details className="admin-details">
              <summary>참석자 수동 관리</summary>
              <div className="admin-details-body">
                <AttendeesPanel
                  attendees={attendees}
                  onAddAttendee={handleAddAttendee}
                  onRemoveAttendee={handleRemoveAttendee}
                />
              </div>
            </details>
            <details className="admin-details">
              <summary>취합 설정</summary>
              <div className="admin-details-body">
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
              </div>
            </details>
            <details className="admin-details">
              <summary>OCR로 메뉴 추가</summary>
              <div className="admin-details-body">
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
              </div>
            </details>
          </main>
        </>
      ) : (
        <>
          <ParticipantWorkspace
            snapshot={snapshot}
            meetingClosed={meetingClosed}
            showPrices={showPrices}
            utilityBar={
              <MeetingUtilityBar
                summaryCount={groupedOrders.length}
                shareLabel="참석 링크"
                onOpenSummary={() => setIsSummarySheetOpen(true)}
                onOpenShare={() => openShareSheet('join')}
                onOpenMore={() => setIsMoreSheetOpen(true)}
              />
            }
            onCompleteOrder={handleCompleteOrder}
            onAddAttendee={handleAddAttendee}
            onUpdateAttendee={updateAttendeeField}
            onSkipAttendee={handleSkipAttendee}
          />
        </>
      )}
    </div>
  )
}

export default App

