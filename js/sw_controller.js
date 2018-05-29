if ('serviceWorker' in navigator) {
  if (!navigator.serviceWorker.controller) {
    navigator.serviceWorker.register('/sw.js')
      .then(function(reg) {
        console.log('Registration successful, scope is:', reg.scope);
      })
      .catch(function(err) {
        console.log('Service worker registration failed, error:', err);
      });
  }
}
