import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

type SeedUser = {
  email: string;
  password: string;
  role: 'super_admin' | 'company_admin' | 'developer';
  name: string;
};

const users: SeedUser[] = [
  {
    email: 'adrian.stanca1@gmail.com',
    password: 'Cumparavinde1',
    role: 'super_admin',
    name: 'Adrian Stanca'
  },
  {
    email: 'adrian@ascladdingltd.co.uk',
    password: 'lolozania1',
    role: 'company_admin',
    name: 'Adrian ASC'
  },
  {
    email: 'dev@constructco.com',
    password: 'password123',
    role: 'developer',
    name: 'Developer User'
  }
];

async function upsertUser(u: SeedUser) {
  // Try to find existing user
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());

  if (existing) {
    // Update password and metadata
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: u.password,
      user_metadata: { role: u.role, name: u.name }
    });
    if (error) throw error;
    console.log(`Updated existing user: ${u.email}`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { role: u.role, name: u.name }
  });
  if (error) throw error;
  console.log(`Created user: ${u.email}`);
  return data.user?.id;
}

(async () => {
  try {
    for (const u of users) {
      await upsertUser(u);
    }
    console.log('All users created/updated.');
    process.exit(0);
  } catch (e: any) {
    console.error('Failed to create users:', e?.message || e);
    process.exit(1);
  }
})();


