
self.Router = (function() {
  const routes= Object.create(null);

  return {
    add(path, func) {
      if (typeof func === 'function')
        routes[path]=func;
      else console.error(`from Router: ${func} is not a function`);
    },

    route(name) {
      return routes[name];
    }
  };
})();

window.addEventListener('DOMContentLoaded', function(event) {
  const path=window.location.pathname.match(/^\/$|^\/([\w\d-]+)\.html/i);
  if (!path) return;
  const func = path[0]==='/'? self.Router.route('index') : self.Router.route(path[1]);
  if (func)
    func(event);
});
