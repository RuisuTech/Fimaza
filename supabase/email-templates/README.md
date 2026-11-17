# Plantillas de correo de Supabase Auth

Configurar en Supabase Dashboard → **Authentication → Email Templates**.

No eliminar las variables `{{ .ConfirmationURL }}`.

## Reset Password
- Archivo: `recovery.html`
- Subject: `Restablece tu contraseña · Fimaza`

## Invite user
- Archivo: `invite.html`
- Subject: `Activa tu cuenta · Fimaza`

## Confirm signup
- Archivo: `confirmation.html`
- Subject: `Confirma tu correo · Fimaza`

El remitente configurado es `soporte@ruisu.tech`.
