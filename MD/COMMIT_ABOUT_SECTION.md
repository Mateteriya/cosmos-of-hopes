# Команды для коммита раздела "О программе" (БЕЗ MD файлов)

## Шаг 1: Перейти в директорию проекта
```powershell
cd C:\Projects\NewDreamer\cosmos-of-hopes
```

## Шаг 2: Добавить только нужные файлы (исключая MD)
```powershell
git add app/page.tsx
git add components/info/AboutProgram.tsx
git add components/info/RemoteNewYear.tsx
git add lib/i18n.ts
git add components/constructor/ToyConstructor.tsx
```

## Шаг 3: Проверить, что добавлено
```powershell
git status
```

## Шаг 4: Сделать commit
```powershell
git commit -m "Добавлен раздел 'О программе' с аккордеоном, блок 'Удалённый Новый год', информация о благотворительности, обновлены тексты о поддержке желаний, заменены эмодзи на SVG иконки, исправлены повелительные формы на вежливые"
```

## Шаг 5: Отправить на сервер
```powershell
git push
```

---

## Альтернативный вариант (если нужно добавить всё, кроме MD):

```powershell
cd C:\Projects\NewDreamer\cosmos-of-hopes
git add .
git reset HEAD MD/
git status
git commit -m "Добавлен раздел 'О программе' с аккордеоном, блок 'Удалённый Новый год', информация о благотворительности, обновлены тексты о поддержке желаний, заменены эмодзи на SVG иконки, исправлены повелительные формы на вежливые"
git push
```

---

## Изменённые файлы (для коммита):
- `app/page.tsx` - добавлены компоненты на главную страницу
- `components/info/AboutProgram.tsx` - новый компонент аккордеона
- `components/info/RemoteNewYear.tsx` - новый компонент блока
- `lib/i18n.ts` - добавлены все переводы
- `components/constructor/ToyConstructor.tsx` - исправлены повелительные формы

## Файлы НЕ для коммита (MD):
- `MD/ABOUT_SECTION_DRAFT.md` - черновик (остаётся локально)
- `MD/TELEGRAM_MESSAGE.md` - варианты сообщений (остаётся локально)
- `MD/COMMIT_ABOUT_SECTION.md` - эта инструкция (остаётся локально)
