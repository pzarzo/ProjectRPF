import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  FileText, 
  Calendar, 
  ListChecks, 
  FileEdit, 
  CheckCircle2, 
  Package, 
  BookOpen, 
  Settings,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Upload & Parse", href: "/upload", icon: FileText },
  { name: "Timeline", href: "/timeline", icon: Calendar },
  { name: "Requirements", href: "/requirements", icon: ListChecks },
  { name: "Draft Builder", href: "/draft", icon: FileEdit },
  { name: "Compliance", href: "/compliance", icon: CheckCircle2 },
  { name: "Submission", href: "/submission", icon: Package },
  { name: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-sidebar-border">
            <FileText className="h-8 w-8 text-sidebar-primary" />
            <span className="ml-3 text-xl font-bold text-sidebar-foreground">
              RFP Manager
            </span>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 flex-shrink-0 h-5 w-5",
                      isActive ? "text-sidebar-primary" : "text-sidebar-foreground opacity-75"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:pl-64">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
