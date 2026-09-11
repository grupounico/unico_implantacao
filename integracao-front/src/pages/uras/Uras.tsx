import { TemplateCatalogPage } from '../../components/TemplateCatalogPage';
import { templates } from '../../data/templates_uras.ts';
import { useRequireAuth } from '../../hooks/useAuthRedirect';

export default function Uras() {
  useRequireAuth();

  return <TemplateCatalogPage title="Uras" templates={templates} />;
}
