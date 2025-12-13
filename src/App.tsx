import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Empty, EmptyHeader, EmptyMedia, EmptyDescription } from '@/components/ui/empty';
import { AlertCircle, LayoutGrid, Table, CheckCircle2, XCircle } from 'lucide-react';
import { PresetsGrid } from '@/components/PresetsGrid';
import { presets, Preset, DataItem } from '@/presets';
import Papa from 'papaparse';

// Fill mode type
type FillMode = 'cards' | 'table';

// Analysis result type (from Plugin)
interface AnalysisResult {
  matched: string[];
  unmatched: string[];
  totalLayers: number;
}

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const CUSTOM_FILE_PRESET_ID = 'custom-file'; // Special ID for user-uploaded files

/**
 * Parse CSV text into array of data items
 */
function parseCSVAll(text: string): DataItem[] {
  if (!text.trim()) {
    throw new Error('CSV файл пустой');
  }

  const result = Papa.parse<DataItem>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim()
  });

  if (result.errors.length > 0) {
    const firstError = result.errors[0];
    throw new Error(`Ошибка парсинга CSV (строка ${firstError.row ?? '?'}): ${firstError.message}`);
  }

  if (!result.data || result.data.length === 0) {
    throw new Error('CSV файл должен содержать заголовки и хотя бы одну строку данных');
  }

  const validData = result.data.filter(row => 
    Object.values(row).some(value => value !== '' && value !== null && value !== undefined)
  );

  if (validData.length === 0) {
    throw new Error('CSV файл не содержит данных (все строки пустые)');
  }

  return validData;
}

