import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/store/auth";
import { 
  LayoutDashboard, 
  Smartphone, 
  MessageSquare, 
  Users, 
  TerminalSquare, 
  Settings, 
  LogOut,
  Bot,
  Terminal,
  Users2,
  CalendarDays,
  Reply
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions", icon: Smartphone },
  { href: "/broadcast", label: "Broadcast", icon: MessageSquare },
  { href: "/commands", label: "Commands", icon: Terminal },
  { href: "/groups", label: "Groups", icon: Users2 },
  { href: "/scheduler", label: "Scheduler", icon: CalendarDays },
  { href: "/auto-reply", label: "Auto Reply", icon: Reply },
  { href: "/users", label: "Users", icon: Users },
  { href: "/logs", label: "Live Logs", icon: TerminalSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { username, logout } = useAuthStore();

  return (
    <div className="w-64 h-screen glass-panel rounded-none border-y-0 border-l-0 flex flex-col fixed left-0 top-0 z-40 shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_15px_rgba(180,90,255,0.4)]">
          <Bot className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-tight text-white">Supreme MD</h1>
          <p className="text-xs text-primary/80 font-medium">Admin Panel</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_0_20px_rgba(180,90,255,0.1)]" 
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}>
              <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-primary text-glow")} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5">
        <div className="bg-black/20 rounded-xl p-4 flex items-center justify-between border border-white/5">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Logged in as</span>
            <span className="text-sm font-semibold text-foreground truncate max-w-[100px]">{username}</span>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
