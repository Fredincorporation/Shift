/**
 * Walkable-grid navigation: each diorama declares its floor bounds and blocked
 * rectangles; this builds a grid and A*-paths across it, then straightens the
 * result with line-of-sight smoothing so characters walk naturally.
 */
import * as THREE from 'three';

export interface Rect { minX: number; maxX: number; minZ: number; maxZ: number; }

export interface NavGridOptions {
    bounds: Rect;
    blocked: Rect[];
    cell?: number;
}

export interface NavGrid {
    walkable(x: number, z: number): boolean;
    clamp(x: number, z: number): THREE.Vector3;
    findPath(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[];
}

export function createNavGrid({ bounds, blocked, cell = 0.5 }: NavGridOptions): NavGrid {
    const cols = Math.max(1, Math.round((bounds.maxX - bounds.minX) / cell));
    const rows = Math.max(1, Math.round((bounds.maxZ - bounds.minZ) / cell));
    const open = new Uint8Array(cols * rows);

    const cx = (col: number) => bounds.minX + (col + 0.5) * cell;
    const cz = (row: number) => bounds.minZ + (row + 0.5) * cell;

    const inRect = (x: number, z: number, r: Rect) => x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = cx(col);
            const z = cz(row);
            let ok = true;
            for (const r of blocked) {
                if (inRect(x, z, r)) { ok = false; break; }
            }
            open[row * cols + col] = ok ? 1 : 0;
        }
    }

    const isOpen = (col: number, row: number) =>
        col >= 0 && row >= 0 && col < cols && row < rows && open[row * cols + col] === 1;

    const toCell = (x: number, z: number) => ({
        col: Math.min(cols - 1, Math.max(0, Math.floor((x - bounds.minX) / cell))),
        row: Math.min(rows - 1, Math.max(0, Math.floor((z - bounds.minZ) / cell))),
    });

    /** Nearest open cell by expanding rings — keeps a click on furniture usable. */
    const nearestOpen = (col: number, row: number) => {
        if (isOpen(col, row)) return { col, row };
        for (let radius = 1; radius < Math.max(cols, rows); radius++) {
            for (let dc = -radius; dc <= radius; dc++) {
                for (let dr = -radius; dr <= radius; dr++) {
                    if (Math.abs(dc) !== radius && Math.abs(dr) !== radius) continue;
                    if (isOpen(col + dc, row + dr)) return { col: col + dc, row: row + dr };
                }
            }
        }
        return { col, row };
    };

    const lineClear = (a: THREE.Vector3, b: THREE.Vector3) => {
        const steps = Math.ceil(a.distanceTo(b) / (cell * 0.5));
        for (let i = 0; i <= steps; i++) {
            const t = steps === 0 ? 0 : i / steps;
            const x = a.x + (b.x - a.x) * t;
            const z = a.z + (b.z - a.z) * t;
            const c = toCell(x, z);
            if (!isOpen(c.col, c.row)) return false;
        }
        return true;
    };

    return {
        walkable(x, z) {
            const c = toCell(x, z);
            return isOpen(c.col, c.row);
        },
        clamp(x, z) {
            const raw = toCell(x, z);
            const c = nearestOpen(raw.col, raw.row);
            return new THREE.Vector3(cx(c.col), 0, cz(c.row));
        },
        findPath(from, to) {
            const startCell = toCell(from.x, from.z);
            const goalRaw = toCell(to.x, to.z);
            const start = nearestOpen(startCell.col, startCell.row);
            const goal = nearestOpen(goalRaw.col, goalRaw.row);

            const startIdx = start.row * cols + start.col;
            const goalIdx = goal.row * cols + goal.col;
            if (startIdx === goalIdx) return [to.clone()];

            const gScore = new Float32Array(cols * rows).fill(Infinity);
            const cameFrom = new Int32Array(cols * rows).fill(-1);
            gScore[startIdx] = 0;
            const heuristic = (idx: number) => {
                const col = idx % cols;
                const row = (idx - col) / cols;
                return Math.hypot(col - goal.col, row - goal.row);
            };
            const frontier: { idx: number; f: number }[] = [{ idx: startIdx, f: heuristic(startIdx) }];
            const visited = new Uint8Array(cols * rows);
            const neighbours = [
                [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
                [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414],
            ] as const;

            let found = false;
            while (frontier.length > 0) {
                frontier.sort((a, b) => a.f - b.f);
                const current = frontier.shift()!;
                if (visited[current.idx]) continue;
                visited[current.idx] = 1;
                if (current.idx === goalIdx) { found = true; break; }
                const col = current.idx % cols;
                const row = (current.idx - col) / cols;
                for (const [dc, dr, cost] of neighbours) {
                    const nc = col + dc;
                    const nr = row + dr;
                    if (!isOpen(nc, nr)) continue;
                    // Don't cut diagonally through a blocked corner.
                    if (dc !== 0 && dr !== 0 && (!isOpen(nc, row) || !isOpen(col, nr))) continue;
                    const nIdx = nr * cols + nc;
                    const tentative = gScore[current.idx] + cost;
                    if (tentative < gScore[nIdx]) {
                        gScore[nIdx] = tentative;
                        cameFrom[nIdx] = current.idx;
                        frontier.push({ idx: nIdx, f: tentative + heuristic(nIdx) });
                    }
                }
            }

            if (!found) return [new THREE.Vector3(cx(goal.col), 0, cz(goal.row))];

            const cells: number[] = [];
            for (let idx = goalIdx; idx !== -1; idx = cameFrom[idx]) {
                cells.push(idx);
                if (idx === startIdx) break;
            }
            cells.reverse();

            const raw = cells.map((idx) => {
                const col = idx % cols;
                const row = (idx - col) / cols;
                return new THREE.Vector3(cx(col), 0, cz(row));
            });
            raw.push(new THREE.Vector3(to.x, 0, to.z));

            // Line-of-sight smoothing: keep only the corners we actually need.
            const smoothed: THREE.Vector3[] = [];
            let anchor = new THREE.Vector3(from.x, 0, from.z);
            let i = 0;
            while (i < raw.length) {
                let furthest = i;
                for (let j = raw.length - 1; j > i; j--) {
                    if (lineClear(anchor, raw[j])) { furthest = j; break; }
                }
                smoothed.push(raw[furthest]);
                anchor = raw[furthest];
                if (furthest === raw.length - 1) break;
                i = furthest + 1;
            }
            return smoothed;
        },
    };
}
