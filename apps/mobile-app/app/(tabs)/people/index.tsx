import React from 'react';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { ConversationsList } from '@/components/people/conversations-list';

export default function PeopleScreen() {
  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top', 'left', 'right']}
    >
      <ConversationsList />
    </SafeAreaView>
  );
}
