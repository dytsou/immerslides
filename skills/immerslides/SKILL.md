---

name: immerslides
description: 使用 immerslides 建立或修改可自由組合的 React 沉浸式簡報。支援程式碼與流程逐段聚焦、多語言上色，以及白底與藍色標籤的視覺風格。
---

# immerslides

把使用者的教材整理成可播放的沉浸式簡報。沿用套件的播放核心與簡報樣式。

## 找到專案

- 先讀專案的 `package.json` 與既有 deck。維持現有命名、內容順序與使用者的視覺要求。
- 新專案使用套件 CLI 的 `immerslides create <directory>`。套件尚未發佈時，使用使用者提供的本機套件或 tarball。不要假設 npm registry 上已有同名套件。
- 建立前確認目的地。CLI 不覆寫非空目錄。修改既有簡報時直接編輯內容，不重新建立專案。
- 公開介面與範例見 [authoring.md](references/authoring.md)。不要匯入套件的 `src/` 或原始參考網站。
- 挑選進階功能或製作功能介紹時閱讀 [features.md](references/features.md)。正式教材只使用能幫助講解的功能。
- 使用者要求程式碼逐段講解、流程分段聚焦或語法上色時閱讀 [immersive.md](references/immersive.md)。使用內建的受控聚焦模式，不另建一套播放進度。
- 需要自由排版或組合節點時閱讀 [composition.md](references/composition.md)。直接使用公開元件與 CSS 排版，保留同一份步驟資料。
- 只使用部分元件時，從 `immerslides/code-window`、`immerslides/flow-node` 等獨立入口匯入。`defineDeck` 與簡報型別可從 `immerslides/deck` 匯入。完整入口見組合指南，不匯入套件內部路徑。
- 需要講稿、下一頁預覽或簡報者視窗時閱讀 [presenter.md](references/presenter.md)。以每頁的 `notes` 保存純文字講稿，不把講稿畫在觀眾投影片上。
- 需要直接連結、大綱或標題導覽時閱讀 [urls.md](references/urls.md)。使用 `slug` 與 `getSlideHref`，不另建路由或播放進度。
- 需要讓讀者向下捲動閱讀同一份 deck 時閱讀 [site.md](references/site.md)。使用 `Site` 與 `SiteStory`，不另外複製內容或步驟資料。
- 需要星號標記與篩選時閱讀 [authoring.md](references/authoring.md)。共用原有導覽視窗與標記資料，沿用套件的星號懸停、鍵盤與觸控操作。
- 使用 pnpm 與專案 `packageManager` 指定的版本。保留 `pnpm-lock.yaml`，不新增其他套件管理器的 lockfile。發佈後的新專案入口為 `pnpm dlx immerslides create <directory>`。

## 安排頁面與點擊

- 先列出每頁要傳達的完整觀點，再寫 JSX。保留原始事實與必要的操作步驟。
- 預設 `steps: 1`。一次前進顯示下一個完整頁面。不要把一句話、一個圖示或每個流程節點各拆成一次點擊。
- 流程頁一次呈現最多三個節點。更長的流程接到下一頁，沿用標題並清楚標示接續關係。
- 只有教學需要比較狀態或聚焦程式碼時才增加 `steps`。採用少量、有意義的段落，避免每行都需要操作。
- `steps` 包含初始狀態。只有兩個畫面狀態時使用 `steps: 2`，`step` 值為 `0` 與 `1`。
- 使用穩定的 slide ID。調整頁面或步驟結構時增加 deck 的 `version`，讓保存的進度安全恢復。
- 長期分享的投影片設定明確且唯一的 `slug`。內容內的連結使用 `getSlideHref`，避免自行拼接步驟參數。

## 延續簡報風格

- 使用 `SlideFrame` 作為頁面框架。封面與結尾使用對應的 `layout`。
- 維持 1600 × 900 畫布。保留白底、藍色章節標籤、灰色輔助文字、大標題與留白。
- 使用 `chapters` 產生章節導覽。需要平滑切換時設定 `Overlay: ChapterGuide`。不要另外維護目前章節的索引。
- 主要比較內容用分欄與細分隔線。避免每個段落都套成有底色的圓角卡片。
- 使用 `Timeline` 呈現流程。使用 `CodeBlock` 呈現程式碼，並以 `language` 指定語法。需要逐段聚焦時，以有意義的段落定義 steps，從同一陣列推導投影片的步驟數。較長的內容拆成接續頁。
- 依內容選擇版型，不把所有頁面排成相同的三張卡片。
- 計時器與其他副作用只在實際播放時執行。預覽保持靜態。自訂動畫尊重 `still` 與 `reducedMotion`。
- 未提供來源的數字、引文與成果不得補寫成已驗證事實。

## 檢查成品

- 執行 `pnpm typecheck` 與 `pnpm build`。缺少依賴時執行 `pnpm install`。已有 lockfile 的重現驗證使用 `pnpm install --frozen-lockfile`。
- 在瀏覽器播放實際產物。確認一次前進會切換整頁，額外步驟只出現在有意安排的頁面。
- 檢查上一頁、章節選單、重新整理後恢復進度與鍵盤操作。
- 以桌面與窄螢幕檢查縮放、文字與圖表裁切。檢視實際截圖，避免只以建置成功判斷版型。
- 啟用減少動態效果，確認內容仍完整可讀。
- 回報修改的 deck、執行過的檢查與尚未驗證的項目。發佈 npm 套件與部署網站需有使用者的明確指示。
