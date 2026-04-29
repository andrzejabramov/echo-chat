/**
 * @file URL utilities for OpenStreetMap and validation
 */

const OSM_BASE = "https://www.openstreetmap.org/";

/**
 * Формирует ссылку на OpenStreetMap с маркером
 * @param {number} lat - Широта
 * @param {number} lon - Долгота
 * @param {number} zoom - Уровень зума (по умолчанию 15)
 * @returns {string}
 */
export function buildOSMLink(lat, lon, zoom = 15) {
  if (!isValidCoordinate(lat, "lat") || !isValidCoordinate(lon, "lon")) {
    throw new Error("Invalid coordinates");
  }

  const latFixed = Number(lat).toFixed(6);
  const lonFixed = Number(lon).toFixed(6);

  return `${OSM_BASE}?mlat=${latFixed}&mlon=${lonFixed}#map=${zoom}/${latFixed}/${lonFixed}`;
}

/**
 * Валидирует координату
 * @param {number} value - Значение
 * @param {'lat'|'lon'} type - Тип координаты
 * @returns {boolean}
 */
export function isValidCoordinate(value, type) {
  const num = Number(value);
  if (isNaN(num)) return false;

  if (type === "lat") {
    return num >= -90 && num <= 90;
  }
  if (type === "lon") {
    return num >= -180 && num <= 180;
  }
  return false;
}

/**
 * Проверяет, валидный ли это HTTP/HTTPS URL
 * @param {string} url
 * @returns {boolean}
 */
export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
