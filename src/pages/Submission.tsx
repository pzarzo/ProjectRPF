import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Download, 
  Upload, 
  FileText, 
  Package, 
  Shield 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Rfp {
  id: string;
  title: string;
  issuer: string;
  reference_id: string;
}

interface DraftSection {
  id: string;
  section_key: string;
  content: string;
}

interface Attachment {
  id: string;
  filename: string;
  type: string;
  url: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  required: boolean;
}

interface ValidationResult {
  summary: {
    complies: number;
    missing: number;
    fail: number;
    na: number;
  };
  blocking: boolean;
  items: any[];
}

export default function Submission() {
  const [searchParams] = useSearchParams();
  const rfpId = searchParams.get("rfp");

  const [rfps, setRfps] = useState<Rfp[]>([]);
  const [selectedRfpId, setSelectedRfpId] = useState<string>(rfpId || "");
  const [selectedRfp, setSelectedRfp] = useState<Rfp | null>(null);
  const [draftSections, setDraftSections] = useState<DraftSection[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"checklist" | "content" | "attachments" | "export">("checklist");

  // Step 1: Checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "language", label: "Language matches RFP requirements", checked: false, required: true },
    { id: "page_limits", label: "Page limits per section respected", checked: false, required: true },
    { id: "documents", label: "Required documents uploaded", checked: false, required: true },
    { id: "price_sheet", label: "Price sheet/template provided", checked: false, required: false },
    { id: "signatures", label: "Signatures and seals completed", checked: false, required: false },
  ]);

  // Step 2: Content Selection
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  // Step 4: Validation & Export
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [exportFormat, setExportFormat] = useState<"docx" | "pdf" | "zip">("docx");
  const [exportProgress, setExportProgress] = useState(0);
  const [exportLogs, setExportLogs] = useState<string[]>([]);

  useEffect(() => {
    loadRfps();
  }, []);

  useEffect(() => {
    if (selectedRfpId) {
      loadRfpData(selectedRfpId);
    }
  }, [selectedRfpId]);

  const loadRfps = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('rfps')
        .select('id, title, issuer, reference_id')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRfps(data || []);
      
      if (data && data.length > 0 && !selectedRfpId) {
        setSelectedRfpId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading RFPs:', error);
      toast.error("Failed to load RFPs");
    }
  };

  const loadRfpData = async (rfpId: string) => {
    try {
      setIsLoading(true);

      // Load RFP details
      const { data: rfpData, error: rfpError } = await (supabase as any)
        .from('rfps')
        .select('*')
        .eq('id', rfpId)
        .single();

      if (rfpError) throw rfpError;
      setSelectedRfp(rfpData);

      // Load draft sections
      const { data: sectionsData, error: sectionsError } = await (supabase as any)
        .from('draft_sections')
        .select('*')
        .eq('rfp_id', rfpId);

      if (sectionsError) throw sectionsError;
      setDraftSections(sectionsData || []);
      setSelectedSections((sectionsData || []).map((s: DraftSection) => s.section_key));

      // Load attachments
      const { data: attachmentsData, error: attachmentsError } = await (supabase as any)
        .from('attachments')
        .select('*')
        .eq('rfp_id', rfpId);

      if (attachmentsError) throw attachmentsError;
      setAttachments(attachmentsData || []);

    } catch (error) {
      console.error('Error loading RFP data:', error);
      toast.error("Failed to load RFP data");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const toggleSection = (sectionKey: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionKey)
        ? prev.filter(s => s !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  const runValidation = async () => {
    if (!selectedRfpId) {
      toast.error("Please select an RFP");
      return;
    }

    try {
      setIsLoading(true);
      addLog("Starting validation...");

      const { data, error } = await supabase.functions.invoke('validate-submission', {
        body: { rfpId: selectedRfpId }
      });

      if (error) throw error;

      setValidationResult(data);
      addLog(`Validation complete: ${data.summary.complies} compliant, ${data.summary.fail} failed`);

      if (data.blocking) {
        toast.error("Blocking issues found. Please resolve them before exporting.");
      } else {
        toast.success("Validation passed!");
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      addLog(`Error: ${error.message}`);
      toast.error("Validation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const exportSubmission = async () => {
    if (!selectedRfpId) {
      toast.error("Please select an RFP");
      return;
    }

    if (validationResult?.blocking) {
      toast.error("Resolve blocking items first");
      return;
    }

    try {
      setIsLoading(true);
      setExportProgress(0);
      addLog(`Starting export (${exportFormat})...`);

      const { data, error } = await supabase.functions.invoke('export-submission', {
        body: { 
          rfpId: selectedRfpId, 
          format: exportFormat,
          includeSections: selectedSections
        }
      });

      if (error) throw error;

      setExportProgress(100);
      addLog(`Export complete: ${data.filename}`);
      
      // Trigger download
      window.open(data.url, '_blank');
      toast.success("Submission package exported successfully!");
    } catch (error: any) {
      console.error('Export error:', error);
      addLog(`Error: ${error.message}`);
      toast.error("Export failed");
    } finally {
      setIsLoading(false);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setExportLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const allChecklistPassed = checklist.every(item => !item.required || item.checked);

  if (rfps.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No RFPs Available</CardTitle>
            <CardDescription>Upload an RFP to get started with submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/upload'} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Upload RFP
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Submission Pack
            </h1>
            <p className="text-muted-foreground text-lg">
              Prepare and export your final RFP response package
            </p>
          </div>
          <Package className="h-12 w-12 text-primary" />
        </div>

        {/* RFP Selector */}
        {rfps.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select RFP</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedRfpId} onValueChange={setSelectedRfpId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an RFP" />
                </SelectTrigger>
                <SelectContent>
                  {rfps.map(rfp => (
                    <SelectItem key={rfp.id} value={rfp.id}>
                      {rfp.title} ({rfp.reference_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Steps Tabs */}
        <Tabs value={currentStep} onValueChange={(v) => setCurrentStep(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="checklist">1. Checklist</TabsTrigger>
            <TabsTrigger value="content">2. Content</TabsTrigger>
            <TabsTrigger value="attachments">3. Attachments</TabsTrigger>
            <TabsTrigger value="export">4. Export</TabsTrigger>
          </TabsList>

          {/* Step 1: Final Checklist */}
          <TabsContent value="checklist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Final Checklist</CardTitle>
                <CardDescription>Verify all submission requirements are met</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={item.checked}
                        onCheckedChange={() => toggleChecklistItem(item.id)}
                      />
                      <Label className="text-base cursor-pointer" onClick={() => toggleChecklistItem(item.id)}>
                        {item.label}
                        {item.required && <Badge variant="destructive" className="ml-2">Required</Badge>}
                      </Label>
                    </div>
                    {item.checked ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={() => setCurrentStep("content")} 
                disabled={!allChecklistPassed}
              >
                Continue to Content Selection
              </Button>
            </div>
          </TabsContent>

          {/* Step 2: Select Content */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Draft Sections</CardTitle>
                <CardDescription>Choose which sections to include in the final submission</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {draftSections.length === 0 ? (
                  <p className="text-muted-foreground">No draft sections available.</p>
                ) : (
                  draftSections.map(section => (
                    <div key={section.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedSections.includes(section.section_key)}
                        onCheckedChange={() => toggleSection(section.section_key)}
                      />
                      <Label className="text-base cursor-pointer flex-1" onClick={() => toggleSection(section.section_key)}>
                        {section.section_key}
                      </Label>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("checklist")}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep("attachments")}>
                Continue to Attachments
              </Button>
            </div>
          </TabsContent>

          {/* Step 3: Attachments */}
          <TabsContent value="attachments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attachments & Annexes</CardTitle>
                <CardDescription>Manage supporting documents for your submission</CardDescription>
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <p className="text-muted-foreground">No attachments uploaded yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attachments.map(att => (
                        <TableRow key={att.id}>
                          <TableCell>{att.filename}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{att.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Uploaded</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("content")}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep("export")}>
                Continue to Export
              </Button>
            </div>
          </TabsContent>

          {/* Step 4: Validation & Export */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Validation & Export</CardTitle>
                <CardDescription>Validate compliance and export your submission package</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Validation */}
                <div className="space-y-3">
                  <Button onClick={runValidation} disabled={isLoading} className="w-full">
                    <Shield className="mr-2 h-4 w-4" />
                    Run Final Validation
                  </Button>

                  {validationResult && (
                    <div className="grid grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-success">{validationResult.summary.complies}</div>
                            <div className="text-sm text-muted-foreground">Complies</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-warning">{validationResult.summary.missing}</div>
                            <div className="text-sm text-muted-foreground">Missing Info</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-destructive">{validationResult.summary.fail}</div>
                            <div className="text-sm text-muted-foreground">Fail</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-muted-foreground">{validationResult.summary.na}</div>
                            <div className="text-sm text-muted-foreground">N/A</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {validationResult?.blocking && (
                    <Card className="border-destructive">
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-2 text-destructive">
                          <AlertCircle className="h-5 w-5" />
                          <p className="font-semibold">Blocking issues detected. Resolve them before export.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Export Options */}
                <div className="space-y-3">
                  <Label>Export Format</Label>
                  <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="docx">DOCX (Word Document)</SelectItem>
                      <SelectItem value="pdf">PDF (Portable Document)</SelectItem>
                      <SelectItem value="zip">ZIP (Complete Package)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    onClick={exportSubmission} 
                    disabled={isLoading || validationResult?.blocking} 
                    className="w-full"
                    size="lg"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Export Submission Package
                  </Button>

                  {exportProgress > 0 && exportProgress < 100 && (
                    <Progress value={exportProgress} className="w-full" />
                  )}
                </div>

                {/* Logs */}
                {exportLogs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Activity Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
                        {exportLogs.map((log, i) => (
                          <div key={i} className="text-muted-foreground">{log}</div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setCurrentStep("attachments")}>
                Back
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
