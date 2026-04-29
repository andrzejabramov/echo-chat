/**
 * @file Application entry point - module composition
 */

import { WebSocketClient } from "./core/WebSocketClient.js";
import { ChatService } from "./services/ChatService.js";
import { ChatUI } from "./ui/ChatUI.js";
import { getById } from "./utils/dom.js";

// ===== Конфигурация =====
const CONFIG = {
  WS_URL: "wss://ws.postman-echo.com/raw",
  RECONNECT_DELAY: 2000,
};

// ===== Инициализация =====
async function init() {
  try {
    // 1. Получаем DOM-элементы
    const elements = {
      chatWindow: getById("chatWindow"),
      messageInput: getById("messageInput"),
      sendBtn: getById("sendBtn"),
      geoBtn: getById("geoBtn"),
      statusEl: getById("connectionStatus"),
    };

    // 2. Создаём UI
    const ui = new ChatUI(elements);

    // 3. Создаём WebSocket клиент
    const wsClient = new WebSocketClient(CONFIG.WS_URL, {
      reconnectDelay: CONFIG.RECONNECT_DELAY,
    });

    // Обновляем статус соединения
    wsClient.on("open", () => ui.updateConnectionStatus(true));
    wsClient.on("close", () => ui.updateConnectionStatus(false));

    // 4. Создаём сервис чата
    const chatService = new ChatService({ wsClient });

    // 5. Настраиваем обработку входящих сообщений
    chatService.onMessageReceived(({ text, type }) => {
      ui.renderMessage(text, type);
    });

    // 6. Привязываем события UI
    ui.bindEvents({
      onSend: (text) => {
        // Сначала показываем своё сообщение
        ui.renderMessage(text, "sent");
        // Затем отправляем на сервер
        chatService.sendTextMessage(text);
      },
      onGeo: async () => {
        const { osmLink } = await chatService.sendGeolocation();
        // Показываем ссылку (тип 'geo', с HTML)
        ui.renderMessage(
          `📍 <a href="${osmLink}" target="_blank" rel="noopener">Открыть на карте</a>`,
          "geo",
          true, // isHtml = true
        );
      },
    });

    // 7. Подключаемся к серверу
    await wsClient.connect();

    console.log("✅ Echo Chat initialized");
  } catch (error) {
    console.error("❌ Failed to initialize app:", error);
    alert("Ошибка загрузки чата. Проверьте консоль.");
  }
}

// Запускаем после загрузки DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
