function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function vectorize(tokens) {
  return tokens.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
}

function cosine(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0;
  let am = 0;
  let bm = 0;
  keys.forEach((k) => {
    const av = a[k] || 0;
    const bv = b[k] || 0;
    dot += av * bv;
    am += av * av;
    bm += bv * bv;
  });
  return dot / ((Math.sqrt(am) * Math.sqrt(bm)) || 1);
}

export function isNearDuplicate(candidate, history, threshold = 0.78) {
  const v1 = vectorize(tokenize(candidate));
  return history.some((item) => cosine(v1, vectorize(tokenize(item.topic || ''))) >= threshold);
}
