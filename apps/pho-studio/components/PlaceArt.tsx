import Image from "next/image";
import photos from "../public/photos/credits.json";

export default function PlaceArt({
  variant = 0,
  large = false,
  placeId,
}: {
  variant?: number;
  large?: boolean;
  placeId?: string;
}) {
  const photo =
    placeId && Object.hasOwn(photos, placeId)
      ? photos[placeId as keyof typeof photos]
      : undefined;
  if (photo)
    return (
      <Image
        src={photo.src}
        alt=""
        width={photo.width}
        height={photo.height}
        className={large ? "place-art place-art--large" : "place-art"}
        title={`${photo.title} — ${photo.author}`}
        unoptimized
      />
    );
  const hue = [
    "#d9dfcb",
    "#d8e4de",
    "#e6dccf",
    "#dbe0cd",
    "#d6e1d5",
    "#d9e4e7",
  ][variant % 6];
  return (
    <svg
      viewBox="0 0 72 64"
      className={large ? "place-art place-art--large" : "place-art"}
      aria-hidden="true"
    >
      <rect width="72" height="64" rx="10" fill={hue} />
      <path d="m3 46 24-13 42 15-23 13Z" fill="#f2eddc" />
      {variant % 3 === 0 ? (
        <>
          <path d="M6 48 72 37v13L15 63Z" fill="#9dbbb5" />
          <path d="M20 29v17l17 6V34Z" fill="#e6cfa3" />
          <path d="m37 34 16-8v17l-16 9Z" fill="#cfbc94" />
          <path d="m16 29 18-12 23 9-20 12Z" fill="#ad795b" />
          <path
            d="m18 29 16-8 19 6"
            fill="none"
            stroke="#d59e75"
            strokeWidth="2"
          />
        </>
      ) : variant % 3 === 1 ? (
        <>
          <path d="M9 41q17-13 36-7t20 10q-6 12-30 10T9 41Z" fill="#9ebbb2" />
          <path d="M28 24v17l13 4 1-19Z" fill="#ece2c8" />
          <path d="m25 24 10-7 12 7-13 5Z" fill="#b58261" />
          <path
            d="M34 9v9m-5 0 5-5 6 6"
            fill="none"
            stroke="#7d8c70"
            strokeWidth="2"
          />
        </>
      ) : (
        <>
          <path d="M17 20v28l12 5 11-6V17l-11-4Z" fill="#eeeadb" />
          <path d="m29 17 11-4v34l-11 6Z" fill="#bac4b4" />
          <path d="M43 31v18l12-6V26Z" fill="#d4c6aa" />
          <path d="m12 20 17-9 15 5-15 9Z" fill="#769182" />
          <path
            d="M21 27v5m0 6v5m13-19v5m0 6v5"
            stroke="#9b9f8a"
            strokeWidth="2"
          />
        </>
      )}
      <path d="M57 32v13M10 31v11" stroke="#8c8b6c" strokeWidth="2" />
      <ellipse cx="57" cy="29" rx="7" ry="9" fill="#7c9570" />
      <ellipse cx="10" cy="28" rx="5" ry="7" fill="#8da27d" />
    </svg>
  );
}
