import type { ReactNode } from 'react';
import type { FlowStatus, FlowTone } from './types.js';

export type { FlowStatus, FlowTone } from './types.js';
export type FlowNodeProps = {
  title: ReactNode;
  status?: FlowStatus;
  tone?: FlowTone;
  children?: ReactNode;
};

export function FlowNode({ title, children, tone, status }: FlowNodeProps) {
  return (
    <div
      className="immerslides-flow-node"
      data-tone={tone}
      data-status={status}
    >
      <b>{title}</b>
      {children && <div className="immerslides-flow-detail">{children}</div>}
    </div>
  );
}
