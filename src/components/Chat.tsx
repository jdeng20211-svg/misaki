import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Loader2 } from 'lucide-react';
import { supabase, Message, Conversation } from '../lib/supabase';
import { sendMessageToOllama } from '../services/ollama';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { StatusMonitor } from './StatusMonitor';

export function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    setConversations(data || []);
    if (data && data.length > 0 && !currentConversationId) {
      setCurrentConversationId(data[0].id);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const createNewConversation = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title: '新對話' })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return;
    }

    setConversations([data, ...conversations]);
    setCurrentConversationId(data.id);
    setMessages([]);
  };

  const handleSendMessage = async (content: string) => {
    if (!currentConversationId) {
      await createNewConversation();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userMessage = {
        conversation_id: currentConversationId,
        role: 'user' as const,
        content,
      };

      const { data: savedUserMessage, error: userError } = await supabase
        .from('messages')
        .insert(userMessage)
        .select()
        .single();

      if (userError) throw userError;

      setMessages([...messages, savedUserMessage]);

      const historyMessages = messages.map(m => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));

      const response = await sendMessageToOllama([
        ...historyMessages,
        { role: 'user', content },
      ]);

      const assistantMessage = {
        conversation_id: currentConversationId,
        role: 'assistant' as const,
        content: response,
      };

      const { data: savedAssistantMessage, error: assistantError } = await supabase
        .from('messages')
        .insert(assistantMessage)
        .select()
        .single();

      if (assistantError) throw assistantError;

      setMessages(prev => [...prev, savedAssistantMessage]);

      await supabase
        .from('conversations')
        .update({
          updated_at: new Date().toISOString(),
          title: content.slice(0, 50)
        })
        .eq('id', currentConversationId);

      await loadConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('無法連接到 Ollama。請確認 Ollama 正在運行於 localhost:11434');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            新對話
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setCurrentConversationId(conv.id)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                currentConversationId === conv.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-sm">{conv.title}</span>
              </div>
            </button>
          ))}
        </div>
        <StatusMonitor messages={messages} />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-800">奧澤美咲聊天室</h1>
          <p className="text-sm text-gray-500 mt-1">說話簡短、愛吐槽的常識人</p>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        <MessageList messages={messages} />

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">回覆中...</span>
          </div>
        )}

        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
