import { supabase } from '@/libs/supabase/client';

export async function saveUserInterests(
  userId: string,
  selectedNames: string[],
) {
  await supabase.from('user_interests').delete().eq('user_id', userId);

  if (selectedNames.length === 0) return;

  const { data: interestRows } = await supabase
    .from('interests')
    .select('id, name')
    .in('name', selectedNames);

  if (!interestRows?.length) return;

  const rows = interestRows.map(i => ({
    user_id: userId,
    interest_id: i.id,
  }));
  await supabase.from('user_interests').insert(rows);
}
