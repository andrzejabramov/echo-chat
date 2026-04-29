/**
 * @file DOM utility helpers
 */

/**
 * Создает HTML-элемент с классами и контентом
 * @param {string} tag - Имя тега
 * @param {string[]} classNames - Массив классов
 * @param {string|Node} content - Текст или узел
 * @returns {HTMLElement}
 */
export function createElement(tag, classNames = [], content = "") {
  const el = document.createElement(tag);
  if (classNames.length) {
    el.classList.add(...classNames);
  }
  if (typeof content === "string") {
    el.textContent = content;
  } else if (content instanceof Node) {
    el.appendChild(content);
  }
  return el;
}

/**
 * Находит элемент по ID с проверкой
 * @param {string} id - ID элемента
 * @param {boolean} required - Бросать ошибку если не найден
 * @returns {HTMLElement|null}
 */
export function getById(id, required = true) {
  const el = document.getElementById(id);
  if (!el && required) {
    throw new Error(`Element #${id} not found`);
  }
  return el;
}

/**
 * Прокручивает контейнер вниз
 * @param {HTMLElement} container
 */
export function scrollToBottom(container) {
  container.scrollTop = container.scrollHeight;
}

/**
 * Безопасно экранирует текст для вставки в HTML
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
