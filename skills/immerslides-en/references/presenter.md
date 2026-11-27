# Presenter view

Press `P` in the audience view, or use the "Presenter view" button in the control bar, to open a separate window. Opening it again focuses the existing presenter window.

The presenter window shows the current view, the next view, the speaker notes for each slide, and the elapsed time. Both windows share one playback state, so moving forward or back in either window updates both. When code or a flow has steps, the next view previews the next step on the same slide first.

## Writing notes

Add an optional `notes` string to a slide's metadata. Line breaks are kept in the notes area.

```tsx
slides: [
	{
		id: 'opening',
		title: 'Before we start',
		steps: 1,
		notes: 'Explain the goal for today first.\nMake sure the audience can see the screen.',
	},
	{
		id: 'code',
		title: 'Understand the code step by step',
		steps: codeSteps.length,
		notes: 'Explain the input, the validation, and the result in order.\nLeave time for questions after each section.',
	},
],
```

The notes are not shown on the audience view. When a slide has no `notes`, the presenter window keeps the notes area and shows a placeholder. The field is plain text, so HTML or Markdown is not parsed.

## Timer and windows

The timer is calculated from timestamps, starting when presenter view opens. It can be paused, resumed, and reset. The timer does not advance slides automatically.

Put the audience view on the projector, and keep the presenter window on your own screen. Closing the presenter window does not affect the audience's playback progress, and you can open it again.

The browser must allow pop-ups for this open action. If opening fails, the player shows a message. The two windows belong to the same playback session, so no new site route is needed and no separate progress is kept.

## Verification

- Open the presenter view several times, and confirm that only one presenter window remains.
- Move forward and back from either window, and confirm that slides and sections stay in sync.
- Check the current notes and the next view, and confirm that the notes do not appear in the audience DOM.
- Test pausing, resuming, and resetting the timer, and reopening after closing.
- Turn on reduced motion, and confirm that both previews still show the correct state.
