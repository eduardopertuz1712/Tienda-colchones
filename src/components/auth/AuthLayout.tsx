import Link from "next/link";

/**
 * Marco visual compartido por todas las pantallas de acceso: panel de
 * marca a la izquierda (oculto en móvil) y formulario a la derecha.
 */
export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  brandTitle,
  brandPoints,
  homeHref = "/",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  brandTitle: string;
  brandPoints: string[];
  homeHref?: string;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white lg:flex">
        {/* Halos decorativos: puro CSS, sin imágenes que cargar. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl"
        />

        <Link href={homeHref} className="relative z-10 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-slate-900">
            T
          </span>
          <span className="text-lg font-semibold tracking-tight">
            {brandTitle}
          </span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Todo tu negocio, en un solo lugar.
          </h2>

          <ul className="mt-8 space-y-4">
            {brandPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-slate-300">
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} {brandTitle}
        </p>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            {eyebrow}
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer && (
            <div className="mt-8 text-center text-sm text-slate-500">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
