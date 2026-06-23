import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 min-h-screen flex-col items-center justify-center px-4 bg-brand-light">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          {/* SVG nativo: filtro aplicado dentro do contexto SVG, sem bug de compositing do Chrome */}
          <svg
            width="128"
            height="128"
            className="shadow-xl"
            style={{ borderRadius: "50%", display: "block" }}
          >
            <defs>
              <filter
                id="logo-bordeaux"
                filterUnits="userSpaceOnUse"
                x="-96" y="-96" width="320" height="320"
              >
                <feFlood floodColor="#8B1A1A" floodOpacity="1" result="bg" />
                <feColorMatrix
                  type="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 -3 0 3"
                  in="SourceGraphic"
                  result="masked"
                />
                <feComposite in="masked" in2="bg" operator="over" />
              </filter>
              <clipPath id="logo-circle">
                <circle cx="64" cy="64" r="64" />
              </clipPath>
            </defs>
            {/* 250%: 128×2.5=320, offset=(128-320)/2=-96 */}
            <image
              href="/logo-login.png"
              x="-96" y="-96"
              width="320" height="320"
              filter="url(#logo-bordeaux)"
              clipPath="url(#logo-circle)"
              preserveAspectRatio="xMidYMid meet"
            />
          </svg>

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
