import Decimal from "decimal.js";

export function pdfMoney(value: string | number): string {
  return new Decimal(value || "0").toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}
