const https = require('https');

const TG_TOKEN = process.env.TG_TOKEN;
const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
const CHANNELS = ['@go_rehab', '@Helpforaddicts'];

const STYLE = `Ты пишешь глубокие психологические посты для Telegram канала о восстановлении личности и зависимости.

Стиль постов:
- Прямое обращение на "ты"
- Короткие абзацы, каждый — одна мысль
- Острая психологическая правда без украшений
- Библейская цитата органично вписана в текст (не в начале)
- В конце — триггерный вопрос для комментариев
- Хэштеги в конце

Темы которые цепляют эту аудиторию:
- роль спасателя, сильного, удобного, контролёра, жертвы
- стыд, вина, страх отвержения
- созависимость и зависимость
- потеря себя в служении
- злость спрятанная за добротой
- жизнь ради чужого одобрения
- невозможность попросить помощь
- контроль как форма тревоги
- молчание вместо правды
- границы и их отсутствие

Утренний пост: глубокий, острый, узнаваемый. 150-200 слов. Заканчивается одним триггерным вопросом.
Вечерний пост: чек-лист ИЛИ опрос с триггерными вопросами. 100-150 слов.`;

const MORNING_TOPICS = [
  'злость которую ты прячешь за добротой и называешь смирением',
  'ты живёшь ради одобрения и сам это знаешь',
  'стыд который заставляет тебя молчать годами',
  'ты называешь это любовью но на самом деле это контроль',
  'почему тебе так трудно принять помощь',
  'ты помогаешь всем кроме себя',
  'граница которую ты боишься поставить',
  'ты давно устал но продолжаешь делать вид что справляешься',
  'одиночество внутри толпы близких людей',
  'ты ждёшь разрешения жить',
  'вина как способ не брать ответственность',
  'ты заслуживаешь любовь или получаешь её за поведение',
  'почему срыв начинается задолго до срыва',
  'ты живёшь в хроническом напряжении и считаешь это нормой',
  'молчание которое разрушает изнутри',
  'ты боишься быть собой потому что однажды за это наказали',
  'служение из страха а не из любви',
  'почему тебе легче сломаться чем попросить',
  'ты не умеешь отдыхать без чувства вины',
  'доверие которое ты давно потерял',
  'ты контролируешь потому что когда-то всё вышло из-под контроля',
  'пустота которую ты заполняешь чужими проблемами',
  'ты живёшь не своей жизнью уже так давно что забыл какая она',
  'страх быть никем если перестанешь быть нужным',
  'когда боль становится привычнее чем радость'
];

const EVENING_FORMATS = ['checklist', 'poll', 'checklist', 'poll', 'checklist'];

function getTodayTopics() {
  const day = new Date().getDate();
  const morning = MORNING_TOPICS[day % MORNING_TOPICS.length];
  const eveningFormat = EVENING_FORMATS[day % EVENING_FORMATS.length];
  return { morning, eveningFormat };
}

function getDayNumber() {
  const start = new Date('2026-04-16');
  const now = new Date();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return 76 + diff;
}

function apiRequest(hostname, path, data, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const opts = {
      hostname, path, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...extraHeaders
      }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch(e) { resolve({ error: d }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function generatePost(type) {
  const { morning, eveningFormat } = getTodayTopics();
  const dayNum = getDayNumber();
  const date = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  let prompt;

  if (type === 'morning') {
    prompt = `${STYLE}

Напиши УТРЕННИЙ пост #день${dayNum} на острую тему: «${morning}»

Структура:
1. Острое начало — сразу в боль без предисловий
2. 4-6 коротких абзацев — каждый одна мысль
3. Библейская цитата органично вписана
4. Практика на сегодня — одно конкретное действие
5. Триггерный вопрос для комментариев
6. Хэштеги: #восстановлениеличности #день${dayNum} и 2-3 тематических #helpforaddicts

Не пиши дату. Не пиши вступление. Начни сразу с сути.
Пиши только сам пост.`;
  } else {
    const format = eveningFormat === 'checklist' ? 'ЧЕК-ЛИСТ' : 'ОПРОС';
    prompt = `${STYLE}

Напиши ВЕЧЕРНИЙ пост #день${dayNum} в формате ${format} по теме: «${morning}»

${eveningFormat === 'checklist' ? `Структура чек-листа:
- Заголовок ЧЕК-ЛИСТ: [тема]
- 7-8 пунктов с тире, каждый — узнаваемая ситуация
- Итог после чек-листа — острый вывод
- 2-3 триггерных вопроса
- Призыв написать в комментарии
- Хэштеги: #восстановлениеличности #день${dayNum} #чеклист и тематические #helpforaddicts` 
: `Структура опроса:
- Острый вводный текст 3-4 абзаца
- Варианты для опроса (5-6 штук)
- 2-3 триггерных вопроса
- Призыв написать в комментарии не только вариант но и почему
- Хэштеги: #восстановлениеличности #день${dayNum} #опрос и тематические #helpforaddicts`}

Пиши только сам пост.`;
  }

  const result = await apiRequest(
    'api.anthropic.com',
    '/v1/messages',
    {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    },
    {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    }
  );

  if (result.error || !result.content) {
    throw new Error('API error: ' + JSON.stringify(result));
  }

  return result.content.map(i => i.text || '').join('').trim();
}

async function sendToChannel(channelId, text) {
  return apiRequest(
    'api.telegram.org',
    `/bot${TG_TOKEN}/sendMessage`,
    { chat_id: channelId, text, parse_mode: 'HTML' }
  );
}

async function postToAll(type) {
  console.log(`Генерирую ${type === 'morning' ? 'утренний' : 'вечерний'} пост...`);
  try {
    const post = await generatePost(type);
    console.log('Пост готов:', post.substring(0, 80) + '...');

    for (const channel of CHANNELS) {
      const result = await sendToChannel(channel, post);
      if (result.ok) {
        console.log(`✅ Отправлено в ${channel}`);
      } else {
        console.log(`❌ Ошибка в ${channel}:`, result.description);
      }
    }
  } catch(e) {
    console.error('Ошибка:', e.message);
  }
}

function getMoscowTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3 * 3600000);
}

function msUntil(targetHour, targetMin = 0) {
  const moscow = getMoscowTime();
  const target = new Date(moscow);
  target.setHours(targetHour, targetMin, 0, 0);
  if (moscow >= target) target.setDate(target.getDate() + 1);
  return target - moscow;
}

function scheduleDaily() {
  const moscow = getMoscowTime();
  console.log(`Бот запущен. Время МСК: ${moscow.getHours()}:${String(moscow.getMinutes()).padStart(2,'0')}`);

  const msToMorning = msUntil(9);
  const msToEvening = msUntil(18);

  console.log(`Утренний пост через ${Math.round(msToMorning/60000)} мин`);
  console.log(`Вечерний пост через ${Math.round(msToEvening/60000)} мин`);

  setTimeout(() => {
    postToAll('morning');
    setInterval(() => postToAll('morning'), 24 * 60 * 60 * 1000);
  }, msToMorning);

  setTimeout(() => {
    postToAll('evening');
    setInterval(() => postToAll('evening'), 24 * 60 * 60 * 1000);
  }, msToEvening);
}

console.log('🤖 Бот глубокого постинга запущен');
scheduleDaily();

if (process.argv.includes('--test-morning')) postToAll('morning');
if (process.argv.includes('--test-evening')) postToAll('evening');
