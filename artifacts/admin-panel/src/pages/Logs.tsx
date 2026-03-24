import { useState, useEffect, useRef } from "react";
import { useGetLogs } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Terminal } from "lucide-react";

type LogLevel = 'all' | 'info' | 'warn' | 'error';

export default function Logs() {
  const [level, setLevel] = useState<LogLevel>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: logs = [] } = useGetLogs({ query: { refetchInterval: 2000 } });

  const filtered = level === 'all' ? logs : logs.filter(l => l.level === level);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelColor = (l: string | undefined) => {
    switch(l) {
      case 'info': return 'text-blue-400';
      case 'warn': return 'text-yellow-400';
      case 'error': return 'text-red-500';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-screen flex flex-col pt-8 pb-8">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <Terminal className="w-8 h-8 text-primary" /> System Terminal
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-black/40 rounded-lg p-1 border border-white/10 flex">
            {(['all', 'info', 'warn', 'error'] as LogLevel[]).map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${level === l ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col bg-[#0d0d12] border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="h-8 bg-black/60 border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
          <span className="text-xs text-muted-foreground font-mono ml-2">root@supreme-md:~# tail -f /var/log/bot.log</span>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed space-y-1">
          {filtered.length === 0 ? (
            <div className="text-muted-foreground italic">No logs found...</div>
          ) : filtered.map((log, i) => (
            <div key={`${log.time}-${i}`} className="flex gap-4 hover:bg-white/5 px-2 py-1 rounded">
              <span className="text-muted-foreground/60 shrink-0 select-none">
                {log.time}
              </span>
              <span className={`w-12 shrink-0 uppercase text-xs font-bold mt-0.5 ${getLevelColor(log.level)}`}>
                {log.level || 'log'}
              </span>
              <span className="text-white/80 break-words">{log.message}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
