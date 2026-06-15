# RecoverWell — Practice-Wide Mode Design

**Date:** 2026-06-15
**Scope:** Per-page toggle that hides doctor attribution on the patient-facing page

---

## Goal

Allow a doctor to mark any of their recommendation pages as "practice-wide" — hiding their name and avatar from the patient page so it reads as a practice-level page rather than a personally attributed one. The toggle is per-page, doctor-controlled, and defaults to showing the doctor's name (existing behavior).

---

## Design Decisions

### What changes when practice-wide mode is on

The doctor attribution row (avatar circle + "Recommended by Dr. Sarah Chen") is hidden. Everything else is unchanged:
- Practice logo/initials + practice name in the header
- Surgery type monospace label
- h1: "Your {surgery_type} Recovery Guide"
- All products, instructions, and buy buttons

### Who controls it

The doctor, per page, via a toggle in the portal page editor. Not a practice-level setting.

### Default

`show_doctor = true` — existing pages keep their current behavior with no migration side effects.

---

## Data Model

### Migration

```sql
ALTER TABLE rw_recommendation_pages
  ADD COLUMN show_doctor boolean NOT NULL DEFAULT true;
```

No backfill needed — `DEFAULT true` applies to all existing rows and preserves current behavior.

### RLS

No new RLS policies needed. `show_doctor` is a column on `rw_recommendation_pages`, which already has:
- Anon SELECT on published pages (patient page reads it)
- Doctor CRUD on their own pages (portal writes it)

---

## Data Layer

### `lib/recoverwell/pages.ts`

**`PublishedPage` type** — add field:
```ts
show_doctor: boolean;
```

**`getPublishedPage`** — add `show_doctor` to the select on `rw_recommendation_pages`:
```ts
.select("id, doctor_id, surgery_type, is_published, show_doctor")
```
Return it in the `PublishedPage` object.

### `lib/recoverwell/portal-pages.ts`

**`PageForEditor` type** — add field:
```ts
show_doctor: boolean;
```

**`getPageForEditor`** — add `show_doctor` to the select on `rw_recommendation_pages`. Return it in the `PageForEditor` object.

---

## Server Action

**File:** `app/(recoverwell)/recoverwell/portal/(protected)/pages/actions.ts`

Add `toggleShowDoctor` — mirrors `togglePublish` exactly:

```ts
export async function toggleShowDoctor(
  pageId: string,
  practiceSlug: string,
  surgeryType: string,
  currentValue: boolean
): Promise<void> {
  const doctor = await requireDoctor();
  // Verify ownership
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("rw_recommendation_pages")
    .select("id")
    .eq("id", pageId)
    .eq("doctor_id", doctor.id)
    .single();
  if (!page) throw new Error("Page not found or not owned by this doctor");
  await supabase
    .from("rw_recommendation_pages")
    .update({ show_doctor: !currentValue })
    .eq("id", pageId);
  revalidatePath(`/recoverwell/dr/${practiceSlug}/${surgeryType}`);
}
```

---

## Portal UI — `PageEditor.tsx`

### State

```ts
const [showDoctor, setShowDoctor] = useState(page.show_doctor);
const [isShowDoctorPending, startShowDoctorTransition] = useTransition();
```

### Toggle handler

```ts
function handleToggleShowDoctor() {
  startShowDoctorTransition(async () => {
    try {
      await toggleShowDoctor(page.id, practiceSlug, page.surgery_type, showDoctor);
      setShowDoctor((v) => !v);
    } catch {
      // silent — badge won't flip if it fails
    }
  });
}
```

### Button placement

In the header row alongside the existing Publish pill:

```tsx
<button
  onClick={handleToggleShowDoctor}
  disabled={isShowDoctorPending}
  className={`mt-1 shrink-0 rounded-full px-3 py-1 font-mono text-[12px] transition disabled:opacity-50 ${
    showDoctor
      ? "bg-[#1c1a17]/6 text-[#1c1a17]/40 hover:bg-[#1c1a17]/10"
      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
  }`}
>
  {isShowDoctorPending ? "…" : showDoctor ? "My name shown" : "Practice-wide"}
</button>
```

Style intent: when `showDoctor = true` the button is muted (it's the default, nothing special). When `showDoctor = false` (practice-wide active) it's blue to signal an active non-default state.

---

## Patient Page — `dr/[slug]/[surgery-type]/page.tsx`

Wrap the attribution row in a conditional:

```tsx
{page.show_doctor && (
  <div className="mt-2 flex items-center gap-2">
    <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#d4e4f7]">
      <span className="text-[10px] font-bold text-[#2c5282]">
        {doctorInitials(doctor_name)}
      </span>
    </div>
    <p className="text-[12px] text-[#1c1a17]/50">
      Recommended by{" "}
      <span className="font-semibold text-[#1c1a17]">{doctor_name}</span>
    </p>
  </div>
)}
```

No other changes to the patient page.

---

## Out of Scope

- Practice-level page entity (separate product list per practice — not this feature)
- Linking between practice-wide and doctor-specific pages
- URL changes (URL stays `/dr/[practice-slug]/[surgery-type]` regardless of mode)
