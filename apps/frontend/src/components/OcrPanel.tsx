import { type ChangeEvent } from 'react'

type OcrState = {
  status: 'idle' | 'processing' | 'success' | 'error'
  progress: number
  confidence: number | null
  message: string
}

type OcrPanelProps = {
  ocrState: OcrState
  imagePreview: string | null
  rawOcrText: string
  onUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  onRawTextChange: (value: string) => void
  onApplyRawText: () => void
}

export function OcrPanel({
  ocrState,
  imagePreview,
  rawOcrText,
  onUpload,
  onRawTextChange,
  onApplyRawText,
}: OcrPanelProps) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">OCR</span>
          <h2>메뉴 이미지 업로드</h2>
        </div>
        {ocrState.confidence !== null ? (
          <span className="status-pill neutral">
            인식 신뢰도 {Math.round(ocrState.confidence)}%
          </span>
        ) : null}
      </div>
      <label className="upload-box">
        <input type="file" accept="image/*" onChange={onUpload} />
        <strong>카페 메뉴 사진 업로드</strong>
        <span>휴대폰으로 찍은 메뉴판 사진, JPG, PNG 파일 모두 가능합니다.</span>
      </label>
      <div className="progress-shell">
        <div
          className={`progress-bar ${ocrState.status}`}
          style={{ width: `${Math.round(ocrState.progress * 100)}%` }}
        />
      </div>
      <p className="panel-note">{ocrState.message}</p>
      <div className="preview-grid">
        <div className="preview-card">
          <h3>업로드 미리보기</h3>
          {imagePreview ? (
            <img src={imagePreview} alt="업로드한 메뉴판 미리보기" />
          ) : (
            <div className="empty-state compact">
              메뉴 이미지를 올리면 이 영역에서 바로 확인할 수 있습니다.
            </div>
          )}
        </div>
        <div className="preview-card">
          <div className="subhead">
            <h3>OCR 텍스트</h3>
            <button
              className="button secondary small"
              type="button"
              onClick={onApplyRawText}
              disabled={!rawOcrText.trim()}
            >
              텍스트로 메뉴 반영
            </button>
          </div>
          <textarea
            className="ocr-textarea"
            value={rawOcrText}
            onChange={(event) => onRawTextChange(event.target.value)}
            rows={12}
            placeholder="OCR 결과가 표시됩니다. 인식 오류가 있으면 직접 수정한 뒤 다시 반영해주세요."
          />
        </div>
      </div>
    </section>
  )
}
