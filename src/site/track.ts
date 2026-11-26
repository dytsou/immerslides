/** Scroll distance for one step, as a fraction of the viewport height. */
export const STEP_SCROLL = 0.3;

export type PageMeasure = { steps: number; content: number };
export type TrackSegment = {
  start: number;
  range: number;
  overflow: number;
  steps: number;
  top: number;
  height: number;
};
export type Track = {
  viewport: number;
  segments: readonly TrackSegment[];
  height: number;
};
export type PagePosition = {
  offset: number;
  inner: number;
  step: number;
  visible: boolean;
  front: boolean;
  shared: number;
  settled: number;
};

export function createTrack(
  pages: readonly PageMeasure[],
  viewport: number,
): Track {
  const stepScroll = Math.round(STEP_SCROLL * viewport);
  let start = 0;
  const segments = pages.map((page, index) => {
    const overflow = Math.max(0, page.content - viewport);
    const range = Math.max((page.steps - 1) * stepScroll, overflow);
    const incoming = index > 0 ? viewport : 0;
    const outgoing = index < pages.length - 1 ? viewport : 0;
    const segment = {
      start,
      range,
      overflow,
      steps: page.steps,
      top: start - incoming,
      height: incoming + range + outgoing + viewport,
    };
    start += range + viewport;
    return segment;
  });
  const last = segments[segments.length - 1];
  return { viewport, segments, height: last.start + last.range + viewport };
}

export function positionOf(track: Track, index: number, step: number) {
  const segment = track.segments[index];
  const last = segment.steps - 1;
  return (
    segment.start +
    (last ? (segment.range * Math.max(0, Math.min(last, step))) / last : 0)
  );
}

export function readPosition(
  track: Track,
  index: number,
  y: number,
): PagePosition {
  const { viewport, segments } = track;
  const segment = segments[index];
  const last = segment.steps - 1;
  let local = y - segment.start;
  if (index === 0) local = Math.max(0, local);
  if (index === segments.length - 1) local = Math.min(segment.range, local);
  let offset = 0;
  let inner = 0;
  let step = 0;
  if (local < 0) offset = -local;
  else if (local > segment.range) {
    offset = segment.range - local;
    inner = segment.overflow;
    step = last;
  } else {
    inner = Math.min(local, segment.overflow);
    if (last) step = Math.min(last, Math.round(local / (segment.range / last)));
  }
  const distance = Math.abs(offset);
  return {
    offset,
    inner,
    step,
    visible: distance < viewport,
    front: offset > -viewport / 2 && offset <= viewport / 2,
    shared: Math.max(0, Math.min(1, 5.5 - (10 * distance) / viewport)),
    settled: Math.max(0, Math.min(1, 1.5 - (12.5 * distance) / viewport)),
  };
}

/** The nearer complete page when y stops inside a page-to-page transition. */
export function snapTarget(track: Track, y: number): number | null {
  const { segments } = track;
  for (let index = 0; index < segments.length - 1; index++) {
    const from = segments[index].start + segments[index].range;
    const to = segments[index + 1].start;
    if (y > from + 1 && y < to - 1) return y - from < to - y ? from : to;
  }
  return null;
}
