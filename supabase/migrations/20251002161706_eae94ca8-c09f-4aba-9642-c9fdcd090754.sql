-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'editor', 'reviewer', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only owners can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Only owners can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Only owners can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- Create app_config table for application settings
CREATE TABLE public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text,
  logo_url text,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  require_login boolean DEFAULT false,
  min_confidence numeric DEFAULT 0.7,
  require_citations boolean DEFAULT false,
  llm_model text DEFAULT 'google/gemini-2.5-flash',
  footer_text text,
  export_naming_convention text DEFAULT '{issuer}_{ref}_{org}_{date}',
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on app_config
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for app_config
CREATE POLICY "Anyone can view config"
  ON public.app_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only owners can insert config"
  ON public.app_config
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Only owners can update config"
  ON public.app_config
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- Create domain_packs table
CREATE TABLE public.domain_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on domain_packs
ALTER TABLE public.domain_packs ENABLE ROW LEVEL SECURITY;

-- RLS policies for domain_packs
CREATE POLICY "Anyone can view packs"
  ON public.domain_packs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only owners can modify packs"
  ON public.domain_packs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- Insert default domain packs
INSERT INTO public.domain_packs (name, description, enabled) VALUES
  ('Healthcare', 'Healthcare-specific terminology and compliance requirements', false),
  ('Construction', 'Construction industry standards and specifications', false),
  ('IT Services', 'IT and software development frameworks', false),
  ('Government', 'Government procurement rules and formats', false);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_app_config_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_app_config_updated_at();