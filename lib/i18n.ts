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
      },
} as const;

export type TranslationKey = keyof typeof translations.ru;

