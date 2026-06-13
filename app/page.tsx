const edges = [
  ["n1", "n2"],
  ["n1", "n4"],
  ["n2", "n3"],
  ["n2", "n5"],
  ["n3", "n6"],
  ["n4", "n5"],
  ["n5", "n6"],
  ["n5", "n7"],
  ["n6", "n8"],
  ["n7", "n8"],
  ["n8", "n9"],
  ["n3", "n9"],
];

const nodes = {
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

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b0a] text-[#f2f0e8]">
      {/* Paper-like texture */}
      <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(0deg,#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Background graph */}
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
              x1={nodes[a as keyof typeof nodes].x}
              y1={nodes[a as keyof typeof nodes].y}
              x2={nodes[b as keyof typeof nodes].x}
              y2={nodes[b as keyof typeof nodes].y}
            />
          ))}
        </g>

        <g>
          {nodeEntries.map(([id, node], i) => (
            <circle
              key={id}
              cx={node.x}
              cy={node.y}
              r={node.r / 3.5}
              fill="#f2f0e8"
              style={{
                animation: "outer-pulse 4s ease-in-out infinite",
                animationDelay: `${i * 0.35}s`,
              }}
            />
          ))}
        </g>

        <g>
          {nodeEntries.map(([id, node], i) => (
            <circle
              key={`${id}-core`}
              cx={node.x}
              cy={node.y}
              r={node.r / 9}
              fill="#f2f0e8"
              style={{
                animation: "core-pulse 4s ease-in-out infinite",
                animationDelay: `${i * 0.35}s`,
              }}
            />
          ))}
        </g>
      </svg>

      {/* Graph annotation */}
      <div className="absolute left-6 top-6 hidden font-mono text-[11px] text-[#f2f0e8]/30 sm:block">
        economic network theory
      </div>

      {/* Main content */}
      <section className="relative z-10 flex min-h-screen items-center px-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="max-w-2xl">
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.32em] text-[#f2f0e8]/45">
              Caleb Eng
            </p>

            <h1 className="max-w-3xl text-5xl font-medium tracking-[-0.04em] text-[#f2f0e8] sm:text-7xl">
              Working on it.
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-[#f2f0e8]/60 sm:text-lg">
              This site is a work in progress. The graph is a nod to economic
              network theory — the study of how agents, markets, and
              relationships give rise to complex systems.
            </p>

            <div className="mt-10 flex gap-3">
              <a
                href="https://github.com/engcaleb"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[#f2f0e8]/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-[#f2f0e8]/70 transition hover:border-[#f2f0e8]/45 hover:text-[#f2f0e8]"
              >
                GitHub
              </a>

              <a
                href="mailto:calebeng21@gmail.com"
                className="border border-[#f2f0e8]/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-[#f2f0e8]/70 transition hover:border-[#f2f0e8]/45 hover:text-[#f2f0e8]"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
