/** Итоговая цена с учётом скидки (discount — проценты 0–100). */
export function getFinalPrice(price, discount = 0) {
  const p = Number(price) || 0;
  const d = Number(discount) || 0;
  if (d <= 0) return p;
  return Math.round(p * (1 - d / 100) * 100) / 100;
}

export function formatPrice(price) {
  return Number(price).toLocaleString("ru-RU");
}
