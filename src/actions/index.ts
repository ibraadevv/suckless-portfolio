import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { Resend } from 'resend';

const esc = (s: string) =>
s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const server = {
	contacto: defineAction({
		accept: 'form',
		input: z.object({
			nombre: z.string().trim().min(1),
			email: z.string().trim().email(),
			proyecto: z.string().trim().min(1),
			link: z.string().trim().url().or(z.literal('')).optional(),
			descripcion: z.string().trim().min(1),
			servicio: z.string().optional(),
			timeline: z.string().optional(),
			presupuesto: z.string().optional(),
		}),
		handler: async (d) => {

			const apiKey = import.meta.env.RESEND_API_KEY;
			const to = import.meta.env.CONTACT_TO_EMAIL;

			if (!apiKey || !to) {
				console.error('Faltan RESEND_API_KEY o CONTACT_TO_EMAIL');
				throw new ActionError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Configuración del servidor incompleta.',
				});
			}

			const resend = new Resend(apiKey);

			const { error } = await resend.emails.send({
				from: 'Web <contacto@ibrathiam.dev>',
				to: [to],
				replyTo: d.email,
				subject: `Nuevo contacto: ${d.proyecto}`,
				html: `
				<p><b>Nombre:</b> ${esc(d.nombre)}</p>
				<p><b>Email:</b> ${esc(d.email)}</p>
				<p><b>Proyecto:</b> ${esc(d.proyecto)}</p>
				<p><b>Link:</b> ${esc(d.link || '-')}</p>
				<p><b>Servicio:</b> ${esc(d.servicio || '-')}</p>
				<p><b>Plazo:</b> ${esc(d.timeline || '-')}</p>
				<p><b>Presupuesto:</b> ${esc(d.presupuesto || '-')}</p>
				<p><b>Descripción:</b><br>${esc(d.descripcion).replace(/\n/g, '<br>')}</p>`,
			});

			if (error) {
				console.error('Resend:', error);
				throw new ActionError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'No se pudo enviar el mensaje.',
				});
			}

			return { ok: true };
		},
	}),
};
