import { useEffect } from "react";
import { useGetSettings, useUpdateSettings, useRestartBot } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Save, RotateCcw, Shield, SlidersHorizontal } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const { toast } = useToast();
  const [isRestartOpen, setIsRestartOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: settings as any
  });

  useEffect(() => {
    if (settings) reset(settings as any);
  }, [settings, reset]);

  const updateMutation = useUpdateSettings({
    mutation: {
      onSuccess: () => toast({ title: "Configuration Saved", description: "System parameters updated successfully." }),
      onError: () => toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" })
    }
  });

  const restartMutation = useRestartBot({
    mutation: {
      onSuccess: () => {
        toast({ title: "System Restarting", description: "Bot process is restarting. Service will resume shortly." });
        setIsRestartOpen(false);
      }
    }
  });

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading core parameters...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight text-glow">System Configuration</h1>
          <p className="text-muted-foreground mt-1">Adjust core behavior and operation modes</p>
        </div>
        <Button variant="destructive" className="gap-2 shadow-[0_0_15px_rgba(255,0,0,0.3)]" onClick={() => setIsRestartOpen(true)}>
          <RotateCcw className="w-4 h-4" /> Hard Restart
        </Button>
      </div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate({ data: data as any }))}>
        <div className="grid grid-cols-1 gap-8">
          <Card className="border-white/5">
            <CardHeader className="border-b border-white/5 bg-black/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <SlidersHorizontal className="w-5 h-5 text-primary" /> General Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bot Identity (Name)</label>
                <Input {...register("botName")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Command Prefix</label>
                <Input {...register("prefix")} className="font-mono text-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Master Number (Read-Only)</label>
                <Input {...register("ownerNumber")} disabled className="opacity-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Premium Code</label>
                <Input {...register("premiumCode")} className="font-mono" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/5">
            <CardHeader className="border-b border-white/5 bg-black/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-accent" /> Operation Modes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[
                { id: "autoRead", label: "Auto Read Messages", desc: "Automatically mark incoming messages as read." },
                { id: "autoTyping", label: "Simulate Typing", desc: "Show 'typing...' status before replying." },
                { id: "nsfwEnabled", label: "NSFW Modules", desc: "Enable Not-Safe-For-Work features.", danger: true },
              ].map(toggle => (
                <div key={toggle.id} className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${toggle.danger ? 'text-red-400' : 'text-foreground'}`}>{toggle.label}</p>
                    <p className="text-sm text-muted-foreground">{toggle.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" {...register(toggle.id as any)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-black/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-white/10"></div>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex justify-end">
          <Button type="submit" size="lg" className="px-10 gap-2" disabled={updateMutation.isPending}>
            <Save className="w-5 h-5" />
            {updateMutation.isPending ? "Committing..." : "Commit Changes"}
          </Button>
        </div>
      </form>

      <Dialog open={isRestartOpen} onOpenChange={setIsRestartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <RotateCcw className="w-5 h-5" /> Confirm Hard Restart
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to restart the bot process? All active sessions will temporarily disconnect while the system reboots. It will reconnect automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsRestartOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => restartMutation.mutate()} disabled={restartMutation.isPending}>
              {restartMutation.isPending ? "Restarting..." : "Execute Restart"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
