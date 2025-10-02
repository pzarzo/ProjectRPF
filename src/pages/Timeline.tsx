import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Rfp {
  id: string;
  title: string;
  reference_id: string | null;
}

interface Deadline {
  id: string;
  type: string;
  datetime_iso: string;
  timezone: string | null;
  rfp_id: string;
  rfp?: Rfp;
}

export default function Timeline() {
  const navigate = useNavigate();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [rfps, setRfps] = useState<Record<string, Rfp>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDeadlines();
  }, []);

  const loadDeadlines = async () => {
    try {
      // Load all deadlines
      const { data: deadlinesData, error: deadlinesError } = await (supabase as any)
        .from('rfp_deadlines')
        .select('*')
        .order('datetime_iso', { ascending: true });

      if (deadlinesError) throw deadlinesError;

      setDeadlines(deadlinesData || []);

      // Load corresponding RFPs
      if (deadlinesData && deadlinesData.length > 0) {
        const rfpIds = [...new Set(deadlinesData.map((d: any) => d.rfp_id))];
        const { data: rfpsData, error: rfpsError } = await (supabase as any)
          .from('rfps')
          .select('id, title, reference_id')
          .in('id', rfpIds);

        if (rfpsError) throw rfpsError;

        const rfpsMap: Record<string, Rfp> = {};
        rfpsData?.forEach((rfp: any) => {
          rfpsMap[rfp.id] = rfp;
        });
        setRfps(rfpsMap);
      }
    } catch (error) {
      console.error('Error loading deadlines:', error);
      toast.error("Failed to load deadlines");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDeadlineType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getDeadlineStatus = (datetime: string) => {
    const deadline = new Date(datetime);
    const now = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { status: 'passed', color: 'text-muted-foreground', bgColor: 'bg-muted' };
    if (daysUntil <= 3) return { status: 'urgent', color: 'text-destructive', bgColor: 'bg-destructive/10' };
    if (daysUntil <= 7) return { status: 'upcoming', color: 'text-warning', bgColor: 'bg-warning/10' };
    return { status: 'future', color: 'text-primary', bgColor: 'bg-primary/10' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            RFP Timeline
          </h1>
          <p className="text-muted-foreground text-lg">
            Track all your RFP deadlines and key dates
          </p>
        </div>

        {/* Timeline */}
        {isLoading ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              Loading deadlines...
            </div>
          </Card>
        ) : deadlines.length === 0 ? (
          <Card className="p-8">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground text-lg">No deadlines available</p>
              <p className="text-sm text-muted-foreground">
                Upload an RFP to see its deadlines here
              </p>
              <Button onClick={() => navigate("/upload")}>
                Upload RFP
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {deadlines.map((deadline) => {
              const { color, bgColor } = getDeadlineStatus(deadline.datetime_iso);
              const date = new Date(deadline.datetime_iso);
              const now = new Date();
              const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const rfp = rfps[deadline.rfp_id];

              if (!rfp) return null;

              return (
                <Card key={deadline.id} className={`p-6 ${bgColor} border-l-4 border-l-current ${color}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Calendar className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">
                          {formatDeadlineType(deadline.type)}
                        </h3>
                      </div>
                      <p className="text-sm mb-2">
                        <span className="font-medium">RFP:</span> {rfp.title}
                      </p>
                      <p className="text-xs opacity-75">
                        Reference: {rfp.reference_id || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold">
                          {date.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs">
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs mt-1 opacity-75">
                        {deadline.timezone || 'UTC'}
                      </div>
                      {daysUntil >= 0 && (
                        <div className="text-xs mt-2 font-medium">
                          {daysUntil === 0 ? 'Today' : `${daysUntil} days`}
                        </div>
                      )}
                      {daysUntil < 0 && (
                        <div className="text-xs mt-2 opacity-75">
                          Passed
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}