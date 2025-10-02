import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import RfpCard from "@/components/rfp/RfpCard";
import { useNavigate } from "react-router-dom";

// Mock data - will be replaced with real data
const mockRfps = [
  {
    id: "1",
    title: "IT Infrastructure Modernization Project",
    issuer: "Ministry of Digital Affairs",
    referenceId: "RFP-2025-IT-001",
    deadline: "2025-11-15",
    status: "in-progress" as const,
    requirementsCount: 45,
    complianceScore: 72,
  },
  {
    id: "2",
    title: "Healthcare Management System Implementation",
    issuer: "National Health Service",
    referenceId: "RFP-2025-HS-008",
    deadline: "2025-10-30",
    status: "review" as const,
    requirementsCount: 38,
    complianceScore: 85,
  },
  {
    id: "3",
    title: "Smart City Infrastructure Development",
    issuer: "City Council of Madrid",
    referenceId: "RFP-2025-SC-023",
    deadline: "2025-12-01",
    status: "draft" as const,
    requirementsCount: 52,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

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
          <Button
            onClick={() => navigate("/upload")}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            New RFP
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-muted-foreground mb-2">Total RFPs</div>
            <div className="text-3xl font-bold text-foreground">12</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-muted-foreground mb-2">In Progress</div>
            <div className="text-3xl font-bold text-primary">5</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-muted-foreground mb-2">Compliant</div>
            <div className="text-3xl font-bold text-success">4</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-muted-foreground mb-2">Submitted</div>
            <div className="text-3xl font-bold text-secondary">3</div>
          </div>
        </div>

        {/* RFP List */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Active RFPs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRfps.map((rfp) => (
              <RfpCard key={rfp.id} {...rfp} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
