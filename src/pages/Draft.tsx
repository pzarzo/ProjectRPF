import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, Save, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const SECTIONS = [
  { key: "executive_summary", name: "Executive Summary" },
  { key: "approach_methodology", name: "Approach & Methodology" },
  { key: "implementation_plan", name: "Implementation Plan" },
  { key: "budget_narrative", name: "Budget Narrative" },
  { key: "team_cvs", name: "Team & CVs" },
  { key: "risk_mitigation", name: "Risk & Mitigation" },
  { key: "past_performance", name: "Past Performance" },
  { key: "compliance_matrix", name: "Compliance Matrix" }
];

export default function Draft() {
  const { toast } = useToast();
  const [rfps, setRfps] = useState<any[]>([]);
  const [selectedRfp, setSelectedRfp] = useState<string | null>(null);
  const [sections, setSections] = useState<any>({});
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [loadingRfps, setLoadingRfps] = useState(true);

  useEffect(() => {
    loadRfps();
  }, []);

  useEffect(() => {
    if (selectedRfp) {
      loadDrafts();
    }
  }, [selectedRfp]);

  const loadRfps = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('rfps')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRfps(data || []);
      if (data && data.length > 0 && !selectedRfp) {
        setSelectedRfp(data[0].id);
      }
    } catch (error) {
      console.error('Error loading RFPs:', error);
      toast({
        title: "Error",
        description: "Failed to load RFPs",
        variant: "destructive"
      });
    } finally {
      setLoadingRfps(false);
    }
  };

  const loadDrafts = async () => {
    if (!selectedRfp) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('draft_sections')
        .select('*')
        .eq('rfp_id', selectedRfp)
        .eq('user_id', user.id);

      if (error) throw error;

      const sectionsMap: any = {};
      data?.forEach((draft: any) => {
        sectionsMap[draft.section_key] = draft;
      });
      setSections(sectionsMap);
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  };

  const generateDraft = async (sectionKey: string) => {
    setLoading({ ...loading, [sectionKey]: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: rfpData } = await supabase
        .from('rfps')
        .select('*')
        .eq('id', selectedRfp)
        .single();

      const { data, error } = await supabase.functions.invoke('draft-section', {
        body: { 
          rfp_json: rfpData,
          section_key: sectionKey,
          rfp_id: selectedRfp
        }
      });

      if (error) throw error;

      setSections({ ...sections, [sectionKey]: data });
      toast({
        title: "Success",
        description: "Draft generated successfully"
      });
    } catch (error: any) {
      console.error('Error generating draft:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate draft",
        variant: "destructive"
      });
    } finally {
      setLoading({ ...loading, [sectionKey]: false });
    }
  };

  const saveDraft = async (sectionKey: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const section = sections[sectionKey];
      if (!section) return;

      const { error } = await supabase
        .from('draft_sections')
        .upsert({
          rfp_id: selectedRfp,
          user_id: user.id,
          section_key: sectionKey,
          content: section.content,
          why_it_scores: section.why_it_scores,
          placeholders_needed: section.placeholders_needed,
          risks: section.risks
        });

      if (error) throw error;

      setEditingSection(null);
      toast({
        title: "Success",
        description: "Draft saved successfully"
      });
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save draft",
        variant: "destructive"
      });
    }
  };

  const updateSectionContent = (sectionKey: string, content: string) => {
    setSections({
      ...sections,
      [sectionKey]: {
        ...sections[sectionKey],
        content
      }
    });
  };

  if (loadingRfps) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (rfps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Upload an RFP first to start drafting</h2>
        <p className="text-muted-foreground">Go to Upload & Parse to add your first RFP</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Draft Builder – Create your proposal</h1>
        <p className="text-muted-foreground">Generate and edit proposal sections for your RFP</p>
      </div>

      {rfps.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select RFP</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedRfp || ''}
              onChange={(e) => setSelectedRfp(e.target.value)}
            >
              {rfps.map((rfp) => (
                <option key={rfp.id} value={rfp.id}>
                  {rfp.title}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {SECTIONS.map((section) => {
          const draft = sections[section.key];
          const isEditing = editingSection === section.key;
          const isLoading = loading[section.key];

          return (
            <Card key={section.key}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{section.name}</span>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Suggestions
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Suggested snippets</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Knowledge Base suggestions for {section.name} will appear here.
                        </p>
                      </div>
                    </SheetContent>
                  </Sheet>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!draft && (
                  <Button
                    onClick={() => generateDraft(section.key)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Draft
                      </>
                    )}
                  </Button>
                )}

                {draft && (
                  <>
                    <Textarea
                      value={draft.content || ''}
                      onChange={(e) => updateSectionContent(section.key, e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                      disabled={!isEditing && !isLoading}
                    />
                    
                    {draft.why_it_scores && (
                      <div className="p-4 bg-muted rounded-md">
                        <h4 className="font-semibold text-sm mb-2">Why it scores:</h4>
                        <p className="text-sm">{draft.why_it_scores}</p>
                      </div>
                    )}

                    {draft.risks && (
                      <div className="p-4 bg-destructive/10 rounded-md">
                        <h4 className="font-semibold text-sm mb-2">Risks:</h4>
                        <p className="text-sm">{draft.risks}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button onClick={() => saveDraft(section.key)}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button variant="outline" onClick={() => setEditingSection(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => setEditingSection(section.key)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => generateDraft(section.key)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            Regenerate
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
