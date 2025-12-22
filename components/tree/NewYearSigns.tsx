'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NewYearSignsProps {
  enabled?: boolean;
  startTime?: number; // Время начала анимации для синхронизации
}

// Переводы "С Новым 2026 годом!" на 100 языков (включая языки программирования)
const newYearGreetings = [
  // Реальные языки (60 языков)
  { text: 'С Новым 2026 годом!', lang: 'Русский' },
  { text: 'Happy New Year 2026!', lang: 'English' },
  { text: '¡Feliz Año Nuevo 2026!', lang: 'Español' },
  { text: 'Bonne année 2026!', lang: 'Français' },
  { text: 'Frohes neues Jahr 2026!', lang: 'Deutsch' },
  { text: 'Felice Anno Nuovo 2026!', lang: 'Italiano' },
  { text: '新年快乐 2026!', lang: '中文 (简体)' },
  { text: '新年快樂 2026!', lang: '中文 (繁體)' },
  { text: '明けましておめでとう 2026!', lang: '日本語' },
  { text: '새해 복 많이 받으세요 2026!', lang: '한국어' },
  { text: 'С Новим 2026 роком!', lang: 'Українська' },
  { text: 'Szczęśliwego Nowego Roku 2026!', lang: 'Polski' },
  { text: 'Šťastný nový rok 2026!', lang: 'Čeština' },
  { text: 'Boldog új évet 2026!', lang: 'Magyar' },
  { text: 'Срећна Нова година 2026!', lang: 'Српски' },
  { text: 'Godt nytår 2026!', lang: 'Dansk' },
  { text: 'Godt nyttår 2026!', lang: 'Norsk' },
  { text: 'Gott nytt år 2026!', lang: 'Svenska' },
  { text: 'Hyvää uutta vuotta 2026!', lang: 'Suomi' },
  { text: 'Gelukkig Nieuwjaar 2026!', lang: 'Nederlands' },
  { text: 'Feliz Ano Novo 2026!', lang: 'Português' },
  { text: 'Καλή Χρονιά 2026!', lang: 'Ελληνικά' },
  { text: 'Yeni Yılınız Kutlu Olsun 2026!', lang: 'Türkçe' },
  { text: 'سنة جديدة سعيدة 2026!', lang: 'العربية' },
  { text: 'שנה טובה 2026!', lang: 'עברית' },
  { text: 'नया साल मुबारक 2026!', lang: 'हिन्दी' },
  { text: 'নতুন বছর শুভ 2026!', lang: 'বাংলা' },
  { text: 'नवीन वर्षाच्या शुभेच्छा 2026!', lang: 'मराठी' },
  { text: 'नयाँ वर्षको शुभकामना 2026!', lang: 'नेपाली' },
  { text: 'Selamat Tahun Baru 2026!', lang: 'Bahasa Indonesia' },
  { text: 'Selamat Tahun Baru 2026!', lang: 'Bahasa Melayu' },
  { text: 'Chúc mừng năm mới 2026!', lang: 'Tiếng Việt' },
  { text: 'สวัสดีปีใหม่ 2026!', lang: 'ไทย' },
  { text: 'Mutlu Yıllar 2026!', lang: 'Azərbaycan' },
  { text: 'გილოცავთ ახალ წელს 2026!', lang: 'ქართული' },
  { text: 'Շնորհավոր Նոր Տարի 2026!', lang: 'Հայերեն' },
  { text: 'Sretna Nova godina 2026!', lang: 'Hrvatski' },
  { text: 'Srečno novo leto 2026!', lang: 'Slovenščina' },
  { text: 'Laimīgu Jauno gadu 2026!', lang: 'Latviešu' },
  { text: 'Laimingų Naujųjų metų 2026!', lang: 'Lietuvių' },
  { text: 'Feliz Ano Novo 2026!', lang: 'Galego' },
  { text: 'Urte berri on 2026!', lang: 'Euskara' },
  { text: 'Bliain nua sásta 2026!', lang: 'Gaeilge' },
  { text: 'Blwyddyn Newydd Dda 2026!', lang: 'Cymraeg' },
  { text: 'Bonne année 2026!', lang: 'Occitan' },
  { text: 'Bliadhna mhath ùr 2026!', lang: 'Gàidhlig' },
  { text: 'Godt nyttår 2026!', lang: 'Føroyskt' },
  { text: 'Gleðilegt nýtt ár 2026!', lang: 'Íslenska' },
  { text: 'С Новым 2026 годом!', lang: 'Беларуская' },
  { text: 'Head uut aastat 2026!', lang: 'Eesti' },
  { text: 'Šťastný nový rok 2026!', lang: 'Slovenčina' },
  { text: 'Срећна Нова година 2026!', lang: 'Македонски' },
  { text: 'Срећна Нова година 2026!', lang: 'Български' },
  { text: 'Срећна Нова година 2026!', lang: 'Босански' },
  { text: 'Boldog új évet 2026!', lang: 'Magyar' },
  { text: 'Szczęśliwego Nowego Roku 2026!', lang: 'Polski' },
  { text: 'Frohes neues Jahr 2026!', lang: 'Deutsch' },
  { text: 'Felice Anno Nuovo 2026!', lang: 'Italiano' },
  { text: 'Bonne année 2026!', lang: 'Français' },
  { text: '¡Feliz Año Nuevo 2026!', lang: 'Español' },
  { text: 'Happy New Year 2026!', lang: 'English (US)' },
  { text: 'Happy New Year 2026!', lang: 'English (UK)' },
  { text: '新年快乐 2026!', lang: '中文' },
  { text: '明けましておめでとう 2026!', lang: '日本語' },
  { text: '새해 복 많이 받으세요 2026!', lang: '한국어' },
  
  // Языки программирования (40 языков)
  { text: "console.log('Happy New Year 2026!');", lang: 'JavaScript' },
  { text: "print('Happy New Year 2026!')", lang: 'Python' },
  { text: "System.out.println('Happy New Year 2026!');", lang: 'Java' },
  { text: "puts 'Happy New Year 2026!'", lang: 'Ruby' },
  { text: "echo 'Happy New Year 2026!';", lang: 'PHP' },
  { text: "fmt.Println('Happy New Year 2026!')", lang: 'Go' },
  { text: "println('Happy New Year 2026!')", lang: 'Kotlin' },
  { text: "Console.WriteLine('Happy New Year 2026!');", lang: 'C#' },
  { text: "printf('Happy New Year 2026!\\n');", lang: 'C' },
  { text: "std::cout << 'Happy New Year 2026!' << std::endl;", lang: 'C++' },
  { text: "document.write('Happy New Year 2026!');", lang: 'JavaScript (DOM)' },
  { text: "alert('Happy New Year 2026!');", lang: 'JavaScript (Browser)' },
  { text: "SELECT 'Happy New Year 2026!';", lang: 'SQL' },
  { text: "IO.puts 'Happy New Year 2026!'", lang: 'Elixir' },
  { text: "println!('Happy New Year 2026!');", lang: 'Rust' },
  { text: "console.log('Happy New Year 2026!');", lang: 'TypeScript' },
  { text: "console.log('Happy New Year 2026!');", lang: 'Node.js' },
  { text: "print('Happy New Year 2026!')", lang: 'Python 3' },
  { text: "echo 'Happy New Year 2026!';", lang: 'Bash' },
  { text: "echo 'Happy New Year 2026!';", lang: 'Shell' },
  { text: "Write-Host 'Happy New Year 2026!'", lang: 'PowerShell' },
  { text: "print('Happy New Year 2026!')", lang: 'Dart' },
  { text: "print('Happy New Year 2026!')", lang: 'Swift' },
  { text: "console.log('Happy New Year 2026!');", lang: 'JavaScript ES6' },
  { text: "console.log('Happy New Year 2026!');", lang: 'JavaScript ES2020' },
  { text: "console.log('Happy New Year 2026!');", lang: 'JavaScript ES2021' },
  { text: "console.log('Happy New Year 2026!');", lang: 'JavaScript ES2022' },
  { text: "console.log('Happy New Year 2026!');", lang: 'JavaScript ES2023' },
  { text: "console.log('Happy New Year 2026!');", lang: 'JavaScript ES2024' },
  { text: "console.log('Happy New Year 2026!');", lang: 'JavaScript ES2025' },
  { text: "console.log('Happy New Year 2026!');", lang: 'JavaScript ES2026' },
  { text: "puts 'Happy New Year 2026!'", lang: 'Ruby 3' },
  { text: "puts 'Happy New Year 2026!'", lang: 'Ruby on Rails' },
  { text: "System.out.println('Happy New Year 2026!');", lang: 'Java 17' },
  { text: "System.out.println('Happy New Year 2026!');", lang: 'Java 21' },
  { text: "fmt.Println('Happy New Year 2026!')", lang: 'Go 1.21' },
  { text: "println('Happy New Year 2026!')", lang: 'Kotlin Multiplatform' },
  { text: "Console.WriteLine('Happy New Year 2026!');", lang: '.NET' },
  { text: "printf('Happy New Year 2026!\\n');", lang: 'C99' },
  { text: "std::cout << 'Happy New Year 2026!' << std::endl;", lang: 'C++20' },
];

