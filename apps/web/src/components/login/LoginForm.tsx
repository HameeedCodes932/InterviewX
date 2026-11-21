"use client";

import Link from "next/link";
import { FormEvent, useId, useState, useSyncExternalStore } from "react";

const REMEMBER_KEY = "interviewx.login.rememberEmail";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readStoredEmail() {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribeRemembered(onStoreChange: () => void) {
  void onStoreChange;
  return () => {};
}

export function LoginForm() {
  const emailId = useId();
  const passwordId = useId();
  const rememberId = useId();

  const storedEmail = useSyncExternalStore(
    subscribeRemembered,
    readStoredEmail,
    () => "",
  );

  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [rememberDraft, setRememberDraft] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const email = emailDraft ?? storedEmail;
  const remember = rememberDraft ?? Boolean(storedEmail);
  const setEmail = (value: string) => setEmailDraft(value);
  const setRemember = (value: boolean) => setRememberDraft(value);

  function validate() {
    let ok = true;
    if (!email.trim()) {
      setEmailError("Email is required.");
      ok = false;
    } else if (!isValidEmail(email.trim())) {
      setEmailError("Enter a valid email address.");
      ok = false;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError("Password is required.");
      ok = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      ok = false;
    } else {
      setPasswordError(null);
    }

    return ok;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormNotice(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      /* ignore */
    }

    // Honest non-operational state — authentication is not wired yet.
    await new Promise((r) => setTimeout(r, 450));
    setSubmitting(false);
    setFormNotice(
      "Sign-in is not connected yet — authentication will be wired in a later task. Your details were validated locally only.",
    );
  }

  return (
    <div className="rounded-ix border border-ix-charcoal/8 bg-ix-softgrey/90 p-6 shadow-soft backdrop-blur-sm sm:p-8">
      <div>
        <h2 className="font-display text-2xl tracking-tight text-ix-graphite sm:text-[1.75rem]">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-ix-charcoal/65">
          Sign in to your InterviewX account.
        </p>
      </div>

      <form className="mt-7 space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label
            htmlFor={emailId}
            className="mb-1.5 block text-sm text-ix-charcoal/70"
          >
            Email address
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className="ix-field"
            placeholder="you@company.com"
            value={email}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? `${emailId}-error` : undefined}
            onChange={(ev) => {
              setEmail(ev.target.value);
              if (emailError) setEmailError(null);
              if (formNotice) setFormNotice(null);
            }}
          />
          {emailError ? (
            <p id={`${emailId}-error`} className="mt-1.5 text-sm text-red-800" role="alert">
              {emailError}
            </p>
          ) : null}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              htmlFor={passwordId}
              className="block text-sm text-ix-charcoal/70"
            >
              Password
            </label>
            <Link href="/forgot-password" className="ix-link text-sm">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="ix-field pr-12"
              placeholder="Enter your password"
              value={password}
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? `${passwordId}-error` : undefined}
              onChange={(ev) => {
                setPassword(ev.target.value);
                if (passwordError) setPasswordError(null);
                if (formNotice) setFormNotice(null);
              }}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1.5 text-xs font-medium text-ix-charcoal/60 transition hover:bg-ix-charcoal/5 hover:text-ix-charcoal"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {passwordError ? (
            <p
              id={`${passwordId}-error`}
              className="mt-1.5 text-sm text-red-800"
              role="alert"
            >
              {passwordError}
            </p>
          ) : null}
        </div>

        <label
          htmlFor={rememberId}
          className="flex cursor-pointer items-center gap-2.5 text-sm text-ix-charcoal/75"
        >
          <input
            id={rememberId}
            name="remember"
            type="checkbox"
            checked={remember}
            onChange={(ev) => setRemember(ev.target.checked)}
            className="h-4 w-4 rounded border-ix-charcoal/25 text-ix-indigo focus:ring-ix-blue/40"
          />
          Remember me
        </label>

        {formNotice ? (
          <p
            className="rounded-ix-sm border border-ix-indigo/20 bg-white/70 px-3.5 py-3 text-sm leading-relaxed text-ix-charcoal/80"
            role="status"
          >
            {formNotice}
          </p>
        ) : null}

        <button type="submit" className="ix-btn-primary" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3" aria-hidden>
        <div className="h-px flex-1 bg-ix-charcoal/10" />
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-ix-silver">
          or
        </span>
        <div className="h-px flex-1 bg-ix-charcoal/10" />
      </div>

      <p className="text-center text-sm text-ix-charcoal/65">
        New to InterviewX?{" "}
        <Link href="/signup" className="ix-link font-medium">
          Sign up
        </Link>
      </p>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-ix-charcoal/40">
        Google and GitHub sign-in are omitted until authentication infrastructure
        supports them.
      </p>
    </div>
  );
}
