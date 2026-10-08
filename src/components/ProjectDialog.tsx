import { useEffect, useRef } from 'react';
import type { Project } from '../config/projects';

export default function ProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const open = project !== null;
  const descriptionParts = project?.descriptionHighlight ? project.description.split(project.descriptionHighlight) : null;
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

  return <dialog ref={dialogRef} className="project-dialog" aria-labelledby="project-dialog-title"
    onCancel={onClose} onClose={onClose} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
    <div className="dialog-header">
      <h2 id="project-dialog-title">{project?.name}</h2>
      <button type="button" className="dialog-close" onClick={onClose} aria-label="Закрыть" autoFocus>×</button>
    </div>
    <div className="project-details">
      {project && <>
        <img src={project.logo} alt={project.name} className={`project-logo project-logo-${project.id}`} />
        <p>{descriptionParts ? <>{descriptionParts[0]}<strong>{project.descriptionHighlight}</strong>{descriptionParts[1]}</> : project.description}</p>
        {project.authorParagraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        {project.socials.length > 0 && <nav className="project-socials" aria-label={`Соцсети ${project.name}`}>
          {project.socials.map(social => <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer">
            {social.icon && <img src={social.icon} alt="" width="24" height="24" />}{social.name}
          </a>)}
        </nav>}
        <a className="project-link" href={project.website} target="_blank" rel="noopener noreferrer">Перейти на сайт</a>
      </>}
    </div>
  </dialog>;
}
