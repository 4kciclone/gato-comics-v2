"use client";

import { useState, useEffect } from "react";
import { Bell, Heart, MessageSquare, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { markNotificationsAsRead } from "@/actions/notifications";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  link: string;
  originUser: { name: string | null };
}

export function NotificationBell({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const hasUnread = notifications.length > 0;

  const handleOpen = async () => {
    if (hasUnread) {
      // Otimista: remove a bolinha vermelha imediatamente
      setNotifications([]); 
      await markNotificationsAsRead();
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type === 'LIKE') return <Heart className="w-4 h-4 text-red-500" />;
    if (type === 'REPLY') return <MessageSquare className="w-4 h-4 text-blue-500" />;
    if (type === 'FOLLOW') return <UserPlus className="w-4 h-4 text-green-500" />;
    return null;
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && handleOpen()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white">
          <Bell className="w-5 h-5" />
          {hasUnread && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-[#111] border-[#27272a] text-white" align="end">
        <div className="p-2 font-bold">Notificações</div>
        {initialNotifications.length > 0 ? (
          initialNotifications.map(notif => (
            <Link href={notif.link} key={notif.id}>
              <DropdownMenuItem className="cursor-pointer focus:bg-[#27272a] flex items-start gap-3 py-3">
                {getNotificationIcon(notif.type)}
                <p className="text-sm text-zinc-300 whitespace-normal">
                  <span className="font-bold text-white">{notif.originUser.name}</span> 
                  {notif.type === 'LIKE' && ' curtiu seu post.'}
                  {notif.type === 'REPLY' && ' respondeu ao seu post.'}
                  {notif.type === 'FOLLOW' && ' começou a seguir você.'}
                </p>
              </DropdownMenuItem>
            </Link>
          ))
        ) : (
          <p className="text-center text-sm text-zinc-500 py-4">Nenhuma notificação nova.</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}