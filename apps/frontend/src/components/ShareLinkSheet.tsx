import { useEffect, useState } from 'react'
import { toDataURL } from 'qrcode'

type ShareLinkSheetProps = {
  open: boolean
  title: string
  description: string
  link: string
  onClose: () => void
  onCopy: () => Promise<void>
  onShareToKakao: () => Promise<void>
}

export function ShareLinkSheet({
  open,
  title,
  description,
  link,
  onClose,
  onCopy,
  onShareToKakao,
}: ShareLinkSheetProps) {
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    if (!open) {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    let ignore = false

    void toDataURL(link, {
      errorCorrectionLevel: 'H',
      margin: 4,
      width: 256,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    }).then((nextUrl: string) => {
      if (!ignore) {
        setQrDataUrl(nextUrl)
      }
    })

    return () => {
      ignore = true
    }
  }, [link, open])

  if (!open) {
    return null
  }

  return (
    <div className="summary-sheet-overlay" role="presentation" onClick={onClose}>
      <section
        aria-label="링크 공유"
        aria-modal="true"
        className="share-sheet"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="summary-sheet-head">
          <div>
            <span className="panel-kicker">링크 공유</span>
            <h2>{title}</h2>
          </div>
          <button className="button ghost small" type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <p className="panel-note">{description}</p>

        <div className="share-link-box">
          <strong>공유 링크</strong>
          <a href={link} rel="noreferrer" target="_blank">
            {link}
          </a>
        </div>

        <div className="share-action-grid">
          <button className="button" type="button" onClick={onCopy}>
            링크 복사
          </button>
          <button className="button secondary" type="button" onClick={onShareToKakao}>
            카카오톡 공유
          </button>
        </div>

        <div className="share-qr-card">
          <div className="subhead">
            <h3>QR 링크</h3>
            <span>휴대폰 카메라로 바로 열 수 있습니다.</span>
          </div>
          {qrDataUrl ? (
            <div className="share-qr-frame">
              <img alt={`${title} QR 코드`} className="share-qr-image" src={qrDataUrl} />
            </div>
          ) : (
            <div className="empty-state compact">QR 코드를 준비하고 있습니다.</div>
          )}
        </div>
      </section>
    </div>
  )
}
