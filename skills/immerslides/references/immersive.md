# 逐段聚焦程式碼與流程

聚焦模式由既有的播放器 `step` 控制。元件不建立另一套播放進度。一般頁面仍維持 `steps: 1`。

## 程式碼

`CodeBlock` 接收 `language`、`steps`、`step` 與 `still`。每個 `CodeStep` 使用包含起訖行的範圍，行號從 1 開始。

```tsx
import { CodeBlock, type CodeStep } from 'immerslides';

const source = [
  'async function loadUser(id: string) {',
  '  const response = await fetch("/users/" + id);',
  '  if (!response.ok) {',
  '    throw new Error("Could not load user");',
  '  }',
  '  return response.json();',
  '}',
].join('\n');

const codeSteps: readonly CodeStep[] = [
  {
    title: '先取得資料',
    detail: '用穩定的使用者 ID 發出請求。',
    lines: [[1, 2]],
  },
  { title: '處理失敗', detail: '在讀取內容前確認回應狀態。', lines: [[3, 5]] },
  {
    title: '回傳結果',
    detail: '將成功的回應轉為呼叫端使用的資料。',
    lines: [[6, 7]],
  },
];

function CodeScene({ step, still }: { step: number; still: boolean }) {
  return (
    <CodeBlock
      filename="load-user.ts"
      language="typescript"
      steps={codeSteps}
      step={step}
      still={still}
    >
      {source}
    </CodeBlock>
  );
}
```

對應的 slide metadata 使用 `steps: codeSteps.length`。把 renderer 收到的 `step` 與 `still` 傳給元件。前後切換、重新整理與版本恢復沿用播放器的行為。

依意義分組，例如取得輸入、驗證、回傳結果。每段保留足夠上下文。不要把每個 token 或每一行都設成一步。較長程式碼會將焦點段落帶入可見範圍。段落過長時先拆分講解內容。

## 流程圖

聚焦流程使用穩定的節點 `id`。每個 `TimelineStep.nodes` 指定這一段要強調的節點。一般的靜態流程不需要提供 `id`。

```tsx
import { Timeline, type TimelineItem, type TimelineStep } from 'immerslides';

const items: readonly TimelineItem[] = [
  { id: 'request', title: '請求', detail: '使用者送出需求。' },
  { id: 'check', title: '檢查', detail: '驗證輸入與權限。' },
  { id: 'respond', title: '回應', detail: '回傳可使用的結果。', tone: 'good' },
];

const flowSteps: readonly TimelineStep[] = [
  { title: '從需求開始', detail: '先說明請求來自哪裡。', nodes: ['request'] },
  { title: '確認條件', detail: '把必要檢查放在處理之前。', nodes: ['check'] },
  { title: '形成結果', detail: '說明完整處理的輸出。', nodes: ['respond'] },
];

function FlowScene({ step, still }: { step: number; still: boolean }) {
  return <Timeline items={items} steps={flowSteps} step={step} still={still} />;
}
```

對應的 slide metadata 使用 `steps: flowSteps.length`。一段可以聚焦多個有關聯的節點。每列仍維持一至三個節點，長流程使用接續頁。

## 語法上色

`language` 採用 highlight.js 的語言名稱或別名，例如 `typescript`、`ts`、`javascript`、`js`、`python`、`java`、`sql`、`json`、`yaml`、`bash`、`html`、`css`。

未指定語言或語言無法辨識時顯示原始文字，不自動猜測。程式碼依然是文字，不作為 HTML 執行。跨行字串與註解的上色必須連續，不逐行獨立重新解析。

## 驗證

- 在每一段前進、後退與快速反向操作，確認焦點及說明一致。
- 確認長程式碼的目前段落可見，原始縮排與空白行保留。
- 使用含跨行註解、字串與 HTML 標籤的程式碼，確認上色與文字安全。
- 啟用減少動態效果，確認焦點直接切換。靜態預覽不得啟動自動播放或計時。
- 確認一般未設定 `steps` 的 CodeBlock 與 Timeline 仍一次完整呈現。
