"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";
import { DemoAuthError, registerDemoAccount } from "@/lib/demo-auth";

const PASSWORD_HINT =
  "Use at least 8 characters, including one uppercase letter, one lowercase letter, and one number.";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function meetsPasswordRequirements(value: string) {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value)
  );
}

export function SignupForm() {
  const router = useRouter();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const termsId = useId();
  const passwordHintId = useId();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function clearNotice() {
    if (formNotice) setFormNotice(null);
  }

  function validate() {
    let ok = true;

    if (!fullName.trim()) {
      setNameError("Full name is required.");
      ok = false;
    } else if (fullName.trim().length < 2) {
      setNameError("Enter your full name.");
      ok = false;
    } else {
      setNameError(null);
    }

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
    } else if (!meetsPasswordRequirements(password)) {
      setPasswordError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
      );
      ok = false;
    } else {
      setPasswordError(null);
    }

    if (!confirmPassword) {
      setConfirmError("Confirm your password.");
      ok = false;
    } else if (confirmPassword !== password) {
      setConfirmError("Passwords do not match.");
      ok = false;
    } else {
      setConfirmError(null);
    }

    if (!acceptedTerms) {
      setTermsError("Please accept the Terms and Conditions to continue.");
      ok = false;
    } else {
      setTermsError(null);
    }

    return ok;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormNotice(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      // DEMO-ONLY: create local account (PBKDF2 hash) + session, then dashboard.
      await registerDemoAccount({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      setPassword("");
      setConfirmPassword("");
      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof DemoAuthError && error.code === "duplicate_email") {
        setEmailError(error.message);
      } else if (error instanceof DemoAuthError) {
        setFormNotice(error.message);
      } else {
        setFormNotice(
          "Unable to create the demo account in this browser. Check storage permissions and try again.",
        );
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="ix-login-card ix-signup-card">
      <div>
        <h2 className="font-display text-[1.55rem] tracking-tight text-ix-graphite sm:text-[1.7rem]">
          Create your account
        </h2>
        <p className="mt-1.5 text-sm text-ix-charcoal/60">
          Start preparing with InterviewX in a few calm steps.
        </p>
      </div>

      <form className="mt-5 space-y-3.5" onSubmit={onSubmit} noValidate>
        <div>
          <label
            htmlFor={nameId}
            className="mb-1.5 block text-sm text-ix-charcoal/70"
          >
            Full name
          </label>
          <input
            id={nameId}
            name="fullName"
            type="text"
            autoComplete="name"
            className="ix-field"
            placeholder="Alex Rivera"
            value={fullName}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? `${nameId}-error` : undefined}
            onChange={(ev) => {
              setFullName(ev.target.value);
              if (nameError) setNameError(null);
              clearNotice();
            }}
          />
          {nameError ? (
            <p
              id={`${nameId}-error`}
              className="mt-1.5 text-sm text-red-800"
              role="alert"
            >
              {nameError}
            </p>
          ) : null}
        </div>

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
              clearNotice();
            }}
          />
          {emailError ? (
            <p
              id={`${emailId}-error`}
              className="mt-1.5 text-sm text-red-800"
              role="alert"
            >
              {emailError}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={passwordId}
            className="mb-1.5 block text-sm text-ix-charcoal/70"
          >
            Password
          </label>
          <div className="relative">
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="ix-field pr-12"
              placeholder="Create a password"
              value={password}
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={
                passwordError
                  ? `${passwordId}-error ${passwordHintId}`
                  : passwordHintId
              }
              onChange={(ev) => {
                setPassword(ev.target.value);
                if (passwordError) setPasswordError(null);
                if (confirmError && confirmPassword) setConfirmError(null);
                clearNotice();
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
          <p
            id={passwordHintId}
            className="mt-1.5 text-[12px] leading-relaxed text-ix-charcoal/50"
          >
            {PASSWORD_HINT}
          </p>
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

        <div>
          <label
            htmlFor={confirmId}
            className="mb-1.5 block text-sm text-ix-charcoal/70"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id={confirmId}
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              className="ix-field pr-12"
              placeholder="Re-enter your password"
              value={confirmPassword}
              aria-invalid={confirmError ? true : undefined}
              aria-describedby={confirmError ? `${confirmId}-error` : undefined}
              onChange={(ev) => {
                setConfirmPassword(ev.target.value);
                if (confirmError) setConfirmError(null);
                clearNotice();
              }}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1.5 text-xs font-medium text-ix-charcoal/60 transition hover:bg-ix-charcoal/5 hover:text-ix-charcoal"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={
                showConfirm ? "Hide confirm password" : "Show confirm password"
              }
              aria-pressed={showConfirm}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
          {confirmError ? (
            <p
              id={`${confirmId}-error`}
              className="mt-1.5 text-sm text-red-800"
              role="alert"
            >
              {confirmError}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={termsId}
            className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-ix-charcoal/75"
          >
            <input
              id={termsId}
              name="terms"
              type="checkbox"
              checked={acceptedTerms}
              aria-invalid={termsError ? true : undefined}
              aria-describedby={termsError ? `${termsId}-error` : undefined}
              onChange={(ev) => {
                setAcceptedTerms(ev.target.checked);
                if (termsError) setTermsError(null);
                clearNotice();
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-ix-charcoal/25 text-ix-indigo focus:ring-ix-blue/40"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="ix-link font-medium">
                Terms and Conditions
              </Link>
            </span>
          </label>
          {termsError ? (
            <p
              id={`${termsId}-error`}
              className="mt-1.5 text-sm text-red-800"
              role="alert"
            >
              {termsError}
            </p>
          ) : null}
        </div>

        {formNotice ? (
          <p
            className="rounded-ix-sm border border-ix-indigo/20 bg-white/70 px-3.5 py-3 text-sm leading-relaxed text-ix-charcoal/80"
            role="status"
          >
            {formNotice}
          </p>
        ) : null}

        <button type="submit" className="ix-btn-primary" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3" aria-hidden>
        <div className="h-px flex-1 bg-ix-charcoal/10" />
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ix-silver">
          or
        </span>
        <div className="h-px flex-1 bg-ix-charcoal/10" />
      </div>

      <p className="text-center text-sm text-ix-charcoal/65">
        Already have an account?{" "}
        <Link href="/login" className="ix-link font-medium">
          Sign in
        </Link>
      </p>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-ix-charcoal/40">
        Demo Mode — accounts stay in this browser only and are not production
        authentication.
      </p>
    </div>
  );
}
