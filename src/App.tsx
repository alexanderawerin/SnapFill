import React, { useState } from 'react';
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

  React.useEffect(() => {
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
    <div className="h-screen w-full bg-background p-4 flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">SnapFill</CardTitle>
          <CardDescription>Заполните макет данными из файла</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 overflow-y-auto">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Загрузите CSV или JSON файл</label>
            <div className="flex items-center gap-2">
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Выбрать файл
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
            {fileName && (
              <p className="text-xs text-muted-foreground">{fileName}</p>
            )}
          </div>

          {/* Data Preview */}
          {currentData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Превью данных:</label>
                {isArray && allData && (
                  <span className="text-xs font-medium text-primary">
                    ({allData.length} записей)
                  </span>
                )}
              </div>
              <div className="rounded-lg border bg-muted/50 p-3 max-h-40 overflow-y-auto">
                {Object.keys(currentData).slice(0, 5).map((key) => (
                  <div key={key} className="text-xs py-1">
                    <strong className="font-medium">{key}:</strong>{' '}
                    <span className="text-muted-foreground">
                      {String(currentData[key]).substring(0, 30)}
                      {String(currentData[key]).length > 30 ? '...' : ''}
                    </span>
                  </div>
                ))}
                {Object.keys(currentData).length > 5 && (
                  <div className="text-xs text-muted-foreground py-1">
                    ...и еще {Object.keys(currentData).length - 5} полей
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Убедитесь, что слои в фрейме названы как поля в файле данных
            </AlertDescription>
          </Alert>

          {/* Messages */}
          {message.type === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{message.text}</AlertDescription>
            </Alert>
          )}
          {message.type === 'success' && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-xs">{message.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex gap-2 pt-4 border-t">
          {isArray && (
            <Button
              variant="gradient"
              onClick={handleRandom}
              disabled={!currentData}
              className="flex-1"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Случайный
            </Button>
          )}
          <Button onClick={handleFill} disabled={!currentData} className="flex-1">
            Заполнить
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default App;

