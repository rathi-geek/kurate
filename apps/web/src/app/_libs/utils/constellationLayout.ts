// 1000×700 virtual canvas — SVG viewBox="0 0 1000 700"

/** The 7 stars of the Big Dipper in sequential fill order (handle → bowl, left → right). */
export const BIG_DIPPER_STARS = [
  { name: "Alkaid", x: 205, y: 455 }, // 0 — handle end (leftmost, START)
  { name: "Mizar", x: 288, y: 378 }, // 1 — handle 2
  { name: "Alioth", x: 385, y: 308 }, // 2 — handle 1
  { name: "Megrez", x: 480, y: 256 }, // 3 — bowl top-left (handle junction)
  { name: "Phecda", x: 492, y: 338 }, // 4 — bowl bottom-left
  { name: "Merak", x: 632, y: 322 }, // 5 — bowl bottom-right
  { name: "Dubhe", x: 620, y: 240 }, // 6 — bowl top-right
] as const;

export const BIG_DIPPER_TOTAL = BIG_DIPPER_STARS.length;

export function hashId(id: string): number {
  return id
    .split("")
    .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0);
}
