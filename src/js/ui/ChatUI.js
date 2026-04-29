/**
 * @file UI manager for chat interface
 */

import {
  createElement,
  getById,
  scrollToBottom,
  escapeHtml,
} from "../utils/dom.js";

export class ChatUI {
  /**
   * @param {Object} elements - DOM элементы
   * @param {HTMLElement} elements.chatWindow
   * @param {HTMLInputElement} elements.messageInput
   * @param {HTMLButtonElement} elements.sendBtn
   * @param {HTMLButtonElement} elements.geoBtn
   * @param {HTMLElement} elements.statusEl
   */
  constructor({ chatWindow, messageInput, sendBtn, geoBtn, statusEl }) {
    this.elements = {
      chatWindow,
      messageInput,
      sendBtn,
      geoBtn,
      statusEl,
    };
  }

  /**
   * Отображает сообщение в чате
   * @param {string} text - Текст или HTML
   * @param {'sent'|'echo'|'geo'} type - Тип сообщения
   * @param {boolean} isHtml - Содержит ли текст HTML (для ссылок)
   */
  renderMessage(text, type, isHtml = false) {
    const messageEl = createElement("div", ["message", `message--${type}`]);

    if (isHtml) {
      messageEl.innerHTML = text;
    } else {
      messageEl.textContent = text;
    }

    this.elements.chatWindow.appendChild(messageEl);
    scrollToBottom(this.elements.chatWindow);
  }

  /**
   * Очищает поле ввода
   */
  clearInput() {
    this.elements.messageInput.value = "";
    this.elements.messageInput.focus();
  }

  /**
   * Обновляет статус соединения
   * @param {boolean} isConnected
   */
  updateConnectionStatus(isConnected) {
    const { statusEl } = this.elements;

    if (isConnected) {
      statusEl.textContent = "Подключено ✓";
      statusEl.className = "status status--connected";
    } else {
      statusEl.textContent = "Отключено ◌";
      statusEl.className = "status status--disconnected";
    }
  }

  /**
   * Устанавливает состояние загрузки для кнопки геолокации
   * @param {boolean} loading
   * @param {string} [label] - Кастомный текст кнопки
   */
  setLoadingGeo(loading, label = null) {
    const { geoBtn } = this.elements;
    geoBtn.disabled = loading;
    if (label) {
      geoBtn.textContent = label;
    } else if (loading) {
      geoBtn.textContent = "📍 Определяем...";
    } else {
      geoBtn.textContent = "📍 Геолокация";
    }
  }

  /**
   * Привязывает обработчики событий
   * @param {Object} handlers
   * @param {Function} handlers.onSend - Вызывается при отправке текста
   * @param {Function} handlers.onGeo - Вызывается при запросе геолокации
   */
  bindEvents({ onSend, onGeo }) {
    const { messageInput, sendBtn, geoBtn } = this.elements;

    // Отправка по клику
    sendBtn.addEventListener("click", () => {
      const text = messageInput.value;
      if (text.trim()) {
        onSend(text);
        this.clearInput();
      }
    });

    // Отправка по Enter
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && messageInput.value.trim()) {
        onSend(messageInput.value);
        this.clearInput();
      }
    });

    // Геолокация
    geoBtn.addEventListener("click", async () => {
      this.setLoadingGeo(true);
      try {
        await onGeo();
      } catch (error) {
        console.error("Geo error:", error);
        alert(error.message || "Не удалось получить геолокацию");
      } finally {
        this.setLoadingGeo(false);
      }
    });

    // Фокус на поле ввода при загрузке
    messageInput.focus();
  }
}
