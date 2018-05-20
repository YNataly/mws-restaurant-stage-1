
self.Router = {
  routes: Object.create(null),

  add(path, func) {
    if (typeof func === 'function')
      this.routes[path]=func;
    else console.error(`from Router: ${func} is not a function`);
  }
};

window.addEventListener('DOMContentLoaded', function(event) {
  const path=window.location.pathname.match(/^\/$|^\/([\w\d]+)\.html/i);
  if (!path) return;
  const func = path[0]==='/'? self.Router.routes['index'] : self.Router.routes[path[1]];
  if (func)
    func(event);
});
