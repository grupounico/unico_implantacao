import { Navigate, useLocation } from 'react-router-dom';

export default function LegacyDocsRedirect() {
  const location = useLocation();

  return (
    <Navigate
      to={`/main${location.pathname}${location.search}${location.hash}`}
      replace
    />
  );
}
