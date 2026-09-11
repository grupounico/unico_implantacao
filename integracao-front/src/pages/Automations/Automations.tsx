import { TemplateCatalogPage } from '../../components/TemplateCatalogPage';
import { templates } from '../../data/templates_automations.ts';
import { useRequireAuth } from '../../hooks/useAuthRedirect';

export default function Automations() {
  useRequireAuth();

  return <TemplateCatalogPage title="Automacoes" templates={templates} />;
}
