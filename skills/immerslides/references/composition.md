# 自由組合元件

在 `SlideFrame` 內安排這些元件的位置。它們不擁有播放進度，從 renderer 傳入同一個 `step`。

## 獨立匯入

依用途匯入單一元件。每個入口直接載入該元件與它需要的依賴。

| 入口                           | 匯出                                                        |
| ------------------------------ | ----------------------------------------------------------- |
| `immerslides/code-window`      | `CodeWindow`、`CodeWindowProps`                             |
| `immerslides/highlighted-code` | `HighlightedCode`、`HighlightedCodeProps`、`CodeLineRange`  |
| `immerslides/code-block`       | `CodeBlock`、`CodeBlockProps`、`CodeStep`、`CodeLineRange`  |
| `immerslides/flow-node`        | `FlowNode`、`FlowNodeProps`、`FlowStatus`、`FlowTone`       |
| `immerslides/flow-connector`   | `FlowConnector`、`FlowConnectorProps`、`FlowStatus`         |
| `immerslides/timeline`         | `Timeline`、`TimelineProps`、`TimelineItem`、`TimelineStep` |
| `immerslides/step-description` | `StepDescription`、`StepDescriptionProps`                   |
| `immerslides/slide-frame`      | `SlideFrame`、`SlideFrameProps`                             |
| `immerslides/chapter-guide`    | `ChapterGuide`                                              |
| `immerslides/slide-preview`    | `SlidePreview`、`SlidePreviewProps`                         |
| `immerslides/slide-navigator`  | `SlideNavigator`                                            |
| `immerslides/player`           | `Player`                                                    |
| `immerslides/deck`             | `defineDeck` 與簡報型別                                     |

單獨使用 `CodeWindow` 不會載入 highlight.js。靜態預覽與基礎流程元件不會載入播放核心。既有根入口仍提供相同元件與型別。樣式只需匯入一次 `immerslides/styles.css`。

## 基礎元件

| 元件              | 責任                     | 主要輸入                                          |
| ----------------- | ------------------------ | ------------------------------------------------- |
| `CodeWindow`      | 深色視窗、檔名與外框     | `filename?`、`children`                           |
| `HighlightedCode` | 語法上色、行聚焦與捲動   | 原始字串、`language?`、`focus?`、`still?`         |
| `StepDescription` | 段落標題、內容與進度文字 | `title`、從 0 開始的 `step`、`count`、`children?` |
| `FlowNode`        | 自訂內容與語意狀態的節點 | `title`、`children?`、`status?`、`tone?`          |
| `FlowConnector`   | 表達流程狀態的連線       | `status?`                                         |

`CodeBlock` 與 `Timeline` 已用這些元件組成現成版型。版面合適時直接使用，不重寫相同的聚焦或上色邏輯。

## 自訂程式碼與說明的位置

以下片段接續 [immersive.md](immersive.md) 定義的 `source` 與 `codeSteps`。把它放入投影片 renderer 的內容中。

```tsx
import { CodeWindow } from 'immerslides/code-window';
import { HighlightedCode } from 'immerslides/highlighted-code';
import { StepDescription } from 'immerslides/step-description';
import type { SlideRenderProps } from 'immerslides/deck';

function CustomCodeScene({ step, still }: SlideRenderProps) {
  const current = codeSteps[step];
  return (
    <div>
      <StepDescription
        title={current.title}
        step={step}
        count={codeSteps.length}
      >
        <p>{current.detail}</p>
      </StepDescription>
      <CodeWindow filename="load-user.ts">
        <HighlightedCode language="ts" focus={current.lines} still={still}>
          {source}
        </HighlightedCode>
      </CodeWindow>
    </div>
  );
}
```

這裡把說明放在程式碼上方。可用自己的 CSS Grid 或 Flex 排成左右欄，或加入圖片與其他 JSX 內容。聚焦範圍仍由同一份 `codeSteps` 推導。

## 自訂節點

`FlowStatus` 為 `active`、`complete`、`idle`。不傳 `status` 時，節點維持一般靜態呈現。節點標題與內容可使用 React 元素。

```tsx
import { FlowNode } from 'immerslides/flow-node';
import { FlowConnector } from 'immerslides/flow-connector';

function CustomFlow({ step }: { step: number }) {
  return (
    <div className="my-flow" aria-label="請求處理流程">
      <FlowNode title="請求" status={step === 0 ? 'active' : 'complete'}>
        <p>接收使用者的輸入。</p>
      </FlowNode>
      <FlowConnector status={step === 0 ? 'active' : 'complete'} />
      <FlowNode
        title={<span>驗證與回應</span>}
        status={step === 1 ? 'active' : 'idle'}
      >
        <p>確認條件後回傳結果。</p>
      </FlowNode>
    </div>
  );
}
```

自行安排節點與連線的位置。完整的垂直流程與程式碼並排範例位於 starter 的 `Composition` 場景與 `src/styles.css`。`FlowConnector` 是視覺連線，不提供自動圖形排版或路由。

## 保留同一份步驟資料

投影片的 `steps` 使用段落陣列的 `length`。程式碼、流程節點與說明皆讀取 renderer 的 `step`，不要各自使用 `useState` 記錄講解位置。

將 `still` 傳給 `HighlightedCode`。放在 `SlideFrame` 中的內建元件會沿用靜態預覽與減少動態效果的樣式。
