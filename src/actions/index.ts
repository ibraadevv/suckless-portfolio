import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const server = {
  contacto: defineAction({
    accept: 'form',
    input: z.object({
      nombre: z.string().trim().min(1),
      email: z.string().email(),
      proyecto: z.string().trim().min(1),
      link: z.string().url().optional().or(z.literal('')),
      descripcion: z.string().trim().min(1),
      servicio: z.string(),
      timeline: z.string(),
      presupuesto: z.string(),
    }),
    handler: async (d) => {
      const { error } = await resend.emails.send({
        from: 'Web <contacto@ibrathiam.dev>',
        to: [import.meta.env.CONTACT_TO_EMAIL],
        replyTo: d.email,
        subject: `Nuevo contacto: ${d.proyecto}`,
        html: `
          <p><b>Nombre:</b> ${esc(d.nombre)}</p>
          <p><b>Email:</b> ${esc(d.email)}</p>
          <p><b>Proyecto:</b> ${esc(d.proyecto)}</p>
          <p><b>Link:</b> ${esc(d.link || '-')}</p>
          <p><b>Servicio:</b> ${esc(d.servicio)}</p>
          <p><b>Plazo:</b> ${esc(d.timeline)}</p>
          <p><b>Presupuesto:</b> ${esc(d.presupuesto)}</p>
          <p><b>Descripción:</b><br>${esc(d.descripcion).replace(/\n/g, '<br>')}</p>`,
      });
      if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
      return { ok: true };
    },
  }),
};
