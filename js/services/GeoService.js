/**
 * @file Geolocation service wrapper
 */

import { buildOSMLink, isValidCoordinate } from "../utils/url.js";

export class GeoService {
  /**
   * Проверяет поддержку Geolocation API
   * @returns {boolean}
   */
  static isSupported() {
    return "geolocation" in navigator;
  }

  /**
   * Запрашивает текущую позицию
   * @param {PositionOptions} options - Опции геолокации
   * @returns {Promise<{latitude: number, longitude: number, osmLink: string}>}
   */
  static getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 600000, // 10 минут кэша
        ...options,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          if (
            !isValidCoordinate(latitude, "lat") ||
            !isValidCoordinate(longitude, "lon")
          ) {
            reject(new Error("Invalid coordinates received"));
            return;
          }

          resolve({
            latitude,
            longitude,
            osmLink: buildOSMLink(latitude, longitude),
          });
        },
        (error) => {
          reject(this._formatGeolocationError(error));
        },
        defaultOptions,
      );
    });
  }

  // Добавь в GeoService.js новый статический метод:

  /**
   * Фолбэк: определяет приблизительные координаты по публичному IP
   * @returns {Promise<{latitude: number, longitude: number, osmLink: string}>}
   */
  static async getApproximatePosition() {
    try {
      const response = await fetch("https://ipapi.co/json/", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("IP geolocation failed");

      const data = await response.json();
      const { latitude, longitude } = data;

      if (typeof latitude !== "number" || typeof longitude !== "number") {
        throw new Error("Invalid coordinates from IP API");
      }

      return {
        latitude,
        longitude,
        osmLink: buildOSMLink(latitude, longitude),
      };
    } catch (error) {
      console.warn("Approximate geolocation failed:", error);
      // Возвращаем координаты центра Москвы как крайний фолбэк
      return {
        latitude: 55.7558,
        longitude: 37.6173,
        osmLink: buildOSMLink(55.7558, 37.6173),
      };
    }
  }

  /**
   * Форматирует ошибку геолокации в человекочитаемое сообщение
   * @param {GeolocationPositionError} error
   * @returns {Error}
   * @private
   */
  static _formatGeolocationError(error) {
    const messages = {
      [error.PERMISSION_DENIED]: "Доступ к геолокации запрещён пользователем",
      [error.POSITION_UNAVAILABLE]: "Информация о местоположении недоступна",
      [error.TIMEOUT]: "Превышено время ожидания ответа",
    };

    const message = messages[error.code] || "Неизвестная ошибка геолокации";
    return new Error(`${message} (code: ${error.code})`);
  }
}
