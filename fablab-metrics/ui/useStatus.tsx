import useSWR from "swr";

export function useStatus() {
  return useSWR("/api/status", (url) => fetch(url).then((res) => res.json()));
}
