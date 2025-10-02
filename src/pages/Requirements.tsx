import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Requirement {
  id: string;
  text: string;
  type: string | null;
  category: string | null;
  priority: string | null;
  source_page: number | null;
  source_section: string | null;
}

export default function Requirements() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('rfp_requirements')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;

      setRequirements(data || []);
    } catch (error) {
      console.error('Error loading requirements:', error);
      toast.error("Failed to load requirements");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequirements = requirements.filter((req) =>
    req.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (req.type && req.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (req.category && req.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const typeColors = {
    mandatory: "default",
    optional: "secondary",
    gating: "destructive"
  } as const;

  const priorityColors = {
    high: "destructive",
    medium: "default",
    low: "secondary"
  } as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Requirements Matrix
          </h1>
          <p className="text-muted-foreground text-lg">
            Track and manage all RFP requirements
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search requirements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-base"
          />
        </div>

        {/* Requirements Table */}
        <Card className="p-6">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading requirements...
            </div>
          ) : requirements.length === 0 ? (
            <div className="text-center space-y-4 py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground text-lg">No requirements found</p>
              <p className="text-sm text-muted-foreground">
                Upload an RFP to extract requirements
              </p>
              <Button onClick={() => navigate("/upload")}>
                Upload RFP
              </Button>
            </div>
          ) : filteredRequirements.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No requirements match your search
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Requirement</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Type</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Category</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Priority</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequirements.map((req) => (
                    <tr key={req.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4 text-sm">{req.text}</td>
                      <td className="py-4 px-4">
                        <Badge variant={req.type && req.type in typeColors ? typeColors[req.type as keyof typeof typeColors] : "secondary"}>
                          {req.type || 'N/A'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline">{req.category || 'N/A'}</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge 
                          variant={req.priority && req.priority in priorityColors ? priorityColors[req.priority as keyof typeof priorityColors] : "secondary"}
                        >
                          {req.priority || 'N/A'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground">
                        {req.source_page ? `Page ${req.source_page}` : ''}
                        {req.source_page && req.source_section ? ' • ' : ''}
                        {req.source_section || ''}
                        {!req.source_page && !req.source_section ? 'N/A' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}