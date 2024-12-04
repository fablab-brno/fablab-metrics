import useSWR from "swr";

export function useResources() {
  return useSWR("/api/metrics/resources", (url) =>
    fetch(url).then((res) => res.json()),
  );
}
