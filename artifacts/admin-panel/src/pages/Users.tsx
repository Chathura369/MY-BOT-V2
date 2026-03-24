import { useState } from "react";
import { useListUsers, useDeleteUser, useToggleUserPremium, useToggleUserBan } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Crown, Ban, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Users() {
  const { data: users = [], isLoading } = useListUsers({ query: { refetchInterval: 10000 } });
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/bot-api/users"] });

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "User removed" });
        invalidate();
      },
      onError: () => toast({ title: "Error", description: "Failed to remove user", variant: "destructive" })
    }
  });

  const premiumMutation = useToggleUserPremium({
    mutation: {
      onSuccess: () => invalidate(),
      onError: () => toast({ title: "Error", description: "Failed to update premium status", variant: "destructive" })
    }
  });

  const banMutation = useToggleUserBan({
    mutation: {
      onSuccess: () => invalidate(),
      onError: () => toast({ title: "Error", description: "Failed to update ban status", variant: "destructive" })
    }
  });

  const filteredUsers = (users as any[]).filter(u =>
    u.jid?.includes(search) || u.number?.includes(search)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-white tracking-tight text-glow">Entity Registry</h1>
        <p className="text-muted-foreground mt-1">Manage users interacting with the system</p>
      </div>

      <div className="flex items-center gap-4 bg-card/40 p-2 rounded-xl border border-white/5 backdrop-blur-md max-w-md">
        <Search className="w-5 h-5 text-muted-foreground ml-2" />
        <Input
          placeholder="Search by number or JID..."
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:border-transparent px-2 h-auto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        Total: <span className="text-white font-semibold">{(users as any[]).length}</span> users
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/40 text-muted-foreground border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium">Number</th>
                  <th className="px-6 py-4 font-medium text-center">Balance</th>
                  <th className="px-6 py-4 font-medium text-center">Wins</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Last Seen</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground animate-pulse">Loading registry...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No users found. They appear here once they interact with the bot.</td></tr>
                ) : filteredUsers.map((user: any) => (
                  <tr key={user.jid} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-foreground">{user.number || user.jid?.split('@')[0]}</p>
                        <p className="text-xs font-mono text-muted-foreground/60">{user.jid}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-primary">{user.balance ?? 0}</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">{user.wins ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.premium && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border gap-1"><Crown className="w-3 h-3"/> VIP</Badge>}
                        {user.banned && <Badge variant="destructive" className="gap-1"><Ban className="w-3 h-3"/> Banned</Badge>}
                        {!user.premium && !user.banned && <span className="text-muted-foreground text-xs">Standard</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {user.lastSeen ? new Date(user.lastSeen).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={user.premium ? "text-yellow-400 hover:bg-yellow-400/10" : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10"}
                          title={user.premium ? "Remove Premium" : "Grant Premium"}
                          onClick={() => premiumMutation.mutate({ jid: user.jid })}
                        >
                          <Crown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={user.banned ? "text-green-400 hover:bg-green-400/10" : "text-muted-foreground hover:text-red-400 hover:bg-red-400/10"}
                          title={user.banned ? "Unban" : "Ban"}
                          onClick={() => banMutation.mutate({ jid: user.jid })}
                        >
                          {user.banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm(`Delete user ${user.jid}?`)) {
                              deleteMutation.mutate({ jid: user.jid });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
