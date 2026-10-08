import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import MinecraftCharacter from './components/MinecraftCharacter';
import ProjectDialog from './components/ProjectDialog';
import TelegramDialog from './components/TelegramDialog';
import ScrambleText from './components/ScrambleText';
import about from './config/about.json';
import { GREETINGS, SOCIALS } from './config/site';
import { PROJECTS, type Project } from './config/projects';

export default function App() {
  const reduced = useReducedMotion();
  const [greeting] = useState(() => {
    let previous: string | null = null;
    try { previous = sessionStorage.getItem('gareldd-greeting'); } catch { /* Storage is optional. */ }
    const choices = GREETINGS.filter(text => text !== previous);
    const next = choices[Math.floor(Math.random() * choices.length)];
    return next;
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [telegramOpen, setTelegramOpen] = useState(false);
  return <div className="site-shell mx-auto px-5 sm:px-8">
    <header className="site-header flex items-center justify-between">
      <a className="brand-logo" href="#about" aria-label="gareldd — на главную"><img src="assets/img/grld_logo.png" alt="gareldd" /></a>
      <span className="header-label">Minecraft & творчество</span>
    </header>
    <main>
      <section id="about" className="hero">
        <motion.h1 className="welcome-text" initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Greeting text={greeting} />
        </motion.h1>
        <MinecraftCharacter />
        <motion.div className="info-text" initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
          {about.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        </motion.div>
      </section>
      <section id="socials" className="content-section">
        <h2>Соцсети</h2>
        <div className="social-links">
          {SOCIALS.map(social => social.name === 'Telegram' ? <button key={social.name} type="button" className="social-item"
            onClick={() => setTelegramOpen(true)} aria-haspopup="dialog" aria-expanded={telegramOpen}>
            <img src={`assets/img/social/${social.icon}`} alt="" width="52" height="52" />
            <ScrambleText text={social.name} onHover />
          </button> : <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" className="social-item">
            <img src={`assets/img/social/${social.icon}`} alt="" width="52" height="52" />
            <ScrambleText text={social.name} onHover />
          </a>)}
        </div>
      </section>
      <section id="projects" className="content-section">
        <h2>Мои проекты</h2>
        <div className="project-grid">
          {PROJECTS.map(project => <button key={project.id} type="button" className={`project-card project-card-${project.id}`}
            onClick={() => setSelectedProject(project)} aria-label={`Подробнее о ${project.name}`} aria-haspopup="dialog">
            <img src={project.logo} alt={project.name} />
          </button>)}
        </div>
      </section>
    </main>
    <footer>© 2026 gareldd</footer>
    <ProjectDialog project={selectedProject} onClose={() => setSelectedProject(null)} />
    <TelegramDialog open={telegramOpen} onClose={() => setTelegramOpen(false)} />
  </div>;
}

function Greeting({ text }: { text: string }) {
  // Persist only the committed greeting, so StrictMode's extra render stays harmless.
  useEffect(() => { try { sessionStorage.setItem('gareldd-greeting', text); } catch { /* Storage is optional. */ } }, [text]);
  return <>{text}</>;
}
