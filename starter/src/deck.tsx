import {
  ChapterGuide,
  CodeBlock,
  CodeWindow,
  defineDeck,
  FlowConnector,
  FlowNode,
  fadeTransition,
  getSlideHref,
  HighlightedCode,
  type PlayerControlsProps,
  SlideFrame,
  type SlideFrameProps,
  type SlideId,
  SlideNavigator,
  type SlideNavigatorProps,
  SlidePreview,
  type SlideRenderProps,
  type StageOverlayProps,
  StepDescription,
  Timeline,
  usePlayback,
  useReducedMotion,
} from 'immerslides';
import {
  type ComponentType,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  codeSteps,
  flowItems,
  flowSteps,
  registrationCode,
  syntaxSamples,
} from './examples';

const Marks = createContext<{
  marked: ReadonlySet<SlideId>;
  toggle: (id: SlideId) => void;
} | null>(null);

function DemoProvider({ children }: { children: ReactNode; fresh: boolean }) {
  const { state } = usePlayback();
  const [marked, setMarked] = useState<Set<SlideId>>(new Set());
  useEffect(() => setMarked(new Set()), [state.generation]);
  const toggle = (id: SlideId) =>
    setMarked((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return <Marks.Provider value={{ marked, toggle }}>{children}</Marks.Provider>;
}

function DemoControls({ slide, openNavigator }: PlayerControlsProps) {
  const { marked, toggle } = useContext(Marks)!;
  return (
    <div className="demo-mark-controls">
      <button
        type="button"
        className="demo-mark"
        aria-label="標記本頁重點"
        aria-pressed={marked.has(slide.id)}
        title="標記本頁重點，從頭開始時清除"
        onClick={() => toggle(slide.id)}
      >
        <span aria-hidden>{marked.has(slide.id) ? '★' : '☆'}</span>
      </button>
      <button
        type="button"
        className="demo-mark-count"
        aria-label={`查看已標記頁面（${marked.size}）`}
        title="查看已標記頁面"
        aria-haspopup="dialog"
        onClick={() => openNavigator('marked')}
      >
        {marked.size}
      </button>
    </div>
  );
}

function DemoNavigator(props: SlideNavigatorProps) {
  const { marked, toggle } = useContext(Marks)!;
  return (
    <SlideNavigator {...props} markedSlides={marked} onToggleMark={toggle} />
  );
}

function hasReservedNote(slide: { id: SlideId }, viewport: { width: number }) {
  return slide.id === 'extensions' && viewport.width >= 1200;
}

function DemoOverlay(props: StageOverlayProps) {
  return (
    <>
      <ChapterGuide {...props} />
      {hasReservedNote(props.slide, props.viewport) && (
        <aside className="demo-reserved-note">
          <span>OVERLAY</span>
          <b>
            舞台之外，
            <br />
            也能擴充。
          </b>
          <p>這裡的空間由 reserveWidth 預留。</p>
        </aside>
      )}
    </>
  );
}

function Cover() {
  return (
    <>
      <p className="immerslides-kicker">
        REACT / VITE / YOUR NEXT PRESENTATION
      </p>
      <h1>
        把想法，
        <br />
        講清楚。
      </h1>
      <p>白色畫布、清楚層次，以及一次一頁的節奏。</p>
      <span className="immerslides-cover-meta">IMMERSLIDES · 功能導覽</span>
    </>
  );
}

function Overview({ actions }: SlideRenderProps) {
  return (
    <div className="demo-inventory">
      {featureInventory.map((feature) => (
        <button
          type="button"
          key={feature.name}
          onClick={() => actions.jump(feature.target)}
        >
          <b>{feature.name}</b>
          <span>{feature.detail}</span>
        </button>
      ))}
    </div>
  );
}

function Layouts() {
  return (
    <>
      <p className="immerslides-lead">
        封面建立主題，內容頁展開，收尾頁留下下一步。
      </p>
      <div className="immerslides-columns">
        <div>
          <span className="immerslides-label">清楚的主從關係</span>
          <h2>把重點留給內容。</h2>
          <p>
            藍色章節標籤、48px 標題，
            <br />
            底部保留署名與頁碼。
          </p>
        </div>
        <div>
          <span className="immerslides-label">兩欄與分隔線</span>
          <h2>比較兩個觀點。</h2>
          <p>
            主要內容以留白區分。
            <br />
            補充說明再使用淡藍提示框。
          </p>
        </div>
      </div>
      <p className="immerslides-note">
        版型來自 SlideFrame。欄位與提示框使用公開的 immerslides-* CSS 類別。
      </p>
    </>
  );
}

function Flow({ step, still }: SlideRenderProps) {
  return (
    <>
      <p className="immerslides-lead">
        三個有意義的階段，每次把焦點移到正在講的節點。
      </p>
      <Timeline items={flowItems} steps={flowSteps} step={step} still={still} />
      <p className="immerslides-note">
        不提供 steps 時，Timeline 會直接呈現完整流程。可在同一步聚焦多個節點。
      </p>
    </>
  );
}

function Code({ step, still }: SlideRenderProps) {
  return (
    <>
      <CodeBlock
        filename="register.ts · TypeScript"
        language="ts"
        steps={codeSteps}
        step={step}
        still={still}
      >
        {registrationCode}
      </CodeBlock>
      <p className="demo-walkthrough-caption">
        按 → / Space 講下一段，← 返回。保留原始文字、縮排與空白行。
      </p>
    </>
  );
}

function Languages() {
  return (
    <>
      <p className="immerslides-lead">
        用 language 指定語言，常見副檔名別名也能使用。
      </p>
      <div className="demo-syntax-grid">
        {syntaxSamples.map((sample) => (
          <CodeBlock
            key={sample.language}
            filename={sample.filename}
            language={sample.language}
          >
            {sample.source}
          </CodeBlock>
        ))}
      </div>
      <p className="demo-walkthrough-caption">
        內建 highlight.js 常用語言組。未指定或未知的語言安全顯示原始文字。
      </p>
    </>
  );
}

function Composition({ step, still }: SlideRenderProps) {
  const current = codeSteps[step];
  return (
    <div className="demo-composition" data-step={step}>
      <div>
        <StepDescription
          title={current.title}
          step={step}
          count={codeSteps.length}
        >
          {current.detail}
        </StepDescription>
        <CodeWindow filename="register.ts · 自訂組合">
          <HighlightedCode language="ts" focus={current.lines} still={still}>
            {registrationCode}
          </HighlightedCode>
        </CodeWindow>
      </div>
      <ol className="demo-vertical-flow" aria-label="程式碼對應流程">
        {flowItems.map((item, index) => (
          <li key={item.id}>
            <FlowNode
              title={item.title}
              status={
                index === step ? 'active' : index < step ? 'complete' : 'idle'
              }
            >
              {item.detail}
            </FlowNode>
            {index < flowItems.length - 1 && (
              <FlowConnector
                status={
                  index < step ? 'complete' : index === step ? 'active' : 'idle'
                }
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Previews() {
  return (
    <div className="immerslides-columns wide-left">
      <div className="demo-preview">
        <SlidePreview deck={deck} slideId="code" step={1} />
      </div>
      <div>
        <span className="immerslides-label">SlidePreview</span>
        <h2>
          放映前，
          <br />
          先看一眼。
        </h2>
        <p>
          共用相同 renderer。
          <br />
          不啟動播放器、儲存進度或計時。
        </p>
        <p className="immerslides-note">
          左側是真正的靜態預覽，停在程式碼第二段。聚焦與語法上色保留，動態效果停止。
        </p>
      </div>
    </div>
  );
}

function Steps({ step }: SlideRenderProps) {
  return (
    <>
      <p className="immerslides-lead">大部分頁面，按一次就前往下一頁。</p>
      <div className="immerslides-columns">
        <div>
          <span className="immerslides-label">STEP 1 OF 2</span>
          <h2>先交代完整概念。</h2>
          <p>
            這一頁刻意保留一個補充步驟。
            <br />按 → 或 Space，揭露右側重點。
          </p>
        </div>
        <div
          className={`demo-reveal ${step >= 1 ? 'visible' : ''}`}
          aria-hidden={step < 1}
        >
          <span className="immerslides-label">STEP 2 OF 2</span>
          <h2>再補一個重點。</h2>
          <p>
            只有需要引導注意力時才分段。
            <br />
            再按一次，就會換頁。
          </p>
        </div>
      </div>
      <p className="immerslides-note">
        steps 包含初始狀態。一般頁面設為 1，這個示範設為 2。
      </p>
    </>
  );
}

function Navigation() {
  return (
    <div className="immerslides-columns">
      <div>
        <span className="immerslides-label">現在就能試</span>
        <h2>用你習慣的方式。</h2>
        <ul className="demo-list">
          <li>→ / Space 前進，← 後退。</li>
          <li>Page Down / Page Up 整頁切換。</li>
          <li>O 開啟樹狀大綱或縮圖預覽。</li>
          <li>F 全螢幕，? 開啟操作說明。</li>
        </ul>
      </div>
      <div>
        <span className="immerslides-label">ChapterGuide / Player</span>
        <h2>進度接得上。</h2>
        <p>
          點選左側章節可跳頁。章節移動、
          <br />
          大小與透明度會一起平滑切換。
        </p>
        <p className="immerslides-note">
          重新整理會恢復本分頁的進度。從頭開始會回到封面，並清除示範標記。
        </p>
      </div>
    </div>
  );
}

function Motion({ still, active }: SlideRenderProps) {
  const reduced = useReducedMotion();
  return (
    <>
      <p className="immerslides-lead">轉場承接內容，動畫不增加操作負擔。</p>
      <div className="demo-motion-track" aria-hidden>
        <span
          style={{
            animation: reduced || still || !active ? 'none' : undefined,
          }}
        />
      </div>
      <div className="immerslides-columns">
        <div>
          <span className="immerslides-label">fadeTransition(.25)</span>
          <h2>原生淡化轉場。</h2>
          <p>
            快速前進或後退會取消舊動畫。
            <br />
            也可提供自己的 Web Animations 轉場。
          </p>
        </div>
        <div>
          <span className="immerslides-label">useReducedMotion()</span>
          <h2>{reduced ? '目前已減少動態效果。' : '尊重系統偏好。'}</h2>
          <p>
            啟用減少動態效果後，
            <br />
            轉場與這裡的圓點動畫都會停止。
          </p>
        </div>
      </div>
    </>
  );
}

function Extensions() {
  return (
    <div className="immerslides-columns wide-left">
      <CodeBlock
        filename="自訂播放器介面 · js"
        language="js"
      >{`const extensions = {
  Provider: DemoProvider,
  Controls: DemoControls,
  Navigator: DemoNavigator,
  Help: DemoHelp,
  Overlay: DemoOverlay,
  reserveWidth: (slide, viewport) =>
    hasReservedNote(slide, viewport) ? 320 : 0,
};`}</CodeBlock>
      <div>
        <span className="immerslides-label">LIVE EXTENSIONS</span>
        <h2>加上你的操作。</h2>
        <p>
          按 ☆ 標記本頁，點數字查看。
          <br />
          Controls 接收目前頁面，並以
          <br />
          openNavigator('marked') 開啟篩選。
        </p>
        <p className="immerslides-note">
          Navigator 共用 Provider 的標記資料。右側是以 reserveWidth 預留空間的
          Overlay，操作說明使用自訂 Help 與講義連結。
        </p>
      </div>
    </div>
  );
}

function Integration() {
  return (
    <div className="immerslides-columns">
      <div>
        <span className="immerslides-label">可獨立安裝</span>
        <h2>套件帶走播放能力。</h2>
        <CodeBlock filename="src/main.tsx" language="tsx">{`import { Player }
  from 'immerslides';
import 'immerslides/styles.css';

<Player deck={deck} />`}</CodeBlock>
      </div>
      <div>
        <span className="immerslides-label">可重用的製作流程</span>
        <h2>Skill 帶走製作方式。</h2>
        <p>
          create 指令同時建立 Vite 專案與
          <br />
          .agents/skills/immerslides。
        </p>
        <p className="immerslides-note">
          defineDeck 驗證頁面與章節。穩定的 id 與 version 支援修改後的進度恢復。
        </p>
      </div>
    </div>
  );
}

function PresenterMode() {
  return (
    <div className="immerslides-columns">
      <div>
        <span className="immerslides-label">按 P 開啟</span>
        <h2>
          觀眾看簡報，
          <br />
          你掌握下一步。
        </h2>
        <p>獨立視窗顯示目前畫面、下一個畫面、講稿與計時。</p>
        <p className="immerslides-note">
          也可使用工具列的簡報者模式按鈕。開啟後將觀眾畫面移到投影螢幕。
        </p>
      </div>
      <div>
        <span className="immerslides-label">同步播放</span>
        <h2>
          分段講解，
          <br />
          也接得上。
        </h2>
        <p>
          在任一視窗前進或後退，另一邊同步更新。程式碼與流程的下一段也會出現在預覽中。
        </p>
        <p className="immerslides-note">
          講稿只顯示在簡報者視窗。每頁可用 notes 補上自己的講解重點。
        </p>
      </div>
    </div>
  );
}

function PageLinks() {
  const code = getSlideHref(deck, 'code', 1);
  return (
    <div className="immerslides-columns">
      <div>
        <span className="immerslides-label">直接連到一個畫面</span>
        <h2>
          每一頁，
          <br />
          都有自己的網址。
        </h2>
        <p>
          網址輸入 #/15 可前往第 15 頁。
          <br />
          直接鍵入頁數，或編輯下方頁碼，
          <br />
          再按 Enter 跳頁。換頁會更新網址，
          <br />
          支援重新整理與瀏覽器前後導覽。
        </p>
        <p className="immerslides-note">
          <a href={code}>開啟程式碼第二段</a>
        </p>
      </div>
      <div>
        <span className="immerslides-label">getSlideHref</span>
        <CodeBlock
          filename="頁面連結 · ts"
          language="ts"
        >{`getSlideHref(deck, 'code', 1)
// ${code}
const slide = {
  id: 'code',
  slug: 'code-walkthrough'
};`}</CodeBlock>
        <p className="immerslides-note">
          未指定 slug 時由標題產生。也可用章節標題的 slug 前往該章首頁，例如{' '}
          <a href="#/版型與內容">版型與內容</a>。
        </p>
      </div>
    </div>
  );
}

function Closing() {
  return (
    <>
      <p className="immerslides-kicker">BUILD YOUR NEXT PRESENTATION</p>
      <h1>
        留下你需要的，
        <br />
        開始你的下一份簡報。
      </h1>
      <p>這份功能導覽就是可修改的 starter。</p>
      <span className="immerslides-cover-meta">
        使用 $immerslides 製作或調整內容
      </span>
    </>
  );
}

type Scene = {
  id: string;
  title: string;
  Content: ComponentType<SlideRenderProps>;
  steps?: number;
  layout?: SlideFrameProps['layout'];
  notes?: string;
  slug?: string;
  features?: readonly { name: string; detail: string }[];
};

const scenes: readonly Scene[] = [
  {
    id: 'cover',
    title: '把想法，講清楚',
    Content: Cover,
    layout: 'cover',
    notes: '介紹 immerslides 的功能與操作。\n按 P 開啟簡報者模式。',
  },
  { id: 'overview', title: '先看看，哪些能力適合你', Content: Overview },
  {
    id: 'layouts',
    title: '用留白，建立清楚的層次',
    Content: Layouts,
    features: [{ name: 'SlideFrame', detail: '封面、內容與收尾版型。' }],
  },
  {
    id: 'timeline',
    title: '沿著流程，一段一段理解',
    slug: 'flow-walkthrough',
    Content: Flow,
    steps: flowSteps.length,
    features: [{ name: 'Timeline', detail: '完整流程與可選的分段聚焦。' }],
  },
  {
    id: 'code',
    title: '程式碼，跟著講解聚焦',
    slug: 'code-walkthrough',
    Content: Code,
    steps: codeSteps.length,
    notes:
      '本頁依序說明輸入整理、資料驗證與送出。\n每次只推進一段，確認聽眾理解後再繼續。',
    features: [{ name: 'CodeBlock', detail: '多語言上色與程式碼段落聚焦。' }],
  },
  { id: 'languages', title: '熟悉的語言，保留語法色彩', Content: Languages },
  {
    id: 'composition',
    title: '拆開元件，組成你的講解方式',
    Content: Composition,
    steps: codeSteps.length,
    features: [
      { name: 'CodeWindow', detail: '可以放入其他內容的程式碼視窗。' },
      { name: 'HighlightedCode', detail: '獨立使用的上色與行聚焦。' },
      { name: 'StepDescription', detail: '放在任何位置的段落說明。' },
      { name: 'FlowNode', detail: '可自訂內容與狀態的節點。' },
      { name: 'FlowConnector', detail: '跟隨流程狀態的連接線。' },
    ],
  },
  {
    id: 'previews',
    title: '預覽也使用同一份內容',
    Content: Previews,
    features: [{ name: 'SlidePreview', detail: '共用 renderer 的靜態預覽。' }],
  },
  { id: 'steps', title: '一次一頁，需要時才分段', Content: Steps, steps: 2 },
  {
    id: 'navigation',
    title: '讓操作跟得上講解',
    Content: Navigation,
    features: [
      { name: 'Player', detail: '播放、簡報者模式與進度保存。' },
      { name: 'ChapterGuide', detail: '平滑切換的章節導覽。' },
    ],
  },
  {
    id: 'motion',
    title: '動態效果，有需要才出現',
    Content: Motion,
    features: [
      { name: 'fadeTransition', detail: '使用瀏覽器原生淡化轉場。' },
      { name: 'useReducedMotion', detail: '尊重減少動態效果的偏好。' },
    ],
  },
  {
    id: 'extensions',
    title: '在播放核心之外，加入你的介面',
    Content: Extensions,
    features: [
      { name: 'usePlayback', detail: '在自訂介面讀取狀態並操作。' },
      { name: 'SlideNavigator', detail: '共用章節、縮圖與已標記篩選。' },
    ],
  },
  {
    id: 'presenter',
    title: '把講稿與下一步，留給自己',
    Content: PresenterMode,
    notes:
      '請示範按 P 開啟簡報者模式，並切到程式碼頁確認逐段預覽。\n最後示範暫停與重設計時。',
  },
  {
    id: 'urls',
    title: '用網址，直接回到這一頁',
    Content: PageLinks,
    features: [
      { name: 'getSlideHref', detail: '以標題、大綱或自訂 slug 直接換頁。' },
    ],
  },
  {
    id: 'integration',
    title: '把套件與製作流程一起帶走',
    Content: Integration,
    features: [{ name: 'defineDeck', detail: '頁面、章節與步驟，集中定義。' }],
  },
  {
    id: 'closing',
    title: '開始下一份簡報',
    Content: Closing,
    layout: 'ending',
    notes: '回顧需要採用的功能，邀請聽眾提出問題。',
  },
];

const featureInventory = scenes.flatMap((scene) =>
  (scene.features ?? []).map((feature) => ({ ...feature, target: scene.id })),
);

function Slide(props: SlideRenderProps) {
  const scene = scenes.find((scene) => scene.id === props.slide.id)!;
  const Content = scene.Content;
  return (
    <SlideFrame
      {...props}
      deck={deck}
      layout={scene.layout}
      footer="IMMERSLIDES / FEATURE TOUR"
    >
      <Content {...props} />
    </SlideFrame>
  );
}

export const deck = defineDeck({
  id: 'immerslides-feature-tour',
  title: '沉浸式簡報功能導覽',
  version: 5,
  size: { width: 1600, height: 900 },
  slides: scenes.map(({ id, title, steps = 1, notes, slug }) => ({
    id,
    title,
    steps,
    notes,
    slug,
  })),
  chapters: [
    { id: 'basics', title: '版型與內容', slug: 'content', slideId: 'overview' },
    { id: 'playback', title: '播放與動態', slideId: 'steps' },
    { id: 'extend', title: '擴充與重用', slideId: 'extensions' },
  ],
  previews: [{ slideId: 'timeline' }, { slideId: 'code' }],
  RenderSlide: Slide,
  transition: fadeTransition(0.25),
  Overlay: DemoOverlay,
  reserveWidth: (slide, viewport) =>
    hasReservedNote(slide, viewport) ? 320 : 0,
  Provider: DemoProvider,
  Controls: DemoControls,
  Navigator: DemoNavigator,
  handout: { title: '功能速查講義', href: './handout.html' },
  Help: () => (
    <p className="help-copy">
      工具列的 ☆
      可以標記目前頁面。點星號旁的數字，會在章節與投影片選單開啟「已標記」篩選，可切換文字與縮圖查看。標記由示範
      Provider
      保存在記憶體，重新整理或從頭開始會清除。播放進度則由播放器獨立保存在本分頁。
    </p>
  ),
});
