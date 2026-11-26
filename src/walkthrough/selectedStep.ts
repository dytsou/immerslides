export function selectedStep<T>(steps: readonly T[] | undefined, step: number) {
  if (
    steps &&
    (!steps.length ||
      !Number.isInteger(step) ||
      step < 0 ||
      step >= steps.length)
  )
    throw new Error(
      'Walkthroughs need a nonempty steps array and an in-range integer step.',
    );
  return steps?.[step];
}
