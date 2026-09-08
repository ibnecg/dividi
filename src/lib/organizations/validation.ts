import { z } from 'zod'

export const organizationSchema = z.object({
  name: z.string().min(1, 'Informe o nome da sua organização.').max(120, 'Nome muito longo.')
})
