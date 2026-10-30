// A API traduz o tipo de categoria no JSON ("Receita"/"Despesa"), mas as
// operações de criação/edição esperam "income"/"expense".
export const apiToDisplayType = {
  income: 'Receita',
  expense: 'Despesa',
}

export const displayToApiType = {
  Receita: 'income',
  Despesa: 'expense',
}

// Categoria vinda do list (type traduzido) → valor para formulário/API.
export function categoryFormDefaults(cat) {
  return {
    name: cat.name,
    type: displayToApiType[cat.type] || cat.type || 'expense',
    description: cat.description || '',
  }
}