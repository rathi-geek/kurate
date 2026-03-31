import { redirect } from "next/navigation";

import { createClient } from "@/app/_libs/supabase/server";
import { DmChatView } from "@/app/_components/people/dm-chat-view";

interface DmPageProps {
  params: Promise<{ convoId: string }>;
}

export default async function DmPage({ params }: DmPageProps) {
  const { convoId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="flex h-full flex-col">
      <DmChatView convoId={convoId} currentUserId={user.id} />
    </div>
  );
}
