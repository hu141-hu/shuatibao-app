/**
 * 按可用题量占比分配总题量。
 *
 * 规则：
 * - 结果之和 = min(总题量, 可用总量)
 * - 每项不超过其可用数（大项封顶后，剩余名额继续按比例分给其它项）
 * - 取整损失用最大余数法补齐
 */
export function allocateByRatio(caps: number[], total: number): number[] {
  const n = caps.length;
  const capSum = caps.reduce((a, b) => a + b, 0);
  const target = Math.max(0, Math.min(Math.floor(total) || 0, capSum));
  const alloc = new Array<number>(n).fill(0);
  if (capSum === 0 || target === 0) return alloc;

  let remaining = target;
  // 每轮至少分配 1 题，最多 n + 1 轮即可收敛
  for (let round = 0; round < n + 1 && remaining > 0; round++) {
    const open = caps.map((c, i) => i).filter(i => alloc[i] < caps[i]);
    if (open.length === 0) break;

    const pool = open.reduce((sum, i) => sum + caps[i], 0);
    let added = 0;
    const fracs: { i: number; frac: number }[] = [];

    for (const i of open) {
      const exact = pool > 0 ? (remaining * caps[i]) / pool : 0;
      const add = Math.min(Math.floor(exact), caps[i] - alloc[i]);
      alloc[i] += add;
      added += add;
      fracs.push({ i, frac: exact - Math.floor(exact) });
    }

    // 整数部分分完后仍有余额（取整损失），按小数部分从大到小补 1
    if (added < remaining) {
      fracs.sort((a, b) => b.frac - a.frac);
      for (const f of fracs) {
        if (added >= remaining) break;
        if (alloc[f.i] < caps[f.i]) {
          alloc[f.i] += 1;
          added += 1;
        }
      }
    }

    remaining -= added;
    if (added === 0) break;
  }

  return alloc;
}
