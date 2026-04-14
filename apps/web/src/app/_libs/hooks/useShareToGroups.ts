"use client";

import { useShareToGroups as _useShareToGroups } from "@kurate/hooks";
import { toast } from "sonner";

import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

export function useShareToGroups() {
  return _useShareToGroups(supabase, () => toast("Shared!"));
}
