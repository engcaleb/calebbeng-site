import React from "react";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireDoctor } from "@/lib/recoverbright/auth";
import { getPageForPdf } from "@/lib/recoverbright/portal-pages";
import { generateQrDataUrl } from "@/lib/recoverbright/qr";
import { RecoverBrightDocument } from "@/lib/recoverbright/pdf";

// Never cache — each response is personalized and reads live DB data
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ pageId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { pageId } = await params;

  // requireDoctor redirects to /portal/login if not authenticated
  const doctor = await requireDoctor();

  const page = await getPageForPdf(pageId, doctor.practice_id);
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Single QR linking to the hosted patient page — URL shape depends on page type
    const surgerySegment = page.surgery_type
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const pageUrl = page.show_doctor
      ? `https://recoverbright.com/dr/${page.practice_slug}/${page.doctor_slug}/${surgerySegment}`
      : `https://recoverbright.com/dr/${page.practice_slug}/${surgerySegment}`;
    const qrDataUrl = await generateQrDataUrl(pageUrl);

    const buffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(RecoverBrightDocument, {
        page,
        doctorName: page.doctor_name,
        qrDataUrl,
      }) as React.ReactElement<any>
    );

    const surgerySlug = page.surgery_type
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = `recoverbright-${surgerySlug}-recovery.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[PDF] generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
