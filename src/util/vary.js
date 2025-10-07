const vary = (value, pct = 0.1, randomFn = Math.random) => {
  const factor = randomFn() * (2 * pct) + (1 - pct);
  return value * factor;
};

export default vary;
