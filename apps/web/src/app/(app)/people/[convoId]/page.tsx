import { DmChatView } from "@/app/_components/people/dm-chat-view";

interface DmPageProps {
  params: Promise<{ convoId: string }>;
}

export default async function DmPage({ params }: DmPageProps) {
  const { convoId } = await params;
  return (
    <div className="flex h-full flex-col">
      <DmChatView convoId={convoId} />
    </div>
  );
}
