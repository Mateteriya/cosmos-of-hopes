export type Language = 'ru' | 'en';

export const translations = {
  ru: {
    // Общие
    optional: 'По желанию',
    select: 'Выбрать',
    
    // Заголовки и метки
    personalization: 'ПЕРСОНАЛИЗАЦИЯ',
    effects: 'ЭФФЕКТЫ',
    filters: 'ФИЛЬТРЫ',
    surfaceType: 'ТИП ПОВЕРХНОСТИ',
    ballSize: 'РАЗМЕР ШАРИКА',
    brushColor: 'ЦВЕТ КИСТИ',
    brushSize: 'РАЗМЕР КИСТИ',
    brush: 'Кисть',
    eraser: 'Ластик',
    undo: 'Шаг назад',
    redo: 'Шаг вперед',
    pattern: 'УЗОР',
    color1: 'ЦВЕТ 1',
    color2: 'ЦВЕТ 2',
    remove: 'Убрать',
    clear: 'Очистить',
    wish: 'ЖЕЛАНИЕ',
    wishForOthers: 'ПОЖЕЛАНИЕ ДРУГИМ',
    photo: 'ФОТО',
    nameOrNickname: 'ИМЯ ИЛИ НИКНЕЙМ',
    selectCountry: 'ВЫБРАТЬ СТРАНУ',
    yourAge: 'ВАШ ВОЗРАСТ',
    statisticsNote: 'Данные для общей статистики',
    
    // Типы поверхностей
    glossy: 'Глянцевая',
    matte: 'Матовая',
    metal: 'Металлическая',
    
    // Эффекты
    sparkle: 'Блеск',
    gradient: 'Градиент',
    glow: 'Свечение',
    stars: 'Звезды',
    
    // Узоры
    noPattern: 'Узор',
    stripes: 'Полоски',
    dots: 'Горох',
    snowflakes: 'Снежинки',
    starsPattern: 'Звездочки',
    
    // Кнопки
    magicWand: '✨ ВОЛШЕБНАЯ ПАЛОЧКА ✨',
    hangOnTree: '✨ ПОВЕСИТЬ НА ЁЛКУ 🌲',
    saving: '⏳ СОХРАНЕНИЕ...',
    addWishFirst: 'Пожалуйста, сначала добавьте ваше желание на вкладке "Желание"',
    goToWishTab: 'Перейти к вкладке "Желание"',
    
    // Плейсхолдеры
    wishPlaceholder: 'Напишите ваше желание...',
    wishForOthersPlaceholder: 'Напишите пожелание другим...',
    
    // Сообщения
    footerText: 'Ваша уникальная игрушка станет частью общего праздника',
    
    // Тултипы
    photoTooltip: 'Можно вложить свое фото в шарик!',
    photoTooltipDetail: 'На ёлке, нажав на шарик - ваше фото отобразится',
    
    // Ошибки
    wishRequired: 'Пожалуйста, напишите ваше желание!',
    wishTooLong: 'Желание не должно превышать 200 символов',
    saveError: 'Не удалось сохранить игрушку. Попробуйте еще раз.',
    imageError: 'Пожалуйста, выберите файл изображения (JPG, PNG, GIF, BMP)',
    
    // Дополнительные элементы
    title: 'Создайте свою игрушку для ёлки',
    editor: 'РЕДАКТОР',
    drawWithMouse: 'РИСУЙТЕ МЫШЬЮ НА ИГРУШКЕ',
    surface: 'ПОВЕРХНОСТЬ',
    colorAndPattern: 'ЦВЕТ И УЗОР',
    selectColor: 'Выбрать цвет',
    secondColor: 'Второй цвет',
    removeSecondColor: 'Убрать второй цвет',
    wishLabel: 'ЖЕЛАНИЕ',
    wishForOthersLabel: 'ПОЖЕЛАНИЕ',
    wishHint: 'О чем мечтаете в 2026г',
    photoHint: 'Вложить фото в игрушку',
    changePhoto: 'ИЗМЕНИТЬ ФОТО',
    uploadPhoto: 'ЗАГРУЗИТЬ ФОТО',
    release: 'ОТПУСТИТЕ',
    selectCountryPlaceholder: 'Выбрать страну',
    blurLabel: 'РАЗМЫТИЕ',
    contrastLabel: 'КОНТРАСТ',
    saturationLabel: 'НАСЫЩЕННОСТЬ',
        vignetteLabel: 'ВИНЬЕТКА',
        grainLabel: 'ЗЕРНИСТОСТЬ',
        close: 'Закрыть',
        supports: 'поддержек',
        years: 'лет',
        likeToSeeYourBall: 'Лайкните чужой шар, чтобы увидеть свой на ёлке!',
        yourBallOnTree: 'Ваш шар на ёлке!',
        youAlreadyHaveBall: 'У вас уже есть шар на ёлке!',
        ballHasLikes: 'Ваш шар уже получил {count} поддержк(и/у)',
        ballCanBeEdited: 'Вы можете его отредактировать',
        editYourBall: 'Редактировать свой шар',
        viewYourBall: 'Посмотреть свой шар на ёлке',
        cannotEditWithLikes: 'Нельзя редактировать шар с поддержками',
        howToCreate: 'Как создать свой шар:',
        step1: 'Укрась свой шар как нравится',
        step2: 'Добавь своё желание или мечту на 2026 год',
        step3: 'Нажми "волшебную палочку", чтобы превратить его в настоящий ёлочный шарик',
        step4: 'Повесь его на мировую ёлку',
        optionalHint: '(можно добавить своё фото, имя или никнейм, а также дополнительное пожелание для кого угодно или сразу для всех)',
        
        // Комнаты
        createRoom: 'Создать комнату',
        roomName: 'Название комнаты',
        roomNameExample: 'Например: Семья Ивановых',
        roomNameRequired: 'Пожалуйста, введите название комнаты',
        selectTimezone: 'Выберите часовой пояс',
        roomCreationError: 'Ошибка создания комнаты',
        creating: 'Создание...',
        create: 'Создать',
        cancel: 'Отмена',
        
        // Таймер
        timerLoading: 'Загрузка...',
        timerUntilNewYear: 'До Нового - 2026 - года осталось:',
        timerNewYearTitle: 'С Новым годом! Наступил 2026!',
        timerNewYear: 'С НОВЫМ ГОДОМ!',
        timerNewYearWish: 'Исполнения самых мощнейших и светлейших желаний и мечт!)',
        timerDay: 'д',
        timerHour: 'ч',
        timerMinute: 'м',
        timerSecond: 'с',
        timerDayFull: 'День',
        timerHourFull: 'Час',
        timerMinuteFull: 'Минуты',
        timerSecondFull: 'Секунды',
      },
  en: {
    // General
    optional: 'Optional',
    select: 'Select',
    
    // Headers and labels
    personalization: 'PERSONALIZATION',
    effects: 'EFFECTS',
    filters: 'FILTERS',
    surfaceType: 'SURFACE TYPE',
    ballSize: 'BALL SIZE',
    brushColor: 'BRUSH COLOR',
    brushSize: 'BRUSH SIZE',
    brush: 'Brush',
    eraser: 'Eraser',
    undo: 'Undo',
    redo: 'Redo',
    pattern: 'PATTERN',
    color1: 'COLOR 1',
    color2: 'COLOR 2',
    remove: 'Remove',
    clear: 'Clear',
    wish: 'WISH',
    wishForOthers: 'WISH FOR OTHERS',
    photo: 'PHOTO',
    nameOrNickname: 'NAME OR NICKNAME',
    selectCountry: 'SELECT COUNTRY',
    yourAge: 'YOUR AGE',
    statisticsNote: 'Data for general statistics',
    
    // Surface types
    glossy: 'Glossy',
    matte: 'Matte',
    metal: 'Metal',
    
    // Effects
    sparkle: 'Sparkle',
    gradient: 'Gradient',
    glow: 'Glow',
    stars: 'Stars',
    
    // Patterns
    noPattern: 'Pattern',
    stripes: 'Stripes',
    dots: 'Dots',
    snowflakes: 'Snowflakes',
    starsPattern: 'Stars',
    
    // Buttons
    magicWand: '✨ MAGIC WAND ✨',
    hangOnTree: '✨ HANG ON TREE 🌲',
    saving: '⏳ SAVING...',
    addWishFirst: 'Please add your wish first on the "Wish" tab',
    goToWishTab: 'Go to "Wish" tab',
    
    // Placeholders
    wishPlaceholder: 'Write your wish...',
    wishForOthersPlaceholder: 'Write a wish for others...',
    
    // Messages
    footerText: 'Your unique toy will become part of the common celebration',
    
    // Tooltips
    photoTooltip: 'You can put your photo in the ball!',
    photoTooltipDetail: 'On the tree, clicking on the ball - your photo will be displayed',
    
    // Errors
    wishRequired: 'Please write your wish!',
    wishTooLong: 'Wish should not exceed 200 characters',
    saveError: 'Failed to save the toy. Please try again.',
    imageError: 'Please select an image file (JPG, PNG, GIF, BMP)',
    
    // Additional elements
    title: 'Create your toy for the tree',
    editor: 'EDITOR',
    drawWithMouse: 'DRAW WITH MOUSE ON TOY',
    surface: 'SURFACE',
    colorAndPattern: 'COLOR AND PATTERN',
    selectColor: 'Select color',
    secondColor: 'Second color',
    removeSecondColor: 'Remove second color',
    wishLabel: 'WISH',
    wishForOthersLabel: 'WISH',
    wishHint: 'What do you dream about in 2026',
    photoHint: 'Put photo in toy',
    changePhoto: 'CHANGE PHOTO',
    uploadPhoto: 'UPLOAD PHOTO',
    release: 'RELEASE',
    selectCountryPlaceholder: 'Select country',
    blurLabel: 'BLUR',
    contrastLabel: 'CONTRAST',
    saturationLabel: 'SATURATION',
        vignetteLabel: 'VIGNETTE',
        grainLabel: 'GRAIN',
        close: 'Close',
        supports: 'supports',
        years: 'years',
        likeToSeeYourBall: 'Like someone\'s ball to see yours on the tree!',
        yourBallOnTree: 'Your ball is on the tree!',
        youAlreadyHaveBall: 'You already have a ball on the tree!',
        ballHasLikes: 'Your ball already has {count} support(s)',
        ballCanBeEdited: 'You can edit it',
        editYourBall: 'Edit your ball',
        viewYourBall: 'View your ball on the tree',
        cannotEditWithLikes: 'Cannot edit ball with supports',
        howToCreate: 'How to create your ball:',
        step1: 'Decorate your ball as you like',
        step2: 'Add your wish or dream for 2026',
        step3: 'Press the "magic wand" to turn it into a real Christmas ball',
        step4: 'Hang it on the world tree',
        optionalHint: '(you can add your photo, name or nickname, as well as an additional wish for anyone or for everyone)',
        
        // Rooms
        createRoom: 'Create Room',
        roomName: 'Room Name',
        roomNameExample: 'For example: The Smith Family',
        roomNameRequired: 'Please enter room name',
        selectTimezone: 'Select Timezone',
        roomCreationError: 'Room creation error',
        creating: 'Creating...',
        create: 'Create',
        cancel: 'Cancel',
        
        // Timer
        timerLoading: 'Loading...',
        timerUntilNewYear: 'Until New Year - 2026 - remaining:',
        timerNewYearTitle: 'Happy New Year! 2026 has arrived!',
        timerNewYear: 'HAPPY NEW YEAR!',
        timerNewYearWish: 'Fulfillment of the most powerful and brightest wishes and dreams!)',
        timerDay: 'd',
        timerHour: 'h',
        timerMinute: 'm',
        timerSecond: 's',
        timerDayFull: 'Day',
        timerHourFull: 'Hour',
        timerMinuteFull: 'Minutes',
        timerSecondFull: 'Seconds',
      },
} as const;

export type TranslationKey = keyof typeof translations.ru;

