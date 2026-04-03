import React from 'react';
import { Play, Plus, Trash2, Globe, Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ApiPlaygroundProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  setMethod: (method: 'GET' | 'POST' | 'PUT' | 'DELETE') => void;
  url: string;
  setUrl: (url: string) => void;
  headers: { key: string, value: string }[];
  setHeaders: (headers: { key: string, value: string }[]) => void;
  body: string;
  setBody: (body: string) => void;
  response: any;
  isLoading: boolean;
  onSend: () => void;
}

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({
  method, setMethod, url, setUrl, headers, setHeaders, body, setBody, response, isLoading, onSend
}) => {
  const addHeader = () => setHeaders([...headers, { key: '', value: '' }]);
  const removeHeader = (index: number) => setHeaders(headers.filter((_, i) => i !== index));
  const updateHeader = (index: number, field: 'key' | 'value', val: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = val;
    setHeaders(newHeaders);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg-primary">
      <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
        {/* URL Bar */}
        <div className="flex gap-2">
          <select 
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-accent outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
          <input 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-accent"
          />
          <button 
            onClick={onSend}
            disabled={isLoading || !url}
            className="bg-accent text-accent-foreground px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </button>
        </div>

        {/* Headers Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono uppercase tracking-widest opacity-40">Headers</label>
            <button onClick={addHeader} className="p-1 hover:bg-white/5 rounded text-accent">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {headers.map((h, i) => (
              <div key={i} className="flex gap-2">
                <input 
                  value={h.key}
                  onChange={(e) => updateHeader(i, 'key', e.target.value)}
                  placeholder="Key"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] outline-none focus:ring-1 focus:ring-accent"
                />
                <input 
                  value={h.value}
                  onChange={(e) => updateHeader(i, 'value', e.target.value)}
                  placeholder="Value"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] outline-none focus:ring-1 focus:ring-accent"
                />
                <button onClick={() => removeHeader(i)} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Body Section */}
        {method !== 'GET' && (
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest opacity-40">Body (JSON)</label>
            <textarea 
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{ "key": "value" }'
              className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-xs font-mono outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>
        )}

        {/* Response Section */}
        {response && (
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-40">Response</label>
              <div className="flex gap-3 text-[10px] font-mono">
                <span className={response.status < 300 ? "text-emerald-400" : "text-red-400"}>
                  Status: {response.status}
                </span>
                <span className="opacity-40">Time: {response.time}ms</span>
              </div>
            </div>
            <div className="bg-black/40 rounded-xl border border-white/5 p-4 overflow-auto max-h-96 custom-scrollbar">
              <pre className="text-[11px] font-mono text-emerald-400/90 whitespace-pre-wrap">
                {typeof response.data === 'object' 
                  ? JSON.stringify(response.data, null, 2) 
                  : response.data}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
