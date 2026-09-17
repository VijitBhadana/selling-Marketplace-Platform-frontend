import { ShieldCheck, MapPin, Zap, LayoutGrid, type LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  {
    icon: ShieldCheck,
    title: 'OTP-Verified Sellers',
    desc: "Every seller confirms their number before going live, so you always know who you're dealing with.",
  },
  {
    icon: MapPin,
    title: 'Hyperlocal Discovery',
    desc: "Results are ranked by distance first — find what's near you, right in your own neighbourhood.",
  },
  {
    icon: Zap,
    title: 'Live in 2 Minutes',
    desc: 'Pick a category, add a few details, verify your OTP — your ad goes live almost instantly.',
  },
  {
    icon: LayoutGrid,
    title: 'Every Cloude, One Place',
    desc: 'Crafts, tutors, venues, mistris and more — every kind of local business under one roof.',
  },
];

interface FeatureTimelineProps {
  /** 0 (nothing revealed) to 1 (all points revealed + line fully grown). */
  progress: number;
  /** Match this panel's height (px) to the hero's left column, e.g. for pinned layouts. */
  heightPx?: number | null;
  className?: string;
}

export function FeatureTimeline({ progress, heightPx, className = '' }: FeatureTimelineProps) {
  return (
    <div
      className={`flex w-full max-w-xs shrink-0 flex-col justify-center ${className}`}
      style={heightPx ? { height: `${heightPx}px` } : undefined}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Why DukanCloude
      </p>
      <ul className="relative flex flex-col gap-10">
        <span aria-hidden className="absolute left-4 top-4 bottom-4 w-px bg-border" />
        <span
          aria-hidden
          className="absolute left-4 top-4 w-px bg-brand transition-[height] duration-150 ease-out"
          style={{ height: `calc((100% - 2rem) * ${progress})` }}
        />
        {FEATURES.map((feature, i) => {
          const threshold = i / FEATURES.length;
          const active = progress >= threshold;
          const Icon = feature.icon;
          return (
            <li
              key={feature.title}
              className={`flex items-start gap-4 transition-all duration-500 ease-out ${
                active ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
              }`}
            >
              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-surface transition-colors duration-300 ${
                  active ? 'border-brand text-brand' : 'border-border text-ink-muted'
                }`}
              >
                <Icon size={15} />
              </span>
              <div className="pt-0.5">
                <p className="font-display text-sm font-bold text-ink">{feature.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{feature.desc}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
