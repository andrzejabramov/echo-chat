/**
 * @file WebSocket client wrapper with auto-reconnect
 */

export class WebSocketClient {
  /**
   * @param {string} url - WebSocket URL
   * @param {Object} options - Настройки
   * @param {number} options.reconnectDelay - Задержка переподключения (мс)
   * @param {number} options.maxReconnectAttempts - Макс. попыток переподключения
   */
  constructor(url, { reconnectDelay = 2000, maxReconnectAttempts = 10 } = {}) {
    this.url = url;
    this.reconnectDelay = reconnectDelay;
    this.maxReconnectAttempts = maxReconnectAttempts;

    this.ws = null;
    this.reconnectCount = 0;
    this.eventHandlers = new Map();

    // ✅ Стрелочные функции автоматически биндят 'this' — не нужно .bind() в конструкторе
  }

  /**
   * Подключается к серверу
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        // ✅ Используем стрелочные функции-свойства — this уже привязан
        this.ws.onopen = this._onOpen;
        this.ws.onmessage = this._onMessage;
        this.ws.onclose = this._onClose;
        this.ws.onerror = this._onError;
      } catch (error) {
        this._emit("error", error);
        reject(error);
      }
    });
  }

  /**
   * Отправляет сообщение
   * @param {string} data
   * @returns {boolean} Успешно ли отправлено
   */
  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected");
      return false;
    }
    this.ws.send(data);
    return true;
  }

  /**
   * Отключается от сервера
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Подписывается на событие
   * @param {'open'|'message'|'close'|'error'} event
   * @param {Function} handler
   * @returns {Function} Функция для отписки
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
    return () => this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Проверяет состояние соединения
   * @returns {boolean}
   */
  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ===== Приватные методы (стрелочные функции = авто-биндинг this) =====

  _onOpen = (event) => {
    this.reconnectCount = 0;
    this._emit("open", event);
  };

  _onMessage = (event) => {
    this._emit("message", event.data);
  };

  _onClose = (event) => {
    this._emit("close", event);

    // Автопереподключение
    if (this.reconnectCount < this.maxReconnectAttempts) {
      this.reconnectCount++;
      console.log(
        `Reconnecting (${this.reconnectCount}/${this.maxReconnectAttempts})...`,
      );
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  };

  _onError = (error) => {
    console.error("WebSocket error:", error);
    this._emit("error", error);
  };

  _emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (err) {
          console.error(`Error in ${event} handler:`, err);
        }
      }
    }
  }
}
