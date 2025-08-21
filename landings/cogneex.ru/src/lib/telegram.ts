interface TelegramMessage {
  name?: string;
  company?: string;
  role?: string;
  email: string;
  phone?: string;
  interest?: string;
  comment?: string;
  goal?: string;
  type: 'b2b' | 'b2c';
}

export async function sendTelegramNotification(data: TelegramMessage): Promise<void> {
  const botToken = import.meta.env.TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Telegram credentials not configured');
    return;
  }

  let message = '🔔 *Новая заявка*\n\n';
  
  if (data.type === 'b2b') {
    message += `📊 *Тип:* Бизнес\n`;
    message += `👤 *Имя:* ${data.name || '-'}\n`;
    message += `🏢 *Компания:* ${data.company || '-'}\n`;
    message += `💼 *Должность:* ${data.role || '-'}\n`;
    message += `📧 *Email:* ${data.email}\n`;
    message += `📱 *Телефон:* ${data.phone || '-'}\n`;
    message += `🎯 *Интерес:* ${formatInterest(data.interest)}\n`;
    if (data.comment) {
      message += `💬 *Комментарий:* ${data.comment}\n`;
    }
  } else {
    message += `📊 *Тип:* Пользователь\n`;
    message += `📧 *Email:* ${data.email}\n`;
    message += `🎯 *Цель:* ${formatGoal(data.goal)}\n`;
  }

  message += `\n⏰ *Время:* ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

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
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Telegram API error:', error);
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

function formatInterest(interest?: string): string {
  const interests: Record<string, string> = {
    demo: 'Демонстрация платформы',
    enterprise: 'Enterprise решение',
    course_box: 'Коробочное решение для курсов',
  };
  return interests[interest || ''] || interest || '-';
}

function formatGoal(goal?: string): string {
  const goals: Record<string, string> = {
    courses: 'Создание курсов',
    content: 'Генерация контента',
    development: 'Разработка',
    research: 'Исследования',
    other: 'Другое',
  };
  return goals[goal || ''] || goal || '-';
}