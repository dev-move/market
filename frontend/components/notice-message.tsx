'use client';

type Props = {
  children: React.ReactNode;
  tone?: 'error' | 'success' | 'info';
  title?: string;
  panel?: boolean;
  className?: string;
};

export default function NoticeMessage({
  children,
  tone = 'info',
  title,
  panel = false,
  className = '',
}: Props) {
  const classes = [
    panel ? 'panel' : '',
    'notice',
    panel ? 'notice-panel' : 'notice-inline',
    `notice-${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {title ? <strong className="notice-title">{title}</strong> : null}
      <p className="notice-text">{children}</p>
    </div>
  );
}
