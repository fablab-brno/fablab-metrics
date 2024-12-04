export function flatten(arr: any[]) {
  return [].concat.apply([], arr);
}

export function unique(arr: any[]) {
  return arr.filter((value, index, array) => array.indexOf(value) === index);
}
