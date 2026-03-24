import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search, Terminal, Power, PowerOff, ShieldAlert, Crown, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Command = {
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  cooldown: number;
  pmOnly: boolean;
  groupOnly: boolean;
  premiumOnly: boolean;
  ownerOnly: boolean;
  usageCount: number;
};

const categoryColors: Record<string, string> = {
  general: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  media: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  downloader: "text-green-400 bg-green-400/10 border-green-400/20",
  tools: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  ai: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  group: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  admin: "text-red-400 bg-red-400/10 border-red-400/20",
  premium: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
};

export default function Commands() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: commands = [], isLoading } = useQuery<Command[]>({
    queryKey: ["/bot-api/commands"],
    queryFn: async () => {
      const res = await fetch("/bot-api/commands");
      if (!res.ok) throw new Error("Failed to fetch commands");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ name, enabled }: { name: string; enabled: boolean }) => {
      const res = await fetch(`/bot-api/commands/${name}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to update command");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/bot-api/commands"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update command status.", variant: "destructive" });
    },
  });

  const toggleAllMutation = useMutation({
    mutationFn: async ({ enabled, category }: { enabled: boolean; category?: string }) => {
      const res = await fetch("/bot-api/commands/toggle-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, category }),
      });
      if (!res.ok) throw new Error("Failed to toggle commands");
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({ 
        title: "Success", 
        description: `All ${variables.category ? variables.category + ' ' : ''}commands ${variables.enabled ? 'enabled' : 'disabled'}.` 
      });
      queryClient.invalidateQueries({ queryKey: ["/bot-api/commands"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to perform bulk action.", variant: "destructive" });
    },
  });

  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(filteredCommands.map((c) => c.category)));
  
  const totalCount = commands.length;
  const enabledCount = commands.filter((c) => c.enabled).length;
  const disabledCount = totalCount - enabledCount;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight text-glow flex items-center gap-3">
            <Terminal className="w-8 h-8 text-primary" /> Command Matrix
          </h1>
          <p className="text-muted-foreground mt-1">Manage system capabilities and module access</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300"
            onClick={() => toggleAllMutation.mutate({ enabled: true })}
            disabled={toggleAllMutation.isPending}
          >
            <Power className="w-4 h-4 mr-2" /> Enable All
          </Button>
          <Button 
            variant="outline" 
            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => toggleAllMutation.mutate({ enabled: false })}
            disabled={toggleAllMutation.isPending}
          >
            <PowerOff className="w-4 h-4 mr-2" /> Disable All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/40 backdrop-blur-sm border-white/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Terminal className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Modules</p>
              <h3 className="text-2xl font-bold text-white">{totalCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-sm border-green-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Power className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-400/70">Online Modules</p>
              <h3 className="text-2xl font-bold text-green-400">{enabledCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-sm border-red-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <PowerOff className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-400/70">Offline Modules</p>
              <h3 className="text-2xl font-bold text-red-400">{disabledCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 bg-card/40 p-2 rounded-xl border border-white/5 backdrop-blur-md max-w-md">
        <Search className="w-5 h-5 text-muted-foreground ml-2" />
        <Input 
          placeholder="Search commands..." 
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:border-transparent px-2 h-auto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse border border-white/5 rounded-xl bg-card/20">
          Loading command database...
        </div>
      ) : filteredCommands.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border border-white/5 rounded-xl bg-card/20">
          No commands match your query.
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            const catCommands = filteredCommands.filter((c) => c.category === category);
            const catColorClass = categoryColors[category.toLowerCase()] || "text-gray-400 bg-gray-400/10 border-gray-400/20";
            
            return (
              <motion.div 
                key={category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn("px-3 py-1 uppercase tracking-wider text-xs font-bold border", catColorClass)}>
                      {category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{catCommands.length} commands</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs hover:text-green-400 hover:bg-green-400/10"
                      onClick={() => toggleAllMutation.mutate({ enabled: true, category })}
                    >
                      Enable Group
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => toggleAllMutation.mutate({ enabled: false, category })}
                    >
                      Disable Group
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {catCommands.map((cmd) => (
                    <Card key={cmd.name} className="bg-card/40 border-white/5 hover:border-primary/30 transition-colors">
                      <CardContent className="p-4 flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-lg font-bold text-white truncate">#{cmd.name}</span>
                            <Badge variant="secondary" className="bg-black/40 text-xs">
                              {cmd.usageCount} uses
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{cmd.description}</p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {cmd.ownerOnly && <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 gap-1 border-0"><ShieldAlert className="w-3 h-3"/> Owner</Badge>}
                            {cmd.premiumOnly && <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 gap-1 border-0"><Crown className="w-3 h-3"/> Premium</Badge>}
                            {cmd.groupOnly && <Badge className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 gap-1 border-0"><Users className="w-3 h-3"/> Group</Badge>}
                            {cmd.pmOnly && <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 gap-1 border-0">PM</Badge>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 pt-1">
                          <Switch 
                            checked={cmd.enabled}
                            onCheckedChange={(checked) => toggleMutation.mutate({ name: cmd.name, enabled: checked })}
                            className="data-[state=checked]:bg-primary"
                          />
                          <span className={cn("text-xs font-medium uppercase", cmd.enabled ? "text-primary" : "text-muted-foreground")}>
                            {cmd.enabled ? "Active" : "Offline"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
