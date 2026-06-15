import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { PageForPdf } from "./portal-pages";

const C = {
  bg: "#ffffff",
  card: "#f9f7f4",
  text: "#1c1a17",
  muted: "rgba(28,26,23,0.45)",
  faint: "rgba(28,26,23,0.28)",
  border: "#e8e3da",
  placeholder: "rgba(28,26,23,0.06)",
  logoBg: "rgba(28,26,23,0.06)",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 10,
    color: C.text,
    fontFamily: "Helvetica",
  },
  // ── Header ──────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 6,
    marginRight: 12,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: C.logoBg,
    borderRadius: 6,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoInitials: {
    fontSize: 12,
    color: C.muted,
    letterSpacing: 1,
    fontFamily: "Helvetica-Bold",
  },
  practiceName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
    color: C.text,
  },
  surgeryLabel: {
    fontSize: 8,
    color: C.muted,
    letterSpacing: 1.5,
  },
  pageTitleSmall: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    lineHeight: 1.1,
  },
  pageTitleLarge: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    lineHeight: 1.1,
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 9,
    color: C.muted,
  },
  headerRight: {
    alignItems: "center",
    marginLeft: 20,
    paddingTop: 4,
  },
  qr: {
    width: 72,
    height: 72,
  },
  qrLabel: {
    fontSize: 7,
    color: C.muted,
    textAlign: "center",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 10,
  },
  // ── Section header ───────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.text,
  },
  sectionCount: {
    fontSize: 8,
    color: C.muted,
    letterSpacing: 1,
  },
  // ── Product cards ────────────────────────────────────────────
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
    gap: 8,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 3,
    flexShrink: 0,
  },
  productImg: {
    width: 56,
    height: 56,
    borderRadius: 4,
    flexShrink: 0,
  },
  productImgPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: C.placeholder,
    borderRadius: 4,
    flexShrink: 0,
  },
  productContent: {
    flex: 1,
  },
  productCategory: {
    fontSize: 7,
    color: C.muted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
    color: C.text,
  },
  productInstructions: {
    fontSize: 8.5,
    color: C.muted,
    lineHeight: 1.5,
  },
  // ── Footer ───────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: C.faint,
    letterSpacing: 0.8,
  },
  pageNum: {
    fontSize: 7,
    color: C.faint,
  },
});

export type RecoverWellDocumentProps = {
  page: PageForPdf;
  doctorName: string;
  qrDataUrl: string; // single QR linking to the doctor's patient page
};

export function RecoverWellDocument({
  page,
  doctorName,
  qrDataUrl,
}: RecoverWellDocumentProps) {
  const initials = page.practice_name.slice(0, 2).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {/* Practice identity row */}
            <View style={s.headerLogoRow}>
              {page.practice_logo_url ? (
                <Image src={page.practice_logo_url} style={s.logo} />
              ) : (
                <View style={s.logoPlaceholder}>
                  <Text style={s.logoInitials}>{initials}</Text>
                </View>
              )}
              <View>
                <Text style={s.practiceName}>{page.practice_name}</Text>
                <Text style={s.surgeryLabel}>
                  {page.surgery_type.toUpperCase()} · RECOVERY GUIDE
                </Text>
              </View>
            </View>

            {/* Title block */}
            <Text style={s.pageTitleSmall}>{"Your Doctor's"}</Text>
            <Text style={s.pageTitleLarge}>Recommendations</Text>
            <Text style={s.doctorName}>Recommended by {doctorName}</Text>
          </View>

          {/* Right: single QR */}
          <View style={s.headerRight}>
            <Image src={qrDataUrl} style={s.qr} />
            <Text style={s.qrLabel}>Scan to view{"\n"}on your phone</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Section header ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Recommended Products</Text>
          <Text style={s.sectionCount}>
            {page.products.length.toString().padStart(2, "0")} ITEMS
          </Text>
        </View>

        {/* ── Product cards ── */}
        {page.products.map((product) => (
          <View key={product.slug} style={s.card} wrap={false}>
            {/* Checkbox for patient to tick off */}
            <View style={s.checkbox} />

            {/* Product image */}
            {product.image_url ? (
              <Image src={product.image_url} style={s.productImg} />
            ) : (
              <View style={s.productImgPlaceholder} />
            )}

            {/* Content */}
            <View style={s.productContent}>
              <Text style={s.productCategory}>
                {product.category.toUpperCase()}
              </Text>
              <Text style={s.productName}>{product.name}</Text>
              {product.instructions ? (
                <Text style={s.productInstructions}>
                  {product.instructions}
                </Text>
              ) : null}
            </View>
          </View>
        ))}

        {/* ── Footer — repeats on every page ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            NOT A SUBSTITUTE FOR MEDICAL ADVICE · FOLLOW YOUR DOCTOR'S
            INSTRUCTIONS · RECOVER WELL
          </Text>
          <Text
            style={s.pageNum}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
