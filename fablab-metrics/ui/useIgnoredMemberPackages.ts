import useSWR from "swr";

export function useIgnoredMemberPackages() {
  return useSWR("/api/metrics/ignored_member_packages", (url) =>
    fetch(url).then((res) => res.json()),
  );
}
