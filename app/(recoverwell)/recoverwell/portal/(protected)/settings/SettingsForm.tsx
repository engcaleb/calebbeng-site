"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { saveSettings } from "./actions";
import type { DoctorWithPractice } from "@/lib/recoverwell/auth";

export function SettingsForm({ doctor }: { doctor: DoctorWithPractice }) {
  const [logoUrl, setLogoUrl] = useState(doctor.practice.logo_url ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle"
  );
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (doctor.practice.name.slice(0, 2) || "?").toUpperCase();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("bucket", "practice-logos");
      body.append("id", doctor.practice.id);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed");
      setLogoUrl(json.url);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed — try again"
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleSave(formData: FormData) {
    formData.set("logo_url", logoUrl);
    startTransition(async () => {
      setSaveStatus("idle");
      try {
        await saveSettings(formData);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    });
  }

  return (
    <form action={handleSave} className="space-y-6">
      {/* Back */}
      <div className="mb-8">
        <Link
          href="/recoverwell/portal"
          className="font-mono text-[12px] text-[#1c1a17]/40 hover:text-[#1c1a17]"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-xl font-medium text-[#1c1a17]">Settings</h1>
      </div>

      {/* Practice Logo */}
      <div>
        <p className="label mb-3">Practice Logo</p>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Practice logo"
              className="h-16 w-16 rounded-lg border border-[#e8e3da] object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#1c1a17]/6 font-mono text-sm text-[#1c1a17]/40">
              {initials}
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="btn-ghost disabled:opacity-50"
            >
              {isUploading ? "Uploading…" : "Choose file"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {uploadError && (
              <p className="mt-1 font-mono text-[11px] text-red-500">
                {uploadError}
              </p>
            )}
          </div>
        </div>
        {/* logo_url is injected into FormData via handleSave — no name attribute needed */}
        <div className="mt-3 flex items-center gap-2">
          <span className="shrink-0 font-mono text-[11px] text-[#1c1a17]/35">
            or paste URL
          </span>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => {
              setLogoUrl(e.target.value);
              setSaveStatus("idle");
            }}
            placeholder="https://…"
            className="input flex-1 font-mono text-[13px]"
          />
        </div>
      </div>

      {/* Practice Name */}
      <div className="flex flex-col gap-1">
        <label className="label" htmlFor="practice_name">
          Practice Name
        </label>
        <input
          id="practice_name"
          name="practice_name"
          required
          defaultValue={doctor.practice.name}
          onChange={() => setSaveStatus("idle")}
          className="input"
        />
      </div>

      {/* Contact Email */}
      <div className="flex flex-col gap-1">
        <label className="label" htmlFor="contact_email">
          Contact Email
        </label>
        <input
          id="contact_email"
          name="contact_email"
          type="email"
          defaultValue={doctor.practice.contact_email ?? ""}
          onChange={() => setSaveStatus("idle")}
          className="input"
        />
      </div>

      {/* Doctor Name */}
      <div className="flex flex-col gap-1">
        <label className="label" htmlFor="doctor_name">
          Your Name
        </label>
        <input
          id="doctor_name"
          name="doctor_name"
          required
          defaultValue={doctor.name}
          onChange={() => setSaveStatus("idle")}
          className="input"
        />
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-4 border-t border-[#e8e3da] pt-6">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Saving…" : "Save"}
        </button>
        {saveStatus === "saved" && (
          <span className="font-mono text-[12px] text-green-600">Saved</span>
        )}
        {saveStatus === "error" && (
          <span className="font-mono text-[12px] text-red-500">
            Error saving — try again
          </span>
        )}
      </div>
    </form>
  );
}
