import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Code2,
  Compass,
  Route,
  Wallet,
  ShieldCheck,
  CircleCheck,
} from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { docPages } from './content';
import './docs.css';

const guideIcons = [Compass, Route, Wallet, Code2, ShieldCheck, CircleCheck];

export function Docs() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '');
  const index = docPages.findIndex((page) => page.slug === slug);
  const page = docPages[index];
  return (
    <div className="docs-shell">
      <nav className="docs-nav" aria-label="Documentation">
        <span className="docs-nav-title">
          <BookOpen size={17} aria-hidden="true" /> SWEEPDOCK DOCS
        </span>
        {docPages.map((item, index) => {
          const Icon = guideIcons[index] ?? BookOpen;
          return (
            <NavLink
              key={item.slug}
              end
              to={item.slug ? `/docs/${item.slug}` : '/docs'}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      {page ? (
        <article className="docs-article">
          <header className="docs-heading">
            <div className="section-heading-label">
              <span className="section-icon">
                <BookOpen size={22} aria-hidden="true" />
              </span>
              <span className="eyebrow">{page.audience}</span>
            </div>
            <h1>{page.title}</h1>
            <p>{page.summary}</p>
          </header>
          {page.slug === '' && (
            <div className="docs-start-cards">
              <Link to="/docs/wallet-users">
                <Wallet size={23} aria-hidden="true" />
                <span>
                  <strong>For wallet owners</strong>
                  <small>Try your first cleanup demo</small>
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link to="/docs/developers">
                <Code2 size={23} aria-hidden="true" />
                <span>
                  <strong>For developers</strong>
                  <small>Explore the source and setup</small>
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          )}
          <nav className="docs-toc" aria-label="On this page">
            <span>On this page</span>
            {page.sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.title}
              </a>
            ))}
          </nav>
          {page.sections.map((section) => (
            <section
              id={section.id}
              key={section.id}
              className="docs-section"
              aria-labelledby={`heading-${section.id}`}
            >
              <h2 id={`heading-${section.id}`}>{section.title}</h2>
              {section.body}
            </section>
          ))}
          <nav className="docs-pagination" aria-label="Documentation pages">
            {index > 0 ? (
              <Link
                to={
                  docPages[index - 1]?.slug
                    ? `/docs/${docPages[index - 1]?.slug}`
                    : '/docs'
                }
              >
                <ArrowLeft size={17} aria-hidden="true" />
                <span>
                  <small>Previous</small>
                  {docPages[index - 1]?.label}
                </span>
              </Link>
            ) : (
              <Link to="/">
                <ArrowLeft size={17} aria-hidden="true" />
                <span>
                  <small>Back to</small>SweepDock home
                </span>
              </Link>
            )}
            {index < docPages.length - 1 && (
              <Link to={`/docs/${docPages[index + 1]?.slug}`}>
                <span>
                  <small>Next</small>
                  {docPages[index + 1]?.label}
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            )}
          </nav>
        </article>
      ) : (
        <section className="docs-article docs-heading">
          <span className="eyebrow">DOCUMENTATION</span>
          <h1>That guide is not here.</h1>
          <p>
            Choose a guide from the documentation menu, or return to the
            introduction.
          </p>
          <Link className="text-link" to="/docs">
            Open SweepDock docs <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  );
}
