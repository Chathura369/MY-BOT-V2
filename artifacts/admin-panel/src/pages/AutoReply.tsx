import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Plus, Trash2, Zap, Reply, Braces, Settings2, Hash, Type, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

type AutoReplyRule = {
  id: string;
  trigger: string;
  response: string;
  matchType: "exact" | "contains" | "startsWith" | "regex";
  enabled: boolean;
  caseSensitive: boolean;
  groupsOnly: boolean;
  pmOnly: boolean;
};

const matchTypeColors = {
  exact: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contains: "bg-green-500/20 text-green-400 border-green-500/30",
  startsWith: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  regex: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AutoReply() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AutoReplyRule>>({
    trigger: "", response: "", matchType: "exact", caseSensitive: false, groupsOnly: false, pmOnly: false
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: rules = [], isLoading } = useQuery<AutoReplyRule[]>({
    queryKey: ["/bot-api/auto-reply"],
    queryFn: async () => {
      const res = await fetch("/bot-api/auto-reply");
      if (!res.ok) throw new Error("Failed to fetch rules");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/bot-api/auto-reply/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to update rule");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/bot-api/auto-reply"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/bot-api/auto-reply/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete rule");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/bot-api/auto-reply"] }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<AutoReplyRule>) => {
      const res = await fetch("/bot-api/auto-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create rule");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Constructed", description: "New neural pathway established." });
      queryClient.invalidateQueries({ queryKey: ["/bot-api/auto-reply"] });
      setIsAddOpen(false);
      setNewRule({ trigger: "", response: "", matchType: "exact", caseSensitive: false, groupsOnly: false, pmOnly: false });
    },
  });

  const enabledRulesCount = rules.filter(r => r.enabled).length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight text-glow flex items-center gap-3">
            <Reply className="w-8 h-8 text-primary" /> Auto-Responders
          </h1>
          <p className="text-muted-foreground mt-1">Configure automated conversational neural paths</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white">
          <Zap className="w-4 h-4" /> Inject Routine
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        <Card className="bg-card/40 border-white/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Braces className="w-5 h-5 text-primary" />
              </div>
              <p className="font-medium text-muted-foreground">Total Rules</p>
            </div>
            <p className="text-2xl font-bold text-white">{rules.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-white/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-green-400" />
              </div>
              <p className="font-medium text-muted-foreground">Active</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{enabledRulesCount}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse bg-card/20 rounded-xl border border-white/5">Loading heuristics...</div>
      ) : rules.length === 0 ? (
        <div className="p-16 text-center bg-card/20 rounded-xl border border-white/5 flex flex-col items-center justify-center">
          <Bot className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Auto-Responses Found</h3>
          <p className="text-sm text-muted-foreground mb-6">Create rule sets to let the system respond automatically.</p>
          <Button variant="outline" onClick={() => setIsAddOpen(true)}>Create First Rule</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.map((rule) => (
            <motion.div key={rule.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className={`border border-white/5 transition-all duration-300 ${rule.enabled ? 'bg-card/60 shadow-[0_0_15px_rgba(180,90,255,0.05)]' : 'bg-black/40 opacity-70'}`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`border ${matchTypeColors[rule.matchType]}`}>
                          {rule.matchType.toUpperCase()}
                        </Badge>
                        <span className="font-mono text-lg font-bold text-white px-2 py-0.5 rounded bg-white/5 border border-white/10 break-all">
                          {rule.trigger}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        {rule.caseSensitive && <Badge className="bg-white/10 text-xs text-muted-foreground border-0"><Type className="w-3 h-3 mr-1"/> Case Sensitive</Badge>}
                        {rule.groupsOnly && <Badge className="bg-orange-500/20 text-orange-400 border-0"><Hash className="w-3 h-3 mr-1"/> Groups</Badge>}
                        {rule.pmOnly && <Badge className="bg-blue-500/20 text-blue-400 border-0">PMs Only</Badge>}
                      </div>
                    </div>
                    
                    <Switch 
                      checked={rule.enabled} 
                      onCheckedChange={(c) => updateMutation.mutate({ id: rule.id, enabled: c })} 
                    />
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <p className="text-sm font-mono text-primary/90 whitespace-pre-wrap">{rule.response}</p>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => { if(confirm("Terminate this routine?")) deleteMutation.mutate(rule.id); }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Erase
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px] border-primary/20 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-primary">
              <Zap className="w-5 h-5"/> Encode New Routine
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Stimulus (Trigger)</label>
              <Input 
                value={newRule.trigger} 
                onChange={(e) => setNewRule({...newRule, trigger: e.target.value})}
                className="bg-black/40 font-mono border-white/10"
                placeholder="e.g. !ping"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Match Algorithm</label>
              <Select value={newRule.matchType} onValueChange={(v: any) => setNewRule({...newRule, matchType: v})}>
                <SelectTrigger className="bg-black/40 border-white/10 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">EXACT_MATCH</SelectItem>
                  <SelectItem value="contains">CONTAINS_SUBSTRING</SelectItem>
                  <SelectItem value="startsWith">STARTS_WITH_PREFIX</SelectItem>
                  <SelectItem value="regex">REGULAR_EXPRESSION</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Response Payload</label>
              <Textarea 
                value={newRule.response} 
                onChange={(e) => setNewRule({...newRule, response: e.target.value})}
                className="bg-black/40 border-white/10 min-h-[100px] font-mono text-primary/90"
                placeholder="Pong! System is operational."
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/5">
              <div className="flex flex-col items-center gap-2 bg-black/20 p-3 rounded-lg border border-white/5">
                <Switch 
                  checked={newRule.caseSensitive} 
                  onCheckedChange={(c) => setNewRule({...newRule, caseSensitive: c})} 
                />
                <span className="text-[10px] text-muted-foreground uppercase text-center">Case Sens</span>
              </div>
              <div className="flex flex-col items-center gap-2 bg-black/20 p-3 rounded-lg border border-white/5">
                <Switch 
                  checked={newRule.groupsOnly} 
                  onCheckedChange={(c) => setNewRule({...newRule, groupsOnly: c, pmOnly: c ? false : newRule.pmOnly})} 
                />
                <span className="text-[10px] text-muted-foreground uppercase text-center">Group Only</span>
              </div>
              <div className="flex flex-col items-center gap-2 bg-black/20 p-3 rounded-lg border border-white/5">
                <Switch 
                  checked={newRule.pmOnly} 
                  onCheckedChange={(c) => setNewRule({...newRule, pmOnly: c, groupsOnly: c ? false : newRule.groupsOnly})} 
                />
                <span className="text-[10px] text-muted-foreground uppercase text-center">PM Only</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Discard</Button>
            <Button onClick={() => createMutation.mutate(newRule)} disabled={createMutation.isPending || !newRule.trigger || !newRule.response} className="gap-2">
              <Save className="w-4 h-4"/> Commit Routine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