// File icon SVG component
const FileIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
    <path d="M23.3333 6.66663H15.3333C13.7862 6.66663 13.0126 6.66663 12.4053 6.93997C11.8719 7.18248 11.4358 7.61859 11.1933 8.15197C10.92 8.75925 10.92 9.53288 10.92 11.08V28.92C10.92 30.4671 10.92 31.2407 11.1933 31.848C11.4358 32.3814 11.8719 32.8175 12.4053 33.06C13.0126 33.3333 13.7862 33.3333 15.3333 33.3333H24.6667C26.2138 33.3333 26.9874 33.3333 27.5947 33.06C28.1281 32.8175 28.5642 32.3814 28.8067 31.848C29.08 31.2407 29.08 30.4671 29.08 28.92V14.6666M23.3333 6.66663L29.08 14.6666M23.3333 6.66663V14.6666H29.08" stroke="#949494" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 18.3333V25M20 25L23.3333 21.6666M20 25L16.6667 21.6666" stroke="#949494" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function App() {
  // Frame selection state
  const [frameSelected, setFrameSelected] = useState(false);
  const [_frameName, setFrameName] = useState<string>('');
  const [_frameCount, setFrameCount] = useState(0);
  
  // Data state
  const [currentData, setCurrentData] = useState<DataItem | null>(null);
  const [allData, setAllData] = useState<DataItem[] | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'preset' | 'file'>('preset');
  const [fileName, setFileName] = useState<string>('');
  
  // UI state
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });
  const [isDragging, setIsDragging] = useState(false);
  const [fillMode, setFillMode] = useState<FillMode>('cards');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Mapping preview state
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Detect Figma theme
  useEffect(() => {
    const checkTheme = () => {
      const darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    checkTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);
    
    return () => mediaQuery.removeEventListener('change', checkTheme);
  }, []);

  // Request mapping analysis when data or frame selection changes
  useEffect(() => {
    if (frameSelected && currentData) {
      const dataKeys = Object.keys(currentData);
      parent.postMessage({
        pluginMessage: {
          type: 'analyze-selection',
          dataKeys
        }
      }, 'https://www.figma.com');
    } else {
      setAnalysisResult(null);
    }
  }, [frameSelected, currentData]);

  const handlePresetSelect = useCallback((preset: Preset) => {
    setSelectedPresetId(preset.id);
    setAllData(preset.data);
    setCurrentData(preset.data[0] ?? null);
    setFileName('');
    setMessage({ type: null, text: '' });
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value as 'preset' | 'file');
    setSelectedPresetId(null);
    setAllData(null);
    setCurrentData(null);
    setFileName('');
    setMessage({ type: null, text: '' });
    setAnalysisResult(null);
  }, []);

  const handleFileUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setMessage({ type: 'error', text: `Файл слишком большой (максимум ${MAX_FILE_SIZE / 1024 / 1024}MB)` });
      return;
    }

    setSelectedPresetId(CUSTOM_FILE_PRESET_ID);
    setFileName(file.name);
    setMessage({ type: null, text: '' });

    try {
      const text = await file.text();

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            setMessage({ type: 'error', text: 'JSON массив пустой' });
            return;
          }
          setAllData(parsed);
          setCurrentData(parsed[0]);
        } else if (typeof parsed === 'object' && parsed !== null) {
          setAllData([parsed]);
          setCurrentData(parsed);
        } else {
          setMessage({ type: 'error', text: 'JSON должен содержать объект или массив объектов' });
          return;
        }
      } else if (file.name.endsWith('.csv')) {
        const parsedArray = parseCSVAll(text);
        if (parsedArray.length === 0) {
          setMessage({ type: 'error', text: 'CSV файл пустой или не содержит данных' });
          return;
        }
        setAllData(parsedArray);
        setCurrentData(parsedArray[0]);
      } else {
        setMessage({ type: 'error', text: 'Поддерживаются только файлы JSON и CSV' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage({ type: 'error', text: `Ошибка чтения файла: ${errorMessage}` });
    }
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  }, [processFile]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.json'))) {
      await processFile(file);
    } else {
      setMessage({ type: 'error', text: 'Поддерживаются только файлы CSV и JSON' });
    }
  }, [processFile]);

  const handleFill = useCallback(() => {
    if (currentData) {
      parent.postMessage({ 
        pluginMessage: { 
          type: 'fill-data', 
          data: currentData,
          allData: allData,
          fillMode: fillMode
        } 
      }, 'https://www.figma.com');
    }
  }, [currentData, allData, fillMode]);

  // Handle messages from plugin
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;
      
      if (msg.type === 'selection-changed') {
        setFrameSelected(msg.frameSelected);
        if (msg.frameSelected) {
          setFrameName(msg.frameName || '');
          setFrameCount(msg.frameCount || 1);
        } else {
          setFrameName('');
          setFrameCount(0);
          setAnalysisResult(null);
        }
      } else if (msg.type === 'analysis-result') {
        setAnalysisResult({
          matched: msg.matched,
          unmatched: msg.unmatched,
          totalLayers: msg.totalLayers
        });
      } else if (msg.type === 'error') {
        setMessage({ type: 'error', text: msg.message });
      } else if (msg.type === 'success') {
        setMessage({ type: null, text: '' });
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Request current selection state when UI is ready
    parent.postMessage({
      pluginMessage: { type: 'get-selection' }
    }, 'https://www.figma.com');
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const hasData = currentData !== null && allData !== null;
  
  const dataSourceLabel = useMemo(() => {
    if (fileName) return fileName;
    if (selectedPresetId && selectedPresetId !== CUSTOM_FILE_PRESET_ID && selectedCategory !== 'file') {
      const preset = presets.all.find(p => p.id === selectedPresetId);
      return preset?.name ?? null;
    }
    return null;
  }, [fileName, selectedPresetId, selectedCategory]);

  return (
    <div className="h-screen w-full bg-background flex flex-col relative overflow-hidden">
      <Card className="flex-1 flex flex-col shadow-none border-0 rounded-none py-0 gap-0 min-h-0">
        <CardContent className={`flex-1 p-0 overflow-y-auto min-h-0 ${frameSelected ? 'pb-24' : ''}`}>
          {/* Header */}
          <div className="p-4 pb-3 space-y-4">
            <div className="space-y-2">
              <h2 className="text-[14px] font-medium leading-[18px] text-foreground">
                {frameSelected ? 'Выберите пресет или загрузите файл' : 'Выберите фрейм для заполнения'}
              </h2>
              <p className="text-[13px] leading-[17px] text-[#666666] dark:text-[#A7A7A7]">
                {frameSelected 
                  ? 'Заполните макеты тестовыми данными в один клик' 
                  : 'Заполните макеты реалистичными данными в один клик'}
              </p>
            </div>
            
            {/* Selection Area - shown when no frame selected */}
            {!frameSelected && (
              <div className="bg-selection-bg rounded-xl flex flex-col items-center justify-center gap-3 border-2 border-transparent transition-all" style={{ minHeight: 'calc(100vh - 111px)' }}>
                <FileIcon />
                <p className="text-[14px] leading-[18px] text-[#6A6868] dark:text-[#A7A7A7] text-center">
                  Выберите фрейм для заполнения
                </p>
              </div>
            )}
            
            {/* Tabs - shown when frame is selected */}
            {frameSelected && (
              <Tabs 
                value={selectedCategory} 
                onValueChange={handleCategoryChange}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="preset" className="flex-1">Пресеты</TabsTrigger>
                  <TabsTrigger value="file" className="flex-1">JSON/CSV</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
          
          {frameSelected && selectedCategory === 'preset' && (
            <PresetsGrid
              presets={presets.all}
              selectedPresetId={selectedPresetId}
              onPresetSelect={handlePresetSelect}
            />
          )}

          {frameSelected && selectedCategory === 'file' && (
            <div className="px-4 pb-4">
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Empty 
                  role="button"
                  tabIndex={0}
                  aria-label="Загрузить CSV или JSON файл"
                  onClick={handleFileUploadClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleFileUploadClick();
                    }
                  }}
                  className={`
                    border-2 rounded-xl py-12 min-h-[338px]
                    transition-all duration-200 cursor-pointer
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                    ${isDragging 
                      ? 'border-primary scale-[0.99]' 
                      : 'border-transparent hover:border-primary/30'
                    }
                    ${selectedPresetId === CUSTOM_FILE_PRESET_ID ? 'border-primary' : ''}
                  `}
                >
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileIcon />
                    </EmptyMedia>
                    <EmptyDescription>
                      {isDragging ? 'Отпустите файл' : 'Перетащите CSV или JSON файл сюда или нажмите для выбора'}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
                <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Названия полей в файле должны совпадать с именами слоёв в Figma. Например, если в макете есть текстовый слой <code className="text-foreground font-medium px-1 py-0.5 bg-muted rounded text-[11px]">title</code>, в файле тоже должно быть поле <code className="text-foreground font-medium px-1 py-0.5 bg-muted rounded text-[11px]">title</code>.
                  </p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Плагин подставит данные только в те слои, для которых найдёт одноимённые поля.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Data Preview Section with Mapping Analysis */}
          {frameSelected && hasData && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium leading-[18px]">
                  {dataSourceLabel || 'Данные загружены'}
                </h2>
                {allData && (
                  <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-muted rounded-md">
                    {allData.length} {allData.length === 1 ? 'запись' : 'записей'}
                  </span>
                )}
              </div>
              
              {/* Mapping Preview */}
              {analysisResult && (
                <div className="rounded-lg border bg-selection-bg p-3 space-y-2">
                  {/* Matched fields */}
                  {analysisResult.matched.length > 0 && (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground">
                          Будут заполнены ({analysisResult.matched.length})
                        </p>
                        <p className="text-[12px] text-muted-foreground truncate">
                          {analysisResult.matched.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Unmatched fields */}
                  {analysisResult.unmatched.length > 0 && (
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-muted-foreground">
                          Нет слоёв ({analysisResult.unmatched.length})
                        </p>
                        <p className="text-[12px] text-muted-foreground truncate">
                          {analysisResult.unmatched.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Warning if nothing will be filled */}
                  {analysisResult.matched.length === 0 && (
                    <p className="text-[12px] text-destructive">
                      Ни одно поле не совпадает с именами слоёв. Проверьте именование.
                    </p>
                  )}
                </div>
              )}

              {/* Messages */}
              {message.type === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fixed Footer - Action buttons (animated) */}
      <div 
        className={`fixed bottom-0 left-0 right-0 p-4 bg-background border-t transition-all duration-300 ease-out ${
          frameSelected && selectedPresetId 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex gap-2 items-center">
          {/* Mode Toggle */}
          <div className="flex rounded-lg border bg-muted p-1">
            <button
              onClick={() => setFillMode('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer ${
                fillMode === 'cards' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Карточки — рандомизация по компонентам"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Карточки
            </button>
            <button
              onClick={() => setFillMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer ${
                fillMode === 'table' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Таблица — рандомизация по строкам"
            >
              <Table className="h-3.5 w-3.5" />
              Таблица
            </button>
          </div>
          
          {/* Fill Button */}
          <Button 
            onClick={handleFill} 
            disabled={!currentData || (analysisResult?.matched.length === 0)} 
            className="flex-1"
          >
            Заполнить
          </Button>
        </div>
      </div>

      {/* App Footer - Hidden when frame is selected */}
      {!frameSelected && (
        <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-background flex items-center justify-between" style={{ height: '36px' }}>
          <a 
            href="https://wiki.yandex-team.ru/users/a-awerin/mds-snapfill/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-medium text-[#666666] dark:text-[#666666] hover:opacity-70 transition-opacity leading-[12px]"
          >
            MDS • SnapFill
          </a>
          <a 
            href="https://wiki.yandex-team.ru/users/a-awerin/mds-snapfill-changelog/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-medium text-[#666666] dark:text-[#666666] hover:opacity-70 transition-opacity leading-[12px]"
          >
            V 1.0.0
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
