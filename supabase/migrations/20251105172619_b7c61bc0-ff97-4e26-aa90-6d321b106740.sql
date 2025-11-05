-- Create table for email verification codes
CREATE TABLE IF NOT EXISTS public.email_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  type text NOT NULL CHECK (type IN ('signup', 'password_reset', 'email_change')),
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON public.email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code ON public.email_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires ON public.email_verification_codes(expires_at);

-- Enable RLS
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own verification codes
CREATE POLICY "Users can view their own verification codes"
  ON public.email_verification_codes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create table for support messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'support')),
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON public.support_messages(created_at);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own messages
CREATE POLICY "Users can view their own support messages"
  ON public.support_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own messages
CREATE POLICY "Users can create their own support messages"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND sender = 'user');