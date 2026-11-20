import Link from "next/link";
import { getMessages, t } from "@/lib/i18n";

export function AuthCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const m = getMessages();
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="atmosphere-layer" aria-hidden />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
        <Link
          href="/"
          className="mb-8 font-display text-3xl tracking-tight text-ink animate-rise"
        >
          {t(m, "brand.name")}
        </Link>
        <div className="animate-rise-delay rounded-2xl border border-ink/10 bg-mist/85 p-6 shadow-soft backdrop-blur sm:p-8">
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6 text-sm text-ink-muted">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
