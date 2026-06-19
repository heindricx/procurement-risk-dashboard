import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ppukvumeefcmbwidtzuj.supabase.co'
const supabaseKey = 'sb_publishable_QreVd28xHQ1YctZ0Hupa7g_Wzxnoz5c'
export const supabase = createClient(supabaseUrl, supabaseKey)
