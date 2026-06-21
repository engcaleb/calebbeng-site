// app/(recoverbright)/recoverbright/portal/(protected)/page.tsx
import { requireDoctor } from "@/lib/recoverbright/auth";
import { getPracticePages } from "@/lib/recoverbright/portal-pages";
import { surgeryTypeToUrlSegment } from "@/lib/recoverbright/pages";
import { logoutAction } from "../login/actions";
import { OnboardingChecklist } from "./OnboardingChecklist";
import Link from "next/link";

export default async function PortalPage() {
  const doctor = await requireDoctor();
  const pages = await getPracticePages(doctor.practice.id);

  const myPages = pages.filter((p) => p.doctor_slug === doctor.slug);
  const hasLogo = !!doctor.practice.logo_url;
  const hasPage = myPages.length > 0;
  const hasPublishedPage = myPages.some((p) => p.is_published);

  const firstPublishedPage = myPages.find((p) => p.is_published);
  const shareUrl = firstPublishedPage
    ? `/dr/${doctor.practice.slug}/${doctor.slug}/${surgeryTypeToUrlSegment(firstPublishedPage.surgery_type)}`
    : null;

  const onboardingSteps = [
    {
      label: "Upload your practice logo",
      description: "Appears on patient pages and PDFs",
      href: "/recoverbright/portal/settings",
      done: hasLogo,
    },
    {
      label: "Create your first page",
      description: "Pick a surgery type and customize products",
      href: "/recoverbright/portal/pages/new",
      done: hasPage,
    },
    {
      label: "Preview your page",
      description: "See what patients will see",
      href: firstPublishedPage
        ? `/recoverbright${shareUrl}`
        : "/recoverbright/portal/pages/new",
      done: hasPublishedPage,
    },
    {
      label: "Share with patients",
      description: "Copy link or download PDF",
      href: firstPublishedPage
        ? `/recoverbright/portal/pages/${firstPublishedPage.id}/edit`
        : "/recoverbright/portal/pages/new",
      done: hasPublishedPage,
    },
  ];

  const showOnboarding =
    !doctor.onboarding_dismissed &&
    onboardingSteps.some((s) => !s.done);

  return (
    <main className="min-h-screen bg-[#f9f7f4] p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-mono text-2xl font-semibold text-[#1c1a17]">
              Welcome, {doctor.name}
            </h1>
            <p className="mt-1 font-mono text-sm text-[#1c1a17]/50">
              {doctor.practice.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/recoverbright/portal/pages/new" className="btn-primary">
              New Page
            </Link>
            <Link href="/recoverbright/portal/settings" className="btn-ghost">
              Settings
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn-ghost">
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Onboarding checklist */}
        {showOnboarding && <OnboardingChecklist steps={onboardingSteps} />}

        {/* Page list */}
        {pages.length === 0 ? (
          <div className="rounded-xl border border-[#e8e3da] bg-white p-12 text-center">
            <p className="font-mono text-sm text-[#1c1a17]/40">
              No recommendation pages yet.
            </p>
            <Link
              href="/recoverbright/portal/pages/new"
              className="mt-4 inline-block btn-primary"
            >
              Create your first page
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map((page) => {
              const segment = surgeryTypeToUrlSegment(page.surgery_type);
              const patientPath = `/dr/${doctor.practice.slug}/${page.doctor_slug}/${segment}`;
              return (
                <div
                  key={page.id}
                  className="rounded-xl border border-[#e8e3da] bg-white px-6 py-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#1c1a17]">
                        {page.surgery_type}
                      </p>
                      <p className="mt-0.5 font-mono text-[12px] text-[#1c1a17]/40">
                        {page.doctor_name} · {page.product_count}{" "}
                        {page.product_count === 1 ? "product" : "products"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] ${
                          page.is_published
                            ? "bg-green-50 text-green-700"
                            : "bg-[#1c1a17]/6 text-[#1c1a17]/40"
                        }`}
                      >
                        {page.is_published ? "Published" : "Draft"}
                      </span>
                      {page.is_published && (
                        <Link
                          href={`/recoverbright${patientPath}`}
                          target="_blank"
                          className="font-mono text-[12px] text-[#1c1a17]/50 underline underline-offset-2 hover:text-[#1c1a17]"
                        >
                          View
                        </Link>
                      )}
                      <a
                        href={`/recoverbright/portal/pages/${page.id}/pdf`}
                        download
                        className="font-mono text-[12px] text-[#1c1a17]/50 underline underline-offset-2 hover:text-[#1c1a17]"
                      >
                        PDF
                      </a>
                      <Link
                        href={`/recoverbright/portal/pages/${page.id}/edit`}
                        className="font-mono text-[12px] text-[#1c1a17]/50 underline underline-offset-2 hover:text-[#1c1a17]"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                  {page.is_published && (
                    <p className="mt-2 font-mono text-[11px] text-[#1c1a17]/30">
                      recoverbright.com{patientPath}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
