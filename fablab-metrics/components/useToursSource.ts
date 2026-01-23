import useSWR from "swr";

export function useToursSource() {
  return useSWR("/api/metrics/tours_sources", (url) =>
    fetch(url).then((res) => res.json()),
  );
}
