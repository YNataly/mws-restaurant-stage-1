
self.Router = (function() {
  const _routes= Object.create(null);
  const _onloadRoutes = Object.create(null);

  return {
    add(path, func) {
      if (typeof func === 'function')
        _routes[path]=func;
      else console.error(`from Router: ${func} is not a function`);
    },

    addOnLoad(path, func) {
      if (typeof func === 'function')
        _onloadRoutes[path]=func;
      else console.error(`from Router: ${func} is not a function`);
    },

    route(name) {
      return _routes[name];
    },

    onloadRoute(name) {
      return _onloadRoutes[name];
    }
  };
})();

const path=window.location.pathname.match(/^\/$|^\/([^/]+?)\.html/i);

window.addEventListener('DOMContentLoaded', function(event) {
  if (!path) return;
  const func = path[0]==='/'? self.Router.route('index') : self.Router.route(path[1]);
  if (func)
    func(event);
});

window.addEventListener('load', function(event) {
  if (!path) return;
  const func = path[0]==='/'? self.Router.onloadRoute('index') : self.Router.onloadRoute(path[1]);
  if (func)
    func(event);
});
