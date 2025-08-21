import type { APIRoute } from 'astro';
import { z } from 'zod';
import { db } from '../../lib/firebase';
import { sendTelegramNotification } from '../../lib/telegram';

// Схемы валидации
const b2cSchema = z.object({
  type: z.literal('b2c'),
  email: z.string().email('Некорректный email'),
  goal: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Необходимо согласие на обработку данных',
  }),
});

const b2bSchema = z.object({
  type: z.literal('b2b'),
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  company: z.string().min(1, 'Укажите название компании'),
  role: z.string().optional(),
  email: z.string().email('Некорректный email'),
  phone: z.string().optional(),
  interest: z.enum(['demo', 'enterprise', 'course_box']).optional(),
  comment: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Необходимо согласие на обработку данных',
  }),
});

// Объединенная схема
const leadSchema = z.discriminatedUnion('type', [b2cSchema, b2bSchema]);

// Rate limiting (простая реализация)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // максимум заявок
const RATE_WINDOW = 60 * 60 * 1000; // за час

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || record.resetTime < now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // Проверка rate limit
    if (!checkRateLimit(clientAddress)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Слишком много запросов. Попробуйте позже.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Парсинг и валидация данных
    const body = await request.json();
    const validationResult = leadSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Проверьте правильность заполнения формы',
          details: validationResult.error.flatten(),
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const data = validationResult.data;

    // Подготовка данных для сохранения
    const leadData = {
      ...data,
      createdAt: new Date().toISOString(),
      ip: clientAddress,
      userAgent: request.headers.get('user-agent') || '',
      source: 'landing',
      status: 'new',
    };

    // Сохранение в Firestore
    try {
      const docRef = await db.collection('leads').add(leadData);
      console.log('Lead saved with ID:', docRef.id);

      // Отправка уведомления в Telegram (не блокируем ответ)
      sendTelegramNotification(data).catch(console.error);
    } catch (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Ошибка сохранения данных. Попробуйте позже.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Успешный ответ
    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Заявка успешно отправлена',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Произошла непредвиденная ошибка',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

// Защита от других методов
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      ok: false,
      error: 'Method not allowed',
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};