import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import UploadZone from "@/components/upload/UploadZone";
import { Loader2, ArrowRight, FileText } from "lucide-react";
import { toast } from "sonner";

export default function UploadParse() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsed, setIsParsed] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsed(false);
    toast.success("File selected successfully");
  };

  const handleParse = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    // Simulate parsing - will be replaced with real AI extraction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setIsParsed(true);
    toast.success("RFP parsed successfully");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Upload & Parse RFP
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload your RFP document to extract and normalize key information
          </p>
        </div>

        {/* Upload Section */}
        <Card className="p-8">
          <UploadZone onFileSelect={handleFileSelect} />

          {file && !isParsed && (
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleParse}
                disabled={isProcessing}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Parse Document
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>

        {/* Results Preview - shown after parsing */}
        {isParsed && (
          <Card className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                Extracted Information
              </h2>
              <div className="flex items-center space-x-2 text-sm">
                <div className="px-3 py-1 rounded-full bg-success/10 text-success font-medium">
                  Confidence: 87%
                </div>
              </div>
            </div>

            {/* Sample extracted data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Title</div>
                <div className="text-foreground">IT Infrastructure Modernization Project</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Issuer</div>
                <div className="text-foreground">Ministry of Digital Affairs</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Reference ID</div>
                <div className="text-foreground">RFP-2025-IT-001</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Submission Deadline</div>
                <div className="text-foreground">2025-11-15 17:00 CET</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Contract Type</div>
                <div className="text-foreground">Fixed Price</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Budget Cap</div>
                <div className="text-foreground">€2,500,000</div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="text-sm font-medium text-muted-foreground mb-3">Scope Summary</div>
              <div className="text-foreground leading-relaxed">
                Complete modernization of IT infrastructure including network architecture, 
                server migration, security implementation, and staff training. Project duration: 18 months.
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-border">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>45 requirements extracted • 12 deadlines identified</span>
              </div>
              <Button size="lg">
                Continue to Timeline
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
