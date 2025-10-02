import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle, AlertCircle, FileQuestion, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type ComplianceStatus = 'complies' | 'missing_info' | 'fail' | 'not_applicable';

interface Requirement {
  id: string;
  text: string;
  type: string;
  priority: string;
  category: string;
}

interface ComplianceItem {
  id: string;
  requirement_id: string;
  status: ComplianceStatus;
  evidence: string;
  action_item: string;
  owner: string;
  due_date: string;
}

export default function Compliance() {
  const { toast } = useToast();
  const [rfps, setRfps] = useState<any[]>([]);
  const [selectedRfp, setSelectedRfp] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [complianceItems, setComplianceItems] = useState<{ [key: string]: ComplianceItem }>({});
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadRfps();
  }, []);

  useEffect(() => {
    if (selectedRfp) {
      loadRequirements();
      loadComplianceItems();
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
    } finally {
      setLoading(false);
    }
  };

  const loadRequirements = async () => {
    if (!selectedRfp) return;

    try {
      const { data, error } = await supabase
        .from('rfp_requirements')
        .select('*')
        .eq('rfp_id', selectedRfp)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRequirements(data || []);
    } catch (error) {
      console.error('Error loading requirements:', error);
    }
  };

  const loadComplianceItems = async () => {
    if (!selectedRfp) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('compliance_items')
        .select('*')
        .eq('rfp_id', selectedRfp)
        .eq('user_id', user.id);

      if (error) throw error;

      const itemsMap: { [key: string]: ComplianceItem } = {};
      data?.forEach((item: any) => {
        itemsMap[item.requirement_id] = item;
      });
      setComplianceItems(itemsMap);
    } catch (error) {
      console.error('Error loading compliance items:', error);
    }
  };

  const updateComplianceItem = async (requirementId: string, field: string, value: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const currentItem = complianceItems[requirementId];
      const updatedItem = {
        ...currentItem,
        rfp_id: selectedRfp,
        requirement_id: requirementId,
        user_id: user.id,
        [field]: value
      };

      const { error } = await supabase
        .from('compliance_items')
        .upsert(updatedItem);

      if (error) throw error;

      setComplianceItems({
        ...complianceItems,
        [requirementId]: updatedItem
      });

      toast({
        title: "Success",
        description: "Compliance item updated"
      });
    } catch (error: any) {
      console.error('Error updating compliance item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update",
        variant: "destructive"
      });
    }
  };

  const runComplianceCheck = async () => {
    setChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('check-compliance', {
        body: { rfp_id: selectedRfp }
      });

      if (error) throw error;

      toast({
        title: "Compliance Check Complete",
        description: data.message || "Check completed successfully"
      });

      await loadComplianceItems();
    } catch (error: any) {
      console.error('Error running compliance check:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to run compliance check",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  const getStatusIcon = (status: ComplianceStatus) => {
    switch (status) {
      case 'complies':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'missing_info':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'not_applicable':
        return <FileQuestion className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: ComplianceStatus) => {
    const variants: { [key in ComplianceStatus]: string } = {
      complies: 'bg-green-100 text-green-800',
      missing_info: 'bg-yellow-100 text-yellow-800',
      fail: 'bg-red-100 text-red-800',
      not_applicable: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const calculateStats = () => {
    const total = requirements.length;
    const complies = requirements.filter(r => complianceItems[r.id]?.status === 'complies').length;
    const missingInfo = requirements.filter(r => complianceItems[r.id]?.status === 'missing_info' || !complianceItems[r.id]).length;
    const fail = requirements.filter(r => complianceItems[r.id]?.status === 'fail').length;
    const notApplicable = requirements.filter(r => complianceItems[r.id]?.status === 'not_applicable').length;
    const percentage = total > 0 ? Math.round((complies / total) * 100) : 0;

    return { total, complies, missingInfo, fail, notApplicable, percentage };
  };

  const getFilteredRequirements = () => {
    return requirements.filter(req => {
      const matchesStatus = filterStatus === 'all' || 
        (complianceItems[req.id]?.status || 'missing_info') === filterStatus;
      const matchesType = filterType === 'all' || req.type === filterType;
      return matchesStatus && matchesType;
    });
  };

  const getPendingActionItems = () => {
    return requirements
      .filter(req => {
        const item = complianceItems[req.id];
        return item?.action_item && item.status !== 'complies';
      })
      .map(req => ({
        requirement: req.text,
        action: complianceItems[req.id].action_item,
        owner: complianceItems[req.id].owner,
        dueDate: complianceItems[req.id].due_date
      }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FileQuestion className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No requirements loaded yet</h2>
        <p className="text-muted-foreground">Upload an RFP and generate requirements first</p>
      </div>
    );
  }

  const stats = calculateStats();
  const filteredReqs = getFilteredRequirements();
  const pendingActions = getPendingActionItems();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Compliance Check – Verify proposal requirements</h1>
          <p className="text-muted-foreground">Track and verify RFP requirements compliance</p>
        </div>
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <AlertCircle className="h-4 w-4 mr-2" />
                Action Items ({pendingActions.length})
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Pending Action Items</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {pendingActions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending action items</p>
                ) : (
                  pendingActions.map((item, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4 space-y-2">
                        <p className="text-sm font-medium">{item.requirement}</p>
                        <p className="text-sm text-muted-foreground">{item.action}</p>
                        {item.owner && <p className="text-xs">Owner: {item.owner}</p>}
                        {item.dueDate && <p className="text-xs">Due: {new Date(item.dueDate).toLocaleDateString()}</p>}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Button onClick={runComplianceCheck} disabled={checking}>
            {checking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Compliance Check
          </Button>
        </div>
      </div>

      {rfps.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select RFP</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedRfp || ''} onValueChange={setSelectedRfp}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {rfps.map((rfp) => (
                  <SelectItem key={rfp.id} value={rfp.id}>
                    {rfp.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{stats.percentage}% Complete</span>
          </div>
          <Progress value={stats.percentage} className="h-3" />
          <div className="grid grid-cols-5 gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.complies}</p>
              <p className="text-sm text-muted-foreground">Complies</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.missingInfo}</p>
              <p className="text-sm text-muted-foreground">Missing Info</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.fail}</p>
              <p className="text-sm text-muted-foreground">Fail</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.notApplicable}</p>
              <p className="text-sm text-muted-foreground">N/A</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="complies">Complies</SelectItem>
              <SelectItem value="missing_info">Missing Info</SelectItem>
              <SelectItem value="fail">Fail</SelectItem>
              <SelectItem value="not_applicable">Not Applicable</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="mandatory">Mandatory</SelectItem>
              <SelectItem value="optional">Optional</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requirements ({filteredReqs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Requirement</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Action Item</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReqs.map((req) => {
                const item = complianceItems[req.id] || { 
                  id: '',
                  requirement_id: req.id,
                  status: 'missing_info' as ComplianceStatus,
                  evidence: '',
                  action_item: '',
                  owner: '',
                  due_date: ''
                };
                return (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.text}</TableCell>
                    <TableCell>
                      <Badge variant={req.priority === 'mandatory' ? 'destructive' : 'secondary'}>
                        {req.priority || req.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.status}
                        onValueChange={(value) => updateComplianceItem(req.id, 'status', value)}
                      >
                        <SelectTrigger className="w-[140px] bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="complies">Complies</SelectItem>
                          <SelectItem value="missing_info">Missing Info</SelectItem>
                          <SelectItem value="fail">Fail</SelectItem>
                          <SelectItem value="not_applicable">N/A</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.evidence || ''}
                        onChange={(e) => updateComplianceItem(req.id, 'evidence', e.target.value)}
                        placeholder="Evidence or link"
                        className="min-w-[150px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.action_item || ''}
                        onChange={(e) => updateComplianceItem(req.id, 'action_item', e.target.value)}
                        placeholder="Action needed"
                        className="min-w-[150px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.owner || ''}
                        onChange={(e) => updateComplianceItem(req.id, 'owner', e.target.value)}
                        placeholder="Owner"
                        className="min-w-[120px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : ''}
                        onChange={(e) => updateComplianceItem(req.id, 'due_date', e.target.value)}
                        className="min-w-[140px]"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
