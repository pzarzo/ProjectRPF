import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, AlertCircle, CheckCircle2, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const mockRequirements = [
  {
    id: "1",
    text: "Provide ISO 27001 certification",
    type: "mandatory",
    category: "eligibility",
    priority: "high",
    evidence: "ISO27001_Certificate.pdf",
    sourcePage: 12,
    sourceSection: "Section 3.2"
  },
  {
    id: "2",
    text: "Minimum 5 years experience in public sector IT projects",
    type: "gating",
    category: "eligibility",
    priority: "critical",
    evidence: "Company_Profile.pdf",
    sourcePage: 8,
    sourceSection: "Section 2.1"
  },
  {
    id: "3",
    text: "Submit detailed project methodology",
    type: "mandatory",
    category: "methodology",
    priority: "high",
    evidence: "Pending",
    sourcePage: 24,
    sourceSection: "Section 5.3"
  },
  {
    id: "4",
    text: "Provide references from at least 3 similar projects",
    type: "mandatory",
    category: "docs",
    priority: "medium",
    evidence: "References.pdf",
    sourcePage: 15,
    sourceSection: "Section 3.5"
  },
  {
    id: "5",
    text: "Optional: Cloud migration experience",
    type: "optional",
    category: "eligibility",
    priority: "low",
    evidence: "N/A",
    sourcePage: 19,
    sourceSection: "Section 4.2"
  },
];

const typeConfig = {
  mandatory: { label: "Mandatory", className: "bg-destructive text-destructive-foreground", icon: AlertCircle },
  gating: { label: "Gating", className: "bg-warning text-warning-foreground", icon: AlertCircle },
  optional: { label: "Optional", className: "bg-muted text-muted-foreground", icon: MinusCircle },
};

const priorityConfig = {
  critical: { label: "Critical", className: "text-destructive font-bold" },
  high: { label: "High", className: "text-warning font-semibold" },
  medium: { label: "Medium", className: "text-foreground" },
  low: { label: "Low", className: "text-muted-foreground" },
};

export default function Requirements() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRequirements = mockRequirements.filter((req) =>
    req.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Total Requirements</div>
            <div className="text-3xl font-bold text-foreground">45</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Gating</div>
            <div className="text-3xl font-bold text-warning">8</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Mandatory</div>
            <div className="text-3xl font-bold text-destructive">24</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Completed</div>
            <div className="text-3xl font-bold text-success">32</div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search requirements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Requirements Table */}
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Requirement</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">Evidence</TableHead>
                <TableHead className="font-semibold">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequirements.map((req) => {
                const typeInfo = typeConfig[req.type as keyof typeof typeConfig];
                const priorityInfo = priorityConfig[req.priority as keyof typeof priorityConfig];
                
                return (
                  <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium max-w-md">
                      {req.text}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("flex items-center w-fit gap-1", typeInfo.className)}>
                        <typeInfo.icon className="h-3 w-3" />
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground capitalize">
                        {req.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-sm", priorityInfo.className)}>
                        {priorityInfo.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {req.evidence === "Pending" ? (
                          <Badge variant="outline" className="text-warning border-warning">
                            Pending
                          </Badge>
                        ) : req.evidence === "N/A" ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            N/A
                          </Badge>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-sm text-foreground">{req.evidence}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        <div>Page {req.sourcePage}</div>
                        <div>{req.sourceSection}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
