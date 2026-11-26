import type { CodeStep, TimelineStep } from 'immerslides';

export const registrationCode = `type Input = { email: string };

export async function register(input: Input) {
  const email = input.email.trim();

  /* Validate at the boundary.
     Keep the original intent clear. */
  if (!email.includes('@')) {
    throw new Error('Invalid email');
  }

  const response = await fetch('/api/register', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error('Try again');

  return response.json();
}`;

export const codeSteps: readonly CodeStep[] = [
  {
    title: '先看輸入與整理。',
    detail:
      '函式接收參加者資料，整理 email。先交代資料如何進來，讓聽眾跟上程式的起點。',
    lines: [[1, 4]],
  },
  {
    title: '在邊界檢查資料。',
    detail: '整段驗證一起講。跨行註解與語法色彩都保留，其他程式仍看得見。',
    lines: [[6, 10]],
  },
  {
    title: '最後完成送出。',
    detail:
      '送出、檢查回應並回傳結果。聚焦區會移動到這一段，需要時捲動程式碼視窗。',
    lines: [[12, 19]],
  },
];

export const flowItems = [
  { id: 'input', title: '整理輸入', detail: '保留完整資料', tone: 'focus' },
  { id: 'validate', title: '檢查條件', detail: '先確認再送出', tone: 'warn' },
  { id: 'submit', title: '完成送出', detail: '檢查回應結果', tone: 'good' },
] as const;
export const flowSteps: readonly TimelineStep[] = [
  {
    title: '從資料的起點開始。',
    detail:
      '先說明輸入資料與預期。整條路徑保留在畫面上，讓聽眾知道目前的位置。',
    nodes: ['input'],
  },
  {
    title: '聚焦需要判斷的地方。',
    detail:
      '節點與連接路徑一起亮起。按 ← 能回到上一段，快速前後切換也會接續目前的位置。',
    nodes: ['validate'],
  },
  {
    title: '把結果與下一步交代清楚。',
    detail:
      '最後說明送出與回應。再按一次前進才會換頁。一般頁面仍維持一次一頁。',
    nodes: ['submit'],
  },
];

export const syntaxSamples = [
  {
    filename: 'types.ts · ts',
    language: 'ts',
    source: 'const name: string = "Ada";\nexport { name };',
  },
  {
    filename: 'hello.py · py',
    language: 'py',
    source: 'def greet(name):\n    return f"Hello {name}"',
  },
  {
    filename: 'Hello.java · java',
    language: 'java',
    source: 'class Hello {\n  String name = "Ada";\n}',
  },
  {
    filename: 'query.sql · sql',
    language: 'sql',
    source: 'SELECT name FROM attendees\nWHERE confirmed = true;',
  },
  {
    filename: 'config.json · json',
    language: 'json',
    source: '{ "name": "Ada",\n  "confirmed": true }',
  },
  {
    filename: 'config.yml · yml',
    language: 'yml',
    source: 'name: Ada\nconfirmed: true',
  },
  {
    filename: 'build.sh · sh',
    language: 'sh',
    source: '# Build the slides\npnpm build',
  },
  {
    filename: 'index.html · html',
    language: 'html',
    source: '<main class="slides">\n  <h1>Hello</h1>\n</main>',
  },
  {
    filename: 'theme.css · css',
    language: 'css',
    source: '.slides {\n  color: #0071e3;\n}',
  },
] as const;
