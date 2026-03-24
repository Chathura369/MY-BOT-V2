import { useGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Cpu, HardDrive, Users, MessageSquare, Smartphone, Clock, Wifi } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useGetStats({
    query: { refetchInterval: 5000 }
  });

  const [memoryHistory, setMemoryHistory] = useState<{time: string, percent: number}[]>([]);

  useEffect(() => {
    if (stats) {
      setMemoryHistory(prev => {
        const newHist = [...prev, {
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
          percent: (stats as any).memPercent
        }];
        return newHist.slice(-15);
      });
    }
  }, [stats]);

  if (isLoading && !stats) return <div className="p-8 text-muted-foreground animate-pulse">Initializing telemetry...</div>;
  if (isError) return <div className="p-8 text-destructive">Failed to fetch system telemetry.</div>;
  if (!stats) return null;

  const s = stats as any;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Connected': return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">Active</Badge>;
      case 'Disconnected': return <Badge variant="destructive">Offline</Badge>;
      default: return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">{status}</Badge>;
    }
  };

  const statCards = [
    { title: "Uptime", value: `${(s.uptime / 3600).toFixed(1)}h`, icon: Clock, color: "text-blue-400" },
    { title: "Active Users", value: (s.userCount || 0).toLocaleString(), icon: Users, color: "text-primary" },
    { title: "Sessions", value: s.sessionCount || 1, icon: Smartphone, color: "text-emerald-400" },
    { title: "Broadcasts", value: s.broadcastCount || 0, icon: MessageSquare, color: "text-amber-400" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white tracking-tight text-glow">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time system telemetry</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border-primary/20 bg-gradient-to-r from-card/80 to-primary/5">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <Activity className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Main Bot Status</p>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className="text-2xl font-bold text-white">{s.number || 'Not Linked'}</h2>
                  {getStatusBadge(s.status)}
                </div>
              </div>
            </div>
            {s.connectedAt && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Connected Since</p>
                <p className="text-foreground font-medium">{new Date(s.connectedAt).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }}>
            <Card className="hover:border-white/20 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <stat.icon className={`w-5 h-5 ${stat.color} opacity-80`} />
                </div>
                <h3 className="text-2xl font-bold mt-2 text-white">{stat.value}</h3>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-primary" />
              Memory Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={memoryHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={12} tickMargin={10} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(20,20,30,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Line
                  type="monotone"
                  dataKey="percent"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-accent" />
              Server Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CPU Load</span>
                <span className="text-foreground font-mono">{s.cpuLoad}</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all" style={{ width: `${Math.min(parseFloat(s.cpuLoad) * 10, 100)}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">RAM Used</span>
                <span className="text-foreground font-mono">{s.memUsed} MB / {s.memTotal} MB</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${s.memPercent}%` }} />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wifi className="w-4 h-4" /> Network Rx
                </div>
                <span className="font-mono text-sm text-emerald-400">{s.net?.speedRx ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wifi className="w-4 h-4" /> Network Tx
                </div>
                <span className="font-mono text-sm text-amber-400">{s.net?.speedTx ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Platform</span>
                <span className="text-foreground capitalize">{s.platform}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Node.js</span>
                <span className="text-foreground">{s.nodeVersion}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Downloads</span>
                <span className="text-foreground">{s.fileCount} files ({s.fileSizeMB} MB)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
