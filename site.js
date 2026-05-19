function toggle(id) {
  document.getElementById(id).classList.toggle('open');
}

document.getElementById('yr').textContent = new Date().getFullYear();
