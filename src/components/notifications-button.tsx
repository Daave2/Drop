"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth-provider";

export function NotificationsButton() {
  const { user } = useAuth();
  const { notifications, markAllAsRead } = useNotifications();

  if (!user) return null;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu onOpenChange={(open) => open && markAllAsRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Bell className="h-4 w-4 text-gold" />
          {unread > 0 && (
            <span className="absolute top-0 right-0 inline-flex h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {notifications.length === 0 && (
          <DropdownMenuItem className="text-muted-foreground">No notifications</DropdownMenuItem>
        )}
        {notifications.map((n) => (
          <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1">
            <span className="text-sm">
              {n.actorPseudonym} {n.type === 'like' ? 'liked' : 'replied to'} your note
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(n.createdAt.seconds * 1000).toLocaleString()}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

