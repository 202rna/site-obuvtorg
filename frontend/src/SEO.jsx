import { useEffect } from "react";

export function SEO({ title, description, isProduct = false }) {
  const siteName = "Магазин «Обувьторг» Ярославль";

  const fullTitle = isProduct
    ? `${title} — Купить по выгодной цене в ${siteName}`
    : `${title} | ${siteName}`;

  useEffect(() => {
    // 1. Жестко меняем title вкладки
    document.title = fullTitle;

    // 2. Ищем существующий тег description в index.html
    let metaDesc = document.querySelector('meta[name="description"]');

    if (metaDesc) {
      // Если нашли — перезаписываем его текст на описание товара
      metaDesc.setAttribute("content", description);
    } else {
      // Если вдруг его вообще не было — создаем с нуля
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      metaDesc.content = description;
      document.head.appendChild(metaDesc);
    }
  }, [fullTitle, description]); // Код сработает заново, если изменится товар

  return null; // Компонент ничего не рисует на экране, он работает в фоне
}
