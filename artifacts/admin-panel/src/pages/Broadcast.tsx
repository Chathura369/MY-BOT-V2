import { useSendBroadcast, useGetBroadcastHistory, useListSessions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, History, CheckCircle2, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const broadcastSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  targets: z.string().optional(),
  sessionId: z.string().optional(),
});

type BroadcastForm = z.infer<typeof broadcastSchema>;

export default function Broadcast() {
  const { toast } = useToast();
  const { data: history = [], refetch: refetchHistory } = useGetBroadcastHistory({ query: { refetchInterval: 15000 } });
  const { data: sessions = [] } = useListSessions();
  const activeSessions = (sessions as any[]).filter(s => s.status === 'Connected');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BroadcastForm>({
    resolver: zodResolver(broadcastSchema)
  });

  const sendMutation = useSendBroadcast({
    mutation: {
      onSuccess: (res: any) => {
        toast({ title: "Broadcast Sent", description: `Delivered to ${res.sent ?? 0} targets. Failed: ${res.failed ?? 0}` });
        reset();
        refetchHistory();
      },
      onError: () => toast({ title: "Error", description: "Failed to send broadcast", variant: "destructive" })
    }
  });

  const onSubmit = (data: BroadcastForm) => {
    const payload = {
      message: data.message,
      targets: data.targets ? data.targets.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      sessionId: data.sessionId || undefined
    };
    sendMutation.mutate({ data: payload });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white tracking-tight text-glow">Global Transmit</h1>
        <p className="text-muted-foreground mt-1">Send messages to multiple targets simultaneously</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-primary/20 shadow-[0_0_30px_rgba(180,90,255,0.05)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Send className="w-5 h-5" /> Composer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Message Content</label>
                <textarea
                  {...register("message")}
                  className="w-full min-h-[150px] rounded-lg border border-white/10 bg-black/20 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                  placeholder="Enter message text..."
                />
                {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Specific Targets (Optional)</label>
                <Input {...register("targets")} placeholder="Comma-separated JIDs (empty = all users)" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Origin Session</label>
                <select
                  {...register("sessionId")}
                  className="w-full h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  <option value="">Default (Main Session)</option>
                  {activeSessions.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.label} ({s.number})</option>
                  ))}
                </select>
              </div>

              {activeSessions.length === 0 && (
                <p className="text-xs text-amber-400 bg-amber-400/10 p-2 rounded-lg">
                  No connected sessions. The main bot must be connected to send broadcasts.
                </p>
              )}

              <Button type="submit" className="w-full mt-2" disabled={sendMutation.isPending}>
                {sendMutation.isPending ? "Transmitting..." : "Execute Broadcast"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" /> Transmission History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-black/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Message Snippet</th>
                    <th className="px-4 py-3 font-medium text-center">Delivered</th>
                    <th className="px-4 py-3 font-medium text-center">Failed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(history as any[]).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No broadcast history yet</td>
                    </tr>
                  ) : (history as any[]).map((record: any) => (
                    <tr key={record.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {record.sentAt ? new Date(record.sentAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-foreground" title={record.message}>
                        {record.message}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {record.sent ?? 0}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(record.failed ?? 0) > 0 ? (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border gap-1">
                            <XCircle className="w-3 h-3" /> {record.failed}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
