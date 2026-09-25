import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Sign in — Resonance Studios" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel (hidden on small screens) */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-indigo-800 p-12 text-cream-50 lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-saffron-400 font-display text-2xl text-indigo-900">
            ॐ
          </span>
          <span className="font-display text-2xl">Resonance Studios</span>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-4xl leading-tight">
            The journey of a thousand compositions begins with a single{" "}
            <span className="text-saffron-300">bol</span>.
          </h1>
          <p className="mt-4 text-indigo-200">
            A structured path through Indian classical Tabla — unlocking one
            lesson at a time, at the pace of a true guru–shishya tradition.
          </p>
        </div>

        <p className="text-sm text-indigo-300">
          © {new Date().getFullYear()} Resonance Studios · Tabla Vidya
        </p>

        {/* decorative rotating arc + glow */}
        <div className="pointer-events-none absolute -right-24 top-1/2 h-96 w-96 -translate-y-1/2 animate-spin-slow rounded-full border-[24px] border-saffron-400/10" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-80 w-80 animate-float rounded-full bg-saffron-400/10 blur-3xl" />
      </section>

      {/* Right: auth form */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-saffron-400 font-display text-xl text-indigo-900">
              ॐ
            </span>
            <span className="font-display text-xl text-indigo-800">
              Resonance Studios
            </span>
          </div>

          <h2 className="font-display text-3xl text-indigo-900">Welcome back</h2>
          <p className="mb-8 mt-1 text-indigo-500">
            Sign in to continue your Tabla practice.
          </p>

          <AuthForm />
        </div>
      </section>
    </main>
  );
}
