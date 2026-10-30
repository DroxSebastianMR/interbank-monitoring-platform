export const attentionLabels: Record<string, string> = {
  DETECTED: 'Detectado', INVESTIGATING: 'En investigación', IDENTIFIED: 'Identificado',
  RECOVERING: 'En recuperación', RESOLVED: 'Resuelto', CLOSED: 'Cerrado', OPEN: 'Afectación activa',
};
export const severityLabels: Record<string, string> = {
  LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica',
};
export const nextAttentionStates: Record<string, string[]> = {
  DETECTED: ['INVESTIGATING'], INVESTIGATING: ['IDENTIFIED', 'RECOVERING'], IDENTIFIED: ['RECOVERING'],
};
export const eventLabels: Record<string, string> = {
  DETECTED: 'Afectación confirmada', TECHNICAL_CHANGED: 'Cambio técnico', RECOVERY_STARTED: 'Verificación de recuperación',
  RECOVERED: 'Recuperación confirmada', REOPENED: 'Reaparición de la afectación', ASSIGNED: 'Asignación',
  ACKNOWLEDGED: 'Reconocimiento', NOTE_ADDED: 'Nota de investigación', ATTENTION_CHANGED: 'Cambio de atención',
  SEVERITY_CHANGED: 'Reclasificación', CLOSED: 'Cierre manual', LEGACY_IMPORTED: 'Registro histórico importado',
  RECOVERY_PUBLISHED: 'Aviso de recuperación publicado',
};
