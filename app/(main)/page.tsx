const edges: [string, string][] = [
  ["n1", "n2"], ["n1", "n4"], ["n2", "n3"], ["n2", "n5"],
  ["n3", "n6"], ["n4", "n5"], ["n5", "n6"], ["n5", "n7"],
  ["n6", "n8"], ["n7", "n8"], ["n8", "n9"], ["n3", "n9"],
];

const nodes: Record<string, { x: number; y: number; r: number }> = {
  n1: { x: 16, y: 32, r: 7 },
  n2: { x: 30, y: 22, r: 11 },
  n3: { x: 48, y: 28, r: 8 },
  n4: { x: 22, y: 55, r: 6 },
  n5: { x: 42, y: 50, r: 18 },
  n6: { x: 62, y: 45, r: 12 },
  n7: { x: 36, y: 74, r: 7 },
  n8: { x: 62, y: 70, r: 14 },
  n9: { x: 78, y: 34, r: 6 },
};

const nodeEntries = Object.entries(nodes);

const background = [
  { year: "June 2026 – Present", role: "Research Assistant", org: "Prof. Robert Gordon, Northwestern" },
  { year: "Oct. 2025 – June 2026", role: "Research Assistant", org: "Prof. Doron Shiffer-Sebba, Northwestern" },
  { year: "June – Sept. 2025", role: "Wealth Management Intern", org: "Morgan Stanley" },
  { year: "May 2022 – Sept. 2024", role: "Founder & CEO", org: "The Kid Details, LLC" },
];

const interests = [
  { label: "Econometrics & Networks", note: "Both as a field of study and a way of seeing." },
  { label: "Latin & Classical Literature", note: "A serious interest — and a break from the math." },
  { label: "Entrepreneurship", note: "Built a business at 16. Still at it." },
  { label: "Monetary Policy", note: null },
  { label: "Muay Thai & Archery", note: null },
  { label: "Horology", note: "Watches and clocks, briefly noted." },
];

const faq = [
  {
    q: "Who is Caleb Eng?",
    a: "Caleb Eng is an undergraduate student at Northwestern University studying Economics and Mathematical Methods in the Social Sciences (MMSS), with minors in Mathematics and Classics. He works as a research assistant at Northwestern and is primarily interested in econometrics, network economics, and how formal methods can illuminate the structure of social and economic systems.",
  },
  {
    q: "What is Caleb Eng's research focus?",
    a: "Caleb's primary research interest is econometrics, with a particular focus on network econometrics — the study of how statistical methods can be applied to understand behavior and outcomes within networks of individuals, firms, or institutions. He currently assists with research on online social networks and digital economies under Prof. Doron Shiffer-Sebba, and is beginning research with Prof. Robert Gordon.",
  },
  {
    q: "What is network econometrics?",
    a: "Network econometrics is a field that applies econometric methods to data with network structure — situations where individuals or agents are connected to one another and where those connections affect their behavior or outcomes. It sits at the intersection of social network analysis, causal inference, and economic theory.",
  },
  {
    q: "What is MMSS at Northwestern?",
    a: "MMSS (Mathematical Methods in the Social Sciences) is a selective undergraduate program at Northwestern University that trains students to apply formal mathematical and statistical tools — including game theory, probability, and optimization — to questions in economics, political science, and the social sciences broadly.",
  },
  {
    q: "What is the Fletcher Prize?",
    a: "The Fletcher Prize is an award for upcoming undergraduate research at Northwestern University. Caleb was named a finalist for research conducted under Prof. Doron Shiffer-Sebba examining peer effects and behavioral patterns in online social networks.",
  },
  {
    q: "What does Caleb Eng plan to do after Northwestern?",
    a: "Caleb is oriented toward graduate study, with a PhD in economics as his current direction. He also maintains a serious interest in entrepreneurship and has founded and operated businesses alongside his academic work.",
  },
];

