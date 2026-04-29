/**
 * @file Chat business logic service
 */

import { GeoService } from "./GeoService.js";

export class ChatService {
  /**
   * @param {Object} deps - Зависимости
   * @param {import('../core/WebSocketClient.js').WebSocketClient} deps.wsClient
   */
  constructor({ wsClient }) {
    this.wsClient = wsClient;
    this._isAwaitingGeoEcho = false;
    this._onMessageCallback = null;

    // Подписываемся на входящие сообщения
    wsClient.on("message", (data) => this._handleIncomingMessage(data));
  }

  /**
   * Устанавливает колбэк для обработки полученных сообщений
   * @param {(msg: {text: string, type: 'echo'|'geo'}) => void} callback
   */
  onMessageReceived(callback) {
    this._onMessageCallback = callback;
  }

  /**
   * Отправляет текстовое сообщение
   * @param {string} text
   * @returns {boolean}
   */
  sendTextMessage(text) {
    const trimmed = text?.trim();
    if (!trimmed || !this.wsClient.isConnected()) {
      return false;
    }

    this.wsClient.send(trimmed);
    return true;
  }

  /**
   * Отправляет геолокацию
   * @returns {Promise<{osmLink: string}>}
   */
  async sendGeolocation() {
    if (!this.wsClient.isConnected()) {
      throw new Error("WebSocket not connected");
    }

    const { latitude, longitude, osmLink } =
      await GeoService.getCurrentPosition();

    // Отправляем координаты как JSON
    const geoData = JSON.stringify({ latitude, longitude });
    this.wsClient.send(geoData);

    // Следующее эхо игнорируем
    this._isAwaitingGeoEcho = true;

    return { osmLink };
  }

  /**
   * Обрабатывает входящее сообщение от сервера
   * @param {string} data
   * @private
   */
  _handleIncomingMessage(data) {
    // Если ждём эхо от геолокации — игнорируем
    if (this._isAwaitingGeoEcho) {
      this._isAwaitingGeoEcho = false;
      return;
    }

    // Пытаемся распарсить как JSON (координаты)
    try {
      const parsed = JSON.parse(data);
      if (
        typeof parsed.latitude === "number" &&
        typeof parsed.longitude === "number"
      ) {
        // Это эхо геолокации — не показываем
        return;
      }
    } catch {
      // Не JSON — обычное текстовое эхо
    }

    // Вызываем колбэк для отображения
    if (this._onMessageCallback) {
      this._onMessageCallback({
        text: data,
        type: "echo",
      });
    }
  }
}
