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

      // Define 5 example RFPs
      const examples = [
        {
          title: 'UNOPS FO/2025/1 - National IP Georgia',
          issuer: 'UNOPS',
          reference_id: 'FO/2025/1',
          budget_cap_amount: 170000,
          budget_cap_currency: 'USD',
          duration_months: 12,
          language: 'en',
          deadlines: [
            { type: 'clarifications', datetime_iso: '2025-10-05T12:00:00', timezone: 'UTC+4' },
            { type: 'submission', datetime_iso: '2025-10-12T17:00:00', timezone: 'UTC+4' },
          ],
          criteria: [
            { name: 'Technical Approach', weight: 60, method: 'weighted', details: 'Quality and feasibility of methodology' },
            { name: 'Team Qualifications', weight: 40, method: 'weighted', details: 'Experience and expertise of key personnel' },
          ],
          requirements: [
            { text: 'Minimum 5 years of experience in project management', type: 'mandatory', category: 'Qualifications', priority: 'high', source_page: 3, source_section: '3.1 Experience' },
            { text: 'Team must include at least 1 certified project manager (PMP or equivalent)', type: 'mandatory', category: 'Qualifications', priority: 'high', source_page: 3, source_section: '3.1 Team' },
            { text: 'Previous experience in Georgia or similar context preferred', type: 'optional', category: 'Experience', priority: 'medium', source_page: 4, source_section: '3.2 Context' },
            { text: 'Submit detailed CVs for all key personnel', type: 'gating', category: 'Documentation', priority: 'critical', source_page: 5, source_section: '4.1 Submissions' },
            { text: 'Provide financial proposal in USD', type: 'mandatory', category: 'Financial', priority: 'high', source_page: 6, source_section: '4.2 Budget' },
            { text: 'Include methodology for stakeholder engagement', type: 'mandatory', category: 'Technical', priority: 'high', source_page: 7, source_section: '5.1 Methodology' },
          ],
          documents: ['CVs of Key Personnel', 'Budget Breakdown Form', 'Company Registration Certificate', 'Technical Methodology Document'],
        },
        {
          title: 'EU DEVCO/2025/42 - Climate Adaptation Project',
          issuer: 'European Commission',
          reference_id: 'DEVCO/2025/42',
          budget_cap_amount: 500000,
          budget_cap_currency: 'EUR',
          duration_months: 24,
          language: 'en',
          deadlines: [
            { type: 'clarifications', datetime_iso: '2025-11-10T17:00:00', timezone: 'CET' },
            { type: 'submission', datetime_iso: '2025-11-25T23:59:00', timezone: 'CET' },
          ],
          criteria: [
            { name: 'Technical Quality', weight: 50, method: 'weighted', details: 'Innovation and technical soundness' },
            { name: 'Cost Efficiency', weight: 30, method: 'weighted', details: 'Value for money assessment' },
            { name: 'Environmental Impact', weight: 20, method: 'weighted', details: 'Sustainability considerations' },
          ],
          requirements: [
            { text: 'Organization must have ISO 14001 certification', type: 'mandatory', category: 'Certifications', priority: 'high', source_page: 2, source_section: '2.1 Eligibility' },
            { text: 'Minimum 3 similar projects completed in last 5 years', type: 'mandatory', category: 'Experience', priority: 'high', source_page: 2, source_section: '2.2 Track Record' },
            { text: 'Team leader must have PhD or 10+ years experience in climate science', type: 'gating', category: 'Qualifications', priority: 'critical', source_page: 3, source_section: '3.1 Team' },
            { text: 'Proposal must include carbon footprint assessment', type: 'mandatory', category: 'Technical', priority: 'medium', source_page: 4, source_section: '4.1 Environmental' },
            { text: 'Partnership with local NGOs is encouraged', type: 'optional', category: 'Partnerships', priority: 'low', source_page: 5, source_section: '5.1 Collaboration' },
            { text: 'Submit detailed work plan with milestones', type: 'mandatory', category: 'Planning', priority: 'high', source_page: 6, source_section: '6.1 Timeline' },
            { text: 'Include risk management framework', type: 'mandatory', category: 'Management', priority: 'high', source_page: 7, source_section: '7.1 Risks' },
          ],
          documents: ['ISO 14001 Certificate', 'CVs and References', 'Project Portfolio', 'Budget Template', 'Work Plan'],
        },
        {
          title: 'USAID/Tanzania/2025-089 - Health Systems Strengthening',
          issuer: 'USAID',
          reference_id: 'USAID/TZ/2025-089',
          budget_cap_amount: 2500000,
          budget_cap_currency: 'USD',
          duration_months: 36,
          language: 'en',
          deadlines: [
            { type: 'clarifications', datetime_iso: '2025-12-01T15:00:00', timezone: 'EAT' },
            { type: 'submission', datetime_iso: '2025-12-20T17:00:00', timezone: 'EAT' },
          ],
          criteria: [
            { name: 'Technical Capacity', weight: 40, method: 'weighted', details: 'Demonstrated health sector expertise' },
            { name: 'Management Systems', weight: 30, method: 'weighted', details: 'Project management and oversight capabilities' },
            { name: 'Local Partnerships', weight: 20, method: 'weighted', details: 'Collaboration with Tanzanian institutions' },
            { name: 'Cost Proposal', weight: 10, method: 'weighted', details: 'Budget reasonableness and efficiency' },
          ],
          requirements: [
            { text: 'Lead organization must have $10M+ annual revenue', type: 'gating', category: 'Financial', priority: 'critical', source_page: 1, source_section: '1.1 Eligibility' },
            { text: 'Minimum 10 years operating in East Africa', type: 'mandatory', category: 'Experience', priority: 'high', source_page: 2, source_section: '2.1 Regional' },
            { text: 'Previous USAID implementation experience required', type: 'mandatory', category: 'Experience', priority: 'high', source_page: 2, source_section: '2.2 Donor' },
            { text: 'Chief of Party must have MPH or equivalent', type: 'mandatory', category: 'Qualifications', priority: 'high', source_page: 3, source_section: '3.1 Leadership' },
            { text: 'Submit NICRA or indirect cost rate agreement', type: 'mandatory', category: 'Financial', priority: 'medium', source_page: 4, source_section: '4.1 Compliance' },
            { text: 'Include monitoring and evaluation framework', type: 'mandatory', category: 'Technical', priority: 'high', source_page: 5, source_section: '5.1 M&E' },
            { text: 'Gender equality and social inclusion strategy required', type: 'mandatory', category: 'Cross-cutting', priority: 'medium', source_page: 6, source_section: '6.1 GESI' },
            { text: 'Partnership with Ministry of Health preferred', type: 'optional', category: 'Partnerships', priority: 'low', source_page: 7, source_section: '7.1 Government' },
          ],
          documents: ['SF-424 Application Form', 'CVs Key Personnel', 'Past Performance References', 'Cost Proposal', 'MEL Plan'],
        },
        {
          title: 'World Bank 2025/AFRI/256 - Infrastructure Development',
          issuer: 'World Bank',
          reference_id: 'WB/AFRI/256',
          budget_cap_amount: 5000000,
          budget_cap_currency: 'USD',
          duration_months: 48,
          language: 'en',
          deadlines: [
            { type: 'clarifications', datetime_iso: '2026-01-15T12:00:00', timezone: 'EST' },
            { type: 'submission', datetime_iso: '2026-02-01T17:00:00', timezone: 'EST' },
          ],
          criteria: [
            { name: 'Technical Expertise', weight: 45, method: 'weighted', details: 'Engineering and infrastructure design capability' },
            { name: 'Financial Capacity', weight: 25, method: 'weighted', details: 'Financial stability and resources' },
            { name: 'Past Performance', weight: 20, method: 'weighted', details: 'Track record on similar projects' },
            { name: 'Sustainability Approach', weight: 10, method: 'weighted', details: 'Environmental and social safeguards' },
          ],
          requirements: [
            { text: 'Firm must be registered engineering company with 15+ years experience', type: 'gating', category: 'Qualifications', priority: 'critical', source_page: 1, source_section: '1.1 Eligibility' },
            { text: 'Team must include licensed civil engineers', type: 'mandatory', category: 'Qualifications', priority: 'high', source_page: 2, source_section: '2.1 Technical' },
            { text: 'Minimum 5 infrastructure projects >$3M completed', type: 'mandatory', category: 'Experience', priority: 'high', source_page: 2, source_section: '2.2 Portfolio' },
            { text: 'Submit World Bank sanctions screening confirmation', type: 'mandatory', category: 'Compliance', priority: 'high', source_page: 3, source_section: '3.1 Integrity' },
            { text: 'Include environmental and social management plan', type: 'mandatory', category: 'Safeguards', priority: 'high', source_page: 4, source_section: '4.1 ESMP' },
            { text: 'Provide audited financial statements for last 3 years', type: 'mandatory', category: 'Financial', priority: 'medium', source_page: 5, source_section: '5.1 Financial' },
            { text: 'Local content plan preferred', type: 'optional', category: 'Social', priority: 'low', source_page: 6, source_section: '6.1 Local' },
            { text: 'Quality assurance and quality control procedures required', type: 'mandatory', category: 'Management', priority: 'medium', source_page: 7, source_section: '7.1 QA/QC' },
            { text: 'Submit detailed construction methodology', type: 'mandatory', category: 'Technical', priority: 'high', source_page: 8, source_section: '8.1 Methods' },
          ],
          documents: ['Company Profile', 'Engineering Licenses', 'Financial Statements', 'ESMP Template', 'Technical Proposal'],
        },
        {
          title: 'UNDP/PAK/2025/017 - Governance and Rule of Law',
          issuer: 'UNDP Pakistan',
          reference_id: 'UNDP/PAK/017',
          budget_cap_amount: 750000,
          budget_cap_currency: 'USD',
          duration_months: 18,
          language: 'en',
          deadlines: [
            { type: 'clarifications', datetime_iso: '2025-10-20T14:00:00', timezone: 'PKT' },
            { type: 'submission', datetime_iso: '2025-11-05T16:00:00', timezone: 'PKT' },
          ],
          criteria: [
            { name: 'Governance Expertise', weight: 50, method: 'weighted', details: 'Knowledge of governance and justice systems' },
            { name: 'Local Knowledge', weight: 30, method: 'weighted', details: 'Understanding of Pakistan context' },
            { name: 'Implementation Approach', weight: 20, method: 'weighted', details: 'Methodology and innovation' },
          ],
          requirements: [
            { text: 'Organization must have legal registration in Pakistan', type: 'gating', category: 'Eligibility', priority: 'critical', source_page: 1, source_section: '1.1 Registration' },
            { text: 'Minimum 7 years experience in governance programming', type: 'mandatory', category: 'Experience', priority: 'high', source_page: 2, source_section: '2.1 Sector' },
            { text: 'Team leader must have postgraduate degree in law, political science or related field', type: 'mandatory', category: 'Qualifications', priority: 'high', source_page: 3, source_section: '3.1 Education' },
            { text: 'Previous work with judiciary or law enforcement agencies required', type: 'mandatory', category: 'Experience', priority: 'medium', source_page: 3, source_section: '3.2 Partnerships' },
            { text: 'Submit capacity statement and organizational chart', type: 'mandatory', category: 'Documentation', priority: 'medium', source_page: 4, source_section: '4.1 Capacity' },
            { text: 'Include stakeholder engagement strategy', type: 'mandatory', category: 'Technical', priority: 'high', source_page: 5, source_section: '5.1 Engagement' },
            { text: 'Experience with UN agencies preferred', type: 'optional', category: 'Experience', priority: 'low', source_page: 6, source_section: '6.1 UN System' },
            { text: 'Submit anti-corruption and ethics policy', type: 'mandatory', category: 'Compliance', priority: 'medium', source_page: 7, source_section: '7.1 Ethics' },
          ],
          documents: ['Registration Certificate', 'CVs Team Members', 'Organizational Chart', 'Technical Proposal', 'Budget Narrative'],
        },
      ];

      // Randomly select one example
      const example = examples[Math.floor(Math.random() * examples.length)];

      // Insert RFP
      const { data: rfpData, error: rfpError } = await (supabase as any)
        .from('rfps')
        .insert({
          user_id: user.id,
          title: example.title,
          issuer: example.issuer,
          reference_id: example.reference_id,
          budget_cap_amount: example.budget_cap_amount,
          budget_cap_currency: example.budget_cap_currency,
          duration_months: example.duration_months,
          language: example.language,
          confidence: 0.9,
        })
        .select()
        .single();

      if (rfpError) throw rfpError;

      // Insert deadlines
      await (supabase as any).from('rfp_deadlines').insert(
        example.deadlines.map(d => ({ rfp_id: rfpData.id, ...d }))
      );

      // Insert evaluation criteria
      await (supabase as any).from('evaluation_criteria').insert(
        example.criteria.map(c => ({ rfp_id: rfpData.id, ...c }))
      );

      // Insert requirements
      await (supabase as any).from('rfp_requirements').insert(
        example.requirements.map(r => ({ rfp_id: rfpData.id, ...r }))
      );

      // Insert required documents as attachments
      await (supabase as any).from('attachments').insert(
        example.documents.map((doc, idx) => ({
          rfp_id: rfpData.id,
          type: 'required_document',
          filename: doc,
          url: `placeholder://document-${idx}`,
          signed: false,
        }))
      );

      toast.success(`Loaded example: ${example.title}`);
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