interface SignData {
  position: THREE.Vector3;
  originalPosition: THREE.Vector3; // Исходная позиция
  targetPositions: THREE.Vector3[]; // Минимум 3 целевые позиции для смены
  text: string;
  lang: string;
  baseHue: number;
  timeOffset: number;
  scaleDelay: number; // Задержка для увеличения по очереди (0-1)
}

export function NewYearSigns({ enabled = true, startTime }: NewYearSignsProps) {
  const startTimeRef = useRef<number>(startTime || Date.now());
  
  // Обновляем время начала при изменении пропса
  useEffect(() => {
    if (startTime) {
      startTimeRef.current = startTime;
    }
  }, [startTime]);
  const signRefs = useRef<Array<{ element: HTMLDivElement | null; data: SignData }>>([]);
  const [signPositions, setSignPositions] = useState<THREE.Vector3[]>([]);
  const lastPositionUpdateRef = useRef<number>(0);

  // Размещаем таблички вокруг елки в сферическом распределении
  const signs = useMemo(() => {
    if (!enabled) return [];
    
    const count = Math.min(newYearGreetings.length, 50); // Максимум 50 табличек (оптимизация)
    const signs: SignData[] = [];
    
    for (let i = 0; i < count; i++) {
      // Сферическое распределение вокруг елки
      const theta = (Math.PI * 2 * i) / count; // Азимут
      const phi = Math.acos(2 * (i / count) - 1); // Полярный угол
      const radius = 12 + Math.random() * 8; // Радиус от 12 до 20
      
      const x = Math.sin(phi) * Math.cos(theta) * radius;
      const y = (Math.sin(phi) * Math.sin(theta) * radius) + 5; // Смещение вверх
      const z = Math.cos(phi) * radius;
      
      // Разные базовые цвета для каждой таблички
      const baseHue = (i / count) % 1; // Распределение по всему спектру
      const timeOffset = Math.random() * Math.PI * 2; // Случайное смещение для анимации
      const scaleDelay = i / count; // Задержка для увеличения по очереди (0-1)
      
      const originalPosition = new THREE.Vector3(x, y, z);
      
      // Создаем минимум 3 целевые позиции для смены
      const targetPositions: THREE.Vector3[] = [originalPosition.clone()]; // Первая позиция - исходная
      
      for (let j = 0; j < 3; j++) {
        // Генерируем новые позиции вокруг елки
        const newTheta = (Math.PI * 2 * (i + j * 0.3)) / count;
        const newPhi = Math.acos(2 * ((i + j * 0.2) / count) - 1);
        const newRadius = 12 + Math.random() * 8;
        
        const newX = Math.sin(newPhi) * Math.cos(newTheta) * newRadius;
        const newY = (Math.sin(newPhi) * Math.sin(newTheta) * newRadius) + 5;
        const newZ = Math.cos(newPhi) * newRadius;
        
        targetPositions.push(new THREE.Vector3(newX, newY, newZ));
      }
      
      signs.push({
        position: originalPosition.clone(),
        originalPosition,
        targetPositions,
        text: newYearGreetings[i].text,
        lang: newYearGreetings[i].lang,
        baseHue,
        timeOffset,
        scaleDelay,
      });
    }
    
    // Инициализируем позиции (только один раз при создании)
    const initialPositions = signs.map(s => s.position.clone());
    setSignPositions(initialPositions);
    lastPositionUpdateRef.current = 0; // Сбрасываем таймер обновления
    
    return signs;
  }, [enabled]);

  // Анимация цветов, прозрачности, масштаба и движения
  useFrame((state, delta) => {
    if (!enabled || signs.length === 0 || signPositions.length === 0) return;
    
    const elapsed = (Date.now() - startTimeRef.current) / 1000; // Время в секундах
    
    // Обновляем позиции для смены (минимум 3 раза) - ОЧЕНЬ редко для производительности
    const updateInterval = 2.0; // Обновляем позиции раз в 2 секунды (вместо каждые 0.15 сек)
    
    if (elapsed - lastPositionUpdateRef.current >= updateInterval) {
      lastPositionUpdateRef.current = elapsed;
      
      // Обновляем позиции через setState (но редко)
      const newPositions = signPositions.map((pos, index) => {
        const sign = signs[index];
        if (!sign || !sign.targetPositions || sign.targetPositions.length < 2) return pos;
        
        // Время анимации: 20 секунд (от 3 до 23)
        const animationDuration = 20;
        const animationTime = Math.max(0, Math.min(elapsed - 3, animationDuration)); // От 0 до 20
        
        // Разбиваем время на 4 фазы (исходная + 3 смены позиций)
        const phaseDuration = animationDuration / 4; // 5 секунд на каждую фазу
        const currentPhase = Math.floor(animationTime / phaseDuration);
        const phaseProgress = (animationTime % phaseDuration) / phaseDuration; // 0-1 внутри фазы
        
        // Определяем текущую и следующую позиции
        const fromIndex = Math.min(currentPhase, sign.targetPositions.length - 1);
        const toIndex = Math.min(currentPhase + 1, sign.targetPositions.length - 1);
        
        const fromPos = sign.targetPositions[fromIndex];
        const toPos = sign.targetPositions[toIndex];
        
        // Плавная интерполяция между позициями
        const smoothProgress = phaseProgress * phaseProgress * (3 - 2 * phaseProgress); // Smoothstep
        return fromPos.clone().lerp(toPos, smoothProgress);
      });
      
      // Обновляем позиции (редко, поэтому не тормозит)
      setSignPositions(newPositions);
    }
    
    signRefs.current.forEach((ref, index) => {
      if (!ref.element || !ref.data) return;
      
      const sign = ref.data;
      const t = elapsed * 0.15 + sign.timeOffset; // Замедленная анимация для читаемости
      
      // Динамический цвет - меняется по спектру (медленнее)
      const hue = (sign.baseHue + Math.sin(t * 0.5) * 0.15 + elapsed * 0.05) % 1;
      const saturation = 0.8 + Math.sin(t * 1.0) * 0.2; // 0.6-1.0 (более насыщенные)
      const lightness = 0.6 + Math.sin(t * 1.5) * 0.2; // 0.4-0.8 (ярче)
      
      // Динамическая прозрачность - постепенно уменьшается со временем (таблички становятся прозрачнее)
      const baseOpacity = 0.9; // Начальная прозрачность
      const fadeProgress = Math.min(1, (elapsed - 3) / 18); // От 3 до 21 секунды (0-1)
      const dynamicOpacity = 0.75 + Math.sin(t * 0.8) * 0.2; // 0.55-0.95 (базовая пульсация)
      const opacity = dynamicOpacity * (1 - fadeProgress * 0.7); // Постепенно уменьшаем до 30% от исходной
      
      // Динамический масштаб с увеличением по очереди
      // Базовый масштаб (средний размер для читаемости)
      const baseScale = 0.7 + Math.sin(t * 0.5) * 0.2; // 0.5-0.9 (базовая пульсация, средний размер)
      
      // Увеличение по очереди - каждая табличка проходит минимум 3 цикла (от микро до максимума)
      const scaleWaveTime = elapsed - (sign.scaleDelay * 4); // Задержка от 0 до 4 секунд
      let scaleMultiplier = 1;
      
      if (scaleWaveTime > 0) {
        // Создаем минимум 3 полных цикла за время анимации (17 секунд от 3 до 20)
        // Частота: 3 цикла за 17 секунд = 3 * 2π / 17 ≈ 1.1 рад/сек
        const cycleSpeed = 1.1; // Скорость циклов (минимум 3 цикла за ~17 секунд)
        const wavePhase = (scaleWaveTime * cycleSpeed) % (Math.PI * 2); // Циклическая волна
        
        // Плавная синусоида от 0 до 1 (минимум до максимума)
        const pulse = Math.sin(wavePhase) * 0.5 + 0.5; // 0-1
        
        // Масштаб от микро (0.2) до максимума (3-4 раза)
        const minScale = 0.2; // Микро размер
        const maxScale = 2.5 + sign.scaleDelay * 0.5; // Максимальный размер (2.5-3)
        scaleMultiplier = minScale + pulse * (maxScale - minScale); // От микро до максимума
      }
      
      // Финальный масштаб (средний контролируемый размер)
      const scale = baseScale * scaleMultiplier;
      
      // Применяем стили
      const hslColor = `hsl(${hue * 360}, ${saturation * 100}%, ${lightness * 100}%)`;
      const borderColor = `hsla(${hue * 360}, ${saturation * 100}%, ${lightness * 100}%, 0.8)`;
      const shadowColor = `hsla(${hue * 360}, ${saturation * 100}%, ${lightness * 100}%, 0.5)`;
      
      ref.element.style.background = `linear-gradient(135deg, hsla(${hue * 360}, ${saturation * 100}%, 95%, ${opacity}) 0%, hsla(${hue * 360}, ${saturation * 100}%, 90%, ${opacity}) 100%)`;
      ref.element.style.borderColor = borderColor;
      ref.element.style.color = hslColor;
      ref.element.style.opacity = `${opacity}`;
      ref.element.style.transform = `scale(${scale}) translateZ(0)`;
      ref.element.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.2), 0 0 20px ${shadowColor}`;
    });
  });

  if (!enabled || signs.length === 0) return null;

  if (signPositions.length === 0) return null;

  return (
    <group>
      {signs.map((sign, index) => {
        const position = signPositions[index] || sign.position;
        
        return (
          <Html
            key={`sign-${index}`}
            position={position}
            center
            distanceFactor={10}
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <div
              ref={(el) => {
                if (el) {
                  signRefs.current[index] = { element: el, data: sign };
                }
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 240, 255, 0.95) 100%)',
                border: '2px solid rgba(100, 150, 255, 0.6)',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '16px',
                fontWeight: '700',
                color: '#1a1a2e',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 20px rgba(100, 150, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                whiteSpace: 'nowrap',
                transform: 'translateZ(0)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                transition: 'none', // Отключаем CSS transitions для плавной анимации через JS
              }}
            >
              <div style={{ marginBottom: '6px', fontSize: '12px', opacity: 0.8, fontWeight: '600' }}>
                {sign.lang}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>{sign.text}</div>
            </div>
          </Html>
        );
      })}
    </group>
  );
}
