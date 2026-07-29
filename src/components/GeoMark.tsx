import { delay } from "../lib/css";

/**
 * Purely decorative. Expo 67's eight-fold radial symmetry as a hard-edged
 * conic pinwheel, deliberately cropped by its own frame the way period
 * supergraphics were cropped by architecture. No assets — all CSS shapes.
 */
export function GeoMark() {
  return (
    <div className="geomark" aria-hidden="true">
      <span className="geomark-disc wipe" style={delay(140)} />
      <span className="geomark-bar wipe" style={delay(300)} />
      <span className="geomark-tri wipe" style={delay(220)} />
      <span className="geomark-arc wipe" style={delay(360)} />
    </div>
  );
}
