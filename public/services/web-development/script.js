(function () {
  var title = document.querySelector('.page-title');
  if (!title) {
    return;
  }

  document.title = title.textContent.trim() + ' | Udoff Web Development';
})();
