import type { FlowStatus } from './types.js';

export type { FlowStatus } from './types.js';
export type FlowConnectorProps = { status?: FlowStatus };

export function FlowConnector({ status = 'idle' }: FlowConnectorProps) {
  return (
    <span
      className="immerslides-flow-connector"
      data-status={status}
      aria-hidden="true"
    />
  );
}
