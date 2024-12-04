import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";

export function useRefresh() {
  const { mutate, cache } = useSWRConfig();

  const { trigger } = useSWRMutation("/api/refresh", refreshMetrics, {
    onSuccess: () => {
      const pattern = new RegExp(/^\/api\//);
      return Promise.all(
        cache
          .keys()
          .filter((key: string) => pattern.test(key))
          .map((key: string) => mutate(key)),
      );
    },
  });

  return trigger;
}

async function refreshMetrics(url: string) {
  await fetch(url, {
    method: "POST",
    credentials: "same-origin",
  });
}
