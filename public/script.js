// global JavaScript for the application
console.log("Hello from the Web App Dev lab!");

// example popup when catalogue loads
window.addEventListener('load', () => {
  if (document.querySelector('#products-container')) {
    alert('Welcome to the collection page!');
  }
});
