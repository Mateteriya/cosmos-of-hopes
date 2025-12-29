# Команды для Git Commit и Push

## Шаг 1: Добавить все изменения
```powershell
cd C:\Projects\NewDreamer\cosmos-of-hopes
git add .
```

## Шаг 2: Проверить, что добавлено
```powershell
git status
```

## Шаг 3: Сделать commit
```powershell
git commit -m "Исправлены ошибки сборки: добавлены недостающие функции в lib/toys.ts, исправлен путь /constructor на /create, добавлены push уведомления"
```

## Шаг 4: Отправить на сервер
```powershell
git push origin main
```

---

## Если нужно исключить какие-то файлы

Если хотите исключить временные файлы (например, "forward-logs-shared.ts95 Download t.txt"):

```powershell
# Сначала добавьте все
git add .

# Затем уберите ненужные файлы из staging
git reset HEAD "forward-logs-shared.ts95 Download t.txt"

# И удалите их из .gitignore (если нужно)
# Или просто закоммитьте всё, это не критично
```

