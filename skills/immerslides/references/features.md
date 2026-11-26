# 功能與使用時機

下列功能屬於 immerslides 的公開能力。Starter 的功能導覽展示常用能力。依使用者的教材選擇，不要求每份正式簡報都包含全部功能。

| 功能                     | 適合使用時機                   | 入口與限制                                                                                                                                                                        |
| ------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 封面、內容頁、結尾       | 建立一致的 presentation 版型   | `SlideFrame` 的 `layout`。固定 1600 × 900，縮放符合視窗。                                                                                                                         |
| 分欄、標籤與註記         | 比較兩個觀點或強調補充說明     | `immerslides-columns`、`immerslides-label`、`immerslides-note`。                                                                                                                  |
| 完整流程圖               | 一頁解釋一段有順序的流程       | `Timeline`，每列一至三個節點。支援 focus、good、warn、bad 狀態。                                                                                                                  |
| 深色程式碼視窗與語法上色 | 呈現短程式或協定訊息           | `CodeBlock` 接收原始字串、可選檔名與 `language`。支援常用語言與別名，保留換行及縮排，安全呈現文字。                                                                               |
| 程式碼逐段聚焦           | 分段說明一個演算法或設定       | `CodeBlock.steps` 定義行範圍及說明，`step` 指定目前段落。保留語法色彩，淡化其他行並將焦點帶入可見範圍。                                                                           |
| 流程逐段聚焦             | 沉浸式解說資料或操作流程       | `Timeline.steps` 以節點 ID 定義段落，隨 `step` 強調目前節點與連線。                                                                                                               |
| 自由組合                 | 說明、程式碼與流程需要不同版面 | `CodeWindow`、`HighlightedCode`、`StepDescription`、`FlowNode`、`FlowConnector`。與現成版型共用實作。                                                                             |
| 平滑章節導覽             | 長簡報中辨識目前位置           | 設定 `chapters` 與 `Overlay: ChapterGuide`。章節由同一份頁面順序推導。                                                                                                            |
| 網址、slug 與歷史記錄    | 分享某一頁或指定講解段落       | 每頁可設定 `slug`，預設由標題產生。支援章節別名、`#/15` 頁數跳轉、重新整理與瀏覽器前後導覽。連結使用 `getSlideHref`。                                                             |
| 整頁與少量分段           | 依講解需要安排點擊節奏         | 預設 `steps: 1`。額外分段由 `step` 驅動 JSX，不逐行強制揭露。                                                                                                                     |
| 鍵盤與控制列             | 現場播放                       | 方向鍵、Space、Page Up、Page Down。可直接鍵入頁數，或編輯下方目前頁數，Enter 跳頁、Esc 取消。控制列閒置後隱藏，指標移動或鍵盤聚焦時顯示。                                         |
| 章節與縮圖選單           | 依大綱或畫面尋找投影片         | O 開啟。文字大綱以章節、投影片的樹狀結構呈現，可收合；縮圖預覽依章節分組。點選頁面跳轉並更新網址。                                                                                |
| 說明與全螢幕             | 現場展示                       | ? 開啟說明，F 切換全螢幕。Esc 關閉選單。全螢幕依瀏覽器與宿主權限。                                                                                                                |
| 簡報者模式               | 自己看講稿，觀眾看投影         | P 開啟獨立視窗。顯示目前與下一個畫面、逐頁 notes、計時及播放控制，和觀眾畫面同步。                                                                                                |
| 自動保存與從頭開始       | 重新整理後接續講解             | 同一分頁的 sessionStorage。使用 `version` 處理內容修訂，使用 `fresh` 或 `actions.restart()` 重設。                                                                                |
| 靜態預覽                 | 展示縮圖、比較頁面設計         | `SlidePreview` 不啟動播放 provider。可指定頁面與步驟。                                                                                                                            |
| 淡出與自訂轉場           | 讓完整頁面平順銜接             | `fadeTransition` 或自訂 `TransitionDefinition`。回傳有限時間的 Web Animations API 動畫。                                                                                          |
| 轉場快照與步內轉場       | 跨頁或分段接續同一個圖形       | 自訂 `capture` 取得變更前狀態，`animateStep` 處理步內變化。可用 `freezeEntranceOnNavigation` 在導覽時直接呈現頁面的指定狀態。                                                     |
| 減少動態效果             | 使用者偏好降低動畫             | 播放器、ChapterGuide、內建樣式尊重系統設定。自訂內容使用 `still`、`reducedMotion` 或 `useReducedMotion()`。                                                                       |
| 自訂投影片內容           | 原生 JSX、SVG、互動按鈕        | `RenderSlide` 接收 `SlideRenderProps`。動畫與操作不能影響靜態預覽。                                                                                                               |
| 額外控制與說明           | 課程專屬操作或教學輔助         | `Controls` 接收播放狀態與 actions。`Help` 補充說明選單。                                                                                                                          |
| 範例重點標記             | 記下稍後要回看的頁面           | Starter 工具列的 ☆ 標記本頁，旁邊的數量開啟共用選單並套用「已標記」篩選。文字與縮圖保留原始頁碼，空章節隱藏；每頁右上星星可標記或取消，點頁面查看。重新整理或從頭開始會清除標記。 |
| 播放專屬狀態             | 計時或跨頁活動                 | `Provider` 接收 `children` 與 `fresh`。在其內使用 `usePlayback()`。預覽不掛載它。                                                                                                 |
| 自訂畫面覆層             | 跨頁保持穩定的指引             | `Overlay` 接收播放狀態、視窗與 scale。`reserveWidth` 可為覆層預留寬度。                                                                                                           |
| 返回入口與講義           | 與既有教材或網站整合           | `Player.homeHref` 顯示返回連結。`handout` 顯示說明中的教材連結。                                                                                                                  |
| 新專案與 project skill   | 重用相同技術與風格             | `immerslides create <directory>` 複製 starter 與 skill。使用 pnpm 安裝及建置。                                                                                                    |

## 自訂播放功能

`usePlayback()` 可在 `Provider`、`Controls`、`Overlay` 與實際播放 renderer 內使用。靜態預覽不提供該 context。共用的 renderer 優先使用已收到的 props。

`Overlay` 是單一元件插槽。需要多個覆層時，在同一個自訂元件中組合。`ChapterGuide` 可作為其中一部分。自訂覆層需自行決定位置與是否預留寬度。

自訂動畫以 JSX 與 CSS 的最終狀態為終點。播放器完成或中斷轉場時會取消動畫。不得依賴永久保留的 fill 效果。

## 產出方式

`pnpm build` 在套件 repository 產生可發佈的 library。相同命令在產生的簡報專案建立 Vite 靜態網站。兩者由各自的 `package.json` 決定。

套件沒有內建 Markdown 匯入、PDF 或 PPTX 匯出、所見即所得編輯器與線上 agent 面板。需要這些能力時，另行評估專用工具。
