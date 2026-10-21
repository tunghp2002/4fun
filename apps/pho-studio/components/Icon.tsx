const paths = {
  search: "m21 21-4.4-4.4M19 10.8a8.2 8.2 0 1 1-16.4 0 8.2 8.2 0 0 1 16.4 0",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  bookmark: "M6 3h12v18l-6-4-6 4V3Z",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  share:
    "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.7 10.5l6.6-4M8.7 13.5l6.6 4",
  help: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3v.1",
  chevron: "m9 5 7 7-7 7",
  close: "m6 6 12 12M6 18 18 6",
  sun: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-6v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  layers: "m12 3 10 6-10 6L2 9l10-6ZM2 13l10 6 10-6M2 17l10 6 10-6",
  cube: "m12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5",
  top: "M3 3h18v18H3V3ZM3 10h18M10 3v18",
  eye: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  reset: "M3 11a9 9 0 1 1 2.5 7M3 4v7h7",
  rotate: "M4 8a9 9 0 1 1 0 8M4 2v6h6",
  sliders: "M5 3v8m0 4v6m7-18v3m0 4v11m7-18v11m0 4v3M2 11h6m1-5h6m1 8h6",
  shuffle: "m3 3 18 18m0-5v5h-5M3 21l6-6m6-6 6-6m-5 0h5v5",
  building: "M4 22V8l8-5 8 5v14M2 22h20M8 9v2m8-2v2m-8 3v2m8-2v2m-5 6v-5h2v5",
  tree: "m12 2 7 9h-3l5 7H3l5-7H5l7-9ZM12 18v5",
  road: "M7 2 3 22M17 2l4 20M12 3v4m0 3v4m0 3v4",
  water:
    "M2 7c3-5 5 5 9 0s6 5 11 0M2 12c3-5 5 5 9 0s6 5 11 0M2 17c3-5 5 5 9 0s6 5 11 0",
  mountain: "m2 21 7-15 5 10 3-6 5 11H2ZM7 10l2 2 2-2",
  check: "m5 12 4 4L20 5",
  cursor: "m4 3 16 9-8 2-3 8L4 3Z",
  copy: "M8 8h13v13H8V8ZM16 5V2H2v14h3",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  folder: "M3 5h7l2 3h9v12H3V5Z",
  info: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6m0-10v.1",
};
export type IconName = keyof typeof paths;
export default function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  );
}
