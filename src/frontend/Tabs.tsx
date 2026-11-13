export function Tabs<Key extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: [key: Key, label: string][];
  value: Key;
  onChange: (key: Key) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          role="tab"
          aria-selected={key === value}
          onClick={() => {
            onChange(key);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
