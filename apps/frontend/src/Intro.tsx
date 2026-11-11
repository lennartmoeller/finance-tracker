export function Intro({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="intro">
      <div className="intro-icon">{icon}</div>
      <p className="intro-title">{title}</p>
      <p className="intro-text">{text}</p>
    </div>
  );
}
