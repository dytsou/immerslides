# immerslides API

專案啟動檔只匯入一次樣式。

```tsx
import { createRoot } from 'react-dom/client';
import { Player } from 'immerslides/player';
import 'immerslides/styles.css';
import { deck } from './deck';

createRoot(document.getElementById('root')!).render(<Player deck={deck} />);
```

## 定義簡報

```tsx
import {
  defineDeck,
  fadeTransition,
  SlideFrame,
  ChapterGuide,
  Timeline,
  CodeBlock,
  type SlideRenderProps,
} from 'immerslides';

function RenderSlide(props: SlideRenderProps) {
  if (props.slide.id === 'opening') {
    return (
      <SlideFrame {...props} deck={deck} layout="cover" footer="團隊簡報">
        <h1>
          讓每次提交
          <br />
          都有回饋
        </h1>
        <p>CI 簡報</p>
      </SlideFrame>
    );
  }
  if (props.slide.id === 'pipeline') {
    return (
      <SlideFrame {...props} deck={deck} footer="團隊簡報">
        <Timeline
          items={[
            { title: '提交', detail: '推送程式碼' },
            { title: '檢查', detail: '自動執行測試', tone: 'focus' },
            { title: '回饋', detail: '檢視執行結果', tone: 'good' },
          ]}
        />
      </SlideFrame>
    );
  }
  return (
    <SlideFrame {...props} deck={deck} footer="團隊簡報">
      <CodeBlock filename="test.sh">
        {'pnpm install --frozen-lockfile\npnpm test'}
      </CodeBlock>
    </SlideFrame>
  );
}

export const deck = defineDeck({
  id: 'ci-presentation',
  title: 'CI 簡報',
  version: 1,
  size: { width: 1600, height: 900 },
  slides: [
    { id: 'opening', title: '讓每次提交都有回饋', steps: 1 },
    { id: 'pipeline', title: '一次看懂回饋流程', steps: 1 },
    { id: 'workflow', title: '用一份設定執行測試', steps: 1 },
  ],
  chapters: [
    { id: 'ci', title: 'CI · Continuous Integration', slideId: 'pipeline' },
  ],
  previews: [{ slideId: 'pipeline' }],
  transition: fadeTransition(0.25),
  Overlay: ChapterGuide,
  RenderSlide,
});
```

`SlideFrame` 從 `deck` 與 `slide` 取得標題、頁碼及章節。它可用於靜態預覽，不依賴播放 context。`layout` 支援 `content`、`cover`、`ending`。預設為 `content`。

`ChapterGuide` 使用持續存在的覆層呈現平滑章節切換。`SlideFrame` 在靜態預覽保留章節導覽。播放時使用覆層的導覽，避免換頁重建導覽造成跳動。

`Timeline` 的 `items` 為一至三個節點。每個節點有 `title`，可選 `detail` 與 `tone`。`tone` 支援 `focus`、`good`、`warn`、`bad`。

`CodeBlock` 的 `children` 是原始程式碼字串。`filename` 為可選的檔名標籤，`language` 指定語法或別名。程式碼以文字呈現，不執行 HTML。逐段聚焦的 CodeBlock 與 Timeline 範例見 [immersive.md](immersive.md)。

## 播放與預覽

`Player` 接收 `deck`。有效的投影片網址優先決定頁面與步驟。沒有指定投影片時，`fresh` 設為 `true` 會從第一頁開始，否則恢復同一分頁保存的進度。`homeHref` 可選，用於返回宿主專案提供的網址。

按 `O` 開啟章節與投影片選單，可切換樹狀文字大綱與縮圖預覽。播放器保存上次選擇的模式，關閉選單與重新整理後仍會沿用。分組依 `chapters` 的起始 `slideId` 決定，每章涵蓋至下一章之前的頁面。第一章前的頁面與未設定章節的簡報直接列出投影片，不顯示章節標題。縮圖共用靜態 renderer。

自訂 `DeckDefinition.Navigator` 可從自己的 Provider 取得標記 ID，傳入公開的 `SlideNavigator.markedSlides`。標記使用 `ReadonlySet<SlideId>`，`onToggleMark(id)` 連接原有的標記操作。文字與縮圖共用「已標記」篩選，保留原始頁碼並隱藏空章節。滑鼠移入頁面或鍵盤聚焦時，右上角顯示一顆星星，用於標記或取消；觸控裝置直接顯示。點頁面本身查看。

目前頁面符合篩選時會自動定位；不在結果內時，清單從頂端開始。篩選只改變導覽清單，不會更動目前播放位置。

自訂 `Controls` 接收 `PlayerControlsProps`，包含原本的播放狀態與 `openNavigator(filter?)`。呼叫 `openNavigator('marked')` 會開啟同一個導覽視窗並篩選標記頁面；省略參數會沿用目前篩選。Starter 的星星數量使用這個入口。

`SlidePreview` 接收 `deck`、`slideId` 與可選的 `step`。省略 `step` 時呈現該頁的最後狀態。預覽不啟動播放 provider。

每筆 slide metadata 可加上 `notes?: string`。按 `P` 在簡報者視窗顯示目前講稿與下一個畫面，詳見 [presenter.md](presenter.md)。

每頁與章節可設定 `slug?: string`。使用 `getSlideHref(deck, id, step)` 建立可直接開啟的連結，詳見 [urls.md](urls.md)。

自訂 `RenderSlide` 接收 `slide`、`step`、`mode`、`active`、`still`、`reducedMotion`、`actions`。使用 `actions.next()`、`previous()`、`nextSlide()`、`previousSlide()`、`jump(id)`、`restart()` 操作進度。

自訂轉場以 renderer 已渲染的最終版型為終點，回傳有限時間內完成的 Web Animations API `Animation` 或陣列。播放器會在完成或中斷時取消動畫，不保留動畫的 fill 效果。最終內容與位置必須由 JSX 和 CSS 決定。`capture` 只回傳可獨立保存的幾何與樣式資料，不保存 DOM nodes。

## 檔案與命令

以產生專案內實際的 `package.json` 為準。Starter 使用 pnpm、Vite、React 與 TypeScript，提供 `pnpm dev`、`pnpm typecheck`、`pnpm build`。`packageManager` 指定 pnpm 版本，`pnpm-lock.yaml` 固定解析後的依賴。

新增頁面時同步更新 `slides` 與 `RenderSlide`。章節的 `slideId` 指向該章第一頁。`previews` 只列出需要靜態展示的頁面。
