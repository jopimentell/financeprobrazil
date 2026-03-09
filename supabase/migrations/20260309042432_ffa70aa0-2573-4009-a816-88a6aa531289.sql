-- Create the trigger to auto-create profiles on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also ensure existing auth users have profiles
INSERT INTO public.profiles (id, name, email)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', ''),
  COALESCE(u.email, '')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Ensure existing auth users have roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  'user'::app_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)
ON CONFLICT (user_id, role) DO NOTHING;