export default function Home() {
  return (
    <main>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative min-h-screen overflow-hidden bg-[#0b0b0a] text-[#f2f0e8]">
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(0deg,#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:24px_24px]" />

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <g stroke="#f2f0e8" strokeOpacity="0.13" strokeWidth="0.18">
            {edges.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={nodes[a].x} y1={nodes[a].y}
                x2={nodes[b].x} y2={nodes[b].y}
              />
            ))}
          </g>
          <g>
            {nodeEntries.map(([id, node], i) => (
              <circle
                key={id}
                cx={node.x} cy={node.y} r={node.r / 3.5}
                fill="#f2f0e8"
                style={{ animation: "outer-pulse 4s ease-in-out infinite", animationDelay: `${i * 0.35}s` }}
              />
            ))}
          </g>
          <g>
            {nodeEntries.map(([id, node], i) => (
              <circle
                key={`${id}-core`}
                cx={node.x} cy={node.y} r={node.r / 9}
                fill="#f2f0e8"
                style={{ animation: "core-pulse 4s ease-in-out infinite", animationDelay: `${i * 0.35}s` }}
              />
            ))}
          </g>
        </svg>

        <div className="absolute left-6 top-6 hidden font-mono text-[11px] text-[#f2f0e8]/30 sm:block">
          network econometrics
        </div>

        <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 py-10">
          <nav className="flex justify-end gap-6 pt-1">
            {["about", "research", "background", "faq"].map((s) => (
              <a
                key={s}
                href={`#${s}`}
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#f2f0e8]/40 transition hover:text-[#f2f0e8]/75"
              >
                {s}
              </a>
            ))}
          </nav>

          <div className="max-w-2xl">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.32em] text-[#f2f0e8]/40">
              Northwestern University · Economics · MMSS
            </p>
            <h1 className="text-6xl font-medium tracking-[-0.04em] text-[#f2f0e8] sm:text-8xl">
              Caleb Eng
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#f2f0e8]/55 sm:text-lg">
              Undergraduate researcher studying economics and networks.
              Interested in what formal methods reveal about how people
              actually behave in relation to each other.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="mailto:calebeng21@gmail.com"
                className="border border-[#f2f0e8]/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-[#f2f0e8]/65 transition hover:border-[#f2f0e8]/45 hover:text-[#f2f0e8]"
              >
                Email
              </a>
              <a
                href="https://www.linkedin.com/in/calebeng/"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[#f2f0e8]/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-[#f2f0e8]/65 transition hover:border-[#f2f0e8]/45 hover:text-[#f2f0e8]"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/engcaleb"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[#f2f0e8]/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-[#f2f0e8]/65 transition hover:border-[#f2f0e8]/45 hover:text-[#f2f0e8]"
              >
                GitHub
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-[#f2f0e8]/18" />
            <a
              href="#about"
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#f2f0e8]/22 transition hover:text-[#f2f0e8]/50"
            >
              scroll
            </a>
          </div>
        </div>
      </section>

      {/* ── CONTENT ───────────────────────────────────────── */}
      <div className="bg-[#faf8f4] text-[#1c1a17]">

        {/* About */}
        <section id="about" className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
          <p className="mb-9 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/32">About</p>
          <div className="space-y-5 text-[17px] leading-[1.85] text-[#1c1a17]/75">
            <p>
              I am a second-year undergraduate at Northwestern University studying Economics
              and Mathematical Methods in the Social Sciences, with minors in Mathematics and
              Classics. My academic interests center on econometrics — particularly the
              econometrics of networks — and how formal methods can illuminate the structure
              of social and economic systems.
            </p>
            <p>
              I currently work as a research assistant to Prof. Robert Gordon at Northwestern.
              I previously worked with Prof. Doron Shiffer-Sebba, examining peer effects and
              behavioral patterns in online social networks — research for which I was named a
              finalist for the Fletcher Prize for upcoming undergraduate research.
            </p>
            <p>
              Alongside research I maintain a persistent interest in entrepreneurship — I
              founded and operated a small business before college and am currently building
              something new. My Classics minor is not incidental: Latin and ancient literature
              offer a long, slow view of how human institutions actually work, which turns out
              to be more useful than it sounds when you spend most of your time doing math.
            </p>
          </div>
        </section>

        <Divider />

        {/* Research */}
        <section id="research" className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
          <p className="mb-9 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/32">Research</p>
          <div className="space-y-12">
            <div>
              <p className="mb-1 font-mono text-[12px] text-[#1c1a17]/35">2025 – Present</p>
              <h3 className="mb-2 text-[17px] font-medium text-[#1c1a17]">
                Online Networks &amp; Digital Economies
              </h3>
              <p className="text-[15px] leading-[1.8] text-[#1c1a17]/60">
                Research assistant to Prof. Doron Shiffer-Sebba (Sociology, Northwestern).
                Analyzing social network structures and behavioral patterns in online platforms,
                with a focus on peer effects at the user level. Named a finalist for the
                Fletcher Prize for upcoming undergraduate research.
              </p>
            </div>

            <div>
              <p className="mb-1 font-mono text-[12px] text-[#1c1a17]/35">2026 – Present</p>
              <h3 className="mb-2 text-[17px] font-medium text-[#1c1a17]">
                Research with Prof. Robert Gordon
              </h3>
              <p className="text-[15px] leading-[1.8] text-[#1c1a17]/60">
                Research assistant to Prof. Robert Gordon (Economics, Northwestern).
                Details forthcoming.
              </p>
            </div>

            <div className="border-l-2 border-[#1c1a17]/8 pl-5">
              <p className="mb-2 font-mono text-[12px] text-[#1c1a17]/35">Interests</p>
              <p className="text-[15px] leading-[1.8] text-[#1c1a17]/60">
                Econometrics, network econometrics, peer effects, identification in social
                settings. Broadly interested in how formal statistical methods can be applied
                to problems where the unit of observation is not the individual in isolation,
                but the individual in relation to others.
              </p>
            </div>
          </div>
        </section>

        <Divider />

        {/* Background */}
        <section id="background" className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
          <p className="mb-9 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/32">Background</p>
          <div className="space-y-7">
            {background.map(({ year, role, org }) => (
              <div key={`${role}-${org}`} className="flex items-baseline justify-between gap-6">
                <div>
                  <p className="text-[15px] text-[#1c1a17]/80">{role}</p>
                  <p className="mt-0.5 text-[13px] text-[#1c1a17]/42">{org}</p>
                </div>
                <p className="shrink-0 font-mono text-[12px] text-[#1c1a17]/32">{year}</p>
              </div>
            ))}
          </div>
        </section>

        <Divider />

        {/* Interests */}
        <section className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
          <p className="mb-9 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/32">Interests</p>
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
            {interests.map(({ label, note }) => (
              <div key={label}>
                <p className="text-[15px] font-medium text-[#1c1a17]/82">{label}</p>
                {note && <p className="mt-1 text-[13px] leading-[1.6] text-[#1c1a17]/42">{note}</p>}
              </div>
            ))}
          </div>
        </section>

        <Divider />

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
          <p className="mb-9 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1c1a17]/32">FAQ</p>
          <div>
            {faq.map(({ q, a }) => (
              <details key={q} className="group border-b border-[#1c1a17]/8 py-5 first:border-t">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[15px] font-medium text-[#1c1a17]/78 transition hover:text-[#1c1a17]">
                  {q}
                  <span className="mt-0.5 shrink-0 font-mono text-[16px] leading-none text-[#1c1a17]/28 transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-[14px] leading-[1.8] text-[#1c1a17]/55">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-[#0b0b0a] px-6 py-10">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <p className="font-mono text-[11px] text-[#f2f0e8]/28">Caleb Eng</p>
          <div className="flex gap-6">
            {[
              { label: "Email", href: "mailto:calebeng21@gmail.com" },
              { label: "LinkedIn", href: "https://www.linkedin.com/in/calebeng/" },
              { label: "GitHub", href: "https://github.com/engcaleb" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="font-mono text-[11px] text-[#f2f0e8]/38 transition hover:text-[#f2f0e8]/65"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}

function Divider() {
  return (
    <div className="mx-auto max-w-2xl px-6">
      <div className="h-px bg-[#1c1a17]/8" />
    </div>
  );
}
