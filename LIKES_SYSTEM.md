# Система лайков для шаров

## Текущая реализация

Система лайков уже частично реализована:

1. **Таблица `supports`** в базе данных Supabase:
   - `toy_id` - ID шара
   - `supporter_tg_id` - ID пользователя (Telegram ID)
   - Уникальный индекс на пару (toy_id, supporter_tg_id) - один пользователь может лайкнуть шар только один раз

2. **Функции в `lib/toys.ts`**:
   - `addSupport(toyId, supporterId)` - добавляет лайк
   - `hasUserLikedAnyBall(userId)` - проверяет, лайкнул ли пользователь хотя бы один шар

3. **Компонент `VirtualTree`**:
   - Принимает проп `onBallLike` для обработки лайков
   - Принимает проп `userHasLiked` для отображения статуса

## Предложения по улучшению

### 1. Добавить подсчет количества лайков

**Проблема**: Сейчас нет функции для получения количества лайков у шара.

**Решение**: Добавить функцию `getToyLikesCount(toyId: string)`:

```typescript
// lib/toys.ts
export async function getToyLikesCount(toyId: string): Promise<number> {
  const { count, error } = await supabase
    .from('supports')
    .select('*', { count: 'exact', head: true })
    .eq('toy_id', toyId);

  if (error) {
    console.warn('Ошибка подсчета лайков:', error);
    return 0;
  }

  return count || 0;
}
```

### 2. Добавить проверку, лайкнул ли пользователь конкретный шар

**Проблема**: Нет функции для проверки, лайкнул ли конкретный пользователь конкретный шар.

**Решение**: Добавить функцию `hasUserLikedToy(toyId: string, userId: string)`:

```typescript
// lib/toys.ts
export async function hasUserLikedToy(toyId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('supports')
    .select('id')
    .eq('toy_id', toyId)
    .eq('supporter_tg_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.warn('Ошибка проверки лайка:', error);
    return false;
  }

  return !!data;
}
```

### 3. Добавить функцию удаления лайка

**Проблема**: Пользователь не может убрать свой лайк.

**Решение**: Добавить функцию `removeSupport(toyId: string, supporterId: string)`:

```typescript
// lib/toys.ts
export async function removeSupport(toyId: string, supporterId: string): Promise<void> {
  const { error } = await supabase
    .from('supports')
    .delete()
    .eq('toy_id', toyId)
    .eq('supporter_tg_id', supporterId);

  if (error) {
    throw new Error(`Ошибка удаления поддержки: ${error.message}`);
  }
}
```

### 4. Улучшить UI для лайков на странице дерева

**Текущее состояние**: Нужно проверить, как отображаются лайки в `VirtualTree`.

**Предложения**:
- Показывать количество лайков рядом с каждым шаром при клике на него
- Добавить кнопку лайка в попапе с информацией о шаре
- Добавить анимацию при лайке
- Показывать топ шаров с наибольшим количеством лайков

### 5. Добавить индикатор лайков в список шаров

**Предложение**: На странице `/tree` показывать количество лайков для каждого шара в списке (если есть список).

### 6. Добавить реальное время обновления лайков

**Предложение**: Использовать Supabase Realtime для обновления количества лайков в реальном времени.

### 7. Добавить ограничения и защиту

**Предложения**:
- Ограничить количество лайков от одного пользователя (например, максимум 100 в день)
- Защита от накрутки (rate limiting)
- Валидация toy_id и supporter_tg_id

## Приоритет реализации

1. **Высокий**: Функции `getToyLikesCount`, `hasUserLikedToy`, `removeSupport`
2. **Средний**: UI для отображения и управления лайками
3. **Низкий**: Realtime обновления, защита от накрутки

## SQL для создания таблицы (если еще не создана)

```sql
-- Создание таблицы supports
CREATE TABLE IF NOT EXISTS supports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  toy_id UUID NOT NULL REFERENCES toys(id) ON DELETE CASCADE,
  supporter_tg_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(toy_id, supporter_tg_id)
);

-- Индекс для быстрого поиска по toy_id
CREATE INDEX IF NOT EXISTS idx_supports_toy_id ON supports(toy_id);

-- Индекс для быстрого поиска по supporter_tg_id
CREATE INDEX IF NOT EXISTS idx_supports_supporter_id ON supports(supporter_tg_id);

-- Включить Realtime для таблицы supports
ALTER PUBLICATION supabase_realtime ADD TABLE supports;
```

