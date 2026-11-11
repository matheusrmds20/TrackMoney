(function () {
  try {
    var stored = localStorage.getItem('ledger-theme')
    var dark = stored ? stored === 'noir' : true
    var el = document.documentElement
    el.classList.toggle('dark', dark)
    el.style.colorScheme = dark ? 'dark' : 'light'
  } catch (e) {}
})()
