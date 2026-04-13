"use client";

import { useDropEngagement as _useDropEngagement } from "@kurate/hooks";
import { toast } from "sonner";

import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

export function useDropEngagement() {
  return _useDropEngagement(supabase, (msg) => toast.error(msg));
}
