import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 min-h-screen flex-col items-center justify-center px-4 bg-brand-light">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
            <defs>
              <filter id="remove-white-login">
                <feColorMatrix
                  type="matrix"
                  values="1 0 0 0 0
                          0 1 0 0 0
                          0 0 1 0 0
                         -1 -1 -1 3 0"
                />
              </filter>
            </defs>
          </svg>

          <div className="w-28 h-28 rounded-full bg-brand flex items-center justify-center overflow-hidden shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-login.png"
              alt=""
              className="h-[160px] w-auto object-contain"
            />
          </div>

          <div className="text-center flex flex-col items-center gap-1">
            <p
              className="text-2xl font-bold tracking-wide text-brand"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Reconecta
            </p>
            <p className="text-xs text-zinc-500 italic">
              Reconectando quem você é e como você é vista
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white px-8 py-8 shadow-sm">
          <p className="text-sm text-zinc-500 text-center mb-6">
            Acesso restrito ao time interno
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
