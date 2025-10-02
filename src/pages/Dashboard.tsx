import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import RfpCard from "@/components/rfp/RfpCard";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Rfp {
  id: string;
  title: string;
  issuer: string | null;
  reference_id: string | null;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [rfps, setRfps] = useState<Rfp[]>([]);
  const [requirements, setRequirements] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRfps();
  }, []);

  const loadExampleData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in first");
        return;
      }

      // Insert example RFP
      const { data: rfpData, error: rfpError } = await (supabase as any)
        .from('rfps')
        .insert({
          user_id: user.id,
          title: 'UNOPS FO/2025/1 - National IP Georgia',
          issuer: 'UNOPS',
          reference_id: 'FO/2025/1',
          budget_cap_amount: 170000,
          budget_cap_currency: 'USD',
          duration_months: 12,
          language: 'en',
          confidence: 0.9,
        })
        .select()
        .single();

      if (rfpError) throw rfpError;

      // Insert example deadlines
      const deadlines = [
        { type: 'clarifications', datetime_iso: '2025-10-05T12:00:00', timezone: 'UTC+4' },
        { type: 'info_session', datetime_iso: '2025-10-08T14:00:00', timezone: 'UTC+4' },
        { type: 'submission', datetime_iso: '2025-10-12T17:00:00', timezone: 'UTC+4' },
        { type: 'contract_start', datetime_iso: '2025-11-01T00:00:00', timezone: 'UTC+4' },
      ];

      await (supabase as any).from('rfp_deadlines').insert(
        deadlines.map(d => ({ rfp_id: rfpData.id, ...d }))
      );

      toast.success("Example RFP loaded!");
      loadRfps();
    } catch (error) {
      console.error('Error loading example:', error);
      toast.error("Failed to load example");
    }
  };

  const loadRfps = async () => {
    try {
      const { data: rfpsData, error: rfpsError } = await (supabase as any)
        .from('rfps')
        .select('id, title, issuer, reference_id, created_at')
        .order('created_at', { ascending: false });

      if (rfpsError) throw rfpsError;

      setRfps(rfpsData || []);

      // Load requirements count for each RFP
      if (rfpsData && rfpsData.length > 0) {
        const reqCounts: Record<string, number> = {};
        
        for (const rfp of rfpsData) {
          const { count, error } = await (supabase as any)
            .from('rfp_requirements')
            .select('*', { count: 'exact', head: true })
            .eq('rfp_id', rfp.id);
          
          if (!error && count !== null) {
            reqCounts[rfp.id] = count;
          }
        }
        
        setRequirements(reqCounts);
      }
    } catch (error) {
      console.error('Error loading RFPs:', error);
      toast.error("Failed to load RFPs");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              RFP Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage and track your RFP responses
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={loadExampleData}
              disabled={isLoading}
            >
              Load Example RFP
            </Button>
            <Button
              onClick={() => navigate("/upload")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              New RFP
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-muted-foreground mb-2">Total RFPs</div>
            <div className="text-3xl font-bold text-foreground">{rfps.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-muted-foreground mb-2">This Month</div>
            <div className="text-3xl font-bold text-primary">
              {rfps.filter(r => {
                const date = new Date(r.created_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-muted-foreground mb-2">Requirements</div>
            <div className="text-3xl font-bold text-success">
              {Object.values(requirements).reduce((sum, count) => sum + count, 0)}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-muted-foreground mb-2">Avg per RFP</div>
            <div className="text-3xl font-bold text-secondary">
              {rfps.length > 0 ? Math.round(Object.values(requirements).reduce((sum, count) => sum + count, 0) / rfps.length) : 0}
            </div>
          </div>
        </div>

        {/* RFP List */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Active RFPs
          </h2>
          {isLoading ? (
            <div className="text-center text-muted-foreground py-12">
              Loading RFPs...
            </div>
          ) : rfps.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">No active RFPs</p>
              <Button onClick={() => navigate("/upload")}>
                <Plus className="mr-2 h-5 w-5" />
                Upload RFP to get started
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rfps.map((rfp) => (
                <RfpCard 
                  key={rfp.id} 
                  title={rfp.title}
                  issuer={rfp.issuer || "Unknown"}
                  referenceId={rfp.reference_id || "N/A"}
                  deadline={new Date(rfp.created_at).toLocaleDateString()}
                  status="draft"
                  requirementsCount={requirements[rfp.id] || 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}