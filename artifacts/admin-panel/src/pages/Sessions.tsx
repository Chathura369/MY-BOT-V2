import { useState } from "react";
import { cn } from "@/lib/utils";
import { useListSessions, useCreateSession, useDeleteSession, useDisconnectSession, useGetSessionQR, useRequestPairCode } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Smartphone, Plus, Trash2, PowerOff, Copy, QrCode, RefreshCw, Loader2, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export default function Sessions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: sessions = [], isLoading } = useListSessions({ query: { refetchInterval: 2000 } });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSessionId, setNewSessionId] = useState("");
  const [addMode, setAddMode] = useState<'qr' | 'pair'>('qr');
  const [phoneNumber, setPhone] = useState("");

  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const [pairSessionId, setPairSessionId] = useState<string | null>(null);

  const [pairRequestSessionId, setPairRequestSessionId] = useState<string | null>(null);
  const [pairRequestPhone, setPairRequestPhone] = useState("");
  const [pairRequestCode, setPairRequestCode] = useState<string | null>(null);

  const pairRequestMutation = useRequestPairCode({
    mutation: {
      onSuccess: (data) => {
        setPairRequestCode((data as any).code || null);
        queryClient.invalidateQueries({ queryKey: ["/bot-api/sessions"] });
      },
      onError: (err: any) => toast({ title: "Pair code failed", description: err?.error || "Error", variant: "destructive" })
    }
  });

  const createMutation = useCreateSession({
    mutation: {
      onSuccess: (_, vars) => {
        queryClient.invalidateQueries({ queryKey: ["/bot-api/sessions"] });
        const createdId = vars.data.id!;
        if (addMode === 'pair') {
          setPairSessionId(createdId);
          setIsAddOpen(false);
        } else {
          setQrSessionId(createdId);
          setIsAddOpen(false);
        }
        setNewSessionId("");
        setPhone("");
      },
      onError: (err: any) => toast({ title: "Failed to create", description: err?.error || "Error", variant: "destructive" })
    }
  });

  const deleteMutation = useDeleteSession({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/bot-api/sessions"] }) }
  });
  const disconnectMutation = useDisconnectSession({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/bot-api/sessions"] }) }
  });

  const qrQuery = useGetSessionQR(qrSessionId ?? "", {
    query: {
      enabled: !!qrSessionId,
      refetchInterval: 5000,
      retry: false,
    }
  });

  const handleCreate = () => {
    if (!newSessionId) return toast({ title: "Error", description: "Session ID required", variant: "destructive" });
    if (addMode === 'pair' && !phoneNumber) return toast({ title: "Error", description: "Phone number required for pair code", variant: "destructive" });
    createMutation.mutate({
      data: {
        id: newSessionId,
        pairMode: addMode === 'pair',
        phone: addMode === 'pair' ? phoneNumber : undefined,
      }
    });
  };

  const handleAddClose = (open: boolean) => {
    setIsAddOpen(open);
    if (!open) {
      createMutation.reset();
      setNewSessionId("");
      setPhone("");
    }
  };

  const pairSession = sessions.find((s: any) => s.id === pairSessionId);
  const pairCode = pairSession?.pairCode as string | null | undefined;

  const getStatusBadge = (status: string) => {
    if (status === 'Connected') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">Connected</Badge>;
    if (status?.includes('QR') || status === 'Awaiting QR Scan' || status === 'Connecting') return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border animate-pulse">{status || 'Connecting'}</Badge>;
    if (status === 'Disconnected' || status === 'Logged Out') return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border">{status}</Badge>;
    return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Session Manager</h1>
          <p className="text-muted-foreground mt-1">Manage active WhatsApp connections</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4" /> Add Session
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-2xl bg-card/40 animate-pulse border border-white/5" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 bg-card/20 rounded-3xl border border-white/5 border-dashed">
          <Smartphone className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-foreground">No active sessions</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Create a session to link a WhatsApp number to the bot.</p>
          <Button onClick={() => setIsAddOpen(true)} className="mt-6" variant="outline">Initialize First Session</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {sessions.map((session: any, i: number) => (
              <motion.div key={session.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}>
                <Card className={cn("relative overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 h-full", session.isMain && "border-primary/50 shadow-[0_0_15px_rgba(180,90,255,0.15)]")}>
                  {session.isMain && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />}
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-xl flex items-center gap-2 flex-wrap">
                          <span className="truncate">{session.label || session.id}</span>
                          {session.isMain && <Badge variant="secondary" className="text-[10px] h-5 bg-primary/20 text-primary shrink-0">MAIN</Badge>}
                        </CardTitle>
                        <CardDescription className="font-mono mt-1 text-xs truncate">{session.id}</CardDescription>
                      </div>
                      <div className="shrink-0">{getStatusBadge(session.status)}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-black/30 rounded-lg p-3 border border-white/5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Linked Number</p>
                        <p className="font-semibold text-foreground tracking-wide truncate">{session.number || 'Pending...'}</p>
                      </div>
                    </div>

                    {session.pairCode && session.status !== 'Connected' && (
                      <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-primary font-bold tracking-widest uppercase mb-1">Pair Code</p>
                        <p className="text-2xl font-mono tracking-[0.15em] text-white font-bold">{session.pairCode}</p>
                      </div>
                    )}

                    {session.status !== 'Connected' && !session.pairCode && (
                      <div className="flex gap-2">
                        {session.qrAvailable && (
                          <Button
                            variant="outline"
                            className="flex-1 border-primary/30 hover:bg-primary/10 text-primary gap-2"
                            onClick={() => setQrSessionId(session.id)}
                          >
                            <QrCode className="w-4 h-4" /> QR Code
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="flex-1 border-blue-500/30 hover:bg-blue-500/10 text-blue-400 gap-2"
                          onClick={() => {
                            setPairRequestSessionId(session.id);
                            setPairRequestPhone("");
                            setPairRequestCode(null);
                            pairRequestMutation.reset();
                          }}
                        >
                          <KeyRound className="w-4 h-4" /> Pair Code
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      {session.status === 'Connected' && (
                        <Button
                          variant="outline"
                          className="flex-1 border-amber-500/30 hover:bg-amber-500/10 text-amber-500"
                          onClick={() => disconnectMutation.mutate({ id: session.id })}
                          disabled={disconnectMutation.isPending}
                        >
                          <PowerOff className="w-4 h-4 mr-2" /> Disconnect
                        </Button>
                      )}
                      {!session.isMain && (
                        <Button
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive flex-1"
                          onClick={() => deleteMutation.mutate({ id: session.id })}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* QR Code Viewer Dialog */}
      <Dialog open={!!qrSessionId} onOpenChange={(open) => { if (!open) setQrSessionId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>Open WhatsApp → Linked Devices → Link a device, then scan.</DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center gap-4">
            <div className="w-64 h-64 bg-white p-3 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(180,90,255,0.2)]">
              {qrQuery.data?.qrCode ? (
                <img src={qrQuery.data.qrCode} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center text-black/50">
                  <RefreshCw className="w-10 h-10 mb-2 animate-spin" />
                  <p className="text-sm font-medium text-center">Generating QR...</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">QR refreshes automatically every 20 seconds</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pair Code Dialog */}
      <Dialog
        open={!!pairSessionId}
        onOpenChange={(open) => {
          if (!open) {
            setPairSessionId(null);
            queryClient.invalidateQueries({ queryKey: ["/bot-api/sessions"] });
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pair Code</DialogTitle>
            <DialogDescription>
              Open WhatsApp → Settings → Linked Devices → Link with phone number, then enter this code.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-5">
            {pairSession?.status === 'Connected' ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="w-14 h-14 text-green-400" />
                <p className="text-lg font-bold text-white">Connected!</p>
                <p className="text-sm text-muted-foreground">WhatsApp linked successfully to <span className="text-primary font-mono">{pairSession.number}</span></p>
                <Button className="mt-2 w-full" onClick={() => setPairSessionId(null)}>Done</Button>
              </div>
            ) : pairCode ? (
              <>
                <div className="bg-black/40 border border-primary/30 p-6 rounded-2xl w-full text-center">
                  <p className="text-[10px] text-primary font-bold tracking-widest uppercase mb-3">Your Pair Code</p>
                  <p className="text-5xl font-mono tracking-[0.2em] text-white font-bold">{pairCode}</p>
                  <p className="text-xs text-muted-foreground mt-3">Code expires in ~60 seconds</p>
                </div>
                <Button
                  variant="outline"
                  className="gap-2 w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(pairCode);
                    toast({ title: "Copied!", description: "Pair code copied to clipboard" });
                  }}
                >
                  <Copy className="w-4 h-4" /> Copy Code
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Waiting for you to enter the code in WhatsApp...</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="font-semibold text-white">Generating pair code...</p>
                <p className="text-xs text-muted-foreground text-center">This may take a few seconds. Please wait.</p>
                {pairSession?.status === 'Error' && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Error occurred. Try deleting and recreating the session.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Pair Code for Existing Session Dialog */}
      <Dialog
        open={!!pairRequestSessionId}
        onOpenChange={(open) => {
          if (!open) {
            setPairRequestSessionId(null);
            setPairRequestCode(null);
            setPairRequestPhone("");
            pairRequestMutation.reset();
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Request Pair Code</DialogTitle>
            <DialogDescription>
              Get a pair code for <span className="text-primary font-mono">{pairRequestSessionId}</span>.
              Open WhatsApp → Settings → Linked Devices → Link with phone number.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center gap-5">
            {pairRequestCode ? (
              <>
                <div className="bg-black/40 border border-blue-500/30 p-6 rounded-2xl w-full text-center">
                  <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mb-3">Your Pair Code</p>
                  <p className="text-5xl font-mono tracking-[0.2em] text-white font-bold">{pairRequestCode}</p>
                  <p className="text-xs text-muted-foreground mt-3">Enter this in WhatsApp to link</p>
                </div>
                <Button
                  variant="outline"
                  className="gap-2 w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(pairRequestCode);
                    toast({ title: "Copied!", description: "Pair code copied to clipboard" });
                  }}
                >
                  <Copy className="w-4 h-4" /> Copy Code
                </Button>
              </>
            ) : (
              <>
                <div className="w-full space-y-2">
                  <label className="text-sm font-medium">Phone Number (with country code)</label>
                  <Input
                    placeholder="e.g. 94721732206"
                    value={pairRequestPhone}
                    onChange={e => setPairRequestPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    type="tel"
                  />
                  <p className="text-xs text-muted-foreground">Digits only, include country code (no +). E.g. 94XXXXXXXXX</p>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={() => pairRequestMutation.mutate({ id: pairRequestSessionId!, data: { phone: pairRequestPhone } })}
                  disabled={pairRequestMutation.isPending || !pairRequestPhone}
                >
                  {pairRequestMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Requesting...</>
                  ) : (
                    <><KeyRound className="w-4 h-4" /> Get Pair Code</>
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Session Dialog */}
      <Dialog open={isAddOpen} onOpenChange={handleAddClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Initialize New Link</DialogTitle>
            <DialogDescription>Create a new WhatsApp session connection.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Session ID</label>
              <Input
                placeholder="e.g. session-2 (letters, numbers, - only)"
                value={newSessionId}
                onChange={e => setNewSessionId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Connection Method</label>
              <div className="flex gap-2">
                <Button variant={addMode === 'qr' ? 'default' : 'outline'} className="flex-1" onClick={() => setAddMode('qr')}>
                  <QrCode className="w-4 h-4 mr-2" /> QR Scan
                </Button>
                <Button variant={addMode === 'pair' ? 'default' : 'outline'} className="flex-1" onClick={() => setAddMode('pair')}>
                  Pair Code
                </Button>
              </div>
            </div>
            {addMode === 'pair' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number (with country code, digits only)</label>
                <Input
                  placeholder="e.g. 94721732206"
                  value={phoneNumber}
                  onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  type="tel"
                />
                <p className="text-xs text-muted-foreground">Include country code without + sign. E.g. Sri Lanka: 94XXXXXXXXX</p>
              </div>
            )}
            <DialogFooter>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createMutation.isPending || !newSessionId || (addMode === 'pair' && !phoneNumber)}
              >
                {createMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Initializing...</>
                ) : (
                  "Generate Connection"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
