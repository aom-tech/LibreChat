/**
 * SberCRM Webhook клиент для отправки заявок
 */
class SberCRMClient {
  constructor(webhookId) {
    this.webhookUrl = `https://app.sbercrm.com/react-gateway/api/webhook/${webhookId}`;
  }

  /**
   * Отправка данных через webhook
   */
  async submitLead(leadData) {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CogneeX Landing Page',
      },
      body: JSON.stringify(leadData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SberCRM Webhook Error:', error);
      throw new Error(`SberCRM Webhook Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Проверка доступности webhook
   */
  async testWebhook() {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'OPTIONS',
      });

      return {
        available: response.status < 400,
        status: response.status,
        url: this.webhookUrl,
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
        url: this.webhookUrl,
      };
    }
  }
}

/**
 * Функция для отправки заявки в SberCRM через webhook
 */
export async function submitLeadToSberCRM(formData) {
  const webhookId = import.meta.env.PUBLIC_SBERCRM_WEBHOOK_ID;

  if (!webhookId) {
    throw new Error('SberCRM Webhook ID not configured');
  }

  const client = new SberCRMClient(webhookId);

  // Подготовка данных в формате SberCRM
  const leadData = {
    name: `${formData.type === 'b2b' ? 'B2B' : 'B2C'} заявка с сайта CogneeX`,
    description: buildDescription(formData),
  };

  // Функция для формирования описания
  function buildDescription(formData) {
    const parts = [];

    // Основная информация о заявке
    parts.push(`Тип заявки: ${formData.type === 'b2b' ? 'B2B' : 'B2C'}`);

    // Контактная информация
    if (formData.name) {
      parts.push(`Имя: ${formData.name}`);
    }

    if (formData.email) {
      parts.push(`Email: ${formData.email}`);
    }

    if (formData.phone) {
      parts.push(`Телефон: ${formData.phone}`);
    }

    // Информация о компании (для B2B)
    if (formData.company) {
      parts.push(`Компания: ${formData.company}`);
    }

    if (formData.role) {
      parts.push(`Должность: ${formData.role}`);
    }

    if (formData.employees) {
      parts.push(`Количество сотрудников: ${formData.employees}`);
    }

    // Цель и интересы
    if (formData.goal) {
      parts.push(`Цель: ${formData.goal}`);
    }

    if (formData.interest) {
      parts.push(`Интересует: ${formData.interest}`);
    }

    if (formData.comment || formData.needs) {
      parts.push(`Комментарий: ${formData.comment || formData.needs}`);
    }

    // UTM метки
    const utmParts = [];
    if (formData.utm_source) utmParts.push(`source: ${formData.utm_source}`);
    if (formData.utm_medium) utmParts.push(`medium: ${formData.utm_medium}`);
    if (formData.utm_campaign) utmParts.push(`campaign: ${formData.utm_campaign}`);
    if (formData.utm_term) utmParts.push(`term: ${formData.utm_term}`);
    if (formData.utm_content) utmParts.push(`content: ${formData.utm_content}`);

    if (utmParts.length > 0) {
      parts.push(`UTM: ${utmParts.join(', ')}`);
    }

    // Техническая информация
    parts.push(`Источник: ${formData.source || window.location.href}`);
    parts.push(`Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`);
    parts.push(`User Agent: ${navigator.userAgent}`);

    return parts.join('\n');
  }

  console.log('Отправляем лид в SberCRM через webhook:', leadData);

  try {
    const result = await client.submitLead(leadData);
    console.log('Лид успешно отправлен в SberCRM:', result);

    // Возвращаем результат в совместимом формате
    return {
      success: true,
      data: result,
      // Эмулируем структуру для совместимости с Telegram
      _embedded: {
        leads: [
          {
            id: result.id || Date.now(), // ID лида или временный ID
          },
        ],
      },
    };
  } catch (error) {
    console.error('Ошибка при отправке лида в SberCRM:', error);
    throw error;
  }
}

/**
 * Отправка уведомления в Telegram
 */
export async function sendTelegramNotification(data, leadId) {
  const botToken = import.meta.env.PUBLIC_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.PUBLIC_TELEGRAM_CHAT_ID;

  if (!botToken || !chatId || botToken === 'your-bot-token') {
    console.warn('Telegram credentials not configured');
    return;
  }

  const message = formatTelegramMessage(data, leadId);

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}

/**
 * Форматирование сообщения для Telegram
 */
function formatTelegramMessage(data, leadId) {
  const type = data.type === 'b2b' ? '🏢 B2B' : '👤 B2C';
  const timestamp = new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
  });

  let message = `${type} *Новая заявка с сайта CogneeX*\n\n`;
  message += `📅 *Время:* ${timestamp}\n`;

  if (leadId) {
    message += `🆔 *ID лида:* \`${leadId}\`\n`;
  }

  message += `👤 *Имя:* ${data.name || 'Не указано'}\n`;
  message += `📧 *Email:* ${data.email}\n`;

  if (data.phone) {
    message += `📱 *Телефон:* ${data.phone}\n`;
  }

  if (data.type === 'b2b') {
    if (data.company) message += `🏢 *Компания:* ${data.company}\n`;
    if (data.role) message += `💼 *Должность:* ${data.role}\n`;
    if (data.employees) message += `👥 *Сотрудников:* ${data.employees}\n`;
    if (data.needs || data.comment) {
      message += `\n💬 *Потребности:*\n${data.needs || data.comment}\n`;
    }
  } else {
    if (data.goal) message += `🎯 *Цель:* ${data.goal}\n`;
  }

  // UTM метки
  const utmParams = [];
  if (data.utm_source) utmParams.push(`source: ${data.utm_source}`);
  if (data.utm_medium) utmParams.push(`medium: ${data.utm_medium}`);
  if (data.utm_campaign) utmParams.push(`campaign: ${data.utm_campaign}`);

  if (utmParams.length > 0) {
    message += `\n📊 *UTM:* ${utmParams.join(', ')}\n`;
  }

  // Ссылка на SberCRM (если есть ID)
  if (leadId && import.meta.env.PUBLIC_SBERCRM_DOMAIN) {
    message += `\n🔗 [Открыть в SberCRM](https://${import.meta.env.PUBLIC_SBERCRM_DOMAIN}.sbercrm.ru/leads/detail/${leadId})`;
  }

  return message;
}

export { SberCRMClient };
