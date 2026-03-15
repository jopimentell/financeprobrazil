INSERT INTO public.user_roles (user_id, role)
VALUES ('59e70903-c51c-4c31-b135-dca9542ad58d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;