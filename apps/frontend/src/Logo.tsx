const letterOf = (name: string | null) =>
  name?.match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() ?? "";

export function Logo({
  src,
  name,
  large = false,
}: {
  src: string | null;
  name: string | null;
  large?: boolean;
}) {
  const className = large ? "logo large" : "logo";
  return src ? (
    <img className={className} src={src} alt="" />
  ) : (
    <span className={`${className} letter`}>{letterOf(name)}</span>
  );
}
