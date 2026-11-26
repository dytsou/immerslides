import { ExternalLink } from 'lucide-react';
import type { DeckDefinition } from './types.js';

type PlayerHelpProps = {
  deck: DeckDefinition;
  onRestart: () => void;
};

export function PlayerHelp({ deck, onRestart }: PlayerHelpProps) {
  return (
    <>
      <div className="shortcut-list">
        {[
          ['→ / Space', '下一頁；有分段時前進一步'],
          ['←', '上一頁；有分段時退回一步'],
          ['Page Up / Page Down', '直接切換整頁'],
          ['數字 + Enter', '輸入投影片頁數跳頁'],
          ['O', '章節與投影片'],
          ['F', '目前視窗全螢幕'],
          ['P', '開啟或聚焦簡報者模式'],
          ['Esc', '關閉選單'],
          ['?', '操作說明'],
        ].map(([key, label]) => (
          <div key={key}>
            <kbd>{key}</kbd>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="help-copy">
        每頁與分段都有可分享的網址。重新整理會回到網址指定的位置；未指定時接續這個分頁的進度。點選「從頭開始」回到封面。
      </p>
      {deck.Help && <deck.Help />}
      {deck.handout && (
        <a
          className="handout-link"
          href={deck.handout.href}
          target="_blank"
          rel="noreferrer"
        >
          {deck.handout.title}
          <ExternalLink size={16} />
        </a>
      )}
      <button type="button" className="restart-button" onClick={onRestart}>
        從頭開始
      </button>
    </>
  );
}
