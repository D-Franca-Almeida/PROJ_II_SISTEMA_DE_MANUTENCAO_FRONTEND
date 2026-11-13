const dois = (n) => String(n).padStart(2, '0');

/** "13/11/2026" */
export function formatarData(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "13/11/2026 14:05" */
export function formatarDataHora(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatarData(iso)} ${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

/** "QFJ0214 - MOTORES ELÉTRICOS" */
export function textoEquipamento(e) {
  if (!e) return '—';
  return [e.codigo, e.descricao].filter(Boolean).join(' - ');
}

/** "OF-PRS - Oficina Presidente Altino" */
export function textoLocalidade(l) {
  if (!l) return '—';
  if (typeof l === 'string') return l;
  return [l.sigla, l.nome].filter(Boolean).join(' - ');
}
