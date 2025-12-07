import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Empty, EmptyHeader, EmptyMedia, EmptyDescription } from '@/components/ui/empty';
import { AlertCircle, Upload } from 'lucide-react';
import { PresetsGrid } from '@/components/PresetsGrid';
import { presets, Preset, PresetCategory, DataItem } from '@/presets';
import Papa from 'papaparse';

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PREVIEW_FIELDS = 50; // Limit preview to avoid performance issues with large objects
const CUSTOM_FILE_PRESET_ID = 'custom-file'; // Special ID for user-uploaded files

/**
 * Parse CSV text into array of data items
 * Pure function - no side effects
 */
function parseCSVAll(text: string): DataItem[] {
  if (!text.trim()) {
    throw new Error('CSV файл пустой');
  }

  const result = Papa.parse<DataItem>(text, {
    header: true,
    skipEmptyLines: 'greedy', // Skip lines that are empty or contain only whitespace
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

  // Filter out rows that have no meaningful data (all values empty)
  const validData = result.data.filter(row => 
    Object.values(row).some(value => value !== '' && value !== null && value !== undefined)
  );

  if (validData.length === 0) {
    throw new Error('CSV файл не содержит данных (все строки пустые)');
  }

  return validData;
}

function App() {
  const [currentData, setCurrentData] = useState<DataItem | null>(null);
  const [allData, setAllData] = useState<DataItem[] | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory>('b2b');
  const [fileName, setFileName] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePresetSelect = useCallback((preset: Preset) => {
    setSelectedPresetId(preset.id);
    setAllData(preset.data);
    setCurrentData(preset.data[0] ?? null);
    setFileName('');
    setMessage({ type: null, text: '' });
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value as PresetCategory);
    // Сбрасываем выбор при смене категории
    setSelectedPresetId(null);
    setAllData(null);
    setCurrentData(null);
    setFileName('');
    setMessage({ type: null, text: '' });
  }, []);

  const handleFileUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const processFile = useCallback(async (file: File) => {
    // Check file size
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
          allData: allData
        } 
      }, 'https://www.figma.com');
    }
  }, [currentData, allData]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;
      
      if (msg.type === 'error') {
        setMessage({ type: 'error', text: msg.message });
      } else if (msg.type === 'success') {
        // Success is visible in Figma itself, no need to show notification
        setMessage({ type: null, text: '' });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const hasData = currentData !== null && allData !== null;
  
  const dataSourceLabel = useMemo(() => {
    if (fileName) return fileName;
    if (selectedPresetId && selectedPresetId !== CUSTOM_FILE_PRESET_ID && selectedCategory !== 'file') {
      const categoryPresets = presets[selectedCategory];
      if (categoryPresets) {
        return categoryPresets.find(p => p.id === selectedPresetId)?.name ?? null;
      }
    }
    return null;
  }, [fileName, selectedPresetId, selectedCategory]);

  return (
    <div className="h-screen w-full bg-background flex flex-col relative">
      <Card className="flex-1 flex flex-col shadow-none border-0 rounded-none py-0 gap-0">
        <CardContent className={`flex-1 p-0 overflow-y-auto ${selectedPresetId ? 'pb-20' : 'pb-0'}`}>
          {/* Header and Tabs */}
          <div className="p-4 space-y-3">
            <h2 className="text-lg font-medium tracking-tight">Выбери пресет или загрузи файл</h2>
            <Tabs 
              value={selectedCategory} 
              onValueChange={handleCategoryChange}
            >
              <TabsList className="w-full">
                <TabsTrigger value="b2b" className="flex-1">B2B</TabsTrigger>
                <TabsTrigger value="b2c" className="flex-1">B2C</TabsTrigger>
                <TabsTrigger value="file" className="flex-1">JSON/CSV</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {selectedCategory === 'b2b' && (
            <PresetsGrid
              presets={presets.b2b}
              selectedPresetId={selectedPresetId}
              onPresetSelect={handlePresetSelect}
            />
          )}
          
          {selectedCategory === 'b2c' && (
            <PresetsGrid
              presets={presets.b2c}
              selectedPresetId={selectedPresetId}
              onPresetSelect={handlePresetSelect}
            />
          )}

          {selectedCategory === 'file' && (
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
                    border-2 border-dashed rounded-lg py-12 min-h-[240px]
                    transition-all cursor-pointer
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                    ${isDragging 
                      ? 'border-primary bg-primary/5 scale-[0.99]' 
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                    }
                    ${selectedPresetId === CUSTOM_FILE_PRESET_ID ? 'border-primary bg-primary/5' : ''}
                  `}
                >
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Upload className={isDragging || selectedPresetId === CUSTOM_FILE_PRESET_ID ? 'text-primary' : ''} />
                    </EmptyMedia>
                    <EmptyDescription>
                      {isDragging ? 'Отпустите файл' : 'Перетащи CSV или JSON файл сюда или нажми для выбора'}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
                <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Названия полей в файле должны совпадать с именами слоёв в Figma. Например, если в макете есть текстовый слой <code className="text-foreground font-medium px-1 py-0.5 bg-muted rounded text-[11px]">title</code>, в файле тоже должно быть поле <code className="text-foreground font-medium px-1 py-0.5 bg-muted rounded text-[11px]">title</code>.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
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

          {/* Data Preview Section */}
          {hasData && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium tracking-tight">
                  {dataSourceLabel || 'Данные загружены'}
                </h2>
                {allData && (
                  <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-muted rounded translate-y-[2px]">
                    {allData.length} {allData.length === 1 ? 'запись' : 'записей'}
                  </span>
                )}
              </div>
              
              {currentData && (
                <div className="rounded-md border bg-muted/50 p-3 max-h-48 overflow-y-auto">
                  {Object.keys(currentData).slice(0, MAX_PREVIEW_FIELDS).map((key) => (
                    <div key={key} className="text-xs py-1 flex gap-2">
                      <strong className="font-semibold min-w-20 shrink-0">{key}:</strong>
                      <span className="text-muted-foreground truncate">
                        {String(currentData[key])}
                      </span>
                    </div>
                  ))}
                  {Object.keys(currentData).length > MAX_PREVIEW_FIELDS && (
                    <div className="text-xs text-muted-foreground mt-1">
                      ... и еще {Object.keys(currentData).length - MAX_PREVIEW_FIELDS} полей
                    </div>
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

      {/* Fixed Footer Button - Animated */}
      <div 
        className={`fixed bottom-0 left-0 right-0 p-4 bg-background border-t backdrop-blur-sm bg-background/95 transition-all duration-300 ease-out ${
          selectedPresetId 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <Button 
          onClick={handleFill} 
          disabled={!currentData} 
          className="w-full"
        >
          Заполнить
        </Button>
      </div>
    </div>
  );
}

export default App;

