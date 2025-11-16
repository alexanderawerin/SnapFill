import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Shuffle, X, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface DataItem {
  [key: string]: any;
}

function App() {
  const [currentData, setCurrentData] = useState<DataItem | null>(null);
  const [allData, setAllData] = useState<DataItem[] | null>(null);
  const [isArray, setIsArray] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setMessage({ type: null, text: '' });

    try {
      const text = await file.text();

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          setAllData(parsed);
          setCurrentData(parsed[0]);
          setIsArray(true);
        } else {
          setAllData([parsed]);
          setCurrentData(parsed);
          setIsArray(false);
        }
      } else if (file.name.endsWith('.csv')) {
        const parsedArray = parseCSVAll(text);
        setAllData(parsedArray);
        setCurrentData(parsedArray[0]);
        setIsArray(true);
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Ошибка чтения файла: ${error.message}` });
    }
  };

  const parseCSVAll = (text: string): DataItem[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV файл должен содержать заголовки и хотя бы одну строку данных');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const results: DataItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: DataItem = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      results.push(row);
    }

    return results;
  };

  const handleFill = () => {
    if (currentData) {
      parent.postMessage({ pluginMessage: { type: 'fill-data', data: currentData } }, '*');
    }
  };

  const handleRandom = () => {
    if (isArray && allData && allData.length > 0) {
      const randomIndex = Math.floor(Math.random() * allData.length);
      const randomData = allData[randomIndex];
      setCurrentData(randomData);
      parent.postMessage({ pluginMessage: { type: 'fill-data', data: randomData } }, '*');
    }
  };

  const handleCancel = () => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
  };

  useEffect(() => {
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (msg.type === 'error') {
        setMessage({ type: 'error', text: msg.message });
      } else if (msg.type === 'success') {
        setMessage({ type: 'success', text: msg.message });
      }
    };
  }, []);

  return (
    <div className="h-screen w-full bg-background p-2 flex flex-col">
      <Card className="flex-1 flex flex-col shadow-none border-0">
        <CardHeader className="pb-2 pt-2 px-3">
          <CardTitle className="text-base">SnapFill</CardTitle>
          <CardDescription className="text-xs">Заполните макет данными</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 space-y-2 overflow-y-auto px-3 pb-2">
          {/* File Upload */}
          <div className="space-y-1">
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Button variant="outline" className="w-full h-8 text-xs" size="sm" asChild>
                <span>
                  <Upload className="w-3 h-3 mr-1" />
                  {fileName ? fileName : 'Выбрать файл'}
                </span>
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Data Preview */}
          {currentData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Превью данных:</label>
                {isArray && allData && (
                  <span className="text-xs font-medium text-primary">
                    ({allData.length} записей)
                  </span>
                )}
              </div>
              <div className="rounded-md border bg-muted/30 p-2 max-h-20 overflow-y-auto text-[10px]">
                {Object.keys(currentData).slice(0, 3).map((key) => (
                  <div key={key} className="py-0.5 leading-tight truncate">
                    <strong className="font-medium">{key}:</strong>{' '}
                    <span className="text-muted-foreground">
                      {String(currentData[key]).substring(0, 20)}
                      {String(currentData[key]).length > 20 ? '...' : ''}
                    </span>
                  </div>
                ))}
                {Object.keys(currentData).length > 3 && (
                  <div className="text-muted-foreground py-0.5">
                    +{Object.keys(currentData).length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Alert */}
          <Alert className="py-2">
            <Info className="h-3 w-3" />
            <AlertDescription className="text-[10px] leading-tight">
              Слои должны быть названы как поля в файле
            </AlertDescription>
          </Alert>

          {/* Messages */}
          {message.type === 'error' && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-[10px]">{message.text}</AlertDescription>
            </Alert>
          )}
          {message.type === 'success' && (
            <Alert variant="success" className="py-2">
              <CheckCircle2 className="h-3 w-3" />
              <AlertDescription className="text-[10px]">{message.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex gap-1.5 pt-2 pb-2 border-t px-3">
          {isArray && (
            <Button
              variant="gradient"
              onClick={handleRandom}
              disabled={!currentData}
              className="flex-1 h-8"
              size="sm"
            >
              <Shuffle className="w-3 h-3 mr-1" />
              <span className="text-[11px]">Случайный</span>
            </Button>
          )}
          <Button onClick={handleFill} disabled={!currentData} className="flex-1 h-8" size="sm">
            <span className="text-[11px]">Заполнить</span>
          </Button>
          <Button variant="outline" onClick={handleCancel} size="sm" className="h-8 w-8 p-0">
            <X className="w-3 h-3" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default App;

