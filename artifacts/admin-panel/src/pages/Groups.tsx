import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Search, Users2, Shield, VolumeX, MessageSquare, Trash2, Link as LinkIcon, Heart, Save, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

type Group = {
  jid: string;
  name: string;
  sessionId: string;
  memberCount: number;
  isMuted: boolean;
  antiLink: boolean;
  antiSpam: boolean;
  welcomeEnabled: boolean;
  welcomeMessage: string;
  goodbyeEnabled: boolean;
};

export default function Groups() {
  const [search, setSearch] = useState("");
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [welcomeMsgEdits, setWelcomeMsgEdits] = useState<Record<string, string>>({});
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: groups = [], isLoading } = useQuery<Group[]>({
    queryKey: ["/bot-api/groups"],
    queryFn: async () => {
      const res = await fetch("/bot-api/groups");
      if (!res.ok) throw new Error("Failed to fetch groups");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ jid, field, value }: { jid: string; field: string; value: any }) => {
      const res = await fetch(`/bot-api/groups/${jid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to update group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/bot-api/groups"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update group settings.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (jid: string) => {
      const res = await fetch(`/bot-api/groups/${jid}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove group");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Group Removed", description: "The group has been purged from the database." });
      queryClient.invalidateQueries({ queryKey: ["/bot-api/groups"] });
    },
  });

  const handleSaveWelcome = (jid: string) => {
    const msg = welcomeMsgEdits[jid];
    if (msg !== undefined) {
      updateMutation.mutate({ jid, field: "welcomeMessage", value: msg });
      toast({ title: "Saved", description: "Welcome message updated." });
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalGroups = groups.length;
  const mutedGroups = groups.filter((g) => g.isMuted).length;
  const antiLinkGroups = groups.filter((g) => g.antiLink).length;
  const welcomeGroups = groups.filter((g) => g.welcomeEnabled).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white tracking-tight text-glow flex items-center gap-3">
          <Users2 className="w-8 h-8 text-primary" /> Group Coordination
        </h1>
        <p className="text-muted-foreground mt-1">Manage chat environments and security policies</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Groups", value: totalGroups, icon: Users2, color: "text-blue-400" },
          { label: "Muted Chats", value: mutedGroups, icon: VolumeX, color: "text-red-400" },
          { label: "Anti-Link Active", value: antiLinkGroups, icon: LinkIcon, color: "text-green-400" },
          { label: "Greeting Active", value: welcomeGroups, icon: Heart, color: "text-primary" },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/40 border-white/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-black/40 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4 bg-card/40 p-2 rounded-xl border border-white/5 backdrop-blur-md max-w-md">
        <Search className="w-5 h-5 text-muted-foreground ml-2" />
        <Input 
          placeholder="Search groups..." 
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:border-transparent px-2 h-auto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse bg-card/20 rounded-xl border border-white/5">
          Syncing group topology...
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card/20 rounded-xl border border-white/5">
          No groups mapped.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroupId === group.jid;
            
            return (
              <motion.div key={group.jid} layout>
                <Card className="bg-card/40 border-white/5 overflow-hidden">
                  <div 
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedGroupId(isExpanded ? null : group.jid)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                        <Users2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">{group.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-mono text-muted-foreground bg-black/40 px-2 py-0.5 rounded">
                            {group.jid.substring(0, 15)}...
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users2 className="w-3 h-3"/> {group.memberCount}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary/30 text-primary">
                            {group.sessionId}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <Switch 
                            checked={group.isMuted} 
                            onCheckedChange={(c) => updateMutation.mutate({ jid: group.jid, field: "isMuted", value: c })}
                          />
                          <span className="text-[10px] text-muted-foreground uppercase">Mute</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Switch 
                            checked={group.antiLink} 
                            onCheckedChange={(c) => updateMutation.mutate({ jid: group.jid, field: "antiLink", value: c })}
                          />
                          <span className="text-[10px] text-muted-foreground uppercase">Anti-Link</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Switch 
                            checked={group.antiSpam} 
                            onCheckedChange={(c) => updateMutation.mutate({ jid: group.jid, field: "antiSpam", value: c })}
                          />
                          <span className="text-[10px] text-muted-foreground uppercase">Anti-Spam</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Switch 
                            checked={group.welcomeEnabled} 
                            onCheckedChange={(c) => updateMutation.mutate({ jid: group.jid, field: "welcomeEnabled", value: c })}
                          />
                          <span className="text-[10px] text-muted-foreground uppercase">Welcome</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            if(confirm("Remove this group mapping?")) deleteMutation.mutate(group.jid);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/20"
                      >
                        <div className="p-5 space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-primary flex items-center gap-2">
                              <MessageSquare className="w-4 h-4"/> Welcome Message Template
                            </label>
                            <Textarea 
                              className="bg-background border-white/10 min-h-[100px] font-mono text-sm"
                              placeholder="Hello @user, welcome to @group!"
                              value={welcomeMsgEdits[group.jid] ?? group.welcomeMessage}
                              onChange={(e) => setWelcomeMsgEdits({...welcomeMsgEdits, [group.jid]: e.target.value})}
                            />
                            <p className="text-xs text-muted-foreground">Variables: @user, @group, @desc</p>
                          </div>
                          <div className="flex justify-end">
                            <Button 
                              onClick={() => handleSaveWelcome(group.jid)}
                              disabled={updateMutation.isPending}
                              className="gap-2"
                            >
                              <Save className="w-4 h-4" /> Save Template
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
