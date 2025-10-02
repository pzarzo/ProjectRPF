import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import UploadZone from "@/components/upload/UploadZone";
import { Loader2, ArrowRight, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ExtractedRfp {
  id: string;
  title: string;
  issuer: string;
  reference_id: string;
  budget_cap_amount: number;
  budget_cap_currency: string;
  duration_months: number;
  language: string;
  confidence: number;
  scope_summary: string;
  deadlines: Array<{
    type: string;
    datetime_iso: string;
    timezone: string;
  }>;
  requirements: Array<{
    text: string;
    type: string;
    category: string;
  }>;
}

export default function UploadParse() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedRfp | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setExtractedData(null);
    toast.success("File selected successfully");
  };

  const handleParse = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    try {
      console.log('Starting RFP extraction...');
      
      const formData = new FormData();
      formData.append('file', file);

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error("Please log in to upload RFPs");
      }

      console.log('Calling extract-rfp function...');
      
      // Set a timeout for the function call
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - please try a smaller file')), 60000)
      );

      const functionPromise = supabase.functions.invoke('extract-rfp', {
        body: formData,
      });

      const { data, error } = await Promise.race([functionPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Server error:', data.error);
        throw new Error(data.error);
      }

      console.log('Extraction successful:', data);
      setExtractedData(data.extracted);
      toast.success("RFP parsed successfully! Data saved to database.");
    } catch (error) {
      console.error('Error parsing RFP:', error);
      let errorMessage = "Parsing failed, please try again";
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = "Request timeout - the file may be too large. Try a smaller file or a different format.";
        } else if (error.message.includes('not authenticated')) {
          errorMessage = "Please log in again to upload RFPs";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      setExtractedData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setFile(null);
    setExtractedData(null);
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

          {file && !extractedData && (
            <div className="mt-8 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handleRetry}
                disabled={isProcessing}
              >
                Change File
              </Button>
              <Button
                onClick={handleParse}
                disabled={isProcessing}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing document...
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
        {extractedData && (
          <Card className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                Extracted Information
              </h2>
              <div className="flex items-center space-x-2 text-sm">
                <div className="px-3 py-1 rounded-full bg-success/10 text-success font-medium">
                  Confidence: {Math.round((extractedData.confidence || 0) * 100)}%
                </div>
              </div>
            </div>

            {/* Extracted data from AI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {extractedData.title && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Title</div>
                  <div className="text-foreground">{extractedData.title}</div>
                </div>
              )}
              {extractedData.issuer && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Issuer</div>
                  <div className="text-foreground">{extractedData.issuer}</div>
                </div>
              )}
              {extractedData.reference_id && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Reference ID</div>
                  <div className="text-foreground">{extractedData.reference_id}</div>
                </div>
              )}
              {extractedData.deadlines && extractedData.deadlines.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Submission Deadline</div>
                  <div className="text-foreground">
                    {new Date(extractedData.deadlines.find(d => d.type === 'submission')?.datetime_iso || extractedData.deadlines[0].datetime_iso).toLocaleString()}
                  </div>
                </div>
              )}
              {extractedData.budget_cap_amount && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Budget Cap</div>
                  <div className="text-foreground">
                    {extractedData.budget_cap_currency} {extractedData.budget_cap_amount.toLocaleString()}
                  </div>
                </div>
              )}
              {extractedData.duration_months && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Duration</div>
                  <div className="text-foreground">{extractedData.duration_months} months</div>
                </div>
              )}
            </div>

            {extractedData.scope_summary && (
              <div className="pt-6 border-t border-border">
                <div className="text-sm font-medium text-muted-foreground mb-3">Scope Summary</div>
                <div className="text-foreground leading-relaxed">
                  {extractedData.scope_summary}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-border">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>
                  {extractedData.requirements?.length || 0} requirements • {extractedData.deadlines?.length || 0} deadlines
                </span>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={handleRetry}
                >
                  Upload Another
                </Button>
                <Button 
                  size="lg"
                  onClick={() => navigate('/timeline')}
                >
                  Continue to Timeline
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
