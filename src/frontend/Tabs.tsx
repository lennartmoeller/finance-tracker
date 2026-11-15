export function Tabs({
  tabs,
  value,
}: {
  tabs: [href: string, label: string][];
  value: string;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([href, label]) => (
        <a key={href} role="tab" aria-selected={href === value} href={href}>
          {label}
        </a>
      ))}
    </div>
  );
}
