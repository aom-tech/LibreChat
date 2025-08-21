# Настройка Firebase и Telegram для лендинга Cogneex

## 1. Настройка Firebase

### Создание проекта Firebase
1. Перейдите на [Firebase Console](https://console.firebase.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Firestore Database:
   - В меню слева выберите "Firestore Database"
   - Нажмите "Create database"
   - Выберите режим production
   - Выберите регион (рекомендуется europe-west1)

### Получение Service Account ключей
1. В настройках проекта перейдите в "Service accounts"
2. Нажмите "Generate new private key"
3. Сохраните JSON файл с ключами
4. Из этого файла возьмите значения для .env:
   - `project_id` → `FB_PROJECT_ID`
   - `client_email` → `FB_CLIENT_EMAIL`
   - `private_key` → `FB_PRIVATE_KEY`

### Настройка правил безопасности Firestore
В Firestore Rules установите:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Разрешаем только серверное создание документов в коллекции leads
    match /leads/{document} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

## 2. Настройка Telegram бота

### Создание бота
1. Откройте Telegram и найдите [@BotFather](https://t.me/botfather)
2. Отправьте команду `/newbot`
3. Введите имя бота (например: "Cogneex Leads Bot")
4. Введите username бота (должен заканчиваться на "bot", например: cogneex_leads_bot)
5. Сохраните полученный токен → `TELEGRAM_BOT_TOKEN`

### Получение Chat ID
1. Создайте группу или канал в Telegram для получения уведомлений
2. Добавьте созданного бота в эту группу/канал как администратора
3. Отправьте любое сообщение в группу
4. Откройте в браузере: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
5. Найдите в ответе `"chat":{"id":-123456789}` → это ваш `TELEGRAM_CHAT_ID`

### Альтернативный способ получения Chat ID
1. Добавьте бота [@userinfobot](https://t.me/userinfobot) в вашу группу
2. Бот отправит сообщение с ID группы
3. Удалите @userinfobot из группы

## 3. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```bash
# Firebase Admin SDK
FB_PROJECT_ID=cogneex-landing
FB_CLIENT_EMAIL=firebase-adminsdk-xxxxx@cogneex-landing.iam.gserviceaccount.com
FB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqh...\n-----END PRIVATE KEY-----"

# Telegram Bot
TELEGRAM_BOT_TOKEN=6234567890:ABCDefGHijKLmnoPQRsTuvWXyz123456789
TELEGRAM_CHAT_ID=-1001234567890
```

### Важные моменты:
- **FB_PRIVATE_KEY**: Замените все `\n` в ключе на реальные переносы строк или оставьте как `\n`
- **TELEGRAM_CHAT_ID**: Для групп/каналов ID начинается с минуса (например: -1001234567890)

## 4. Тестирование

### Проверка Firebase
1. Запустите сервер: `npm run dev`
2. Откройте лендинг и отправьте тестовую заявку
3. Проверьте Firebase Console → Firestore Database → коллекция `leads`
4. Должен появиться новый документ с данными заявки

### Проверка Telegram
1. После отправки формы проверьте группу/канал в Telegram
2. Должно прийти форматированное сообщение с данными заявки

### Возможные проблемы:
- **Firebase error**: Проверьте правильность ключей и формат FB_PRIVATE_KEY
- **Telegram не отправляет**: Проверьте, что бот добавлен в группу как администратор
- **CORS ошибки**: Убедитесь, что используете правильный API route `/api/lead`

## 5. Деплой на продакшн

При деплое на Vercel/Netlify:
1. Добавьте все переменные из .env в настройки проекта
2. Для FB_PRIVATE_KEY используйте многострочное поле или замените `\n` на реальные переносы
3. Убедитесь, что `output: 'server'` в astro.config.mjs для работы API routes

## Дополнительная безопасность

### reCAPTCHA (опционально)
1. Получите ключи на [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Добавьте в .env:
   ```
   RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
   RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
   ```
3. Раскомментируйте соответствующий код в компоненте формы

### Дополнительные меры:
- Настройте rate limiting в Cloudflare/Vercel
- Добавьте валидацию email через отправку подтверждения
- Используйте webhooks для интеграции с CRM