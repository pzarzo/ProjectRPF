import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Building2, FileText, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RfpCardProps {
  title: string;
  issuer: string;
  referenceId: string;
  deadline: string;
  status: "draft" | "in-progress" | "review" | "compliant" | "submitted";
  requirementsCount: number;
  complianceScore?: number;
  onDelete?: () => void;
}

const statusConfig = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  "in-progress": { label: "In Progress", className: "bg-primary text-primary-foreground" },
  review: { label: "In Review", className: "bg-warning text-warning-foreground" },
  compliant: { label: "Compliant", className: "bg-success text-success-foreground" },
  submitted: { label: "Submitted", className: "bg-secondary text-secondary-foreground" },
};

export default function RfpCard({
  title,
  issuer,
  referenceId,
  deadline,
  status,
  requirementsCount,
  complianceScore,
  onDelete,
}: RfpCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-border relative">
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      
      <CardHeader className="space-y-3 pr-12">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </CardTitle>
          <Badge className={cn("ml-2 flex-shrink-0", statusInfo.className)}>
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{issuer}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>{referenceId}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>{deadline}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Requirements</span>
            <span className="font-semibold text-foreground">{requirementsCount}</span>
          </div>
          {complianceScore !== undefined && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">Compliance</span>
              <span className={cn(
                "font-semibold",
                complianceScore >= 80 ? "text-success" : 
                complianceScore >= 50 ? "text-warning" : "text-destructive"
              )}>
                {complianceScore}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
