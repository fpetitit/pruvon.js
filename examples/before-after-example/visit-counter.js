let visits = [];

export function recordVisit(name) {
  visits.push(name);
  return visits.length;
}

export function resetVisits() {
  visits = [];
}
