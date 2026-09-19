// Shared look for the round icon buttons in the navbar toolbar (bucket, inbox,
// shops, notifications, theme). They sit inside one bordered pill, so the
// buttons themselves are borderless.
export function navIconButtonClass(open = false) {
  return `relative flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
    open ? 'bg-brand-soft text-brand' : 'text-ink-muted hover:bg-surface-hover hover:text-ink'
  }`;
}

// Count badge pinned to the top-right of a toolbar icon button.
export const navBadgeClass =
  'absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ring-2 ring-surface';
