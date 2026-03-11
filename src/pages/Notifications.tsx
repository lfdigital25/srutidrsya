import { Bell, MessageSquare, Heart, Video } from 'lucide-react';
import { clsx } from 'clsx';

export default function Notifications() {
  const notifications = [
    {
      id: 1,
      type: 'upload',
      message: 'SRUTI DRSYA Official uploaded a new video: "Ad-Blocking Architecture Explained"',
      time: '2 hours ago',
      read: false,
      icon: Video,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      id: 2,
      type: 'comment',
      message: 'Dr. Smith replied to your comment on "Vanced vs Brave"',
      time: '5 hours ago',
      read: true,
      icon: MessageSquare,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      id: 3,
      type: 'like',
      message: 'Your comment got 15 likes',
      time: '1 day ago',
      read: true,
      icon: Heart,
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    }
  ];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
          <Bell className="w-6 h-6 text-red-600" />
          Notifications
        </h1>
        <button className="text-sm font-medium text-red-600 hover:text-red-500 transition-colors">
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => {
          const Icon = notif.icon;
          return (
            <div 
              key={notif.id}
              className={clsx(
                "flex items-start gap-4 p-4 rounded-xl transition-colors cursor-pointer group",
                notif.read ? "bg-neutral-900/50 hover:bg-neutral-800" : "bg-neutral-800 border border-neutral-700 hover:bg-neutral-700"
              )}
            >
              <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0", notif.bg, notif.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={clsx("text-sm leading-snug", notif.read ? "text-neutral-400" : "text-neutral-200 font-medium")}>
                  {notif.message}
                </p>
                <p className="text-xs text-neutral-500 mt-1">{notif.time}</p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-red-600 mt-2 shrink-0"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
