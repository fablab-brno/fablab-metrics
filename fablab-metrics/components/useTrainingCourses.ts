import useSWR from "swr";

export function useTrainingCourses() {
  return useSWR("/api/metrics/training_courses", (url) =>
    fetch(url).then((res) => res.json()),
  );
}
