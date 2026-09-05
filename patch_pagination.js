const fs = require('fs');
let code = fs.readFileSync('frontend/src/apps/platform/pages/SystemHealthDashboard.jsx', 'utf8');

// 1. Add Pagination States
code = code.replace(
  '  const [drawerData, setDrawerData] = useState(null);',
  `  const [drawerData, setDrawerData] = useState(null);
  const [logPage, setLogPage] = useState(1);
  const [drawerPage, setDrawerPage] = useState(1);`
);

// 2. Reset drawer page on open
code = code.replace(
  '    setDrawerData(null);',
  '    setDrawerData(null);\n    setDrawerPage(1);'
);

// 3. Update Logs Rendering
// Find the logs mapping and change it to paginatedLogs
// Also add Pagination controls below the table
code = code.replace(
  '{logs.map(log => (',
  `{logs.slice((logPage - 1) * 10, logPage * 10).map(log => (`
);

// Add red color to failed logs
code = code.replace(
  '<td className="px-6 py-3 text-slate-400">{log.status}</td>',
  '<td className={`px-6 py-3 font-bold ${log.status === \'FAILED\' ? \'text-red-500\' : \'text-slate-400\'}`}>{log.status}</td>'
);

// Add Logs Pagination Controls
code = code.replace(
  '          </table>\n        </div>\n      </div>',
  `          </table>
        </div>
        
        {/* LOGS PAGINATION */}
        <div className="flex justify-between items-center p-4 border-t border-slate-800 bg-slate-900/50">
          <button 
            disabled={logPage === 1} 
            onClick={() => setLogPage(p => p - 1)}
            className="px-3 py-1 bg-slate-800 rounded text-slate-400 disabled:opacity-30 hover:bg-slate-700"
          >
            Prev
          </button>
          <span className="text-slate-500 text-sm">
            Page {logPage} of {Math.ceil(logs.length / 10)}
          </span>
          <button 
            disabled={logPage >= Math.ceil(logs.length / 10)} 
            onClick={() => setLogPage(p => p + 1)}
            className="px-3 py-1 bg-slate-800 rounded text-slate-400 disabled:opacity-30 hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      </div>`
);


// 4. Update Drawer Rendering
// Find where drawerData is mapped and paginate it
code = code.replace(
  '{drawerData.map(p => (',
  '{drawerData.slice((drawerPage - 1) * 20, drawerPage * 20).map(p => ('
);

code = code.replace(
  '{drawerData.map(s => (',
  '{drawerData.slice((drawerPage - 1) * 20, drawerPage * 20).map(s => ('
);

code = code.replace(
  '{drawerData.map(j => (',
  '{drawerData.slice((drawerPage - 1) * 20, drawerPage * 20).map(j => ('
);

// Add Drawer Pagination Controls
code = code.replace(
  '                </div>\n              )}\n            </div>\n          </div>',
  `                </div>
              )}
            </div>
            
            {/* DRAWER PAGINATION */}
            {drawerData && drawerData.length > 20 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                <button 
                  disabled={drawerPage === 1} 
                  onClick={() => setDrawerPage(p => p - 1)}
                  className="px-3 py-1 bg-slate-800 rounded text-slate-400 disabled:opacity-30 hover:bg-slate-700"
                >
                  Prev
                </button>
                <span className="text-slate-500 text-sm">
                  Page {drawerPage} of {Math.ceil(drawerData.length / 20)}
                </span>
                <button 
                  disabled={drawerPage >= Math.ceil(drawerData.length / 20)} 
                  onClick={() => setDrawerPage(p => p + 1)}
                  className="px-3 py-1 bg-slate-800 rounded text-slate-400 disabled:opacity-30 hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            )}
          </div>`
);

fs.writeFileSync('frontend/src/apps/platform/pages/SystemHealthDashboard.jsx', code);
console.log('Patched pagination');
