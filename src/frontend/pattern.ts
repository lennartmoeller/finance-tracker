// PostgreSQL's word and space classes under the database's locale, where JavaScript's \w is ASCII-only and its \s takes in Unicode spaces.
const word = String.raw`\p{L}\p{N}_`;
const space = String.raw`\t-\r `;
const isWord = `[${word}]`;

// PostgreSQL's escapes that JavaScript's RegExp lacks or reads differently.
const escapes: Record<string, string> = {
  m: `(?<!${isWord})(?=${isWord})`,
  M: `(?<=${isWord})(?!${isWord})`,
  y: `(?:(?<!${isWord})(?=${isWord})|(?<=${isWord})(?!${isWord}))`,
  Y: `(?:(?<=${isWord})(?=${isWord})|(?<!${isWord})(?!${isWord}))`,
  A: "^",
  Z: "$",
  w: isWord,
  W: `[^${word}]`,
  s: `[${space}]`,
  S: `[^${space}]`,
};

function escaped(escape: string, char: string, bracketed: boolean) {
  if (char === "b" || char === "B")
    throw new SyntaxError(
      "PostgreSQL reads \\b as a backspace; write \\y for a word boundary.",
    );
  if (bracketed && (char === "W" || char === "S"))
    throw new SyntaxError(`Write \\${char} outside brackets.`);
  if (bracketed && (char === "w" || char === "s"))
    return char === "w" ? word : space;
  if (!bracketed && escapes[char]) return escapes[char];
  if (/[\p{L}\p{N}]/u.test(char) || "^$\\.*+?()[]{}|/".includes(char))
    return escape;
  return `\\u{${char.codePointAt(0)?.toString(16) ?? ""}}`;
}

export const literal = (text: string) =>
  text.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");

export const exactly = (text: string) => `^${literal(text)}$`;

// PostgreSQL reads a ] first in brackets, a ] or } outside brackets and bounds, and a { before a non-digit, as itself, where JavaScript's RegExp refuses or ends on them, and allows no count above 255.
function token(match: string, char: string | undefined) {
  if (char !== undefined) return escaped(match, char, false);
  if (match.startsWith("["))
    return match
      .replace(/^(\[\^?)\]/u, "$1\\]")
      .replace(/\\(.)/gsu, (escape, inner: string) =>
        escaped(escape, inner, true),
      );
  if (match.length === 1) return `\\${match}`;
  if (match.match(/\d+/gu)?.some((count) => Number(count) > 255))
    throw new SyntaxError("PostgreSQL repeats at most 255 times.");
  return match;
}

// A rule's pattern as PostgreSQL's ~* reads it: case-insensitive, with . matching line breaks.
export function pattern(source: string) {
  return new RegExp(
    source.replace(
      /\[\^?\]?(?:\[:[^\]]*:\]|\\.|[^\]\\])*\]|\\(.)|\{\d+(?:,\d*)?\}|\{(?!\d)|[\]}]/gsu,
      token,
    ),
    "isu",
  );
}
