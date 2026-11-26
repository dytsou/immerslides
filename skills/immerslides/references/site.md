# 將簡報內容用於直向網站

保留同一份 deck、內容順序與設計風格，讓讀者在 /site 向下捲動閱讀。

## 設定入口

Starter 與 CLI 產生的專案提供三個入口。

- / 依 src/config.ts 的 defaultView 顯示網站或簡報。
- /slides 固定顯示簡報。
- /site 固定顯示網站。

修改產生專案的 src/config.ts，選擇首頁形式。套件 repository 中的對應檔案是 starter/src/config.ts。

```ts
export const defaultView: 'slides' | 'site' = 'site';
```

Starter 預設為 `'slides'`，/ 開啟簡報，既有的 `/#/slug` 簡報網址維持不變。需要以網站作為首頁時，才改成上方的 `'site'`。

保留 index.html、slides/index.html、site/index.html 與 Vite 的三個 build inputs。它們讓靜態主機也能直接開啟子頁面。部署時使用完整建置目錄。

## 在既有 React 網站加入閱讀頁

在宿主專案的 /site 路由渲染 Site，傳入原有 deck。

```tsx
import { Site } from 'immerslides/site';
import 'immerslides/styles.css';
import { deck } from './deck';

export function ReadingPage() {
  return <Site deck={deck} presentationHref="/slides" />;
}
```

presentationHref 指向宿主專案的簡報入口。部署在子目錄時，使用包含該子目錄的網址。Site 本身不註冊宿主路由。

網站專屬的 CSS 類別使用 immersite 與 immersite-*。共用的內容元件仍沿用原有類別，樣式統一由 immerslides/styles.css 提供。

## 讓捲動推進原有動畫

網站使用既有 RenderSlide。捲動位置決定 step，內容進入與離開畫面時更新 active。沿用 still 與 reducedMotion 控制動畫，不要在網站版將它們固定為靜態。程式碼聚焦、流程節點、連線與分段揭露可繼續使用原有受控元件。

需要固定整個頁面並以捲動推進步驟時，使用 SiteStory。steps 接收原有的標題與說明陣列，step 接收 renderer 的目前步驟。children 放入原有圖表或程式碼元件。

```tsx
import { SiteStory } from 'immerslides/site';
import { CodeBlock } from 'immerslides/code-block';

<SiteStory steps={codeSteps} step={step}>
  <CodeBlock
    filename="register.ts"
    language="ts"
    steps={codeSteps}
    step={step}
    still={still}
  >
    {registrationCode}
  </CodeBlock>
</SiteStory>;
```

動畫模式一次顯示目前步驟的資訊，短距離捲動即可前進，向上捲動可回到前一步。內容過高時先縮小文字，保留可讀下限；仍無法放入視窗時才使用自然流動。步驟完成後，內文隨捲動進度向上銜接，向上捲動可倒退轉場。銜接範圍以下方的瀏覽器視窗邊界為準。前後內容保持連續可見，章節列等共用元素保持固定。停止捲動後，畫面吸附到鄰近的完整頁面。系統啟用減少動態效果時，移除固定、縮字與吸附效果，展開完整的靜態說明。

## 減少動態效果下的步驟

啟用減少動態效果時，每頁直接顯示最後一步的完整內容，分段揭露的內容全部可見。SiteStory 另外列出所有步驟的標題與說明，並隱藏子元件原本只顯示單一步驟的說明。捲動不再推進步驟。

不要另外複製程式碼、步驟資料或章節清單。Starter 的程式碼、流程與自由組合示範都沿用簡報的步驟陣列。

將收到的 props 傳給 SlideFrame，同時接上章節點擊操作。章節列、標題與頁尾保持共用的渲染方式，網站外層負責固定畫面、響應式版面與轉場。自訂固定寬高的圖表需要自行提供窄螢幕樣式。內嵌 SlidePreview 仍維持靜態縮圖。

共用 renderer 使用 props 的 actions，不要依賴 usePlayback()。網站不掛載播放的 Provider、控制列、覆層或講稿。actions.jump(id) 捲到對應段落，前後操作捲到相鄰段落。

## 連到網站段落

使用 getSiteHref 建立網站內的錨點。

```tsx
import { getSiteHref } from 'immerslides/site';

<a href={getSiteHref(deck, 'pipeline')}>閱讀流程</a>;
```

在網站使用這個連結，在簡報使用 getSlideHref。固定分享的段落設定穩定的 slide slug。

## 驗證閱讀體驗

執行專案的型別檢查與建置。開啟 /、/slides 與 /site，確認預設形式與固定入口都正確。切換設定後再次確認首頁。

檢查章節連結、直接開啟段落、重新整理與瀏覽器前後導覽。用桌面和手機寬度確認文字、流程與程式碼完整可讀。程式碼可在自己的區域水平捲動，整頁不應水平溢出。

捲動時檢查整頁固定、程式碼行聚焦、流程節點與連線、封面景深與內文向上銜接。確認轉場中沒有空白畫面，相同元素不會一起滾動。跨頁中途停手，確認畫面吸附到完整頁面；吸附時再次滾動，確認可接續操作。一頁只顯示目前的資訊，步驟切換不需要長距離捲動。點擊側邊章節列，確認可跳到對應章節。向上捲動確認步驟與轉場可以反向推進。檢查離開畫面的循環動畫會停止。

啟用系統的減少動態效果，確認動畫、固定與吸附效果停止，內容仍可閱讀。保留原生捲動，只在跨頁中途停止操作後吸附，不攔截滾輪或延長步驟捲動距離。
