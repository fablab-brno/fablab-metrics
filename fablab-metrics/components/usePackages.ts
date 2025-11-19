import useSWR from "swr";

export function usePackages() {
  const params = new URLSearchParams();

  return useSWR(`/api/metrics/packages/?${params.toString()}`, (url) =>
    fetch(url).then((res) => res.json()),
  );
}
