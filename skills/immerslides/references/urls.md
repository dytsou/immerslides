# 以網址開啟投影片

每張投影片都有獨立的 fragment 網址。一般換頁與分段操作會更新網址及瀏覽器歷史記錄。使用上一頁、下一頁或重新整理，可回到相同的投影片與步驟。

例如 `/#/code-walkthrough?step=2` 開啟程式碼頁的第二段。原本的網站路徑與查詢參數會保留，因此靜態部署也可使用直接連結。

## 指定 slug

```tsx
const deck = defineDeck({
  id: 'my-talk',
  title: '技術分享',
  size: { width: 1600, height: 900 },
  slides: [
    { id: 'opening', title: '開始之前', slug: 'opening', steps: 1 },
    {
      id: 'code',
      title: '逐段理解程式碼',
      slug: 'code-walkthrough',
      steps: codeSteps.length,
    },
  ],
  chapters: [
    { id: 'intro', title: '基本概念', slug: 'basics', slideId: 'opening' },
  ],
  previews: [{ slideId: 'code' }],
  RenderSlide,
});
```

未指定 slug 時，由標題產生。英文會轉為小寫，空白與標點會整理為連字號，中文等 Unicode 文字會保留。重複標題會加上穩定的頁面 ID 以區分。

分享需要長期保留的連結時，明確設定 `slug`。修改標題就不會改變該頁的主要網址。

## 輸入頁數跳頁

`#/15` 前往第 15 頁，`#/5?step=2` 前往第 5 頁的第二段。頁數從 1 開始，依 `slides` 陣列順序計算。換頁後網址會整理為該頁的主要 slug。

放映時直接鍵入頁數再按 Enter 可跳頁。下方頁碼的目前頁數也可點選編輯。按 Esc 或離開輸入框則取消編輯，空白、小數與超出總頁數的輸入不會換頁。編輯其他文字欄位時，數字按鍵不會觸發跳頁。

純數字網址保留給頁數。數字型的投影片 ID 不作為網址別名，純數字標題會加上 `slide-` 前綴。自訂投影片或章節的 slug 需包含數字以外的文字，例如 `chapter-1`。數字頁碼會隨簡報排序改變，長期分享使用明確的 slug。

## 由標題或大綱前往

非純數字的投影片 ID、標題產生的 slug，以及章節標題或明確設定的 slug，都可用來找到對應投影片。章節會前往該章的第一頁。

範例中的主要連結為 `#/opening` 與 `#/code-walkthrough`。也可使用 `#/基本概念` 或 `#/basics` 前往章節首頁。

無法唯一判斷的自動別名不會任意導向其他頁面。明確設定的 slug 若產生衝突，`defineDeck` 會在建立簡報時回報錯誤。

## 在內容中加入連結

```tsx
import { getSlideHref } from 'immerslides';

<a href={getSlideHref(deck, 'code', 1)}>前往程式碼第二段</a>;
```

`getSlideHref(deck, slideId, step = 0)` 回傳 fragment 字串。函式的 `step` 與播放器一樣從 0 開始，網址中的 `step` 從 1 開始。第一段省略網址步驟參數。

有效的投影片網址優先於保存的播放進度與 `fresh`。沒有指定投影片時，沿用 `fresh` 或分頁保存的進度。無效的指定網址會回到第一頁，格式錯誤的步驟回到第一段，超出範圍的整數步驟限制在有效範圍內。

簡報者視窗共用觀眾視窗的播放狀態。從簡報者視窗操作也會更新觀眾視窗的網址。
