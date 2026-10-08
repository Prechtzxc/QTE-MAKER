import Decimal from "decimal.js";

export function formatCurrency(value: string): string {
  const amount = new Decimal(value || "0").toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
  const [whole, fraction] = amount.split(".");
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `₱${formattedWhole}.${fraction}`;
}

export function formatMoneyValue(value: string | number): string {
  return new Decimal(value || "0").toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

export function formatDate(value: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function vatLabel(value: string): string {
  switch (value) {
    case "VAT_INCLUSIVE":
      return "VAT Inc.";
    case "VAT_EXCLUSIVE":
      return "VAT Exc.";
    case "NON_VAT":
      return "Non-VAT";
    default:
      return value;
  }
}

export function nextSectionNumber(count: number): string {
  let number = count + 1;
  let result = "";

  while (number > 0) {
    const remainder = (number - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    number = Math.floor((number - 1) / 26);
  }

  return `${result}.`;
}
