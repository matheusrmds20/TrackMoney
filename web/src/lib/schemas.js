import { z } from 'zod'

// ---------- Autenticação ----------
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Informe o e-mail' })
    .min(1, 'Informe o e-mail')
    .email('E-mail inválido'),
  password: z
    .string({ required_error: 'Informe a senha' })
    .min(3, 'A senha deve ter ao menos 3 caracteres'),
})

export const registerSchema = loginSchema.extend({
  confirm: z.string({ required_error: 'Confirme a senha' }),
}).refine((d) => d.password === d.confirm, {
  message: 'As senhas não coincidem',
  path: ['confirm'],
})

export const TIPO_CATEGORIA = ['income', 'expense']
export const TIPO_CATEGORIA_VALUES = {
  income: 'Receita',
  expense: 'Despesa',
}

// ---------- Categoria ----------
export const categorySchema = z.object({
  name: z
    .string({ required_error: 'Informe o nome' })
    .min(1, 'Informe o nome')
    .max(100, 'Máximo de 100 caracteres'),
  type: z.enum(TIPO_CATEGORIA, { required_error: 'Escolha o tipo' }),
  description: z.string().max(200, 'Máximo de 200 caracteres').optional().or(z.literal('')),
})

// ---------- Despesa (transação) ----------
export const transactionSchema = z.object({
  title: z.string({ required_error: 'Informe o título' }).min(1, 'Informe o título'),
  description: z.string().optional().or(z.literal('')),
  value: z.coerce
    .number({ invalid_type_error: 'Informe o valor' })
    .positive('Valor deve ser maior que 0'),
  type: z.enum(['income', 'expense'], { required_error: 'Escolha o tipo' }),
  category_id: z.coerce
    .number({ invalid_type_error: 'Escolha a categoria' })
    .int()
    .positive('Escolha a categoria'),
  transaction_date: z.string().optional().or(z.literal('')),
})

export default {
  loginSchema,
  registerSchema,
  categorySchema,
  transactionSchema,
  TIPO_CATEGORIA,
  TIPO_CATEGORIA_VALUES,
}