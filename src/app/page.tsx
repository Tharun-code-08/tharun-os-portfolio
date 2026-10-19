import { GameEntry } from "@/components/game/GameEntry";
import { contact, profile } from "@/data/profile";
import { publishedExperience, publishedProjects } from "@/data/projects";

/**
 * The page is the game. Underneath it, a plain server-rendered summary for
 * crawlers, screen readers and anyone without JavaScript — the same facts the
 * island shows, from the same data files.
 */
export default function Page() {
  return (
    <>
      <GameEntry />
      <article className="sr-only">
        <h1>
          {profile.name} — {profile.role}
        </h1>
        <p>{profile.intro}</p>
        <h2>Projects</h2>
        <ul>
          {publishedProjects.map((p) => (
            <li key={p.id}>
              <strong>{p.name}</strong> ({p.kind}) — {p.summary}
            </li>
          ))}
        </ul>
        <h2>Experience</h2>
        <ul>
          {publishedExperience.map((j) => (
            <li key={j.company}>
              {j.role}, {j.company} — {j.period}
            </li>
          ))}
        </ul>
        <h2>Contact</h2>
        <p>
          <a href={`mailto:${contact.email}`}>{contact.email}</a> · <a href={contact.github}>GitHub</a> ·{" "}
          <a href={contact.linkedin}>LinkedIn</a> · <a href={contact.resume}>Résumé</a>
        </p>
      </article>
    </>
  );
}
