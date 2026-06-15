import React from "react";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireDoctor } from "@/lib/recoverwell/auth";
import { getPageForPdf } from "@/lib/recoverwell/portal-pages";
import { generateQrDataUrl } from "@/lib/recoverwell/qr";
import { RecoverWellDocument } from "@/lib/recoverwell/pdf";

// Never cache — each response is personalized and reads live DB data
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ pageId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { pageId } = await params;

  // requireDoctor redirects to /portal/login if not authenticated
  const doctor = await requireDoctor();

  const page = await getPageForPdf(pageId, doctor.id);
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Generate all QR codes in parallel
  const qrEntries = await Promise.all(
    page.products.map(async (p) => {
      const url = `https://recoverwell.calebbeng.com/products/${p.slug}`;
      const dataUrl = await generateQrDataUrl(url);
      return [p.slug, dataUrl] as const;
    })
  );
  const qrDataUrls = Object.fromEntries(qrEntries);

  try {
    const buffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(RecoverWellDocument, {
        page,
        doctorName: doctor.name,
        qrDataUrls,
      }) as React.ReactElement<any>
    );

    const surgerySlug = page.surgery_type.toLowerCase().replace(/\s+/g, "-");
    const filename = `recoverwell-${surgerySlug}-recovery.pdf`;

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
