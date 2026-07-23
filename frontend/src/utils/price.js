/**
 * Итоговая цена с учётом скидки (discount — проценты 0–100).
 * Возвращает целое число (без копеек).
 */
export function getFinalPrice(price, discount = 0) {
  const p = Number(price) || 0;
  const d = Number(discount) || 0;
  if (d <= 0) return Math.round(p); // Если скидки нет, округляем исходную цену до целого
  return Math.round(p * (1 - d / 100)); // Округляем до ближайшего целого
}

/**
 * Форматирует цену, показывая только целую часть (без копеек).
 * Например: 1234.56 → "1 235"
 */
export function formatPrice(price) {
  const rounded = Math.round(Number(price) || 0);
  return rounded.toLocaleString("ru-RU", {
    maximumFractionDigits: 0, // не показываем дробную часть
  });
}
