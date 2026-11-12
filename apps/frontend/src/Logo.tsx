export function Logo({
  src,
  name,
}: {
  src: string | null;
  name: string | null;
}) {
  return src ? (
    <img className="logo" src={src} alt="" />
  ) : (
    <span className="logo letter">
      {name?.match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase()}
    </span>
  );
}
