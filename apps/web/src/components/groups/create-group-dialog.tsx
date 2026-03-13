"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { slugify } from "@/app/_libs/utils/slugify";
import { queryKeys } from "@/app/_libs/query/keys";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const supabase = createClient();

function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: trimmedName,
          description: description.trim() || null,
          created_by: user.id,
          invite_code: generateInviteCode(),
          max_members: 20,
        })
        .select("id, name")
        .single();

      if (groupError) throw new Error(groupError.message);

      // Add creator as owner — upsert in case a DB trigger already inserted them
      const { error: memberError } = await supabase
        .from("group_members")
        .upsert(
          { group_id: group.id, user_id: user.id, role: "owner", status: "active" },
          { onConflict: "group_id,user_id", ignoreDuplicates: true },
        );

      if (memberError) throw new Error(memberError.message);

      // Refresh sidebar groups list
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });

      onOpenChange(false);
      setName("");
      setDescription("");

      router.push(`/groups/${slugify(group.name)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create a group</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label htmlFor="group-name" className="text-sm font-medium text-foreground">
              Name
            </label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Team"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="group-desc" className="text-sm font-medium text-foreground">
              Description{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              id="group-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows={2}
              className="resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-error-foreground">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting ? "Creating…" : "Create group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
