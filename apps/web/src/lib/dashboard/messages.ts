export type DashboardFlash = {
  tone: 'success' | 'error' | 'warning'
  message: string
}

const DASHBOARD_MESSAGES: Record<string, DashboardFlash> = {
  'band-name-invalid': {
    tone: 'error',
    message: 'El nombre de la banda debe tener entre 2 y 120 caracteres.',
  },
  'band-slug-invalid': {
    tone: 'error',
    message: 'No se pudo generar un slug valido para esa banda.',
  },
  'band-create-error': {
    tone: 'error',
    message: 'No se pudo crear la banda. Revisa Supabase/RLS.',
  },
  'membership-create-error': {
    tone: 'error',
    message: 'La banda se creo, pero no se pudo asignar el owner.',
  },
  'invite-email-invalid': {
    tone: 'error',
    message: 'Ingresa un email valido para enviar la invitacion.',
  },
  'invite-role-invalid': {
    tone: 'error',
    message: 'Selecciona un rol valido para la invitacion.',
  },
  'invite-self-forbidden': {
    tone: 'warning',
    message: 'No hace falta invitar a tu propia cuenta.',
  },
  'invite-role-forbidden': {
    tone: 'error',
    message: 'Tu rol actual no puede asignar ese rol a otro miembro.',
  },
  'team-action-rate-limited': {
    tone: 'warning',
    message: 'Hiciste demasiadas acciones de equipo por ahora. Espera unos minutos antes de volver a intentar.',
  },
  'invite-membership-exists': {
    tone: 'warning',
    message: 'Ese usuario ya pertenece a la banda.',
  },
  'invite-create-error': {
    tone: 'error',
    message: 'No se pudo crear o actualizar la invitacion.',
  },
  'invite-sent': {
    tone: 'success',
    message: 'Invitacion enviada correctamente.',
  },
  'invite-sent-email-failed': {
    tone: 'warning',
    message: 'La invitacion fue creada, pero no se pudo enviar el email. Usa el enlace manual para compartirla.',
  },
  'invite-updated': {
    tone: 'success',
    message: 'La invitacion pendiente fue actualizada.',
  },
  'invite-updated-email-failed': {
    tone: 'warning',
    message: 'La invitacion fue actualizada, pero no se pudo enviar el email. Usa el enlace manual para compartirla.',
  },
  'invite-revoked': {
    tone: 'success',
    message: 'La invitacion pendiente fue revocada.',
  },
  'invite-revoke-error': {
    tone: 'error',
    message: 'No se pudo revocar la invitacion.',
  },
  'invite-not-found': {
    tone: 'error',
    message: 'La invitacion ya no esta disponible.',
  },
  'invite-expired': {
    tone: 'warning',
    message: 'La invitacion ya expiro. Pedi una nueva.',
  },
  'invite-email-mismatch': {
    tone: 'warning',
    message: 'La sesion actual no coincide con el email invitado. Entra con la cuenta correcta.',
  },
  'invite-accepted': {
    tone: 'success',
    message: 'La invitacion fue aceptada y la banda ya esta en tu dashboard.',
  },
  'invite-already-accepted': {
    tone: 'success',
    message: 'La invitacion ya estaba aceptada para esta cuenta.',
  },
  'invite-accept-error': {
    tone: 'error',
    message: 'No se pudo aceptar la invitacion.',
  },
  'member-update-error': {
    tone: 'error',
    message: 'No se pudo actualizar el rol del miembro.',
  },
  'member-updated': {
    tone: 'success',
    message: 'El rol del miembro fue actualizado.',
  },
  'member-remove-error': {
    tone: 'error',
    message: 'No se pudo quitar el miembro de la banda.',
  },
  'member-removed': {
    tone: 'success',
    message: 'El miembro fue quitado de la banda.',
  },
  'member-self-manage-forbidden': {
    tone: 'warning',
    message: 'Todavia no permitimos cambiar tu propio rol desde esta pantalla.',
  },
  'owner-last-required': {
    tone: 'warning',
    message: 'La banda debe conservar al menos un owner.',
  },
}

export function getDashboardFlash(message: string | undefined) {
  if (!message) {
    return null
  }

  return DASHBOARD_MESSAGES[message] || null
}
