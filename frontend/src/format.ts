export function fmt(value: number | null | undefined, digits = 2): string {
  if (value == null) return "N/A";
  if (value !== 0 && Math.abs(value) < 0.000001) return value.toExponential(2);
  return value.toLocaleString("en-US", {
    maximumFractionDigits: value !== 0 && Math.abs(value) < 0.01 ? 6 : digits,
  });
}
export const exact = (value: number) => fmt(value, 6);
