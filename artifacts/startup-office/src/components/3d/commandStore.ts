/* ─── Global CEO Command Bus ───────────────────────────────────────────────
   Agents poll `seq` every frame.  When seq > their stored lastSeq they
   consume the latest command and react immediately.
   ─────────────────────────────────────────────────────────────────────── */
export type CEOCommand = 'work' | 'meeting' | 'lounge' | 'coffee' | 'focus' | 'dismiss'

export const commandStore: { cmd: CEOCommand | null; seq: number } = {
  cmd: null,
  seq: 0,
}

export function issueCommand(cmd: CEOCommand) {
  commandStore.cmd = cmd
  commandStore.seq++
}
