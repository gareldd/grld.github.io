import { useEffect, useRef } from 'react';
import { TELEGRAM_CHANNELS } from '../config/site';

export default function TelegramDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      dialog.close();
    };
  }, [open]);

  return <dialog ref={dialogRef} className="project-dialog telegram-dialog" aria-labelledby="telegram-dialog-title"
    onCancel={onClose} onClose={onClose} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
    <div className="dialog-header">
      <h2 id="telegram-dialog-title">Telegram</h2>
      <button type="button" className="dialog-close" onClick={onClose} aria-label="Закрыть" autoFocus>×</button>
    </div>
    <div className="telegram-channels">
      {TELEGRAM_CHANNELS.map(channel => <a key={channel.href} href={channel.href} target="_blank" rel="noopener noreferrer"
        className={`telegram-tile${channel.private ? ' telegram-tile-private' : ''}`}>
        <span className="telegram-tile-surface" aria-hidden="true" />
        <span className="telegram-tile-content">
          <img src={channel.private ? 'assets/img/social/privatka_icon_bg.png' : 'assets/img/social/tg_alt.png'}
            className={channel.private ? 'private-fire-icon' : channel.name === 'ИИ-штуки' ? 'telegram-ai-icon' : 'telegram-main-icon'}
            alt="" width="56" height="56" />
          <span className="telegram-tile-name">{channel.name}</span>
          <span className="telegram-tile-subtitle">{channel.subtitle}</span>
          <span className="telegram-tile-action">Открыть <span aria-hidden="true">↗</span></span>
        </span>
      </a>)}
    </div>
  </dialog>;
}
