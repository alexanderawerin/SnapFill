import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface DataItem {
  [key: string]: any;
}

function App() {
  const [currentData, setCurrentData] = useState<DataItem | null>(null);
  const [allData, setAllData] = useState<DataItem[] | null>(null);
  const [isArray, setIsArray] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });
  const [selectedFramesCount, setSelectedFramesCount] = useState<number>(0);

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

  // Get selection info on mount and periodically
  useEffect(() => {
    const getSelectionInfo = () => {
      parent.postMessage({ pluginMessage: { type: 'get-selection-info' } }, '*');
    };
    
    getSelectionInfo();
    const interval = setInterval(getSelectionInfo, 500);
    
    return () => clearInterval(interval);
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
      parent.postMessage({ 
        pluginMessage: { 
          type: 'fill-data', 
          data: currentData,
          allData: allData // Send all data for random selection
        } 
      }, '*');
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
      } else if (msg.type === 'selection-info') {
        setSelectedFramesCount(msg.count);
      }
    };
  }, []);

  return (
    <div className="h-screen w-full bg-background p-4 flex flex-col">
      <Card className="flex-1 flex flex-col shadow-none border-0">
        <CardHeader className="pb-3 pt-3 px-4">
          <CardTitle className="text-lg">SnapFill</CardTitle>
          <CardDescription className="text-sm">Заполните макет данными из файла</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 space-y-3 overflow-y-auto px-4 pb-3">
          {/* File Upload */}
          <div>
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Button variant="outline" className="w-full h-10" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {fileName || 'Выберите CSV или JSON файл'}
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
                <label className="text-sm font-medium">Превью данных</label>
                {isArray && allData && (
                  <span className="text-xs font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded">
                    {allData.length} записей
                  </span>
                )}
              </div>
              <div className="rounded-md border bg-muted/50 p-3 max-h-64 overflow-y-auto">
                {Object.keys(currentData).slice(0, 8).map((key) => (
                  <div key={key} className="text-xs py-1 flex gap-2">
                    <strong className="font-semibold min-w-20 shrink-0">{key}:</strong>
                    <span className="text-muted-foreground truncate">
                      {String(currentData[key])}
                    </span>
                  </div>
                ))}
                {Object.keys(currentData).length > 8 && (
                  <div className="text-xs text-muted-foreground py-1 italic">
                    + еще {Object.keys(currentData).length - 8} полей
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          {message.type === 'error' && (
            <Alert variant="destructive" className="py-2.5 px-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{message.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex gap-2 pt-3 pb-3 border-t px-4">
          <Button onClick={handleFill} disabled={!currentData} className="flex-1">
            Заполнить
          </Button>
          <Button variant="outline" onClick={handleCancel} className="px-3">
            <X className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default App;

