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
  bg: "#f9f7f4",
  text: "#1c1a17",
  muted: "rgba(28,26,23,0.45)",
  faint: "rgba(28,26,23,0.28)",
  border: "#e8e3da",
  white: "#ffffff",
  placeholder: "rgba(28,26,23,0.04)",
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
  headerLogoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: C.logoBg,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  logoInitials: {
    fontSize: 9,
    color: C.muted,
    letterSpacing: 1,
  },
  practiceName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    color: C.text,
  },
  surgeryLabel: {
    fontSize: 8,
    color: C.muted,
    letterSpacing: 1.5,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
    marginTop: 4,
    color: C.text,
  },
  doctorName: {
    fontSize: 10,
    color: C.muted,
    marginBottom: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    position: "relative",
  },
  productImg: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 10,
    flexShrink: 0,
  },
  productImgPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: C.placeholder,
    borderRadius: 4,
    marginRight: 10,
    flexShrink: 0,
  },
  productContent: {
    flex: 1,
    paddingRight: 58,
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
    fontSize: 9,
    color: C.muted,
    lineHeight: 1.5,
  },
  qr: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 48,
    height: 48,
  },
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
  qrDataUrls: Record<string, string>; // keyed by product slug
};

export function RecoverWellDocument({
  page,
  doctorName,
  qrDataUrls,
}: RecoverWellDocumentProps) {
  const initials = page.practice_name.slice(0, 2).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
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
        <Text style={s.pageTitle}>Your Doctor's Recommendations</Text>
        <Text style={s.doctorName}>{doctorName}</Text>
        <View style={s.divider} />

        {/* ── Product cards ── */}
        {page.products.map((product) => (
          <View key={product.slug} style={s.card} wrap={false}>
            {product.image_url ? (
              <Image src={product.image_url} style={s.productImg} />
            ) : (
              <View style={s.productImgPlaceholder} />
            )}
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
            {qrDataUrls[product.slug] ? (
              <Image src={qrDataUrls[product.slug]} style={s.qr} />
            ) : null}
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
