import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oallytrmvxphbhyddjht.supabase.co'
const supabaseKey = 'sb_publishable_QqcKp1YHms9CNm8I0xXUPA_i-Gog3jR'
export const supabase = createClient(supabaseUrl, supabaseKey)
