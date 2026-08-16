import React from 'react';
import { Bell } from 'lucide-react';

const NotificationsTab = ({
    adminNotifications = [],
    loadingNotifications
}) => {
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                {adminNotifications.map((n, idx) => (
                    <div 
                        key={n._id || n.id || idx}
                        className="p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] flex items-start gap-4 transition-all hover:border-neutral-300 dark:hover:border-zinc-700"
                    >
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                            <Bell size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="font-bold text-black dark:text-white text-sm">{n.title}</h4>
                                <span className="text-[10px] text-neutral-400 font-mono">
                                    {new Date(n.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                            </div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">{n.message}</p>
                            <div className="flex items-center gap-3 mt-3">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                                    Sender: <span className="text-black dark:text-white">{n.sender?.name || n.sender?.clubName || 'System'}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {adminNotifications.length === 0 && !loadingNotifications && (
                    <div className="p-12 text-center border border-dashed border-neutral-300 dark:border-zinc-800 rounded-2xl">
                        <Bell size={32} className="mx-auto text-neutral-300 dark:text-zinc-700 mb-3" />
                        <p className="text-sm font-medium text-neutral-500">No system notifications found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsTab;
