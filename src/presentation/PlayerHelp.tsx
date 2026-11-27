import { ExternalLink } from 'lucide-react';
import { useI18n } from '../i18n/context.js';
import type { DeckDefinition } from './types.js';

type PlayerHelpProps = {
  deck: DeckDefinition;
  onRestart: () => void;
};

export function PlayerHelp({ deck, onRestart }: PlayerHelpProps) {
  const { t } = useI18n();
  return (
    <>
      <div className="shortcut-list">
        {[
          ['→ / Space', t('help.nextDescription')],
          ['←', t('help.previousDescription')],
          ['Page Up / Page Down', t('help.pageDescription')],
          [t('help.digitsKey'), t('help.digitsDescription')],
          ['O', t('help.navigatorDescription')],
          ['F', t('help.fullscreenDescription')],
          ['P', t('help.presenterDescription')],
          ['Esc', t('help.escapeDescription')],
          ['?', t('help.helpDescription')],
        ].map(([key, label]) => (
          <div key={key}>
            <kbd>{key}</kbd>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="help-copy">{t('help.copy')}</p>
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
        {t('help.startOver')}
      </button>
    </>
  );
}
