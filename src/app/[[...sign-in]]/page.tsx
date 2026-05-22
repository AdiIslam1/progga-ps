"use client";

import { inferRoleFromUsername } from "@/lib/roles";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const LoginPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const role =
    session?.user?.role || inferRoleFromUsername(session?.user?.username);

  useEffect(() => {
    if (status !== "authenticated" || !role) return;
    router.push(`/${role}`);
  }, [status, role, router]);

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-lamaSkyLight">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  if (status === "authenticated" && !role) {
    return (
      <div className="h-screen flex items-center justify-center bg-lamaSkyLight">
        <div className="bg-white p-8 rounded-md shadow-md text-center flex flex-col gap-3 max-w-md">
          <h2 className="text-lg font-semibold">Account role is missing</h2>
          <p className="text-sm text-gray-600">
            Signed in successfully, but this account has no role. Use a seeded
            username (admin*, teacher*, student*, parent*) and try again.
          </p>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-blue-500 text-white rounded-md px-3 py-2 text-sm"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="h-screen flex items-center justify-center bg-lamaSkyLight">
        <p className="text-sm text-gray-600">Redirecting...</p>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-lamaSkyLight">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-12 rounded-md shadow-2xl flex flex-col gap-2"
      >
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Image src="/logo.png" alt="" width={24} height={24} />
          SchooLama
        </h1>
        <h2 className="text-gray-400">Sign in to your account</h2>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-2 rounded-md ring-1 ring-gray-300"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 rounded-md ring-1 ring-gray-300"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white my-1 rounded-md text-sm p-[10px] disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
