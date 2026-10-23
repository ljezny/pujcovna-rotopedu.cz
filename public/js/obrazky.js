/* Vygenerováno scripts/build.mjs — otisky obrázků, needitovat. */
export const VERZE = {
  "logo-znak.jpg": "72397b74",
  "stroje/bo.jpg": "475c355f",
  "stroje/bp.jpg": "7d26343b",
  "stroje/ct.jpg": "0f8468e5",
  "stroje/galerie/bp-1.jpg": "bccfcb4a",
  "stroje/galerie/bp-2.jpg": "ef1f4c0b",
  "stroje/galerie/bp-3.jpg": "5051706c",
  "stroje/galerie/bp-4.jpg": "451bad05",
  "stroje/galerie/bp-produkt.jpg": "20d907ba",
  "stroje/galerie/om-produkt.jpg": "3c3dbb43",
  "stroje/galerie/re-produkt.jpg": "8c3d788b",
  "stroje/galerie/rm-interier.jpg": "35b437cf",
  "stroje/galerie/rm-produkt.jpg": "de7c9368",
  "stroje/galerie/sk-produkt.jpg": "1450e7ba",
  "stroje/galerie/vt-produkt.jpg": "da0d593d",
  "stroje/om.jpg": "c4dd90dd",
  "stroje/pb.jpg": "96a4e17e",
  "stroje/re.jpg": "d4c2dd9f",
  "stroje/rm.jpg": "1bb9c2ee",
  "stroje/sk.jpg": "53381142",
  "stroje/vt.jpg": "461deb97"
};

/** "stroje/rm.jpg" → "/images/stroje/rm.jpg?v=…" */
export const obrazek = (p) => `/images/${p}${VERZE[p] ? `?v=${VERZE[p]}` : ''}`;
