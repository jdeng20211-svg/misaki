import { SYSTEM_PROMPT } from '../constants/prompts';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export async function sendMessageToOllama(
  messages: OllamaMessage[],
  model: string = 'llama2'
): Promise<string> {
  const messagesWithSystem = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...messages.filter(m => m.role !== 'system')
  ];

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: messagesWithSystem,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('Error calling Ollama API:', error);
    throw error;
  }
}

export async function generateSummary(
  messages: OllamaMessage[],
  model: string = 'llama2'
): Promise<string> {
  const summaryPrompt = `根據以下對話歷史，用美咲的口吻（簡短、愛吐槽、溫柔且務實）總結使用者的挫折與進度。格式為：
1. 挫折與問題
2. 已取得的進度
3. 美咲的建議與鼓勵

對話歷史：
${messages
  .filter(m => m.role !== 'system')
  .map(m => `${m.role === 'user' ? '用戶' : '美咲'}: ${m.content}`)
  .join('\n')}

請以自然、親切的語氣回應，適度加入(動作描述)。`;

  const messagesForSummary: OllamaMessage[] = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: summaryPrompt }
  ];

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: messagesForSummary,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}
