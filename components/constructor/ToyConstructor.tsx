'use client';

/**
 * Конструктор игрушек для виртуальной ёлки
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ToyShape, ToyPattern, ToySticker, ToyParams } from '@/types/toy';
import CanvasEditor from './CanvasEditor';
import MagicTransformation from './MagicTransformation';
import { useLanguage } from './LanguageProvider';
import { translations } from '@/lib/i18n';
import { getCountryName } from '@/lib/countryTranslations';
import { AutoTranslator } from './AutoTranslator';


const COLORS = [
  { value: '#FF0000', label: 'Красный', color: 'bg-red-500' },
  { value: '#00FF00', label: 'Зеленый', color: 'bg-green-500' },
  { value: '#0000FF', label: 'Синий', color: 'bg-blue-500' },
  { value: '#FFFF00', label: 'Желтый', color: 'bg-yellow-500' },
  { value: '#FF00FF', label: 'Фиолетовый', color: 'bg-purple-500' },
  { value: '#00FFFF', label: 'Голубой', color: 'bg-cyan-500' },
  { value: '#FFA500', label: 'Оранжевый', color: 'bg-orange-500' },
  { value: '#FFC0CB', label: 'Розовый', color: 'bg-pink-500' },
];

// PATTERNS будет создан внутри компонента с учетом языка

const STICKERS: { value: ToySticker; label: string; icon: string }[] = [
  { value: null, label: 'Без наклейки', icon: '' },
  { value: 'deer', label: 'Оленёнок', icon: '🦌' },
  { value: 'snowman', label: 'Снеговик', icon: '⛄' },
  { value: 'gift', label: 'Подарок', icon: '🎁' },
  { value: 'bell', label: 'Колокольчик', icon: '🔔' },
  { value: 'snowflake', label: 'Снежинка', icon: '❄️' },
];

// Список стран с флагами
// Функция для генерации флага из кода страны через Unicode
const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const COUNTRIES: { code: string; name: string; flag: string; nativeName: string }[] = [
  { code: '', name: 'Выбрать страну', flag: '🌍', nativeName: 'Выбрать страну' },
  { code: 'RU', name: 'Россия', flag: '🇷🇺', nativeName: 'Россия' },
  { code: 'US', name: 'США', flag: '🇺🇸', nativeName: 'United States' },
  { code: 'GB', name: 'Великобритания', flag: '🇬🇧', nativeName: 'United Kingdom' },
  { code: 'DE', name: 'Германия', flag: '🇩🇪', nativeName: 'Deutschland' },
  { code: 'FR', name: 'Франция', flag: '🇫🇷', nativeName: 'France' },
  { code: 'IT', name: 'Италия', flag: '🇮🇹', nativeName: 'Italia' },
  { code: 'ES', name: 'Испания', flag: '🇪🇸', nativeName: 'España' },
  { code: 'CN', name: 'Китай', flag: '🇨🇳', nativeName: '中国' },
  { code: 'JP', name: 'Япония', flag: '🇯🇵', nativeName: '日本' },
  { code: 'KR', name: 'Южная Корея', flag: '🇰🇷', nativeName: '한국' },
  { code: 'IN', name: 'Индия', flag: '🇮🇳', nativeName: 'भारत' },
  { code: 'BR', name: 'Бразилия', flag: '🇧🇷', nativeName: 'Brasil' },
  { code: 'MX', name: 'Мексика', flag: '🇲🇽', nativeName: 'México' },
  { code: 'CA', name: 'Канада', flag: '🇨🇦', nativeName: 'Canada' },
  { code: 'AU', name: 'Австралия', flag: '🇦🇺', nativeName: 'Australia' },
  { code: 'NZ', name: 'Новая Зеландия', flag: '🇳🇿', nativeName: 'Aotearoa' },
  { code: 'AR', name: 'Аргентина', flag: '🇦🇷', nativeName: 'Argentina' },
  { code: 'CL', name: 'Чили', flag: '🇨🇱', nativeName: 'Chile' },
  { code: 'CO', name: 'Колумбия', flag: '🇨🇴', nativeName: 'Colombia' },
  { code: 'PE', name: 'Перу', flag: '🇵🇪', nativeName: 'Perú' },
  { code: 'VE', name: 'Венесуэла', flag: '🇻🇪', nativeName: 'Venezuela' },
  { code: 'PL', name: 'Польша', flag: '🇵🇱', nativeName: 'Polska' },
  { code: 'NL', name: 'Нидерланды', flag: '🇳🇱', nativeName: 'Nederland' },
  { code: 'BE', name: 'Бельгия', flag: '🇧🇪', nativeName: 'België' },
  { code: 'CH', name: 'Швейцария', flag: '🇨🇭', nativeName: 'Schweiz' },
  { code: 'AT', name: 'Австрия', flag: '🇦🇹', nativeName: 'Österreich' },
  { code: 'SE', name: 'Швеция', flag: '🇸🇪', nativeName: 'Sverige' },
  { code: 'NO', name: 'Норвегия', flag: '🇳🇴', nativeName: 'Norge' },
  { code: 'DK', name: 'Дания', flag: '🇩🇰', nativeName: 'Danmark' },
  { code: 'FI', name: 'Финляндия', flag: '🇫🇮', nativeName: 'Suomi' },
  { code: 'IE', name: 'Ирландия', flag: '🇮🇪', nativeName: 'Éire' },
  { code: 'PT', name: 'Португалия', flag: '🇵🇹', nativeName: 'Portugal' },
  { code: 'GR', name: 'Греция', flag: '🇬🇷', nativeName: 'Ελλάδα' },
  { code: 'TR', name: 'Турция', flag: '🇹🇷', nativeName: 'Türkiye' },
  { code: 'SA', name: 'Саудовская Аравия', flag: '🇸🇦', nativeName: 'السعودية' },
  { code: 'AE', name: 'ОАЭ', flag: '🇦🇪', nativeName: 'الإمارات' },
  { code: 'IL', name: 'Израиль', flag: '🇮🇱', nativeName: 'ישראל' },
  { code: 'EG', name: 'Египет', flag: '🇪🇬', nativeName: 'مصر' },
  { code: 'ZA', name: 'ЮАР', flag: '🇿🇦', nativeName: 'South Africa' },
  { code: 'NG', name: 'Нигерия', flag: '🇳🇬', nativeName: 'Nigeria' },
  { code: 'KE', name: 'Кения', flag: '🇰🇪', nativeName: 'Kenya' },
  { code: 'TH', name: 'Таиланд', flag: '🇹🇭', nativeName: 'ประเทศไทย' },
  { code: 'VN', name: 'Вьетнам', flag: '🇻🇳', nativeName: 'Việt Nam' },
  { code: 'ID', name: 'Индонезия', flag: '🇮🇩', nativeName: 'Indonesia' },
  { code: 'MY', name: 'Малайзия', flag: '🇲🇾', nativeName: 'Malaysia' },
  { code: 'SG', name: 'Сингапур', flag: '🇸🇬', nativeName: 'Singapore' },
  { code: 'PH', name: 'Филиппины', flag: '🇵🇭', nativeName: 'Pilipinas' },
  { code: 'PK', name: 'Пакистан', flag: '🇵🇰', nativeName: 'پاکستان' },
  { code: 'BD', name: 'Бангладеш', flag: '🇧🇩', nativeName: 'বাংলাদেশ' },
  { code: 'UA', name: 'Украина', flag: '🇺🇦', nativeName: 'Україна' },
  { code: 'BY', name: 'Беларусь', flag: '🇧🇾', nativeName: 'Беларусь' },
  { code: 'KZ', name: 'Казахстан', flag: '🇰🇿', nativeName: 'Қазақстан' },
  { code: 'UZ', name: 'Узбекистан', flag: '🇺🇿', nativeName: 'Oʻzbekiston' },
  { code: 'GE', name: 'Грузия', flag: '🇬🇪', nativeName: 'საქართველო' },
  { code: 'AM', name: 'Армения', flag: '🇦🇲', nativeName: 'Հայաստան' },
  { code: 'AZ', name: 'Азербайджан', flag: '🇦🇿', nativeName: 'Azərbaycan' },
  { code: 'RO', name: 'Румыния', flag: '🇷🇴', nativeName: 'România' },
  { code: 'HU', name: 'Венгрия', flag: '🇭🇺', nativeName: 'Magyarország' },
  { code: 'CZ', name: 'Чехия', flag: '🇨🇿', nativeName: 'Česko' },
  { code: 'SK', name: 'Словакия', flag: '🇸🇰', nativeName: 'Slovensko' },
  { code: 'BG', name: 'Болгария', flag: '🇧🇬', nativeName: 'България' },
  { code: 'HR', name: 'Хорватия', flag: '🇭🇷', nativeName: 'Hrvatska' },
  { code: 'RS', name: 'Сербия', flag: '🇷🇸', nativeName: 'Србија' },
  { code: 'SI', name: 'Словения', flag: '🇸🇮', nativeName: 'Slovenija' },
  { code: 'EE', name: 'Эстония', flag: '🇪🇪', nativeName: 'Eesti' },
  { code: 'LV', name: 'Латвия', flag: '🇱🇻', nativeName: 'Latvija' },
  { code: 'LT', name: 'Литва', flag: '🇱🇹', nativeName: 'Lietuva' },
  { code: 'IS', name: 'Исландия', flag: '🇮🇸', nativeName: 'Ísland' },
  { code: 'LU', name: 'Люксембург', flag: '🇱🇺', nativeName: 'Luxembourg' },
  { code: 'MT', name: 'Мальта', flag: '🇲🇹', nativeName: 'Malta' },
  { code: 'CY', name: 'Кипр', flag: '🇨🇾', nativeName: 'Κύπρος' },
  { code: 'CR', name: 'Коста-Рика', flag: '🇨🇷', nativeName: 'Costa Rica' },
  { code: 'PA', name: 'Панама', flag: '🇵🇦', nativeName: 'Panamá' },
  { code: 'GT', name: 'Гватемала', flag: '🇬🇹', nativeName: 'Guatemala' },
  { code: 'CU', name: 'Куба', flag: '🇨🇺', nativeName: 'Cuba' },
  { code: 'DO', name: 'Доминикана', flag: '🇩🇴', nativeName: 'República Dominicana' },
  { code: 'JM', name: 'Ямайка', flag: '🇯🇲', nativeName: 'Jamaica' },
  { code: 'TT', name: 'Тринидад и Тобаго', flag: '🇹🇹', nativeName: 'Trinidad and Tobago' },
  { code: 'EC', name: 'Эквадор', flag: '🇪🇨', nativeName: 'Ecuador' },
  { code: 'BO', name: 'Боливия', flag: '🇧🇴', nativeName: 'Bolivia' },
  { code: 'PY', name: 'Парагвай', flag: '🇵🇾', nativeName: 'Paraguay' },
  { code: 'UY', name: 'Уругвай', flag: '🇺🇾', nativeName: 'Uruguay' },
  { code: 'MA', name: 'Марокко', flag: '🇲🇦', nativeName: 'المغرب' },
  { code: 'TN', name: 'Тунис', flag: '🇹🇳', nativeName: 'تونس' },
  { code: 'DZ', name: 'Алжир', flag: '🇩🇿', nativeName: 'الجزائر' },
  { code: 'LY', name: 'Ливия', flag: '🇱🇾', nativeName: 'ليبيا' },
  { code: 'SD', name: 'Судан', flag: '🇸🇩', nativeName: 'السودان' },
  { code: 'ET', name: 'Эфиопия', flag: '🇪🇹', nativeName: 'ኢትዮጵያ' },
  { code: 'GH', name: 'Гана', flag: '🇬🇭', nativeName: 'Ghana' },
  { code: 'TZ', name: 'Танзания', flag: '🇹🇿', nativeName: 'Tanzania' },
  { code: 'UG', name: 'Уганда', flag: '🇺🇬', nativeName: 'Uganda' },
  { code: 'MM', name: 'Мьянма', flag: '🇲🇲', nativeName: 'မြန်မာ' },
  { code: 'KH', name: 'Камбоджа', flag: '🇰🇭', nativeName: 'កម្ពុជា' },
  { code: 'LA', name: 'Лаос', flag: '🇱🇦', nativeName: 'ລາວ' },
  { code: 'BN', name: 'Бруней', flag: '🇧🇳', nativeName: 'Brunei' },
  { code: 'TL', name: 'Восточный Тимор', flag: '🇹🇱', nativeName: 'Timor-Leste' },
  { code: 'MN', name: 'Монголия', flag: '🇲🇳', nativeName: 'Монгол' },
  { code: 'NP', name: 'Непал', flag: '🇳🇵', nativeName: 'नेपाल' },
  { code: 'LK', name: 'Шри-Ланка', flag: '🇱🇰', nativeName: 'ශ්‍රී ලංකා' },
  { code: 'AF', name: 'Афганистан', flag: '🇦🇫', nativeName: 'افغانستان' },
  { code: 'IQ', name: 'Ирак', flag: '🇮🇶', nativeName: 'العراق' },
  { code: 'IR', name: 'Иран', flag: '🇮🇷', nativeName: 'ایران' },
  { code: 'JO', name: 'Иордания', flag: '🇯🇴', nativeName: 'الأردن' },
  { code: 'LB', name: 'Ливан', flag: '🇱🇧', nativeName: 'لبنان' },
  { code: 'SY', name: 'Сирия', flag: '🇸🇾', nativeName: 'سوريا' },
  { code: 'YE', name: 'Йемен', flag: '🇾🇪', nativeName: 'اليمن' },
  { code: 'OM', name: 'Оман', flag: '🇴🇲', nativeName: 'عُمان' },
  { code: 'QA', name: 'Катар', flag: '🇶🇦', nativeName: 'قطر' },
  { code: 'KW', name: 'Кувейт', flag: '🇰🇼', nativeName: 'الكويت' },
  { code: 'BH', name: 'Бахрейн', flag: '🇧🇭', nativeName: 'البحرين' },
  { code: 'FJ', name: 'Фиджи', flag: '🇫🇯', nativeName: 'Fiji' },
  { code: 'PG', name: 'Папуа-Новая Гвинея', flag: '🇵🇬', nativeName: 'Papua New Guinea' },
  { code: 'NC', name: 'Новая Каледония', flag: '🇳🇨', nativeName: 'Nouvelle-Calédonie' },
  { code: 'PF', name: 'Французская Полинезия', flag: '🇵🇫', nativeName: 'Polynésie française' },
];

// Генерация списка годов рождения (от текущего года до 1920)
const BIRTH_YEARS: number[] = (() => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear; year >= 1920; year--) {
    years.push(year);
  }
  return years;
})();

interface ToyConstructorProps {
  onSave: (params: ToyParams) => Promise<void>;
  userId: string;
}

export default function ToyConstructor({ onSave, userId }: ToyConstructorProps) {
  const { language, setLanguage, t } = useLanguage();
  const currentTranslations = translations[language];
  
  // PATTERNS с учетом языка
  const PATTERNS: { value: ToyPattern; label: string }[] = [
    { value: null, label: t('noPattern') },
    { value: 'stripes', label: t('stripes') },
    { value: 'dots', label: t('dots') },
    { value: 'snowflakes', label: t('snowflakes') },
    { value: 'stars', label: t('starsPattern') },
  ];
  
  // Форма всегда шар
  const shape: ToyShape = 'ball';
  const [color, setColor] = useState('#FFFF00'); // Желтый по умолчанию
  const [pattern, setPattern] = useState<ToyPattern>(null);
  const [wishText, setWishText] = useState('');
  const [wishForOthers, setWishForOthers] = useState('');
  
  // Персонализация шара
  const [ballSize, setBallSize] = useState(1.0);
  const [surfaceType, setSurfaceType] = useState<'glossy' | 'matte' | 'metal'>('glossy');
  const [effects, setEffects] = useState<{
    sparkle: boolean;
    gradient: boolean;
    glow: boolean;
    stars: boolean;
  }>({
    sparkle: false,
    gradient: false,
    glow: false,
    stars: false,
  });
  const [filters, setFilters] = useState<{
    blur: number;
    contrast: number;
    saturation: number;
    vignette: number;
    grain: number;
  }>({
    blur: 0,
    contrast: 100,
    saturation: 100,
    vignette: 0,
    grain: 0,
  });
  const [secondColor, setSecondColor] = useState<string | null>('#FFFF00'); // Желтый по умолчанию
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [userPhotoFile, setUserPhotoFile] = useState<File | null>(null);
  // Статистические данные (необязательные)
  const [userName, setUserName] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countryDropdownUp, setCountryDropdownUp] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const countryButtonRef = useRef<HTMLButtonElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const [canvasImageData, setCanvasImageData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSecondColorPicker, setShowSecondColorPicker] = useState(false);
  const [showMagicTransformation, setShowMagicTransformation] = useState(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'wish'>('editor');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [isOldBrowser, setIsOldBrowser] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const secondColorInputRef = useRef<HTMLInputElement>(null);
  const [snowflakes, setSnowflakes] = useState<Array<{ left: number; top: number; delay: number; duration: number; size: number }>>([]);
  const [holidayElements, setHolidayElements] = useState<{
    stars: Array<{ left: number; top: number; delay: number; duration: number; size: number }>;
    fireworks: Array<{ left: number; top: number; delay: number; duration: number; size: number; color: string }>;
    santas: Array<{ left: number; top: number; delay: number; duration: number; size: number; emoji: string }>;
    dedMorozes: Array<{ left: number; top: number; delay: number; duration: number; size: number; emoji: string; color: string }>;
    snowmen: Array<{ left: number; top: number; delay: number; duration: number; size: number }>;
    bells: Array<{ left: number; top: number; delay: number; duration: number; size: number; color: string }>;
    deers: Array<{ left: number; top: number; delay: number; duration: number; size: number }>;
    gnomes: Array<{ left: number; top: number; delay: number; duration: number; size: number }>;
    candies: Array<{ left: number; top: number; delay: number; duration: number; size: number; color: string }>;
    oranges: Array<{ left: number; top: number; delay: number; duration: number; size: number }>;
    lollipops: Array<{ left: number; top: number; delay: number; duration: number; size: number }>;
    cones: Array<{ left: number; top: number; delay: number; duration: number; size: number }>;
    lanterns: Array<{ left: number; top: number; delay: number; duration: number; size: number; color: string }>;
    candles: Array<{ left: number; top: number; delay: number; duration: number; size: number }>;
    chinese: Array<{ left: number; top: number; delay: number; duration: number; size: number; color: string; emoji: string }>;
    japanese: Array<{ left: number; top: number; delay: number; duration: number; size: number; emoji: string }>;
  }>({
    stars: [],
    fireworks: [],
    santas: [],
    dedMorozes: [],
    snowmen: [],
    bells: [],
    deers: [],
    gnomes: [],
    candies: [],
    oranges: [],
    lollipops: [],
    cones: [],
    lanterns: [],
    candles: [],
    chinese: [],
    japanese: [],
  });

  // Генерируем все новогодние элементы только на клиенте, чтобы избежать ошибки гидратации
  useEffect(() => {
    // Генерируем снежинки
    const newSnowflakes = Array.from({ length: 30 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2,
      size: 10 + Math.random() * 20,
    }));
    setSnowflakes(newSnowflakes);
    
    const chineseEmojis = ['🧧', '🐉', '🧨', '🎋', '🏮', '💰'];
    const japaneseEmojis = ['🎌', '🏯', '🎍', '🎎', '🌸'];
    
    setHolidayElements({
      stars: Array.from({ length: 20 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 3,
        size: 12 + Math.random() * 18,
      })),
      fireworks: Array.from({ length: 8 }, (_, i) => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 1.5 + Math.random() * 2,
        size: 16 + Math.random() * 20,
        color: i % 3 === 0 ? 'rgba(255, 215, 0, 0.6)' : i % 3 === 1 ? 'rgba(255, 20, 147, 0.6)' : 'rgba(0, 191, 255, 0.6)',
      })),
      santas: Array.from({ length: 4 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 3 + Math.random() * 4,
        size: 20 + Math.random() * 25,
        emoji: '🎅',
      })),
      dedMorozes: Array.from({ length: 4 }, (_, i) => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 3 + Math.random() * 4,
        size: 24 + Math.random() * 28,
        emoji: '🧑‍🎄',
        color: i % 2 === 0 ? 'rgba(220, 20, 60, 0.7)' : 'rgba(0, 0, 139, 0.7)', // Красная или синяя шуба
      })),
      snowmen: Array.from({ length: 5 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 2.5 + Math.random() * 3.5,
        size: 18 + Math.random() * 24,
      })),
      bells: Array.from({ length: 6 }, (_, i) => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 1.5 + Math.random() * 2.5,
        size: 16 + Math.random() * 20,
        color: i % 2 === 0 ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 140, 0, 0.6)',
      })),
      deers: Array.from({ length: 5 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 2.5 + Math.random() * 3,
        size: 18 + Math.random() * 22,
      })),
      gnomes: Array.from({ length: 4 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 3,
        size: 16 + Math.random() * 20,
      })),
      candies: Array.from({ length: 10 }, (_, i) => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 1.5 + Math.random() * 2,
        size: 14 + Math.random() * 18,
        color: i % 3 === 0 ? 'rgba(255, 20, 147, 0.5)' : i % 3 === 1 ? 'rgba(255, 165, 0, 0.5)' : 'rgba(255, 192, 203, 0.5)',
      })),
      oranges: Array.from({ length: 6 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 3,
        size: 16 + Math.random() * 20,
      })),
      lollipops: Array.from({ length: 5 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 1.8 + Math.random() * 2.5,
        size: 15 + Math.random() * 19,
      })),
      cones: Array.from({ length: 8 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 2.5 + Math.random() * 3,
        size: 14 + Math.random() * 18,
      })),
      lanterns: Array.from({ length: 7 }, (_, i) => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 1.5 + Math.random() * 2,
        size: 18 + Math.random() * 22,
        color: i % 2 === 0 ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 69, 0, 0.6)',
      })),
      candles: Array.from({ length: 6 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 1 + Math.random() * 1.5,
        size: 16 + Math.random() * 20,
      })),
      chinese: Array.from({ length: 6 }, (_, i) => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 3,
        size: 18 + Math.random() * 24,
        color: i % 2 === 0 ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 215, 0, 0.5)',
        emoji: chineseEmojis[i % chineseEmojis.length],
      })),
      japanese: Array.from({ length: 5 }, (_, i) => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2.5 + Math.random() * 3,
        size: 16 + Math.random() * 22,
        emoji: japaneseEmojis[i % japaneseEmojis.length],
      })),
    });
  }, []);

  // Определяем старый браузер (не поддерживает современные CSS возможности)
  useEffect(() => {
    const checkOldBrowser = () => {
      // Проверяем поддержку CSS Grid, Flexbox gap, и backdrop-filter
      if (typeof window === 'undefined' || typeof CSS === 'undefined' || !CSS.supports) {
        // Если CSS.supports недоступен - это точно старый браузер
        setIsOldBrowser(true);
        return;
      }
      
      const supportsGrid = CSS.supports('display', 'grid');
      const supportsGap = CSS.supports('gap', '1rem');
      const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
      const supportsCssVars = CSS.supports('--test', 'value');
      
      // Старый браузер - если не поддерживает хотя бы один из этих features
      setIsOldBrowser(!supportsGrid || !supportsGap || !supportsBackdropFilter || !supportsCssVars);
    };
    
    checkOldBrowser();
  }, []);

  // Функция для получения стилей позиционирования holiday элементов
  const getHolidayElementStyle = useCallback((leftPercent: number, topPercent: number, size: number, delay?: number, duration?: number, color?: string) => {
    if (isOldBrowser) {
      // Для старых браузеров используем фиксированные позиции в пикселях
      // Используем document.documentElement для более надежного определения размеров
      const screenWidth = typeof document !== 'undefined' && document.documentElement ? document.documentElement.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 1920);
      const screenHeight = typeof document !== 'undefined' && document.documentElement ? document.documentElement.clientHeight : (typeof window !== 'undefined' ? window.innerHeight : 1080);
      return {
        position: 'absolute' as const,
        left: `${(leftPercent / 100) * screenWidth}px`,
        top: `${(topPercent / 100) * screenHeight}px`,
        fontSize: `${size}px`,
        zIndex: 1,
        ...(color ? { color } : {}),
      };
    } else {
      // Для современных браузеров используем проценты и анимации
      return {
        position: 'absolute' as const,
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        animationDelay: delay ? `${delay}s` : undefined,
        animationDuration: duration ? `${duration}s` : undefined,
        fontSize: `${size}px`,
        zIndex: 1,
        ...(color ? { color } : {}),
      };
    }
  }, [isOldBrowser]);

  // Закрываем панели при клике вне их
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // НЕ обрабатываем клики на кнопки UNDO/REDO и другие элементы редактора
      const target = event.target as HTMLElement;
      if (target.closest('[data-canvas-tools]') || 
          target.closest('[data-canvas-editor]') || 
          target.closest('[data-canvas-wrapper]') ||
          target.closest('[data-action-buttons]') ||
          target.closest('[data-undo-button]') ||
          target.closest('[data-redo-button]')) {
        return; // Игнорируем клики на элементы редактора
      }
      
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    if (showColorPicker || showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showColorPicker, showCountryDropdown]);

  // Определяем направление открытия dropdown для страны
  const handleCountryDropdownToggle = () => {
    if (!showCountryDropdown && countryButtonRef.current) {
      const rect = countryButtonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 200; // max-h-[200px]
      
      // Если места внизу меньше, чем нужно, и места вверху больше - открываем вверх
      setCountryDropdownUp(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
    }
    setShowCountryDropdown(!showCountryDropdown);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('Выбран файл изображения:', file ? { name: file.name, size: file.size, type: file.type } : 'нет файла');
    if (file) {
      setImageFile(file);
      console.log('Файл изображения сохранен в state');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        console.log('Preview изображения создан');
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleUserPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('Выбран файл фото пользователя:', file ? { name: file.name, size: file.size, type: file.type } : 'нет файла');
    if (file) {
      setUserPhotoFile(file);
      console.log('Файл фото пользователя сохранен в state');
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserPhotoPreview(reader.result as string);
        console.log('Preview фото пользователя создан');
      };
      reader.readAsDataURL(file);
    } else {
      setUserPhotoFile(null);
      setUserPhotoPreview(null);
    }
  };

  // Обработка drag-and-drop для изображения игрушки
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    console.log('Drop файла:', file ? { name: file.name, type: file.type, size: file.size } : 'нет файла');
    
    if (file && file.type.startsWith('image/')) {
      console.log('Обработка drop файла изображения');
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        console.log('Preview из drop создан');
      };
      reader.readAsDataURL(file);
    } else if (file) {
      console.warn('Файл не является изображением:', file.type);
      alert('Пожалуйста, выберите файл изображения (JPG, PNG, GIF, BMP)');
    }
  };

  // Обработка drag-and-drop для фото пользователя
  const handleDragOverPhoto = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingPhoto(true);
    }
  };

  const handleDragLeavePhoto = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(false);
  };

  const handleDropPhoto = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(false);

    const file = e.dataTransfer.files?.[0];
    console.log('Drop фото пользователя:', file ? { name: file.name, type: file.type, size: file.size } : 'нет файла');
    
    if (file && file.type.startsWith('image/')) {
      console.log('Обработка drop фото пользователя');
      setUserPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserPhotoPreview(reader.result as string);
        console.log('Preview фото из drop создан');
      };
      reader.readAsDataURL(file);
    } else if (file) {
      console.warn('Файл не является изображением:', file.type);
      alert('Пожалуйста, выберите файл изображения (JPG, PNG, GIF, BMP)');
    }
  };

  const handleSave = async () => {
    if (!wishText.trim()) {
      alert(t('wishRequired'));
      return;
    }

    if (wishText.length > 200) {
      alert(t('wishTooLong'));
      return;
    }

    console.log('Состояние файлов перед сохранением:', {
      imageFile: imageFile ? { name: imageFile.name, size: imageFile.size, type: imageFile.type } : null,
      userPhotoFile: userPhotoFile ? { name: userPhotoFile.name, size: userPhotoFile.size, type: userPhotoFile.type } : null,
    });

    setIsSaving(true);
    try {
      const params: ToyParams = {
        shape,
        color,
        pattern,
        wish_text: wishText,
        wish_for_others: wishForOthers.trim() || undefined,
        image_file: imageFile || undefined,
        user_photo_file: userPhotoFile || undefined,
      };
      
      console.log('Параметры для сохранения:', {
        ...params,
        image_file: params.image_file ? { name: params.image_file.name, size: params.image_file.size } : undefined,
        user_photo_file: params.user_photo_file ? { name: params.user_photo_file.name, size: params.user_photo_file.size } : undefined,
      });

      await onSave(params);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  // Старая функция предпросмотра (не используется, заменена на CanvasEditor)
  const _renderToyPreview = () => {
    const size = 200;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;

    // Всегда шар
    const getClipPathId = () => 'clip-circle';

    return (
      <div className="flex items-center justify-center w-full h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Определения clipPath для шара */}
          <defs>
            <clipPath id="clip-circle">
              <circle cx={centerX} cy={centerY} r={radius} />
            </clipPath>
          </defs>

          {/* Фон (полупрозрачный) */}
          <circle cx={centerX} cy={centerY} r={radius} fill={color} opacity={0.3} />
          
          {/* Основная форма */}
          {/* Всегда шар */}
          <circle cx={centerX} cy={centerY} r={radius} fill={color} stroke="#333" strokeWidth="2" />

          {/* Узор */}
          {pattern === 'stripes' && (
            <>
              <line x1={centerX - radius} y1={centerY} x2={centerX + radius} y2={centerY} stroke="#fff" strokeWidth="3" />
              <line x1={centerX - radius} y1={centerY - radius * 0.5} x2={centerX + radius} y2={centerY - radius * 0.5} stroke="#fff" strokeWidth="2" />
              <line x1={centerX - radius} y1={centerY + radius * 0.5} x2={centerX + radius} y2={centerY + radius * 0.5} stroke="#fff" strokeWidth="2" />
            </>
          )}
          {pattern === 'dots' && (
            <>
              <circle cx={centerX - radius * 0.3} cy={centerY - radius * 0.3} r="8" fill="#fff" />
              <circle cx={centerX + radius * 0.3} cy={centerY - radius * 0.3} r="8" fill="#fff" />
              <circle cx={centerX} cy={centerY} r="8" fill="#fff" />
              <circle cx={centerX - radius * 0.3} cy={centerY + radius * 0.3} r="8" fill="#fff" />
              <circle cx={centerX + radius * 0.3} cy={centerY + radius * 0.3} r="8" fill="#fff" />
            </>
          )}

          {/* Изображение в центре - правильно обрезанное по форме */}
          {imagePreview && (
            <image
              href={imagePreview}
              x={centerX - radius}
              y={centerY - radius}
              width={radius * 2}
              height={radius * 2}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${getClipPathId()})`}
            />
          )}

        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative p-2 sm:p-3 md:p-4 overflow-hidden">
      {/* Селектор языка в левом верхнем углу */}
      <div className="fixed top-12 left-2 sm:top-4 sm:left-4 z-50">
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'ru' | 'en')}
            className="bg-slate-800/95 backdrop-blur-md border-2 border-white/30 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-white font-bold text-xs sm:text-sm cursor-pointer active:border-white/50 transition-colors shadow-xl touch-manipulation"
          >
            <option value="ru">🇷🇺 Русский</option>
            <option value="en">🇺🇸 English</option>
          </select>
        </div>
      </div>

      {/* Автоматический переводчик в правом верхнем углу */}
      <AutoTranslator />
      
      {/* Новогодний фон с анимацией */}
      {/* Новогодние элементы - всегда показываются, но с разным позиционированием для старых браузеров */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
        {/* Темный градиентный фон */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 via-purple-950 to-pink-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.3),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,215,0,0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,20,147,0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_80%,rgba(255,69,0,0.06),transparent_40%)]"></div>
        
        {/* Анимированные новогодние элементы */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Снежинки */}
          {snowflakes.length > 0 && snowflakes.map((flake, i) => (
            <div
              key={`snow-${i}`}
              className={isOldBrowser ? "text-white/50 pointer-events-none" : "absolute text-white/50 animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(flake.left, flake.top, flake.size, flake.delay, flake.duration)}
            >
              ❄
            </div>
          ))}
          
          {/* Звезды */}
          {holidayElements.stars.length > 0 && holidayElements.stars.map((star, i) => (
            <div
              key={`star-${i}`}
              className={isOldBrowser ? "text-yellow-300/70 pointer-events-none" : "absolute text-yellow-300/70 animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(star.left, star.top, star.size, star.delay, star.duration)}
            >
              ⭐
            </div>
          ))}
          
          {/* Фейерверки */}
          {holidayElements.fireworks.length > 0 && holidayElements.fireworks.map((firework, i) => (
            <div
              key={`firework-${i}`}
              className={isOldBrowser ? "pointer-events-none" : "absolute animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(firework.left, firework.top, firework.size, firework.delay, firework.duration, firework.color)}
            >
              ✨
            </div>
          ))}
          
          {/* Санта Клаусы */}
          {holidayElements.santas.length > 0 && holidayElements.santas.map((santa, i) => (
            <div
              key={`santa-${i}`}
              className={isOldBrowser ? "text-red-400/60 pointer-events-none" : "absolute text-red-400/60 animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(santa.left, santa.top, santa.size, santa.delay, santa.duration)}
            >
              {santa.emoji}
            </div>
          ))}
          
          {/* Деды Морозы (русские, с длинными шубами) */}
          {holidayElements.dedMorozes.length > 0 && holidayElements.dedMorozes.map((ded, i) => (
            <div
              key={`ded-${i}`}
              className="absolute animate-pulse pointer-events-none"
              style={{
                left: `${ded.left}%`,
                top: `${ded.top}%`,
                animationDelay: `${ded.delay}s`,
                animationDuration: `${ded.duration}s`,
                fontSize: `${ded.size}px`,
                color: ded.color,
                zIndex: 1,
              }}
            >
              {ded.emoji}
            </div>
          ))}
          
          {/* Снеговики */}
          {holidayElements.snowmen.length > 0 && holidayElements.snowmen.map((snowman, i) => (
            <div
              key={`snowman-${i}`}
              className="absolute text-white/90 animate-pulse pointer-events-none"
              style={{
                left: `${snowman.left}%`,
                top: `${snowman.top}%`,
                animationDelay: `${snowman.delay}s`,
                animationDuration: `${snowman.duration}s`,
                fontSize: `${snowman.size}px`,
                zIndex: 1,
              }}
            >
              ⛄
            </div>
          ))}
          
          {/* Колокольчики */}
          {holidayElements.bells.length > 0 && holidayElements.bells.map((bell, i) => (
            <div
              key={`bell-${i}`}
              className="absolute animate-pulse pointer-events-none"
              style={{
                left: `${bell.left}%`,
                top: `${bell.top}%`,
                animationDelay: `${bell.delay}s`,
                animationDuration: `${bell.duration}s`,
                fontSize: `${bell.size}px`,
                color: bell.color,
                zIndex: 1,
              }}
            >
              🔔
            </div>
          ))}
          
          {/* Деды Морозы (русские, с длинными шубами) */}
          {holidayElements.dedMorozes.length > 0 && holidayElements.dedMorozes.map((ded, i) => (
            <div
              key={`ded-${i}`}
              className={isOldBrowser ? "pointer-events-none" : "absolute animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(ded.left, ded.top, ded.size, ded.delay, ded.duration, ded.color)}
            >
              {ded.emoji}
            </div>
          ))}
          
          {/* Снеговики */}
          {holidayElements.snowmen.length > 0 && holidayElements.snowmen.map((snowman, i) => (
            <div
              key={`snowman-${i}`}
              className={isOldBrowser ? "text-white/90 pointer-events-none" : "absolute text-white/90 animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(snowman.left, snowman.top, snowman.size, snowman.delay, snowman.duration)}
            >
              ⛄
            </div>
          ))}
          
          {/* Колокольчики */}
          {holidayElements.bells.length > 0 && holidayElements.bells.map((bell, i) => (
            <div
              key={`bell-${i}`}
              className={isOldBrowser ? "pointer-events-none" : "absolute animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(bell.left, bell.top, bell.size, bell.delay, bell.duration, bell.color)}
            >
              🔔
            </div>
          ))}
          
          {/* Олени */}
          {holidayElements.deers.length > 0 && holidayElements.deers.map((deer, i) => (
            <div
              key={`deer-${i}`}
              className={isOldBrowser ? "text-amber-300/50 pointer-events-none" : "absolute text-amber-300/50 animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(deer.left, deer.top, deer.size, deer.delay, deer.duration)}
            >
              🦌
            </div>
          ))}
          
          {/* Гномики */}
          {holidayElements.gnomes.length > 0 && holidayElements.gnomes.map((gnome, i) => (
            <div
              key={`gnome-${i}`}
              className={isOldBrowser ? "text-red-300/50 pointer-events-none" : "absolute text-red-300/50 animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(gnome.left, gnome.top, gnome.size, gnome.delay, gnome.duration)}
            >
              🧙
            </div>
          ))}
          
          {/* Конфеты */}
          {holidayElements.candies.length > 0 && holidayElements.candies.map((candy, i) => (
            <div
              key={`candy-${i}`}
              className={isOldBrowser ? "pointer-events-none" : "absolute animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(candy.left, candy.top, candy.size, candy.delay, candy.duration, candy.color)}
            >
              🍬
            </div>
          ))}
          
          {/* Мандарины */}
          {holidayElements.oranges.length > 0 && holidayElements.oranges.map((orange, i) => (
            <div
              key={`orange-${i}`}
              className={isOldBrowser ? "text-orange-400/60 pointer-events-none" : "absolute text-orange-400/60 animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(orange.left, orange.top, orange.size, orange.delay, orange.duration)}
            >
              🍊
            </div>
          ))}
          
          {/* Леденцы */}
          {holidayElements.lollipops.length > 0 && holidayElements.lollipops.map((lollipop, i) => (
            <div
              key={`lollipop-${i}`}
              className={isOldBrowser ? "text-pink-300/60 pointer-events-none" : "absolute text-pink-300/60 animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(lollipop.left, lollipop.top, lollipop.size, lollipop.delay, lollipop.duration)}
            >
              🍭
            </div>
          ))}
          
          {/* Шишки */}
          {holidayElements.cones.length > 0 && holidayElements.cones.map((cone, i) => (
            <div
              key={`cone-${i}`}
              className={isOldBrowser ? "text-amber-600/50 pointer-events-none" : "absolute text-amber-600/50 animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(cone.left, cone.top, cone.size, cone.delay, cone.duration)}
            >
              🌲
            </div>
          ))}
          
          {/* Фонарики */}
          {holidayElements.lanterns.length > 0 && holidayElements.lanterns.map((lantern, i) => (
            <div
              key={`lantern-${i}`}
              className={isOldBrowser ? "pointer-events-none" : "absolute animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(lantern.left, lantern.top, lantern.size, lantern.delay, lantern.duration, lantern.color)}
            >
              🏮
            </div>
          ))}
          
          {/* Свечки */}
          {holidayElements.candles.length > 0 && holidayElements.candles.map((candle, i) => (
            <div
              key={`candle-${i}`}
              className={isOldBrowser ? "text-yellow-200/70 pointer-events-none" : "absolute text-yellow-200/70 animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(candle.left, candle.top, candle.size, candle.delay, candle.duration)}
            >
              🕯️
            </div>
          ))}
          
          {/* Китайские новогодние элементы */}
          {holidayElements.chinese.length > 0 && holidayElements.chinese.map((chinese, i) => (
            <div
              key={`chinese-${i}`}
              className={isOldBrowser ? "pointer-events-none" : "absolute animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(chinese.left, chinese.top, chinese.size, chinese.delay, chinese.duration, chinese.color)}
            >
              {chinese.emoji}
            </div>
          ))}
          
          {/* Японские новогодние элементы */}
          {holidayElements.japanese.length > 0 && holidayElements.japanese.map((japanese, i) => (
            <div
              key={`japanese-${i}`}
              className={isOldBrowser ? "text-pink-200/60 pointer-events-none" : "absolute text-pink-200/60 animate-pulse pointer-events-none"}
              style={getHolidayElementStyle(japanese.left, japanese.top, japanese.size, japanese.delay, japanese.duration)}
            >
              {japanese.emoji}
            </div>
          ))}
        </div>
        
        {/* Блики и свечение */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/3"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10"></div>
      </div>
      
      <div className="relative z-0">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-3 sm:mb-4 md:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 drop-shadow-2xl">
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent animate-pulse">
              ✨ {t('title')} ✨
            </span>
          </h1>
        </div>

        {/* Мобильные вкладки (ТОЛЬКО на мобильных и планшетах, на ПК скрыты) */}
        <div className="mb-3 flex md:hidden flex-row border-b-2 border-white/20 w-full">
          <button
            onClick={() => setMobileTab('editor')}
            className="py-2.5 px-2 text-xs font-bold rounded-t-lg touch-manipulation whitespace-nowrap"
            style={{ 
              flex: '1',
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: mobileTab === 'editor' ? '#9333ea' : 'rgba(30, 41, 59, 0.5)',
              background: mobileTab === 'editor' ? 'linear-gradient(to right, #9333ea, #db2777)' : 'rgba(30, 41, 59, 0.5)',
              color: mobileTab === 'editor' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: '1', marginRight: '4px', display: 'inline-block' }}>🎨</span>
            <span className="hidden sm:inline">Редактор</span>
          </button>
          <button
            onClick={() => setMobileTab('wish')}
            className="py-2.5 px-2 text-xs font-bold rounded-t-lg touch-manipulation whitespace-nowrap"
            style={{ 
              flex: '1',
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: mobileTab === 'wish' ? '#dc2626' : (!wishText.trim() ? 'rgba(127, 29, 29, 0.6)' : 'rgba(30, 41, 59, 0.5)'),
              background: mobileTab === 'wish' ? 'linear-gradient(to right, #dc2626, #db2777)' : (!wishText.trim() ? 'linear-gradient(to right, rgba(127, 29, 29, 0.6), rgba(153, 27, 27, 0.6))' : 'rgba(30, 41, 59, 0.5)'),
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              opacity: mobileTab === 'wish' ? 1 : (!wishText.trim() ? 0.9 : 0.6)
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: '1', marginRight: '4px', display: 'inline-block' }}>💫</span>
            <span className="hidden sm:inline">Желание</span>
            {!wishText.trim() && <span style={{ fontSize: '12px', lineHeight: '1', marginLeft: '2px', display: 'inline-block' }}>⚠️</span>}
          </button>
        </div>

        {/* Layout: Редактор в центре, инструменты рядом с ним */}
        {/* На мобильных: вертикальный layout с вкладками, на больших экранах: grid layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-[auto_1fr_auto] gap-2 lg:gap-3 max-w-[1600px] mx-auto relative">
          {/* Левая панель: Персонализация, Эффекты (на мобильных показывается на вкладке редактора, на ПК всегда видна) */}
          <div className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} lg:flex flex-col gap-1.5 w-full lg:w-[240px] order-3 lg:order-1 relative`}>
            <div className="bg-slate-800/90 backdrop-blur-md rounded-xl p-2 sm:p-2.5 shadow-xl border-2 border-white/20 space-y-1.5 sm:space-y-2 flex-1 flex flex-col overflow-y-auto max-h-[400px] sm:max-h-[500px] lg:max-h-none" style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)' }}>
              {/* Персонализация шара */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-white/90 flex items-center gap-1 uppercase tracking-widest">
                  <span className="text-sm">✨</span>
                  {t('personalization')}
                </label>
                
                {/* Размер шара */}
                <div>
                  <div className="text-[9px] text-white/70 mb-0.5 font-black uppercase tracking-wider">{t('ballSize')}</div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.5"
                      step="0.1"
                      value={ballSize}
                      onChange={(e) => setBallSize(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-gradient-to-r from-slate-700 via-purple-700/50 to-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 touch-manipulation"
                      style={{ touchAction: 'none' }}
                    />
                </div>

                {/* Тип поверхности */}
                <div>
                  <div className="text-[9px] text-white/70 mb-1 font-black uppercase tracking-wider">{t('surface')}</div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setSurfaceType('glossy')}
                      className={`p-2.5 rounded-lg border-2 transition-all touch-manipulation ${
                        surfaceType === 'glossy'
                          ? 'border-cyan-400 bg-gradient-to-br from-cyan-500/40 via-blue-500/30 to-indigo-500/40 shadow-md scale-105'
                          : 'border-cyan-500/30 hover:border-cyan-400/60 bg-gradient-to-br from-slate-700/40 via-cyan-900/20 to-slate-700/40 hover:from-slate-700/50 hover:via-cyan-900/30 hover:to-slate-700/50'
                      }`}
                    >
                      <span className="text-lg">✨</span>
                      <div className="text-[10px] text-white/70 mt-1 font-black uppercase tracking-wider">{t('glossy').toUpperCase()}</div>
                    </button>
                    <button
                      onClick={() => setSurfaceType('matte')}
                      className={`p-2.5 rounded-lg border-2 transition-all ${
                        surfaceType === 'matte'
                          ? 'border-purple-400 bg-gradient-to-br from-purple-500/40 via-pink-500/30 to-rose-500/40 shadow-md scale-105'
                          : 'border-purple-500/30 hover:border-purple-400/60 bg-gradient-to-br from-slate-700/40 via-purple-900/20 to-slate-700/40 hover:from-slate-700/50 hover:via-purple-900/30 hover:to-slate-700/50'
                      }`}
                    >
                      <span className="text-lg">🔳</span>
                      <div className="text-[10px] text-white/70 mt-1 font-black uppercase tracking-wider">{t('matte').toUpperCase()}</div>
                    </button>
                    <button
                      onClick={() => setSurfaceType('metal')}
                      className={`p-2.5 rounded-lg border-2 transition-all touch-manipulation ${
                        surfaceType === 'metal'
                          ? 'border-amber-400 bg-gradient-to-br from-amber-500/40 via-yellow-500/30 to-orange-500/40 shadow-md scale-105'
                          : 'border-amber-500/30 hover:border-amber-400/60 bg-gradient-to-br from-slate-700/40 via-amber-900/20 to-slate-700/40 hover:from-slate-700/50 hover:via-amber-900/30 hover:to-slate-700/50'
                      }`}
                    >
                      <span className="text-lg">⚡</span>
                      <div className="text-[10px] text-white/70 mt-1 font-black uppercase tracking-wider">{t('metal').toUpperCase()}</div>
                    </button>
                  </div>
                </div>

                {/* Эффекты */}
                <div>
                  <div className="text-[9px] text-white/70 mb-1 font-black uppercase tracking-wider">{t('effects')}</div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setEffects({ ...effects, sparkle: !effects.sparkle })}
                      className={`p-2.5 rounded-lg border-2 transition-all touch-manipulation ${
                        effects.sparkle
                          ? 'border-yellow-400 bg-gradient-to-br from-yellow-500/40 via-amber-500/30 to-orange-500/40 shadow-md scale-105'
                          : 'border-yellow-500/30 hover:border-yellow-400/60 bg-gradient-to-br from-slate-700/40 via-yellow-900/20 to-slate-700/40 hover:from-slate-700/50 hover:via-yellow-900/30 hover:to-slate-700/50'
                      }`}
                    >
                      <span className="text-lg">💫</span>
                      <div className="text-[10px] text-white/70 mt-1 font-black uppercase tracking-wider">{t('sparkle').toUpperCase()}</div>
                    </button>
                    <button
                      onClick={() => setEffects({ ...effects, gradient: !effects.gradient })}
                      className={`p-2.5 rounded-lg border-2 transition-all touch-manipulation ${
                        effects.gradient
                          ? 'border-pink-400 bg-gradient-to-br from-pink-500/40 via-rose-500/30 to-fuchsia-500/40 shadow-md scale-105'
                          : 'border-pink-500/30 hover:border-pink-400/60 bg-gradient-to-br from-slate-700/40 via-pink-900/20 to-slate-700/40 hover:from-slate-700/50 hover:via-pink-900/30 hover:to-slate-700/50'
                      }`}
                    >
                      <span className="text-lg">🌈</span>
                      <div className="text-[10px] text-white/70 mt-1 font-black uppercase tracking-wider">{t('gradient').toUpperCase()}</div>
                    </button>
                    <button
                      onClick={() => setEffects({ ...effects, glow: !effects.glow })}
                      className={`p-2.5 rounded-lg border-2 transition-all touch-manipulation ${
                        effects.glow
                          ? 'border-emerald-400 bg-gradient-to-br from-emerald-500/40 via-teal-500/30 to-cyan-500/40 shadow-md scale-105'
                          : 'border-emerald-500/30 hover:border-emerald-400/60 bg-gradient-to-br from-slate-700/40 via-emerald-900/20 to-slate-700/40 hover:from-slate-700/50 hover:via-emerald-900/30 hover:to-slate-700/50'
                      }`}
                    >
                      <span className="text-lg">✨</span>
                      <div className="text-[10px] text-white/70 mt-1 font-black uppercase tracking-wider">{t('glow').toUpperCase()}</div>
                    </button>
                    <button
                      onClick={() => setEffects({ ...effects, stars: !effects.stars })}
                      className={`p-2.5 rounded-lg border-2 transition-all touch-manipulation ${
                        effects.stars
                          ? 'border-violet-400 bg-gradient-to-br from-violet-500/40 via-indigo-500/30 to-purple-500/40 shadow-md scale-105'
                          : 'border-violet-500/30 hover:border-violet-400/60 bg-gradient-to-br from-slate-700/40 via-violet-900/20 to-slate-700/40 hover:from-slate-700/50 hover:via-violet-900/30 hover:to-slate-700/50'
                      }`}
                    >
                      <span className="text-lg">🌟</span>
                      <div className="text-[10px] text-white/70 mt-1 font-black uppercase tracking-wider">{t('stars').toUpperCase()}</div>
                    </button>
                  </div>
                </div>

                {/* Цвет и Узор */}
                <div>
                  <div className="text-[9px] text-white/70 mb-1 font-black uppercase tracking-wider">{t('colorAndPattern')}</div>
                  <div className="space-y-1.5">
                    {/* Цвет 1 */}
                    <div className="relative" ref={colorPickerRef}>
                      <label className="w-full h-[50px] p-2 border-2 border-cyan-500/40 rounded-lg hover:border-cyan-400 transition-colors bg-gradient-to-br from-slate-700/60 via-cyan-900/20 to-slate-700/60 text-white/90 font-medium text-[10px] flex flex-col items-center justify-center gap-1 cursor-pointer">
                        <input
                          ref={colorInputRef}
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-5 h-5 rounded border-2 border-white/40 cursor-pointer touch-manipulation"
                          title={t('selectColor')}
                        />
                        <span className="text-[9px] font-black uppercase tracking-wider">{t('color1')}</span>
                      </label>
                    </div>
                    
                    {/* Цвет 2 */}
                    <div className="relative">
                      <label className="w-full h-[50px] p-2 border-2 border-rose-500/40 rounded-lg hover:border-rose-400 transition-colors bg-gradient-to-br from-slate-700/60 via-rose-900/20 to-slate-700/60 text-white/90 font-medium text-[10px] flex flex-col items-center justify-center gap-1 cursor-pointer relative">
                        <input
                          ref={secondColorInputRef}
                          type="color"
                          value={secondColor || '#FFFF00'}
                          onChange={(e) => setSecondColor(e.target.value)}
                          className="w-5 h-5 rounded border-2 border-white/40 cursor-pointer touch-manipulation"
                          title={t('secondColor')}
                        />
                        <span className="text-[9px] font-black uppercase tracking-wider">{t('color2')}</span>
                        {secondColor && (
                          <span className="text-[8px] text-green-400 font-bold">✓</span>
                        )}
                      </label>
                      {secondColor && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSecondColor(null);
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-[10px] flex items-center justify-center font-bold z-10"
                          title={t('removeSecondColor')}
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Узор */}
                    <div className="relative">
                      <select
                        value={pattern || ''}
                        onChange={(e) => setPattern(e.target.value as ToyPattern || null)}
                        className="w-full h-[50px] p-2 border-2 border-indigo-500/40 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-gradient-to-br from-slate-700/60 via-indigo-900/20 to-slate-700/60 text-white/90 font-medium text-[10px] flex flex-col items-center justify-center touch-manipulation"
                        title={t('pattern')}
                      >
                        {PATTERNS.map((p) => (
                          <option key={p.value || 'none'} value={p.value || ''} className="bg-slate-800 text-white">
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Центральная область: Canvas редактор с фильтрами (вкладка Редактор) */}
          <div className={`flex flex-col gap-2 order-2 lg:order-2 ${mobileTab === 'editor' ? 'block' : 'hidden'} lg:block lg:relative`}>
            {/* Область прокрутки справа (только на больших экранах) */}
            <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-4 z-10 pointer-events-none" style={{ right: '-16px', width: '16px' }}></div>
            
            {/* Инструкция над фильтрами */}
            <div className="mb-2 bg-gradient-to-r from-purple-800/40 via-indigo-800/30 to-pink-800/40 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/20">
              <div className="text-white/90 text-[10px] sm:text-xs space-y-1">
                <div className="font-bold text-[11px] sm:text-sm mb-2 text-center">✨ {t('howToCreate') || 'Как создать свой шар:'}</div>
                <div className="space-y-1 text-left">
                  <div>1️⃣ {t('step1') || 'Укрась свой шар как нравится'}</div>
                  <div>2️⃣ {t('step2') || 'Добавь своё желание или мечту на 2026 год'}</div>
                  <div>3️⃣ {t('step3') || 'Нажми "волшебную палочку", чтобы превратить его в настоящий ёлочный шарик'}</div>
                  <div>4️⃣ {t('step4') || 'Повесь его на мировую ёлку'}</div>
                </div>
                <div className="text-[9px] text-white/70 mt-2 italic text-center border-t border-white/20 pt-2">
                  {t('optionalHint') || '(можно добавить своё фото, имя или никнейм, а также дополнительное пожелание для кого угодно или сразу для всех)'}
                </div>
              </div>
            </div>

            {/* Фильтры: на ПК всегда развернуты, на мобильных - сворачивающаяся панель с миниатюрными кнопками */}
            <div className="bg-gradient-to-r from-slate-800/90 via-indigo-800/30 to-slate-800/90 backdrop-blur-md rounded-xl shadow-xl border-2 border-indigo-500/30" style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)' }}>
              {/* Заголовок с кнопкой сворачивания (только на мобильных) */}
              <button
                onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                className="md:hidden w-full p-2 flex items-center justify-between text-white/90 font-bold"
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">🎬</span>
                  <span>{t('filters')}</span>
                </span>
                <span className="text-xl">{showFiltersMobile ? '▲' : '▼'}</span>
              </button>
              
              {/* Содержимое фильтров: всегда видно на ПК, сворачивается на мобильных */}
              <div className={`${showFiltersMobile ? 'block' : 'hidden'} md:block p-2 sm:p-3`}>
                {/* На мобильных: миниатюрные кнопки с эмодзи и тултипами */}
                <div className="md:hidden flex items-center gap-1.5 flex-wrap justify-center pb-2">
                  {/* Blur */}
                    <div className="relative group" onTouchStart={(e) => e.stopPropagation()}>
                    <button
                      className="w-10 h-10 rounded-lg bg-indigo-600/50 hover:bg-indigo-600 active:bg-indigo-700 flex items-center justify-center text-white text-lg border border-indigo-400/50 transition-colors touch-manipulation"
                      title={`${t('blurLabel')}: ${filters.blur}`}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        const slider = e.currentTarget.parentElement?.querySelector('input[type="range"]') as HTMLInputElement;
                        if (slider) {
                          slider.style.opacity = '1';
                          setTimeout(() => slider.style.opacity = '', 2000);
                        }
                      }}
                    >
                      🌫️
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="10" 
                      step="0.5" 
                      value={filters.blur} 
                      onChange={(e) => setFilters({ ...filters, blur: parseFloat(e.target.value) })} 
                      className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-gradient-to-r from-slate-700 via-blue-700/50 to-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation"
                      style={{ zIndex: 50, touchAction: 'none' }}
                      onTouchStart={(e) => e.stopPropagation()}
                    />
                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[10px] text-white/70 opacity-100 md:opacity-0 md:group-hover:opacity-100 whitespace-nowrap">{filters.blur}</span>
                  </div>
                  
                  {/* Contrast */}
                  <div className="relative group" onTouchStart={(e) => e.stopPropagation()}>
                    <button
                      className="w-10 h-10 rounded-lg bg-indigo-600/50 hover:bg-indigo-600 active:bg-indigo-700 flex items-center justify-center text-white text-lg border border-indigo-400/50 transition-colors touch-manipulation"
                      title={`${t('contrastLabel')}: ${filters.contrast}%`}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        const slider = e.currentTarget.parentElement?.querySelector('input[type="range"]') as HTMLInputElement;
                        if (slider) slider.style.opacity = '1';
                      }}
                    >
                      ⚡
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      step="5" 
                      value={filters.contrast} 
                      onChange={(e) => setFilters({ ...filters, contrast: parseInt(e.target.value) })} 
                      className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-gradient-to-r from-slate-700 via-blue-700/50 to-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation"
                      style={{ zIndex: 50, touchAction: 'none' }}
                      onTouchStart={(e) => e.stopPropagation()}
                    />
                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[10px] text-white/70 opacity-100 md:opacity-0 md:group-hover:opacity-100 whitespace-nowrap">{filters.contrast}%</span>
                  </div>
                  
                  {/* Saturation */}
                  <div className="relative group" onTouchStart={(e) => e.stopPropagation()}>
                    <button
                      className="w-10 h-10 rounded-lg bg-indigo-600/50 hover:bg-indigo-600 active:bg-indigo-700 flex items-center justify-center text-white text-lg border border-indigo-400/50 transition-colors touch-manipulation"
                      title={`${t('saturationLabel')}: ${filters.saturation}%`}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        const slider = e.currentTarget.parentElement?.querySelector('input[type="range"]') as HTMLInputElement;
                        if (slider) slider.style.opacity = '1';
                      }}
                    >
                      🌈
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      step="5" 
                      value={filters.saturation} 
                      onChange={(e) => setFilters({ ...filters, saturation: parseInt(e.target.value) })} 
                      className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-gradient-to-r from-slate-700 via-blue-700/50 to-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation"
                      style={{ zIndex: 50, touchAction: 'none' }}
                      onTouchStart={(e) => e.stopPropagation()}
                    />
                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[10px] text-white/70 opacity-100 md:opacity-0 md:group-hover:opacity-100 whitespace-nowrap">{filters.saturation}%</span>
                  </div>
                  
                  {/* Vignette */}
                  <div className="relative group" onTouchStart={(e) => e.stopPropagation()}>
                    <button
                      className="w-10 h-10 rounded-lg bg-indigo-600/50 hover:bg-indigo-600 active:bg-indigo-700 flex items-center justify-center text-white text-lg border border-indigo-400/50 transition-colors touch-manipulation"
                      title={`${t('vignetteLabel')}: ${filters.vignette}`}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        const slider = e.currentTarget.parentElement?.querySelector('input[type="range"]') as HTMLInputElement;
                        if (slider) slider.style.opacity = '1';
                      }}
                    >
                      🔲
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="5" 
                      value={filters.vignette} 
                      onChange={(e) => setFilters({ ...filters, vignette: parseInt(e.target.value) })} 
                      className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-gradient-to-r from-slate-700 via-blue-700/50 to-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation"
                      style={{ zIndex: 50, touchAction: 'none' }}
                      onTouchStart={(e) => e.stopPropagation()}
                    />
                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[10px] text-white/70 opacity-100 md:opacity-0 md:group-hover:opacity-100 whitespace-nowrap">{filters.vignette}</span>
                  </div>
                  
                  {/* Grain */}
                  <div className="relative group" onTouchStart={(e) => e.stopPropagation()}>
                    <button
                      className="w-10 h-10 rounded-lg bg-indigo-600/50 hover:bg-indigo-600 active:bg-indigo-700 flex items-center justify-center text-white text-lg border border-indigo-400/50 transition-colors touch-manipulation"
                      title={`${t('grainLabel')}: ${filters.grain}`}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        const slider = e.currentTarget.parentElement?.querySelector('input[type="range"]') as HTMLInputElement;
                        if (slider) slider.style.opacity = '1';
                      }}
                    >
                      ✨
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      step="1" 
                      value={filters.grain} 
                      onChange={(e) => setFilters({ ...filters, grain: parseInt(e.target.value) })} 
                      className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-gradient-to-r from-slate-700 via-blue-700/50 to-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation"
                      style={{ zIndex: 50, touchAction: 'none' }}
                      onTouchStart={(e) => e.stopPropagation()}
                    />
                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[10px] text-white/70 opacity-100 md:opacity-0 md:group-hover:opacity-100 whitespace-nowrap">{filters.grain}</span>
                  </div>
                </div>
                
                {/* На ПК: обычные фильтры с подписями */}
                <div className="hidden md:flex items-center gap-2 sm:gap-3 flex-wrap">
                  <label className="text-xs sm:text-sm font-black text-white/90 flex items-center gap-1 sm:gap-2 uppercase tracking-widest whitespace-nowrap">
                    <span className="text-base sm:text-lg">🎬</span>
                    <span className="hidden sm:inline">{t('filters')}:</span>
                  </label>
                  
                  {/* Компактные фильтры */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap flex-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] sm:text-xs text-white/70 whitespace-nowrap font-bold">{t('blurLabel')}:</span>
                      <input type="range" min="0" max="10" step="0.5" value={filters.blur} onChange={(e) => setFilters({ ...filters, blur: parseFloat(e.target.value) })} className="w-16 sm:w-20 h-1.5 sm:h-2 bg-gradient-to-r from-slate-700 via-blue-700/50 to-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                      <span className="text-[10px] text-white/60 w-6">{filters.blur}</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] sm:text-xs text-white/70 whitespace-nowrap font-bold">{t('contrastLabel')}:</span>
                      <input type="range" min="0" max="200" step="5" value={filters.contrast} onChange={(e) => setFilters({ ...filters, contrast: parseInt(e.target.value) })} className="w-16 sm:w-20 h-1.5 sm:h-2 bg-gradient-to-r from-slate-700 via-blue-700/50 to-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                      <span className="text-[10px] text-white/60 w-8">{filters.contrast}%</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] sm:text-xs text-white/70 whitespace-nowrap font-bold">{t('saturationLabel')}:</span>
                      <input type="range" min="0" max="200" step="5" value={filters.saturation} onChange={(e) => setFilters({ ...filters, saturation: parseInt(e.target.value) })} className="w-16 sm:w-20 h-1.5 sm:h-2 bg-gradient-to-r from-slate-700 via-blue-700/50 to-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                      <span className="text-[10px] text-white/60 w-8">{filters.saturation}%</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] sm:text-xs text-white/70 whitespace-nowrap font-bold">{t('vignetteLabel')}:</span>
                      <input type="range" min="0" max="100" step="5" value={filters.vignette} onChange={(e) => setFilters({ ...filters, vignette: parseInt(e.target.value) })} className="w-16 sm:w-20 h-1.5 sm:h-2 bg-gradient-to-r from-slate-700 via-blue-700/50 to-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                      <span className="text-[10px] text-white/60 w-6">{filters.vignette}</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] sm:text-xs text-white/70 whitespace-nowrap font-bold">{t('grainLabel')}:</span>
                      <input type="range" min="0" max="50" step="1" value={filters.grain} onChange={(e) => setFilters({ ...filters, grain: parseInt(e.target.value) })} className="w-16 sm:w-20 h-1.5 sm:h-2 bg-gradient-to-r from-slate-700 via-blue-700/50 to-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                      <span className="text-[10px] text-white/60 w-6">{filters.grain}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas редактор */}
            <div 
              data-canvas-editor="true"
              className="bg-slate-800/90 backdrop-blur-md rounded-xl p-2 sm:p-3 shadow-2xl border-2 border-white/20 ring-2 ring-white/10 w-full max-w-[280px] sm:max-w-[340px] md:max-w-md lg:max-w-none mx-auto flex flex-col" 
              style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)' }}
              onClick={(e) => { e.stopPropagation(); }}
              onMouseDown={(e) => { e.stopPropagation(); }}
            >
              <h2 className="text-sm sm:text-base md:text-lg font-black mb-1 bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent text-center uppercase tracking-widest">
                🎨 {t('editor')}
              </h2>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] text-white/80 mb-1 sm:mb-2 font-black text-center uppercase tracking-wider">
                {t('drawWithMouse')}
              </p>
              <div 
                data-canvas-wrapper="true"
                onClick={(e) => { 
                  // НЕ блокируем клики на input элементы (например, color picker)
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'INPUT' || target.closest('input')) {
                    return; // Разрешаем клики на input
                  }
                  e.stopPropagation();
                }}
                onMouseDown={(e) => { 
                  // НЕ блокируем клики на input элементы
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'INPUT' || target.closest('input')) {
                    return; // Разрешаем клики на input
                  }
                  e.stopPropagation();
                }}
                onTouchStart={(e) => { 
                  // НЕ блокируем клики на input элементы
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'INPUT' || target.closest('input')) {
                    return; // Разрешаем клики на input
                  }
                  e.stopPropagation();
                }}
              >
                <CanvasEditor
                  shape={shape}
                  color={color}
                  pattern={pattern}
                  ballSize={ballSize}
                  surfaceType={surfaceType}
                  effects={effects}
                  filters={filters}
                  secondColor={secondColor || undefined}
                  language={language}
                  t={t}
                  onImageChange={(dataUrl) => {
                    setCanvasImageData(dataUrl);
                    // Конвертируем dataUrl в File для сохранения
                    fetch(dataUrl)
                      .then(res => res.blob())
                      .then(blob => {
                        const file = new File([blob], 'toy.png', { type: 'image/png' });
                        setImageFile(file);
                      });
                  }}
                />
              </div>
              
              {/* Кнопки действий - очень большой отступ на мобильных для безопасного расстояния от UNDO/REDO */}
              <div 
                className="mt-10 sm:mt-4 flex flex-col sm:flex-row gap-6 sm:gap-2"
                data-action-buttons="true"
                onClick={(e) => { 
                  // НЕ обрабатываем клики на кнопки UNDO/REDO
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-undo-button]') || target.closest('[data-redo-button]')) {
                    return;
                  }
                  e.stopPropagation(); 
                }}
                onMouseDown={(e) => { 
                  // НЕ обрабатываем клики на кнопки UNDO/REDO
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-undo-button]') || target.closest('[data-redo-button]')) {
                    return;
                  }
                  e.stopPropagation(); 
                }}
                onTouchStart={(e) => { 
                  // НЕ обрабатываем клики на кнопки UNDO/REDO
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-undo-button]') || target.closest('[data-redo-button]')) {
                    return;
                  }
                  e.stopPropagation(); 
                }}
              >
                {/* Волшебная палочка */}
                <div className="relative group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      // НЕ обрабатываем, если клик был на UNDO/REDO
                      const target = e.target as HTMLElement;
                      if (target.closest('[data-undo-button]') || target.closest('[data-redo-button]')) {
                        return;
                      }
                      if (!wishText.trim()) {
                        setMobileTab('wish');
                        return;
                      }
                      setShowMagicTransformation(true);
                    }}
                    disabled={!wishText.trim()}
                    className={`flex-1 py-2.5 sm:py-3.5 px-3 sm:px-5 rounded-lg font-black text-white transition-all transform shadow-lg text-sm sm:text-base uppercase tracking-widest touch-manipulation w-full ${
                      !wishText.trim()
                        ? 'bg-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 hover:from-purple-700 hover:via-pink-700 hover:to-yellow-700 hover:scale-105 hover:shadow-xl'
                    }`}
                  >
                    {t('magicWand')}
                  </button>
                  {!wishText.trim() && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-red-600/95 backdrop-blur-md rounded-lg p-3 border-2 border-red-400 shadow-xl z-50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity">
                      <p className="text-white text-xs font-bold mb-2">{t('addWishFirst')}</p>
                      <button
                        onClick={() => setMobileTab('wish')}
                        className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors pointer-events-auto"
                      >
                        {t('goToWishTab')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Кнопка сохранения */}
                <div className="relative group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      // НЕ обрабатываем, если клик был на UNDO/REDO
                      const target = e.target as HTMLElement;
                      if (target.closest('[data-undo-button]') || target.closest('[data-redo-button]')) {
                        return;
                      }
                      if (!wishText.trim()) {
                        setMobileTab('wish');
                        return;
                      }
                      handleSave();
                    }}
                    disabled={isSaving || !wishText.trim()}
                    className={`flex-1 py-2.5 sm:py-3.5 px-3 sm:px-5 rounded-lg font-black text-white transition-all transform shadow-lg text-sm sm:text-base uppercase tracking-widest touch-manipulation w-full ${
                      isSaving || !wishText.trim()
                        ? 'bg-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 hover:from-emerald-700 hover:via-blue-700 hover:to-purple-700 hover:scale-105 hover:shadow-xl'
                    }`}
                  >
                    {isSaving ? t('saving') : t('hangOnTree')}
                  </button>
                  {!wishText.trim() && !isSaving && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-red-600/95 backdrop-blur-md rounded-lg p-3 border-2 border-red-400 shadow-xl z-50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity">
                      <p className="text-white text-xs font-bold mb-2">{t('addWishFirst')}</p>
                      <button
                        onClick={() => setMobileTab('wish')}
                        className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors pointer-events-auto"
                      >
                        {t('goToWishTab')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Правая панель: Желания, Фото (скрыта на мобильных, показывается через вкладку желания) */}
          <div className={`flex flex-col gap-1.5 w-full lg:w-[240px] order-4 lg:order-3 ${mobileTab === 'wish' ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-slate-800/90 backdrop-blur-md rounded-xl p-2 sm:p-2.5 shadow-xl border-2 border-white/20 space-y-1.5 flex-1 flex flex-col overflow-y-auto max-h-[calc(100vh-250px)] sm:max-h-[500px] lg:max-h-none" style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)' }}>
              {/* Желание */}
              <div>
                <label className="block text-[10px] font-black text-white/90 mb-1 flex items-center gap-1 uppercase tracking-widest">
                  <span className="text-sm">💫</span>
                  {t('wishLabel')} <span className="text-red-500">*</span>
                </label>
                <div className="text-[8px] text-white/50 mb-0.5 italic">
                  {t('wishHint')}
                </div>
                <textarea
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                  maxLength={200}
                  rows={6}
                  className="w-full p-1.5 border-4 border-pink-500/50 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 bg-gradient-to-br from-slate-700/60 via-pink-900/15 to-slate-700/60 text-white/90 placeholder:text-white/50 text-[10px]"
                  placeholder={t('wishPlaceholder')}
                />
                <div className="text-[9px] text-white/60 mt-0.5 text-right">
                  {wishText.length}/200
                </div>
              </div>

              {/* Пожелание */}
              <div>
                <label className="block text-[10px] font-black text-white/90 mb-1 flex items-center gap-1 uppercase tracking-widest">
                  <span className="text-sm">🌍</span>
                  {t('wishForOthersLabel')}
                </label>
                <textarea
                  value={wishForOthers}
                  onChange={(e) => setWishForOthers(e.target.value)}
                  maxLength={200}
                  rows={2}
                  className="w-full p-1.5 border-2 border-teal-500/40 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-gradient-to-br from-slate-700/60 via-teal-900/15 to-slate-700/60 text-white/90 placeholder:text-white/50 text-[10px]"
                  placeholder={t('wishForOthersPlaceholder')}
                />
                <div className="text-[9px] text-white/60 mt-0.5 text-right">
                  {wishForOthers.length}/200
                </div>
              </div>

              {/* Фото пользователя */}
              <div>
                <label 
                  className="block text-[10px] font-black text-white/90 mb-1 flex items-center gap-1 uppercase tracking-widest cursor-help relative group"
                >
                  <span className="text-sm">📸</span>
                  {t('photo')}
                  {userPhotoFile && (
                    <span className="ml-1 text-green-600 text-[9px]">✓</span>
                  )}
                  {/* Тултип */}
                  <div className="absolute left-0 top-full mt-1 w-[200px] bg-slate-900/95 backdrop-blur-md rounded-lg p-2 border-2 border-white/30 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="text-[9px] font-bold text-white/90 mb-1">
                      {t('photoTooltip')}
                    </div>
                    <div className="text-[7px] text-white/60 italic">
                      {t('photoTooltipDetail')}
                    </div>
                  </div>
                </label>
                <div className="text-[8px] text-white/50 mb-1 italic">
                  {t('photoHint')}
                </div>
                <input
                  ref={userPhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUserPhotoChange}
                  className="hidden"
                />
                <div
                  onDragOver={handleDragOverPhoto}
                  onDragLeave={handleDragLeavePhoto}
                  onDrop={handleDropPhoto}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingPhoto(true);
                  }}
                  className={`w-full p-1.5 border-2 border-dashed rounded-lg transition-all cursor-pointer h-[45px] flex items-center justify-center ${
                    isDraggingPhoto
                      ? 'border-blue-400 bg-blue-500/20 scale-105'
                      : userPhotoPreview
                      ? 'border-green-400/50 bg-green-500/10 hover:border-green-400'
                      : 'border-white/30 bg-slate-700/30 hover:border-blue-400'
                  }`}
                  onClick={() => {
                    if (!isDraggingPhoto) {
                      userPhotoInputRef.current?.click();
                    }
                  }}
                >
                  {userPhotoPreview ? (
                    <p className="text-[9px] text-center text-white/60 font-black uppercase tracking-wider">
                      {t('changePhoto')}
                    </p>
                  ) : (
                    <p className="text-[9px] text-white/70 text-center font-black uppercase tracking-wider">
                      {isDraggingPhoto ? t('release') : t('uploadPhoto')}
                    </p>
                  )}
                </div>
              </div>

              {/* Кнопки действий на вкладке Желание (только на мобильных) */}
              <div className="lg:hidden pt-3 border-t border-white/20 space-y-2 mb-3">
                {/* Волшебная палочка */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (!wishText.trim()) {
                      return;
                    }
                    setShowMagicTransformation(true);
                  }}
                  disabled={!wishText.trim()}
                  className={`w-full py-3 px-4 rounded-lg font-black text-white transition-all transform shadow-lg text-sm uppercase tracking-widest touch-manipulation ${
                    !wishText.trim()
                      ? 'bg-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 hover:from-purple-700 hover:via-pink-700 hover:to-yellow-700 active:scale-95 hover:shadow-xl'
                  }`}
                >
                  {t('magicWand')}
                </button>

                {/* Повесить на ёлку */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (!wishText.trim()) {
                      return;
                    }
                    handleSave();
                  }}
                  disabled={isSaving || !wishText.trim()}
                  className={`w-full py-3 px-4 rounded-lg font-black text-white transition-all transform shadow-lg text-sm uppercase tracking-widest touch-manipulation ${
                    isSaving || !wishText.trim()
                      ? 'bg-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 hover:from-emerald-700 hover:via-blue-700 hover:to-purple-700 active:scale-95 hover:shadow-xl'
                  }`}
                >
                  {isSaving ? t('saving') : t('hangOnTree')}
                </button>
              </div>

              {/* Статистические данные */}
              <div className="pt-1.5 border-t border-white/10">
                <div className="text-[7px] text-white/40 mb-1 italic text-center">
                  {t('statisticsNote')}
                </div>
                
                {/* Имя или никнейм */}
                <div className="mb-1">
                  <label className="block text-[9px] font-black text-white/80 mb-0.5 uppercase tracking-wider">
                    {t('nameOrNickname')}
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    maxLength={50}
                    className="w-full h-[45px] p-2 border-2 border-amber-500/40 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-gradient-to-br from-slate-700/60 via-amber-900/15 to-slate-700/60 text-white/90 placeholder:text-white/40 text-[10px]"
                    placeholder={t('optional')}
                  />
                </div>

                {/* Выбор страны */}
                <div className="mb-1">
                  <label className="block text-[9px] font-black text-white/80 mb-0.5 uppercase tracking-wider">
                    {t('selectCountry')}
                  </label>
                  <div className="relative" ref={countryDropdownRef}>
                    <button
                      ref={countryButtonRef}
                      type="button"
                      onClick={handleCountryDropdownToggle}
                      className="w-full h-[45px] p-2 border-2 border-emerald-500/40 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-gradient-to-br from-slate-700/60 via-emerald-900/15 to-slate-700/60 text-white/90 text-[10px] flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        {selectedCountry ? (
                          <>
                            <span 
                              className="text-2xl leading-none flex-shrink-0 inline-block" 
                              role="img"
                              aria-label={COUNTRIES.find(c => c.code === selectedCountry)?.name || ''}
                            >
                              {selectedCountry ? getFlagEmoji(selectedCountry) : (COUNTRIES.find(c => c.code === selectedCountry)?.flag || '🏳️')}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-white/90">{COUNTRIES.find(c => c.code === selectedCountry)?.nativeName}</span>
                              <span className="text-[8px] text-white/50">{getCountryName(selectedCountry, language)}</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-white/60">{t('optional')}</span>
                        )}
                      </span>
                      <span className="text-white/60">▼</span>
                    </button>
                    {showCountryDropdown && (
                      <div 
                        className={`absolute z-50 w-full max-h-[200px] overflow-y-auto bg-slate-800/95 backdrop-blur-md rounded-lg border-2 border-emerald-500/40 shadow-xl ${
                          countryDropdownUp ? 'bottom-full mb-1' : 'top-full mt-1'
                        }`}
                      >
                        {COUNTRIES.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(country.code);
                              setShowCountryDropdown(false);
                            }}
                            className={`w-full p-2 text-left text-[10px] flex items-center gap-2 hover:bg-emerald-500/20 transition-colors ${
                              selectedCountry === country.code ? 'bg-emerald-500/30' : ''
                            }`}
                          >
                            <span 
                              className="text-xl leading-none flex-shrink-0 inline-block min-w-[24px] text-center" 
                              role="img"
                              aria-label={country.name}
                            >
                              {country.code ? getFlagEmoji(country.code) : (country.flag || '🌍')}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-white/90">{country.nativeName}</span>
                              <span className="text-[8px] text-white/50">{getCountryName(country.code, language)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Год рождения */}
                <div>
                  <label className="block text-[9px] font-black text-white/80 mb-0.5 uppercase tracking-wider">
                    {t('yourAge')}
                  </label>
                  <select
                    value={birthYear || ''}
                    onChange={(e) => setBirthYear(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full h-[45px] p-2 border-2 border-violet-500/40 rounded-lg focus:ring-2 focus:ring-violet-400 focus:border-violet-400 bg-gradient-to-br from-slate-700/60 via-violet-900/15 to-slate-700/60 text-white/90 text-[10px]"
                  >
                    <option value="" className="bg-slate-800 text-white">{t('optional')}</option>
                    {BIRTH_YEARS.map((year) => (
                      <option key={year} value={year} className="bg-slate-800 text-white">
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>

        </div>
        
        {/* Подпись внизу страницы */}
        <div className="text-center mt-6">
          <p className="text-white/90 text-xl font-medium drop-shadow-lg">{t('footerText')}</p>
        </div>
      </div>
      </div>

      {/* Модальное окно магического превращения */}
      {showMagicTransformation && (
        <MagicTransformation
          color={color}
          pattern={pattern}
          wishText={wishText}
          wishForOthers={wishForOthers}
          imageDataUrl={canvasImageData}
          ballSize={ballSize}
          surfaceType={surfaceType}
          effects={effects}
          onComplete={() => {
            setShowMagicTransformation(false);
          }}
          onClose={() => {
            setShowMagicTransformation(false);
          }}
        />
      )}
    </div>
  );
}

