import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Upload, User, Brain, Package, Palette, Loader2 } from "lucide-react";

interface AppConfig {
  id?: string;
  organization_name: string;
  logo_url: string;
  timezone: string;
  language: string;
  require_login: boolean;
  min_confidence: number;
  require_citations: boolean;
  llm_model: string;
  footer_text: string;
  export_naming_convention: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'reviewer' | 'viewer';
}

interface DomainPack {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  organization_name: "",
  logo_url: "",
  timezone: "UTC",
  language: "en",
  require_login: false,
  min_confidence: 0.7,
  require_citations: false,
  llm_model: "google/gemini-2.5-flash",
  footer_text: "",
  export_naming_convention: "{issuer}_{ref}_{org}_{date}",
};

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'reviewer' | 'viewer' | null>(null);
  const [users, setUsers] = useState<UserRole[]>([]);
  const [domainPacks, setDomainPacks] = useState<DomainPack[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isOwner = userRole === 'owner';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setUserRole(roleData?.role || null);

      // Get app config
      const { data: configData } = await supabase
        .from('app_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (configData) {
        setConfig({
          id: configData.id,
          organization_name: configData.organization_name || "",
          logo_url: configData.logo_url || "",
          timezone: configData.timezone || "UTC",
          language: configData.language || "en",
          require_login: configData.require_login || false,
          min_confidence: configData.min_confidence || 0.7,
          require_citations: configData.require_citations || false,
          llm_model: configData.llm_model || "google/gemini-2.5-flash",
          footer_text: configData.footer_text || "",
          export_naming_convention: configData.export_naming_convention || "{issuer}_{ref}_{org}_{date}",
        });
      }

      // Get all users with roles
      const { data: usersData } = await supabase
        .from('user_roles')
        .select('*');
      
      if (usersData) {
        setUsers(usersData);
      }

      // Get domain packs
      const { data: packsData } = await supabase
        .from('domain_packs')
        .select('*');
      
      if (packsData) {
        setDomainPacks(packsData);
      }

    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isOwner) {
      toast({
        title: "Permission denied",
        description: "Only owners can modify settings",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const configData = {
        organization_name: config.organization_name,
        logo_url: config.logo_url,
        timezone: config.timezone,
        language: config.language,
        require_login: config.require_login,
        min_confidence: config.min_confidence,
        require_citations: config.require_citations,
        llm_model: config.llm_model,
        footer_text: config.footer_text,
        export_naming_convention: config.export_naming_convention,
      };

      if (config.id) {
        // Update existing config
        const { error } = await supabase
          .from('app_config')
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        // Insert new config
        const { data, error } = await supabase
          .from('app_config')
          .insert(configData)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setConfig({ ...config, id: data.id });
        }
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePackToggle = async (packId: string, enabled: boolean) => {
    if (!isOwner) return;

    try {
      const { error } = await supabase
        .from('domain_packs')
        .update({ enabled })
        .eq('id', packId);

      if (error) throw error;

      setDomainPacks(packs =>
        packs.map(pack =>
          pack.id === packId ? { ...pack, enabled } : pack
        )
      );

      toast({
        title: "Success",
        description: "Domain pack updated",
      });
    } catch (error) {
      console.error('Error updating domain pack:', error);
      toast({
        title: "Error",
        description: "Failed to update domain pack",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Application configuration
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!isOwner || saving}
          size="lg"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>

      {!isOwner && (
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/10">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              You are viewing settings in read-only mode. Only users with Owner role can modify settings.
            </p>
          </CardContent>
        </Card>
      )}

      {!config.id && (
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/10">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              No settings configured yet. Use the forms below to customize your app.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="auth" className="gap-2">
            <User className="h-4 w-4" />
            Auth & Roles
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="h-4 w-4" />
            AI & Extraction
          </TabsTrigger>
          <TabsTrigger value="packs" className="gap-2">
            <Package className="h-4 w-4" />
            Domain Packs
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={config.organization_name}
                  onChange={(e) => setConfig({ ...config, organization_name: e.target.value })}
                  disabled={!isOwner}
                  placeholder="Enter your organization name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="logo"
                    value={config.logo_url}
                    onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                    disabled={!isOwner}
                    placeholder="https://example.com/logo.png"
                  />
                  <Button variant="outline" disabled={!isOwner} size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={config.timezone}
                  onValueChange={(value) => setConfig({ ...config, timezone: value })}
                  disabled={!isOwner}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={config.language}
                  onValueChange={(value) => setConfig({ ...config, language: value })}
                  disabled={!isOwner}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Authentication & Roles</CardTitle>
              <CardDescription>
                Manage authentication settings and user roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Login</Label>
                  <p className="text-sm text-muted-foreground">
                    Users must be authenticated to access the application
                  </p>
                </div>
                <Switch
                  checked={config.require_login}
                  onCheckedChange={(checked) => setConfig({ ...config, require_login: checked })}
                  disabled={!isOwner}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Users & Roles</Label>
                  <Button variant="outline" size="sm" disabled={!isOwner}>
                    Invite User
                  </Button>
                </div>
                
                <div className="border rounded-lg divide-y">
                  {users.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No users configured yet
                    </div>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.user_id}</p>
                          <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                        </div>
                        <Select value={user.role} disabled={!isOwner}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="reviewer">Reviewer</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI & Extraction</CardTitle>
              <CardDescription>
                Configure AI model and extraction settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Minimum Confidence: {config.min_confidence.toFixed(2)}</Label>
                <Slider
                  value={[config.min_confidence]}
                  onValueChange={([value]) => setConfig({ ...config, min_confidence: value })}
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={!isOwner}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Minimum confidence threshold for AI extraction results (0-1)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Citations</Label>
                  <p className="text-sm text-muted-foreground">
                    AI responses must include source citations
                  </p>
                </div>
                <Switch
                  checked={config.require_citations}
                  onCheckedChange={(checked) => setConfig({ ...config, require_citations: checked })}
                  disabled={!isOwner}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="llm-model">LLM Model</Label>
                <Select
                  value={config.llm_model}
                  onValueChange={(value) => setConfig({ ...config, llm_model: value })}
                  disabled={!isOwner}
                >
                  <SelectTrigger id="llm-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                    <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                    <SelectItem value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
                    <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
                    <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                    <SelectItem value="openai/gpt-5-nano">GPT-5 Nano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packs">
          <Card>
            <CardHeader>
              <CardTitle>Domain Packs</CardTitle>
              <CardDescription>
                Enable or disable domain-specific terminology and compliance rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {domainPacks.map((pack) => (
                  <div key={pack.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{pack.name}</h4>
                      <p className="text-sm text-muted-foreground">{pack.description}</p>
                    </div>
                    <Switch
                      checked={pack.enabled}
                      onCheckedChange={(checked) => handlePackToggle(pack.id, checked)}
                      disabled={!isOwner}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Customize the look and feel of your exports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="footer">Footer Text</Label>
                <Textarea
                  id="footer"
                  value={config.footer_text}
                  onChange={(e) => setConfig({ ...config, footer_text: e.target.value })}
                  disabled={!isOwner}
                  placeholder="Enter footer text for exports"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="naming">Export Naming Convention</Label>
                <Input
                  id="naming"
                  value={config.export_naming_convention}
                  onChange={(e) => setConfig({ ...config, export_naming_convention: e.target.value })}
                  disabled={!isOwner}
                  placeholder="{issuer}_{ref}_{org}_{date}"
                />
                <p className="text-sm text-muted-foreground">
                  Available variables: {"{issuer}"}, {"{ref}"}, {"{org}"}, {"{date}"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
