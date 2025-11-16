import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle } from 'lucide-react';

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
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage({ type: 'error', text: `Ошибка чтения файла: ${errorMessage}` });
    }
  };

  const parseCSVAll = (text: string): DataItem[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV файл должен содержать заголовки и хотя бы одну строку данных');
    }

    // Simple CSV parser that handles quoted values with commas
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const results: DataItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = parseLine(lines[i]);
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
    <div className="h-screen w-full bg-background flex flex-col">
      <Card className="flex-1 flex flex-col shadow-none border-0">
        <CardContent className="flex-1 flex flex-col overflow-y-auto p-0">
          {!fileName ? (
            // Empty state - instruction screen
            <label htmlFor="file-upload-empty" className="cursor-pointer flex-1 flex flex-col p-4">
              <div className="flex-1 border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-base font-semibold mb-2">
                  Загрузите файл с данными
                </h3>
                
                <p className="text-sm text-muted-foreground max-w-xs">
                  Выберите <span className="font-medium text-foreground">JSON</span> или <span className="font-medium text-foreground">CSV</span> файл для заполнения макетов
                </p>
              </div>
              <input
                id="file-upload-empty"
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          ) : (
            // File selected - data preview and controls
            <div className="space-y-3 flex-1 flex flex-col p-4">
              {/* File Upload */}
              <div>
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <Button variant="outline" className="w-full h-10" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {fileName}
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
                <div className="space-y-2 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Превью данных</label>
                    {isArray && allData && (
                      <span className="text-xs font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded">
                        {allData.length} записей
                      </span>
                    )}
                  </div>
                  <div className="rounded-md border bg-muted/50 p-3 flex-1 overflow-y-auto min-h-0">
                    {Object.keys(currentData).map((key) => (
                      <div key={key} className="text-xs py-1 flex gap-2">
                        <strong className="font-semibold min-w-20 shrink-0">{key}:</strong>
                        <span className="text-muted-foreground truncate">
                          {String(currentData[key])}
                        </span>
                      </div>
                    ))}
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
            </div>
          )}
        </CardContent>

        {fileName && (
          <CardFooter className="pt-3 pb-3 border-t px-4">
            <Button 
              onClick={handleFill} 
              disabled={!currentData} 
              className="w-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Заполнить
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default App;

