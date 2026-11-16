let sequence = 0;

export function nextId(): number {
  sequence = (sequence + 1) % 1000;
  return Date.now() * 1000 + sequence;
}
