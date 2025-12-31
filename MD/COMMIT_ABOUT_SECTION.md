# Команды для коммита раздела "О программе"

## Шаг 1: Перейти в директорию проекта
```powershell
cd C:\Projects\NewDreamer\cosmos-of-hopes
```

## Шаг 2: Добавить все изменения
```powershell
git add .
```

## Шаг 3: Проверить, что добавлено
```powershell
git status
```

## Шаг 4: Сделать commit
```powershell
git commit -m "Добавлен раздел 'О программе' с аккордеоном, блок 'Удалённый Новый год', информация о благотворительности, обновлены тексты о поддержке желаний, заменены эмодзи на SVG иконки"
```

## Шаг 5: Отправить на сервер
```powershell
git push
```

---

## Изменённые файлы:
- `app/page.tsx` - добавлены компоненты на главную страницу
- `components/info/AboutProgram.tsx` - новый компонент аккордеона
- `components/info/RemoteNewYear.tsx` - новый компонент блока
- `lib/i18n.ts` - добавлены все переводы
- `MD/ABOUT_SECTION_DRAFT.md` - черновик текстов
- `MD/TELEGRAM_MESSAGE.md` - варианты сообщений для Telegram

