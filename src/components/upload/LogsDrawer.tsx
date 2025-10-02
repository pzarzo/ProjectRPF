import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LogEntry {
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  url: string;
  statusCode?: number;
  durationMs?: number;
  errorMessage?: string;
}

interface LogsDrawerProps {
  logs: LogEntry[];
}

export default function LogsDrawer({ logs }: LogsDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          View Logs ({logs.length})
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Extraction Logs</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No logs yet. Upload a file to see extraction details.
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {log.status === 'success' && <CheckCircle className="h-5 w-5 text-success" />}
                    {log.status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
                    {log.status === 'pending' && <Clock className="h-5 w-5 text-warning animate-spin" />}
                    <Badge variant={
                      log.status === 'success' ? 'default' : 
                      log.status === 'error' ? 'destructive' : 'secondary'
                    }>
                      {log.status.toUpperCase()}
                    </Badge>
                  </div>
                  {log.durationMs && (
                    <span className="text-xs text-muted-foreground">
                      {log.durationMs}ms
                    </span>
                  )}
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="text-muted-foreground">
                    <span className="font-medium">URL:</span> {log.url}
                  </div>
                  {log.statusCode && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">Status Code:</span> {log.statusCode}
                    </div>
                  )}
                  {log.errorMessage && (
                    <div className="text-destructive">
                      <span className="font-medium">Error:</span> {log.errorMessage}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}