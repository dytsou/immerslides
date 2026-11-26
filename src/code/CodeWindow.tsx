import type { ReactNode } from 'react';

export type CodeWindowProps = { filename?: string; children: ReactNode };

export function CodeWindow({ filename, children }: CodeWindowProps) {
  return (
    <figure className="immerslides-code">
      {filename && <figcaption>{filename}</figcaption>}
      {children}
    </figure>
  );
}
