// Ligação ao Supabase. Só é carregada nas páginas que precisam dela (contacto e painel).
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
