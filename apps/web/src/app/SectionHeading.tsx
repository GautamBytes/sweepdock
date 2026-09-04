import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <header className="page-heading section-heading">
      <div className="section-heading-label">
        <span className="section-icon">
          <Icon size={22} aria-hidden="true" />
        </span>
        <span className="eyebrow">{eyebrow}</span>
      </div>
      <h1>{title}</h1>
      <p>{children}</p>
    </header>
  );
}
