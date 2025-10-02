import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Library, 
  Plus, 
  Upload, 
  Search, 
  FileText, 
  Trash2, 
  BookTemplate, 
  Sparkles 
} from "lucide-react";

interface PastProposal {
  id: string;
  client: string;
  year: number;
  sector: string | null;
  country: string | null;
  contract_type: string | null;
  language: string;
  filename: string;
  uploaded_by: string | null;
}

interface Template {
  id: string;
  name: string;
  type: string;
  filename: string;
  description: string | null;
}

interface Snippet {
  id: string;
  title: string;
  content: string;
  sector: string | null;
  tags: string[] | null;
  source: string | null;
}

export default function Knowledge() {
  const [pastProposals, setPastProposals] = useState<PastProposal[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [snippetDialogOpen, setSnippetDialogOpen] = useState(false);
  const [newSnippet, setNewSnippet] = useState({
    title: "",
    content: "",
    sector: "",
    tags: "",
    source: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadPastProposals(),
        loadTemplates(),
        loadSnippets(),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPastProposals = async () => {
    const { data, error } = await (supabase as any)
      .from('past_proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading proposals:', error);
      toast.error("Failed to load proposals");
    } else {
      setPastProposals(data || []);
    }
  };

  const loadTemplates = async () => {
    const { data, error } = await (supabase as any)
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading templates:', error);
      toast.error("Failed to load templates");
    } else {
      setTemplates(data || []);
    }
  };

  const loadSnippets = async () => {
    const { data, error } = await (supabase as any)
      .from('snippets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading snippets:', error);
      toast.error("Failed to load snippets");
    } else {
      setSnippets(data || []);
    }
  };

  const handleSearchSemantic = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-knowledge', {
        body: { query: searchQuery }
      });

      if (error) throw error;

      toast.success(`Found ${data.results.length} similar items`);
      console.log('Search results:', data.results);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error("Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSnippet = async () => {
    if (!newSnippet.title || !newSnippet.content) {
      toast.error("Title and content are required");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in");
        return;
      }

      const { error } = await (supabase as any)
        .from('snippets')
        .insert({
          user_id: user.id,
          title: newSnippet.title,
          content: newSnippet.content,
          sector: newSnippet.sector || null,
          tags: newSnippet.tags ? newSnippet.tags.split(',').map(t => t.trim()) : null,
          source: newSnippet.source || null,
        });

      if (error) throw error;

      toast.success("Snippet added successfully");
      setSnippetDialogOpen(false);
      setNewSnippet({ title: "", content: "", sector: "", tags: "", source: "" });
      loadSnippets();
    } catch (error: any) {
      console.error('Error adding snippet:', error);
      toast.error("Failed to add snippet");
    }
  };

  const handleDeleteItem = async (type: 'proposal' | 'template' | 'snippet', id: string) => {
    try {
      const tableName = type === 'proposal' ? 'past_proposals' : type === 'template' ? 'templates' : 'snippets';
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(`${type} deleted successfully`);
      loadData();
    } catch (error: any) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(`Failed to delete ${type}`);
    }
  };

  const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: any) => (
    <Card className="p-12">
      <div className="text-center space-y-4">
        <Icon className="h-16 w-16 text-muted-foreground mx-auto" />
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {onAction && (
          <Button onClick={onAction}>
            <Plus className="mr-2 h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );

  const hasAnyData = pastProposals.length > 0 || templates.length > 0 || snippets.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Knowledge Base
            </h1>
            <p className="text-muted-foreground text-lg">
              Your reusable proposals and templates
            </p>
          </div>
          <Library className="h-12 w-12 text-primary" />
        </div>

        {/* Global empty state */}
        {!hasAnyData && !isLoading && (
          <EmptyState
            icon={Library}
            title="No items yet"
            description="Upload a proposal, template, or snippet to build your library"
            actionLabel="Get Started"
            onAction={() => {}}
          />
        )}

        {/* Search Bar */}
        {hasAnyData && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Semantic search across your knowledge base..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchSemantic()}
                  />
                </div>
                <Button onClick={handleSearchSemantic} disabled={isLoading}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        {hasAnyData && (
          <Tabs defaultValue="proposals" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="proposals">Past Proposals</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="snippets">Snippets</TabsTrigger>
            </TabsList>

            {/* Past Proposals Tab */}
            <TabsContent value="proposals" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Past Proposals</h2>
                <Button disabled>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Proposal
                </Button>
              </div>

              {pastProposals.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No proposals yet"
                  description="Upload PDF or DOCX proposals to build your library"
                  actionLabel="Upload Proposal"
                  onAction={() => toast.info("Upload feature coming soon")}
                />
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Contract Type</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastProposals.map((proposal) => (
                        <TableRow key={proposal.id}>
                          <TableCell className="font-medium">{proposal.client}</TableCell>
                          <TableCell>{proposal.year}</TableCell>
                          <TableCell>{proposal.sector || '-'}</TableCell>
                          <TableCell>{proposal.country || '-'}</TableCell>
                          <TableCell>{proposal.contract_type || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{proposal.language}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {proposal.filename}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" disabled>
                                <Sparkles className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteItem('proposal', proposal.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Templates</h2>
                <Button disabled>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Template
                </Button>
              </div>

              {templates.length === 0 ? (
                <EmptyState
                  icon={BookTemplate}
                  title="No templates yet"
                  description="Upload reusable templates for Executive Summary, Methodology, etc."
                  actionLabel="Upload Template"
                  onAction={() => toast.info("Upload feature coming soon")}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription>{template.type}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description || 'No description'}
                        </p>
                        <div className="flex justify-between">
                          <Badge variant="secondary">{template.filename}</Badge>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteItem('template', template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Snippets Tab */}
            <TabsContent value="snippets" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Snippets</h2>
                <Dialog open={snippetDialogOpen} onOpenChange={setSnippetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Snippet
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Snippet</DialogTitle>
                      <DialogDescription>
                        Create a reusable text snippet for your proposals
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={newSnippet.title}
                          onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                          placeholder="e.g., Company Overview"
                        />
                      </div>
                      <div>
                        <Label htmlFor="content">Content *</Label>
                        <Textarea
                          id="content"
                          value={newSnippet.content}
                          onChange={(e) => setNewSnippet({ ...newSnippet, content: e.target.value })}
                          placeholder="Enter the snippet text..."
                          rows={6}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="sector">Sector</Label>
                          <Input
                            id="sector"
                            value={newSnippet.sector}
                            onChange={(e) => setNewSnippet({ ...newSnippet, sector: e.target.value })}
                            placeholder="e.g., Health"
                          />
                        </div>
                        <div>
                          <Label htmlFor="source">Source</Label>
                          <Input
                            id="source"
                            value={newSnippet.source}
                            onChange={(e) => setNewSnippet({ ...newSnippet, source: e.target.value })}
                            placeholder="e.g., Website"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          value={newSnippet.tags}
                          onChange={(e) => setNewSnippet({ ...newSnippet, tags: e.target.value })}
                          placeholder="e.g., experience, qualifications"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setSnippetDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddSnippet}>
                          Add Snippet
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {snippets.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No snippets yet"
                  description="Add reusable text snippets for quick insertion in proposals"
                  actionLabel="Add Snippet"
                  onAction={() => setSnippetDialogOpen(true)}
                />
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Content Preview</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {snippets.map((snippet) => (
                        <TableRow key={snippet.id}>
                          <TableCell className="font-medium">{snippet.title}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {snippet.content.substring(0, 80)}...
                          </TableCell>
                          <TableCell>{snippet.sector || '-'}</TableCell>
                          <TableCell>
                            {snippet.tags && snippet.tags.length > 0 ? (
                              <div className="flex gap-1 flex-wrap">
                                {snippet.tags.slice(0, 2).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {snippet.tags.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{snippet.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{snippet.source || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" disabled>
                                <Sparkles className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteItem('snippet', snippet.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
