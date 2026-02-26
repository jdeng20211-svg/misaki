import { useState } from 'react';
import { BarChart3, X } from 'lucide-react';
import { Message } from '../lib/supabase';
import { generateSummary } from '../services/ollama';

interface StatusMonitorProps {
  messages: Message[];
}

export function StatusMonitor({ messages }: StatusMonitorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGenerateSummary = async () => {
    if (messages.length === 0) {
      setError('還沒有對話記錄呢...');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const ollamaMessages = messages.map(m => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));
      const result = await generateSummary(ollamaMessages);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '無法生成筆記');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={() => {
            setIsOpen(true);
            if (!summary && messages.length > 0) {
              handleGenerateSummary();
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all font-medium"
        >
          <BarChart3 className="w-5 h-5" />
          查看筆記
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">進度筆記</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4" />
                  <p className="text-gray-600">美咲正在整理筆記...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {error}
                </div>
              ) : summary ? (
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {summary}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  還沒有筆記呢，先聊天吧。
                </div>
              )}

              {messages.length > 0 && !loading && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={loading}
                  className="mt-6 w-full px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:bg-gray-300 transition-colors"
                >
                  重新生成筆記
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
