// Mile-marker badge for numbered lists.
export default function Mile({ n }) {
  return (
    <span className="mile" aria-hidden="true">
      <span className="mile__inner">
        <small>MILE</small>
        <b className="tnum">{n}</b>
      </span>
    </span>
  );
}
