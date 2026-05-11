type PageProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function Page({ title, subtitle, children }: PageProps) {
  return (
    <main className="min-h-screen bg-slate-100 pl-72">
      <div className="mx-auto max-w-7xl px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
        </div>

        {children}
      </div>
    </main>
  );
}
