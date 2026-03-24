import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Plus, Trash2, Clock, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";

type ScheduledItem = {
  id: string;
  message: string;
  sessionId: string;
  targetType: string;
  targets: string[];
  scheduledAt: string;
  sent: boolean;
  sentAt: string | null;
  createdAt: string;
};

export default function Scheduler() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sessionInput, setSessionInput] = useState("main");
  const [targetType, setTargetType] = useState("all");
  const [targetsInput, setTargetsInput] = useState("");
  const [scheduledAtStr, setScheduledAtStr] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: schedule = [], isLoading } = useQuery<ScheduledItem[]>({
    queryKey: ["/bot-api/scheduler"],
    queryFn: async () => {
      const res = await fetch("/bot-api/scheduler");
      if (!res.ok) throw new Error("Failed to fetch schedule");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/bot-api/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create schedule");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Scheduled", description: "Message added to the transmission queue." });
      queryClient.invalidateQueries({ queryKey: ["/bot-api/scheduler"] });
      setIsAddOpen(false);
      setNewMessage("");
    },
    onError: () => toast({ title: "Error", description: "Failed to schedule broadcast.", variant: "destructive" })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/bot-api/scheduler/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete schedule");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Removed", description: "Transmission canceled." });
      queryClient.invalidateQueries({ queryKey: ["/bot-api/scheduler"] });
    },
  });

  const handleAdd = () => {
    if (!newMessage || !scheduledAtStr) return;
    const dateObj = new Date(scheduledAtStr);
    
    createMutation.mutate({
      message: newMessage,
      sessionId: sessionInput,
      targetType,
      targets: targetType === "specific" ? targetsInput.split(",").map(t => t.trim()) : [],
      scheduledAt: dateObj.toISOString(),
    });
  };

  const upcoming = schedule.filter(s => !s.sent).sort((a,b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const history = schedule.filter(s => s.sent).sort((a,b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const renderCard = (item: ScheduledItem, isHistory: boolean) => (
    <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card/40 border-white/5 hover:border-primary/30 transition-colors group">
        <CardContent className="p-5 flex flex-col sm:flex-row gap-5">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                {item.sessionId}
              </Badge>
              <Badge variant="secondary" className="bg-black/40 capitalize">
                {item.targetType === 'all' ? 'Broadcast All' : item.targetType === 'groups' ? 'All Groups' : 'Specific Targets'}
              </Badge>
              {isHistory ? (
                <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Sent</span>
              ) : (
                <span className="text-xs text-amber-400 flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>
              )}
            </div>
            
            <div className="bg-black/30 p-3 rounded-lg border border-white/5 font-mono text-sm text-foreground whitespace-pre-wrap">
              {item.message}
            </div>
            
            {item.targetType === 'specific' && item.targets && item.targets.length > 0 && (
              <p className="text-xs text-muted-foreground">Targets: {item.targets.join(", ")}</p>
            )}
          </div>
          
          <div className="flex sm:flex-col justify-between items-end sm:min-w-[200px] border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-5">
            <div className="text-right">
              <p className="text-sm font-bold text-white">{format(new Date(item.scheduledAt), "MMM d, yyyy")}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(item.scheduledAt), "h:mm a")}</p>
              {!isHistory && (
                <p className="text-xs text-primary mt-2 font-medium">
                  In {formatDistanceToNow(new Date(item.scheduledAt))}
                </p>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
              onClick={() => { if(confirm("Delete this scheduled transmission?")) deleteMutation.mutate(item.id); }}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight text-glow flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary" /> Chrono-Scheduler
          </h1>
          <p className="text-muted-foreground mt-1">Automate time-delayed broadcasts and dispatches</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Add Transmission
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-black/40 border border-white/10">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            Upcoming Queue
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            Transmission Log
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6 space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse bg-card/20 rounded-xl border border-white/5">Scanning temporal queues...</div>
          ) : upcoming.length === 0 ? (
            <div className="p-16 text-center bg-card/20 rounded-xl border border-white/5 flex flex-col items-center justify-center">
              <CalendarDays className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Queue is empty</h3>
              <p className="text-sm text-muted-foreground mb-6">No temporal dispatches scheduled.</p>
              <Button variant="outline" onClick={() => setIsAddOpen(true)}>Schedule Now</Button>
            </div>
          ) : (
            upcoming.map(item => renderCard(item, false))
          )}
        </TabsContent>
        
        <TabsContent value="history" className="mt-6 space-y-4">
          {history.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground bg-card/20 rounded-xl border border-white/5">
              Log is empty.
            </div>
          ) : (
            history.map(item => renderCard(item, true))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px] border-primary/20 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-primary">
              <Send className="w-5 h-5"/> New Chrono-Dispatch
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Payload Message</label>
              <Textarea 
                className="bg-black/40 border-white/10 min-h-[120px] font-mono focus-visible:ring-primary" 
                placeholder="Enter transmission content..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Session</label>
                <Input 
                  value={sessionInput} 
                  onChange={(e) => setSessionInput(e.target.value)}
                  className="bg-black/40 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Execution Time</label>
                <Input 
                  type="datetime-local" 
                  value={scheduledAtStr}
                  onChange={(e) => setScheduledAtStr(e.target.value)}
                  className="bg-black/40 border-white/10 color-scheme-dark"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Target Scope</label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue placeholder="Select target scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Global Broadcast (All Chats)</SelectItem>
                  <SelectItem value="groups">Groups Only</SelectItem>
                  <SelectItem value="specific">Specific Identifiers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {targetType === "specific" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Target JIDs (Comma Separated)</label>
                <Textarea 
                  className="bg-black/40 border-white/10 font-mono text-xs" 
                  placeholder="123456@s.whatsapp.net, 987654@g.us"
                  value={targetsInput}
                  onChange={(e) => setTargetsInput(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Abort</Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending || !newMessage || !scheduledAtStr} className="gap-2">
              <CalendarDays className="w-4 h-4"/> Engage Timer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
