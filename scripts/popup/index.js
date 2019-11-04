const utils = new Utils();
const popup = new Popup();

window.addEventListener('load', () => {
  popup.initialiseSettings();
});

window.addEventListener('click',function(e){
  popup.handleClick(e);
});
