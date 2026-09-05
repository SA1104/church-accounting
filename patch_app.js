const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

code = code.replace(
    "import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';",
    "import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';\nimport { apiClient } from './core/api';"
);

code = code.replace(
    "export default function App() {",
    `function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    let sid = localStorage.getItem('boozathink_sid');
    if (!sid) { sid = Math.random().toString(36).substring(2, 15); localStorage.setItem('boozathink_sid', sid); }
    apiClient('/api/admin/sys-health/track', { method: 'POST', body: JSON.stringify({ path: location.pathname, sessionId: sid }) }).catch(e=>console.error(e));
  }, [location]);
  return null;
}

export default function App() {`
);

code = code.replace("<Router>", "<Router>\n        <RouteTracker />");

fs.writeFileSync('frontend/src/App.jsx', code);
console.log("App patched");
