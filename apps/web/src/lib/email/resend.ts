import {Resend} from 'resend'

type BandInviteEmailParams = {
  to: string
  bandName: string
  roleLabel: string
  expiresAt: string
  inviteUrl: string
}

let resendClient: Resend | null = null

function getResendApiKey() {
  return process.env.RESEND_API_KEY
}

function getEmailFrom() {
  return process.env.EMAIL_FROM
}

export function isBandInviteEmailConfigured() {
  return Boolean(getResendApiKey() && getEmailFrom())
}

function getResendClient() {
  const apiKey = getResendApiKey()

  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY.')
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }

  return resendClient
}

function formatInviteExpiration(expiresAt: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(expiresAt))
}

export function buildBandInviteEmail({bandName, roleLabel, expiresAt, inviteUrl}: Omit<BandInviteEmailParams, 'to'>) {
  const formattedExpiration = formatInviteExpiration(expiresAt)
  const subject = `Te invitaron a colaborar en ${bandName}`
  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">',
    `<h1 style="font-size:20px;margin:0 0 12px;">Te invitaron a colaborar en ${bandName}</h1>`,
    `<p style="margin:0 0 12px;">Recibiste una invitacion para unirte a <strong>${bandName}</strong> con el rol <strong>${roleLabel}</strong>.</p>`,
    `<p style="margin:0 0 12px;">La invitacion vence el <strong>${formattedExpiration}</strong>.</p>`,
    `<p style="margin:0 0 16px;"><a href="${inviteUrl}" style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;">Ver invitacion</a></p>`,
    `<p style="margin:0;">Si el boton no funciona, copia y pega este enlace en tu navegador:</p>`,
    `<p style="margin:8px 0 0;"><a href="${inviteUrl}">${inviteUrl}</a></p>`,
    '</div>',
  ].join('')
  const text = [
    `Te invitaron a colaborar en ${bandName}.`,
    `Rol: ${roleLabel}.`,
    `La invitacion vence el ${formattedExpiration}.`,
    `Abri este enlace para verla: ${inviteUrl}`,
  ].join(' ')

  return {subject, html, text}
}

export async function sendBandInviteEmail(params: BandInviteEmailParams) {
  const from = getEmailFrom()

  if (!from) {
    throw new Error('Missing EMAIL_FROM.')
  }

  const resend = getResendClient()
  const content = buildBandInviteEmail(params)
  const {data, error} = await resend.emails.send({
    from,
    to: [params.to],
    subject: content.subject,
    html: content.html,
    text: content.text,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
