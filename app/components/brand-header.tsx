import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export async function BrandHeader() {
  const session = await getServerSession(authOptions);

  return (
    <header className="bg-brand px-6 py-0 h-[100px] overflow-hidden flex items-center justify-between shadow-md">
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <filter id="remove-white">
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
      <Link href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Reconecta"
          className="h-[250px] w-auto object-contain"
          style={{ filter: "url(#remove-white)" }}
        />
      </Link>
      {session && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/60 hidden sm:block">{session.user.name}</span>
          <SignOutButton />
        </div>
      )}
    </header>
  );
}
