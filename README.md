<p align="center">
  <img src="./starter/public/favicon.svg" alt="immerslides" width="128" height="128" />
</p>

# immerslides

![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![Node.js 26+](https://img.shields.io/badge/Node.js-26%2B-339933?logo=nodedotjs&logoColor=white)
![pnpm 11.29.0](https://img.shields.io/badge/pnpm-11.29.0-F69220?logo=pnpm&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

使用 React 製作沉浸式簡報，搭配可組合元件、簡報者模式與可重用的 agent skill。

## 預覽範例

需要 Node.js 26 以上與 pnpm 11。專案與 starter 都提供 `.nvmrc`，並以 `packageManager` 固定 pnpm 版本。

```sh
nvm install
nvm use
npm install --global pnpm@11.29.0
pnpm install
pnpm build
pnpm dev
```

開啟終端機顯示的 Vite 網址。範例是一份功能導覽，讓你查看版型、流程圖、語法上色、逐段聚焦、自由組合、簡報者模式與播放能力，再決定哪些適合自己的教材。大部分頁面一次點擊換頁，另有明確標示的分段示範。

## 從本機套件建立簡報

套件目前尚未發佈至 npm。先在這個 repository 打包。

```sh
pnpm pack --out immerslides.tgz
immerslides_package_tarball="$PWD/immerslides.tgz"
node bin/immerslides.mjs create /tmp/my-presentation
cd /tmp/my-presentation
pnpm add "$immerslides_package_tarball"
pnpm dev
```

將 tarball 路徑換成實際檔案位置。建立指令不會安裝依賴，也不會覆寫非空目錄。產生的專案使用公開的 `immerslides` 套件入口，不依賴這個 repository 的參考資料。

套件發佈後可使用以下指令。

```sh
pnpm dlx immerslides create my-presentation
cd my-presentation
pnpm install
pnpm dev
```

## 使用對應的 skill

新專案會自動包含 `.agents/skills/immerslides/`。在該專案開啟支援 project skills 的 agent，使用以下提示。

```text
$immerslides 請把這份教材整理成一份 CI 技術簡報。
一次點擊切換一個完整頁面，流程不要逐節點拆開。
```

維護用的唯一來源是 [skills/immerslides/SKILL.md](skills/immerslides/SKILL.md)。CLI 將它與其參考文件一起複製到新專案。既有專案也可將整個 `skills/immerslides` 資料夾複製至該專案的 `.agents/skills/immerslides`。

Skill 會先安排每頁的完整觀點，再使用套件元件撰寫 JSX。它保留整頁為主的點擊節奏，並要求檢查實際瀏覽器畫面、縮放與鍵盤播放。

## 在 React 專案使用

```tsx
import { Player } from 'immerslides/player';
import 'immerslides/styles.css';
import { deck } from './deck';

export function App() {
  return <Player deck={deck} />;
}
```

使用 `defineDeck` 定義頁面順序、章節與 renderer。每頁設定 `steps: 1` 即為一次前進換頁。需要少量分段時再明確增加 `steps`。

每個元件都有獨立入口，可只匯入需要的部分。

```tsx
import { CodeWindow } from 'immerslides/code-window';
import { HighlightedCode } from 'immerslides/highlighted-code';
import { FlowNode } from 'immerslides/flow-node';
import type { CodeWindowProps } from 'immerslides/code-window';
```

`CodeWindow`、`FlowNode` 等基礎元件可直接使用，不需要播放器。單獨匯入外框不會載入語法上色或播放核心。既有的 `import { CodeWindow } from 'immerslides'` 也可繼續使用。完整入口見 [元件組合指南](skills/immerslides/references/composition.md)。樣式統一由 `immerslides/styles.css` 匯入。

完整範例與公開介面見 [製作指南](skills/immerslides/references/authoring.md)。支援範圍與使用時機見 [功能表](skills/immerslides/references/features.md)。

程式碼與流程的分段聚焦範例見 [沉浸式講解](skills/immerslides/references/immersive.md)。CodeBlock 支援 `language` 指定語法，例如 TypeScript、Python、Java、SQL、JSON、YAML、Bash、HTML 與 CSS。

需要自己安排版面時，使用 [自由組合元件](skills/immerslides/references/composition.md)。`CodeWindow`、`HighlightedCode`、`StepDescription`、`FlowNode` 與 `FlowConnector` 可分開使用，並共用同一份講解步驟。

按 `P` 開啟 [簡報者模式](skills/immerslides/references/presenter.md)，查看目前畫面、下一個畫面、講稿與計時。講稿使用每頁可選的 `notes` 欄位。

每頁都有 [可分享的 slug 網址](skills/immerslides/references/urls.md)，例如 `/#/code-walkthrough?step=2`。網址會隨換頁與分段更新，支援重新整理與瀏覽器上一頁、下一頁。Slug 可明確指定，也會從標題與章節大綱產生。

也可使用 `/#/15` 直接前往第 15 頁。放映時直接鍵入頁數，或編輯下方目前頁數，再按 Enter 跳頁。Esc 或離開輸入框取消。純數字網址代表頁數，自訂 slug 使用 `chapter-1` 等名稱。

按 `O` 開啟「章節與投影片」。文字大綱以章節與投影片的樹狀結構呈現，可展開或收合；未分章頁面直接列出。切到「縮圖預覽」可依畫面挑選頁面。選擇的模式會保留，關閉選單或重新整理後仍可沿用。目前頁面符合篩選時，開啟選單或切換模式會捲到該頁並標示選取狀態；選取其他頁面後同步更新網址。

範例工具列的 ☆ 可標記目前頁面。點旁邊的數量會開啟同一個「章節與投影片」視窗，並套用「已標記」篩選。文字大綱與縮圖都可篩選，保留原始頁碼並隱藏空章節。滑鼠移到頁面時，右上角會顯示星星，可標記或取消；點頁面本身即可查看。鍵盤聚焦也會顯示星星，觸控裝置則直接顯示。標記保留於本次播放，重新整理或從頭開始會清除。

## 播放操作

| 按鍵               | 功能                               |
| ------------------ | ---------------------------------- |
| →／Space           | 前進。預設切換下一頁。             |
| ←                  | 返回上一頁或上一個明確設定的步驟。 |
| Page Down／Page Up | 直接切換整頁。                     |
| 數字，再按 Enter   | 輸入頁數跳頁。Esc 取消。           |
| O                  | 開啟章節與頁面選單。               |
| F                  | 切換全螢幕。                       |
| P                  | 開啟或聚焦簡報者視窗。             |
| ?                  | 開啟說明與從頭開始。               |
| Esc                | 關閉選單。                         |

重新整理會優先恢復網址指定的投影片與步驟。未指定網址時沿用同一分頁保存的進度，`<Player deck={deck} fresh/>` 則從封面開始。使用者啟用減少動態效果時，播放器停用轉場並保留完整內容。

## 驗證

```sh
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm test:package
pnpm test:browser
```

`pnpm lint` 使用 Biome 檢查程式碼、React 規則、排版與匯入順序。`pnpm lint:fix` 套用可安全自動修正的項目。

規則保留明確的 effect 生命週期觸發、非空斷言、動畫索引與既有 CSS 優先序，仍會阻擋遺漏的 effect 依賴。原生 dialog 取消、子控制項冒泡的焦點、按鈕群組與 React 測試 fixture 採檔案範圍的規則例外。產生的 favicon 不納入檢查。

## GitHub 自動化

Pull request 與推送至 `main` 會執行 lint、型別、單元、套件安裝與 Chromium 播放檢查。CI 與發佈前檢查共用 `.github/workflows/verify.yml`。

Dependabot 每週檢查主專案、starter 與 GitHub Actions 的依賴。CodeQL 在 pull request 與 `main` 更新時分析 JavaScript 與 TypeScript。私人 repository 需先啟用 GitHub Code Security，才能使用 CodeQL。

## 發佈套件

發佈使用 [Release GitHub & NPM](https://github.com/marketplace/actions/release-github-npm)。流程僅能從 `main` 手動啟動，先執行共用檢查，再依序發佈 npm、GitHub Packages 與 GitHub Release。

npm 名稱維持 `immerslides`。GitHub Packages 名稱為 `@<repository-owner>/immerslides`，scope 自動使用 repository 擁有者的小寫名稱。兩個 registry 使用同一份建置內容。Workflow 在 runner 暫時切換套件名稱與 repository 資訊；GitHub Packages 步驟結束後，無論成功與否都還原原始 manifest。

1. 在 GitHub repository 建立 `npm` environment，限制僅允許 `main` 部署；需要人工核准時設定 required reviewers。
2. 在該 environment 新增 `NPM_TOKEN` secret，使用有權發佈 `immerslides` 的 npm token。
3. 確認 repository 的 `GITHUB_TOKEN` 可寫入 GitHub Packages。Workflow 已為發佈工作設定 `packages: write`；組織仍須允許建立該 scope 的套件。
4. 提交要發佈的 `package.json` 版本。首次發佈前先確認 npm 套件名稱與授權。
5. 開啟 Actions 的 **Release** workflow，選擇 `main` 並執行。

版本取自 `package.json`，對應標籤為 `v<version>`。同名標籤若已指向其他 commit，流程會停止。已存在的 registry 版本沿用 Action 的略過機制。GitHub Release 包含 commit notes，穩定版會將 `v<major>` 標籤移到本次發佈的 commit。

從 GitHub Packages 使用套件時，先設定該 scope 的 registry 與具備 `read:packages` 的登入權限。CLI 產生的專案會透過 npm alias 將 scoped 套件對應為 `immerslides`，原有元件匯入方式保持相同。產生專案後，該專案也需要相同的 scope registry 設定。
